# backend/voice_clone.py
"""Voice Clone feature: IVC clone preview, then create custom storyteller."""

import base64
import logging
import time
from io import BytesIO

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from voice_design import (
    CUSTOM_AGENT_TOOLS,
    CustomCharacterData,
    _LANG_CODE,
    _generate_character_config,
    _get_elevenlabs,
    _is_safe_for_children,
    _save_custom_character,
)
from characters import SYSTEM_PROMPT_BASE

logger = logging.getLogger(__name__)
router = APIRouter()

_MAX_AUDIO_BYTES = 20 * 1024 * 1024  # 20 MB hard cap

_PREVIEW_TEXT = (
    "Oh, what a wonderful adventure awaits! I'm so excited to tell you a magical story today. "
    "Are you ready? There are dragons, hidden castles, and a very brave hero — and that hero is YOU!"
)


# ── Request / Response models ─────────────────────────────────────────────────

class VoiceClonePreviewRequest(BaseModel):
    audio_data: str  # base64-encoded audio
    mime_type: str   # e.g. "audio/webm;codecs=opus"

    @field_validator("audio_data")
    @classmethod
    def audio_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("audio_data cannot be empty")
        return v


class VoiceClonePreviewResponse(BaseModel):
    voice_id: str
    audio_base64: str  # base64-encoded MP3 preview


class VoiceCloneCreateRequest(BaseModel):
    voice_id: str      # from the preview step — already cloned
    character_name: str
    emoji: str
    persona_description: str
    language: str = "English"

    @field_validator("character_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("character_name cannot be empty")
        if len(v) > 50:
            raise ValueError("character_name too long")
        return v

    @field_validator("emoji")
    @classmethod
    def emoji_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("emoji cannot be empty")
        return v

    @field_validator("language")
    @classmethod
    def valid_language(cls, v: str) -> str:
        valid = set(_LANG_CODE.keys())
        if v not in valid:
            raise ValueError(f"language must be one of {sorted(valid)}")
        return v

    @field_validator("persona_description")
    @classmethod
    def persona_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("persona_description cannot be empty")
        if len(v) > 2000:
            raise ValueError("persona_description too long")
        return v.strip()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/api/voice-clone/preview", response_model=VoiceClonePreviewResponse)
async def preview_cloned_voice(req: VoiceClonePreviewRequest) -> VoiceClonePreviewResponse:
    """Clone voice via IVC and return a TTS sample so the user can hear it."""
    try:
        audio_bytes = base64.b64decode(req.audio_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid audio_data — must be base64-encoded.")

    if len(audio_bytes) < 50_000:
        raise HTTPException(
            status_code=400,
            detail="Recording too short — please record at least 30 seconds of clear speech.",
        )
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Audio file too large (max 20 MB).")

    client = _get_elevenlabs()

    # Clone voice via IVC
    try:
        ext = _mime_to_ext(req.mime_type)
        audio_file = (f"sample.{ext}", BytesIO(audio_bytes), req.mime_type.split(";")[0])
        voice = client.voices.ivc.create(
            name=f"ElevenTales - Clone Preview {int(time.time())}",
            files=[audio_file],
        )
        voice_id = voice.voice_id
        logger.info("[voice-clone] Voice cloned for preview: %s", voice_id)
    except Exception as e:
        logger.error("[voice-clone] IVC failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Voice cloning failed — please try a longer, clearer recording.",
        )

    # Generate TTS preview with the cloned voice
    try:
        chunks = client.text_to_speech.convert(
            voice_id=voice_id,
            text=_PREVIEW_TEXT,
            model_id="eleven_flash_v2",
            output_format="mp3_44100_128",
        )
        audio_bytes_out = b"".join(chunks)
        audio_base64 = base64.b64encode(audio_bytes_out).decode()
        logger.info("[voice-clone] TTS preview generated for voice %s", voice_id)
    except Exception as e:
        logger.error("[voice-clone] TTS preview failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to generate voice preview.")

    return VoiceClonePreviewResponse(voice_id=voice_id, audio_base64=audio_base64)


@router.post("/api/voice-clone/create", response_model=CustomCharacterData)
async def create_cloned_character(req: VoiceCloneCreateRequest) -> CustomCharacterData:
    """Generate character config and create ElevenLabs agent using an already-cloned voice_id."""
    combined = f"{req.character_name}. {req.persona_description}"
    if not await _is_safe_for_children(combined):
        raise HTTPException(
            status_code=400,
            detail="Character description is not appropriate for a children's app.",
        )

    client = _get_elevenlabs()
    safe_slug = req.character_name.lower().replace(" ", "_")[:20]
    char_id = f"cloned_{safe_slug}_{int(time.time())}"
    agent_display_name = f"ElevenTales - Cloned {req.character_name}"

    # Generate character config via Gemini
    personality, presence, voice_section, image_style, tagline, first_message = (
        _generate_character_config(req.character_name, req.emoji, req.persona_description, req.language)
    )

    # Create ElevenLabs agent
    system_prompt = SYSTEM_PROMPT_BASE.format(
        name=req.character_name,
        personality=personality,
        presence=presence,
        voice_section=voice_section,
        language=req.language,
    )
    tts_model = "eleven_v3_conversational" if req.language == "English" else "eleven_multilingual_v2"
    lang_code = _LANG_CODE.get(req.language, "en")

    try:
        agent = client.conversational_ai.agents.create(
            name=agent_display_name,
            conversation_config={
                "agent": {
                    "prompt": {
                        "prompt": system_prompt,
                        "llm": "gemini-2.5-flash",
                        "temperature": 0.0,
                        "tools": CUSTOM_AGENT_TOOLS,
                    },
                    "first_message": first_message,
                    "dynamic_variable_placeholders": {"theme": "a wonderful adventure"},
                },
                "tts": {
                    "voice_id": req.voice_id,
                    "model_id": tts_model,
                    "language": lang_code,
                    "stability": 0.5,
                    "speed": 1.0,
                    "similarity_boost": 0.8,
                    "optimize_streaming_latency": 3,
                },
                "stt": {"user_input_audio_format": "pcm_16000"},
                "turn": {"turn_timeout": 7.0},
            },
            platform_settings={"auth": {"enable_auth": True}},
        )
        agent_id = agent.agent_id
        logger.info("[voice-clone] Agent created: %s (lang=%s)", agent_id, lang_code)
    except Exception as e:
        logger.error("[voice-clone] Agent creation failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to create agent.")

    # Persist
    char_data = {
        "id": char_id,
        "name": req.character_name,
        "emoji": req.emoji,
        "voice_id": req.voice_id,
        "agent_id": agent_id,
        "language": req.language,
        "image_style": image_style,
        "tagline": tagline,
        "first_message": first_message,
    }
    _save_custom_character(char_id, char_data)

    return CustomCharacterData(**char_data)


# ── Helper ────────────────────────────────────────────────────────────────────

def _mime_to_ext(mime_type: str) -> str:
    mime = mime_type.split(";")[0].lower()
    if "mp4" in mime or "m4a" in mime:
        return "mp4"
    if "wav" in mime:
        return "wav"
    if "mp3" in mime or "mpeg" in mime:
        return "mp3"
    if "flac" in mime:
        return "flac"
    return "webm"
