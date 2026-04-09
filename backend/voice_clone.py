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

# Reverse map: BCP-47 prefix → display name (matches _LANG_CODE keys in voice_design.py)
_LANG_NAME: dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "es": "Spanish",
    "fr": "French",
    "zh": "Mandarin",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "ru": "Russian",
}

_PREVIEW_TEXT: dict[str, str] = {
    "English":    "Oh, what a wonderful adventure awaits! I'm so excited to tell you a magical story today. Are you ready? There are dragons, hidden castles, and a very brave hero — and that hero is YOU!",
    "Hindi":      "ओह, क्या अद्भुत साहसिक कार्य आगे है! मैं आज आपको एक जादुई कहानी सुनाने के लिए बहुत उत्साहित हूँ। क्या आप तैयार हैं? ड्रेगन हैं, छिपे हुए महल हैं, और एक बहुत बहादुर नायक — और वह नायक आप हैं!",
    "Tamil":      "ஓ, என்ன அற்புதமான சாகசம் காத்திருக்கிறது! இன்று உங்களுக்கு ஒரு மந்திரமான கதை சொல்ல மிகவும் உற்சாகமாக இருக்கிறேன். தயாரா? டிராகன்கள், மறைந்த கோட்டைகள், மிகவும் தைரியமான ஒரு வீரர் இருக்கிறார் — அந்த வீரர் நீங்கள்தான்!",
    "Spanish":    "¡Oh, qué maravillosa aventura nos espera! Estoy muy emocionado de contarte una historia mágica hoy. ¿Estás listo? ¡Hay dragones, castillos escondidos y un héroe muy valiente — y ese héroe eres TÚ!",
    "French":     "Oh, quelle merveilleuse aventure nous attend! Je suis tellement excité de vous raconter une histoire magique aujourd'hui. Êtes-vous prêt? Il y a des dragons, des châteaux cachés et un héros très courageux — et ce héros, c'est VOUS!",
    "Mandarin":   "哦，多么美好的冒险等着我们！我今天非常兴奋地要给你讲一个神奇的故事。你准备好了吗？有龙、隐藏的城堡，还有一个非常勇敢的英雄——那个英雄就是你！",
    "German":     "Oh, was für ein wunderbares Abenteuer wartet auf uns! Ich bin so aufgeregt, dir heute eine magische Geschichte zu erzählen. Bist du bereit? Es gibt Drachen, verborgene Schlösser und einen sehr mutigen Helden — und dieser Held bist DU!",
    "Italian":    "Oh, che meravigliosa avventura ci aspetta! Sono così emozionato di raccontarti una storia magica oggi. Sei pronto? Ci sono draghi, castelli nascosti e un eroe molto coraggioso — e quell'eroe sei TU!",
    "Portuguese": "Oh, que aventura maravilhosa nos espera! Estou tão animado para te contar uma história mágica hoje. Você está pronto? Há dragões, castelos escondidos e um herói muito corajoso — e esse herói é VOCÊ!",
    "Japanese":   "ああ、なんて素晴らしい冒険が待っているんでしょう！今日は魔法のような物語を聞かせてあげるのがとても楽しみです。準備はいいですか？ドラゴン、隠された城、そしてとても勇敢なヒーローがいます — そのヒーローはあなたです！",
    "Korean":     "오, 얼마나 멋진 모험이 기다리고 있는지! 오늘 여러분에게 마법 같은 이야기를 들려드릴 생각에 너무 설렙니다. 준비됐나요? 용, 숨겨진 성, 그리고 아주 용감한 영웅이 있는데 — 그 영웅이 바로 여러분입니다!",
    "Arabic":     "يا له من مغامرة رائعة تنتظرنا! أنا متحمس جداً لأروي لك قصة سحرية اليوم. هل أنت مستعد؟ هناك تنانين وقلاع مخفية وبطل شجاع جداً — وذلك البطل هو أنت!",
    "Russian":    "О, какое замечательное приключение нас ждёт! Я так рад рассказать тебе волшебную историю сегодня. Ты готов? Там есть драконы, скрытые замки и очень храбрый герой — и этот герой — ТЫ!",
}


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
    detected_language: str  # e.g. "English", "Hindi"


class VoiceCloneCreateRequest(BaseModel):
    voice_id: str      # from the preview step — already cloned
    character_name: str
    emoji: str = ""
    persona_description: str
    language: str = "English"
    avatar_data: str = ""
    avatar_mime_type: str = ""

    @field_validator("character_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("character_name cannot be empty")
        if len(v) > 50:
            raise ValueError("character_name too long")
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

@router.delete("/api/voice-clone/preview/{voice_id}", status_code=204)
async def delete_preview_voice(voice_id: str) -> None:
    """Delete a temporary IVC preview voice — called when the user re-records or navigates away."""
    client = _get_elevenlabs()
    try:
        client.voices.delete(voice_id=voice_id)
        logger.info("[voice-clone] Deleted preview voice: %s", voice_id)
    except Exception as e:
        # Best-effort cleanup — don't surface errors to the client
        logger.warning("[voice-clone] Failed to delete preview voice %s: %s", voice_id, e)


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
    ext = _mime_to_ext(req.mime_type)
    mime_base = req.mime_type.split(";")[0]

    # Detect spoken language via STT
    detected_language = "English"
    try:
        stt = client.speech_to_text.convert(
            file=BytesIO(audio_bytes),
            model_id="scribe_v2",
        )
        lang_prefix = (stt.language_code or "en").lower()[:2]
        detected_language = _LANG_NAME.get(lang_prefix, "English")
        logger.info("[voice-clone] Detected language: %s (%s)", detected_language, lang_prefix)
    except Exception as e:
        logger.warning("[voice-clone] STT language detection failed, defaulting to English: %s", e)

    # Clone voice via IVC
    try:
        audio_file = (f"sample.{ext}", BytesIO(audio_bytes), mime_base)
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

    # Generate TTS preview with the cloned voice in the detected language
    preview_text = _PREVIEW_TEXT.get(detected_language, _PREVIEW_TEXT["English"])
    tts_model = "eleven_flash_v2" if detected_language == "English" else "eleven_multilingual_v2"
    try:
        chunks = client.text_to_speech.convert(
            voice_id=voice_id,
            text=preview_text,
            model_id=tts_model,
            output_format="mp3_44100_128",
        )
        audio_bytes_out = b"".join(chunks)
        audio_base64 = base64.b64encode(audio_bytes_out).decode()
        logger.info("[voice-clone] TTS preview generated for voice %s (lang=%s)", voice_id, detected_language)
    except Exception as e:
        logger.error("[voice-clone] TTS preview failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to generate voice preview.")

    return VoiceClonePreviewResponse(
        voice_id=voice_id,
        audio_base64=audio_base64,
        detected_language=detected_language,
    )


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
    from image_gen import generate_character_avatar
    personality, presence, voice_section, image_style, tagline, first_message = (
        _generate_character_config(req.character_name, req.emoji, req.persona_description, req.language)
    )

    # Use pre-generated avatar from frontend preview step, or generate now as fallback
    if req.avatar_data:
        avatar_data, avatar_mime_type = req.avatar_data, req.avatar_mime_type
    else:
        avatar_data, avatar_mime_type = await generate_character_avatar(
            req.character_name, req.persona_description, image_style
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

    # Rename the IVC voice from "Clone Preview ..." to the character name
    try:
        client.voices.edit(voice_id=req.voice_id, name=f"ElevenTales - {req.character_name}")
        logger.info("[voice-clone] Renamed voice %s → ElevenTales - %s", req.voice_id, req.character_name)
    except Exception as e:
        logger.warning("[voice-clone] Failed to rename voice %s: %s", req.voice_id, e)

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
        "avatar_data": avatar_data,
        "avatar_mime_type": avatar_mime_type,
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
