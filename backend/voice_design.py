# backend/voice_design.py
"""Voice Design feature: generate previews, create custom storyteller characters."""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, field_validator

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()

CUSTOM_CHARACTERS_PATH = Path(__file__).parent / "custom_characters.json"

# Inline client tool definitions (same as setup_voices.py — SDK requires full definition)
CUSTOM_AGENT_TOOLS = [
    {
        "type": "client",
        "name": "generate_illustration",
        "description": (
            "Generate a storybook illustration at a key visual moment. "
            "Call at scene changes, character introductions, dramatic reveals. "
            "scene_description must show story characters only — NEVER a real person."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "scene_description": {
                    "type": "string",
                    "description": "Vivid painter-friendly English description of the scene (1-2 sentences)",
                }
            },
            "required": ["scene_description"],
        },
    },
    {
        "type": "client",
        "name": "award_badge",
        "description": "Award a creativity badge silently. Call when child contributes any creative idea. Max 3 per session.",
        "parameters": {
            "type": "object",
            "properties": {
                "emoji":  {"type": "string", "description": "A single emoji representing the badge"},
                "name":   {"type": "string", "description": "Short badge name, e.g. 'Dragon Tamer'"},
                "reason": {"type": "string", "description": "One sentence explaining why the badge was earned"},
            },
            "required": ["emoji", "name", "reason"],
        },
    },
]

_LANG_CODE: dict[str, str] = {
    "English": "en",
    "Hindi": "hi",
    "Tamil": "ta",
    "Spanish": "es",
    "French": "fr",
    "Mandarin": "zh",
}

_gemini_client: genai.Client | None = None


def _get_elevenlabs():
    from elevenlabs import ElevenLabs
    return ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])


def _get_gemini() -> genai.Client:
    global _gemini_client
    if _gemini_client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set")
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


# ── Request / Response models ─────────────────────────────────────────────────

class VoicePreviewRequest(BaseModel):
    voice_description: str
    preview_text: str
    guidance_scale: int = 30

    @field_validator("voice_description")
    @classmethod
    def desc_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("voice_description cannot be empty")
        if len(v) > 2000:
            raise ValueError("voice_description too long")
        return v.strip()

    @field_validator("preview_text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("preview_text cannot be empty")
        if len(v) < 100:
            raise ValueError(f"preview_text must be at least 100 characters (currently {len(v)})")
        if len(v) > 1000:
            raise ValueError("preview_text too long (max 1000 characters)")
        return v

    @field_validator("guidance_scale")
    @classmethod
    def scale_range(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("guidance_scale must be 0–100")
        return v


class PreviewItem(BaseModel):
    generated_voice_id: str
    audio_base64: str  # base64-encoded MP3 audio


class VoicePreviewResponse(BaseModel):
    previews: list[PreviewItem]


class CharacterCreateRequest(BaseModel):
    generated_voice_id: str
    voice_description: str
    character_name: str
    emoji: str = ""
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

    # Pre-generated avatar from the preview step (skip server-side generation if provided)
    avatar_data: str = ""
    avatar_mime_type: str = ""


class CustomCharacterData(BaseModel):
    id: str
    name: str
    emoji: str
    voice_id: str
    agent_id: str
    language: str
    image_style: str
    tagline: str
    first_message: str
    avatar_data: str = ""       # base64 character portrait (empty = use emoji)
    avatar_mime_type: str = ""  # e.g. "image/png"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/api/voice-design/preview", response_model=VoicePreviewResponse)
async def generate_voice_previews(req: VoicePreviewRequest) -> VoicePreviewResponse:
    """Generate 3 voice preview samples from a text prompt."""
    if not await _is_safe_for_children(req.voice_description):
        raise HTTPException(status_code=400, detail="Voice description is not appropriate for a children's app.")

    client = _get_elevenlabs()
    try:
        result = client.text_to_voice.create_previews(
            voice_description=req.voice_description,
            text=req.preview_text,
            guidance_scale=req.guidance_scale,
        )
    except Exception as e:
        logger.error("[voice-design] Preview generation failed: %s", e)
        raise HTTPException(status_code=502, detail="Voice preview generation failed")

    if not result.previews:
        raise HTTPException(status_code=502, detail="No voice previews returned")

    previews: list[PreviewItem] = []
    for p in result.previews:
        previews.append(PreviewItem(
            generated_voice_id=p.generated_voice_id,
            audio_base64=p.audio_base_64,  # already base64-encoded by SDK
        ))

    return VoicePreviewResponse(previews=previews)


async def _is_safe_for_children(content: str) -> bool:
    """Return True if the content is appropriate for a children's app."""
    from image_gen import _is_safe_for_children as _img_safe
    return await _img_safe(content)


class AvatarRequest(BaseModel):
    character_name: str
    persona_description: str


class AvatarResponse(BaseModel):
    avatar_data: str
    avatar_mime_type: str


@router.post("/api/character/avatar", response_model=AvatarResponse)
async def generate_avatar_preview(req: AvatarRequest) -> AvatarResponse:
    """Generate a character portrait. Can be called multiple times for regeneration."""
    from image_gen import generate_character_avatar
    avatar_data, avatar_mime_type = await generate_character_avatar(
        req.character_name, req.persona_description, ""
    )
    if not avatar_data:
        raise HTTPException(status_code=502, detail="Avatar generation failed — please try again.")
    return AvatarResponse(avatar_data=avatar_data, avatar_mime_type=avatar_mime_type)


@router.post("/api/character/create", response_model=CustomCharacterData)
async def create_custom_character(req: CharacterCreateRequest) -> CustomCharacterData:
    """Save voice, generate system prompt via Gemini, create ElevenLabs agent."""
    # Moderate persona before embedding it in a system prompt
    combined = f"{req.character_name}. {req.persona_description}"
    if not await _is_safe_for_children(combined):
        raise HTTPException(status_code=400, detail="Character description is not appropriate for a children's app.")

    client = _get_elevenlabs()
    safe_slug = req.character_name.lower().replace(" ", "_")[:20]
    char_id = f"custom_{safe_slug}_{int(time.time())}"
    agent_display_name = f"ElevenTales - Custom {req.character_name}"

    # Step 1: Save the selected voice
    try:
        voice = client.text_to_voice.create(
            voice_name=agent_display_name,
            voice_description=req.voice_description,
            generated_voice_id=req.generated_voice_id,
        )
        voice_id = voice.voice_id
        logger.info("[character] Voice saved: %s", voice_id)
    except Exception as e:
        err_str = str(e)
        logger.error("[character] Voice save failed: %s", e)
        if "already been created" in err_str:
            raise HTTPException(
                status_code=409,
                detail="This voice preview has already been used. Please generate new voice previews and try again.",
            )
        raise HTTPException(status_code=502, detail="Failed to save voice")

    # Step 2: Generate character config via Gemini
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

    # Step 3: Create ElevenLabs agent
    from characters import SYSTEM_PROMPT_BASE
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
                    "voice_id": voice_id,
                    "model_id": tts_model,
                    "language": lang_code,
                    "stability": 0.5,
                    "speed": 1.0,
                    "similarity_boost": 0.8,
                    "optimize_streaming_latency": 3,
                },
                "stt": {
                    "user_input_audio_format": "pcm_16000",
                },
                "turn": {
                    "turn_timeout": 7.0,
                },
            },
            platform_settings={"auth": {"enable_auth": True}},
        )
        agent_id = agent.agent_id
        logger.info("[character] Agent created: %s (lang=%s)", agent_id, lang_code)
    except Exception as e:
        logger.error("[character] Agent creation failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to create agent")

    # Step 4: Persist
    char_data: dict[str, Any] = {
        "id": char_id,
        "name": req.character_name,
        "emoji": req.emoji,
        "voice_id": voice_id,
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


@router.get("/api/characters/custom", response_model=list[CustomCharacterData])
async def list_custom_characters() -> list[CustomCharacterData]:
    """Return all user-created custom characters."""
    data = _load_custom_characters()
    return [CustomCharacterData(**v) for v in data.values()]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_character_config(
    name: str,
    emoji: str,
    persona: str,
    language: str,
) -> tuple[str, str, str, str, str, str]:
    """Use Gemini Flash to generate personality/presence/voice_section/image_style/tagline/first_message."""
    prompt = f"""You are designing a children's storyteller character for a voice-first interactive story app (target age: 4–10 years).

Character details:
- Name: {name}
- Emoji: {emoji}
- Persona description: {persona}
- Language: {language}

Generate a JSON object with exactly these six keys:

1. "personality": 4 short paragraphs describing who this character is. Follow this structure exactly:
   Paragraph 1: "You are {name}."
   Paragraph 2: A 1-sentence description of their core nature and warmth (e.g. "You are a bold, brave...")
   Paragraph 3: "You do not lecture. You do not explain. You tell stories — and [how they draw the child in]."
   Paragraph 4: "You are not a narrator. You are [poetic description of what they embody]."

2. "presence": 3 short paragraphs describing how they make the child feel. Follow this structure exactly:
   Paragraph 1: How they feel right now in this moment (genuine emotion).
   Paragraph 2: What every word should make the child feel (specific, vivid, warm).
   Paragraph 3: 3 short sentences: "Your [quality] is [adjective]. Your [quality] is [adjective]. Your [quality] is [adjective]."

3. "voice_section": 3–4 paragraphs describing their speech style. Must include:
   - One line describing their overall language register (e.g. "You use warm, simple Hindi — like a slow evening breeze.")
   - A list of 3–5 signature expressions with the label "Signature expressions (use sparingly, never repeat twice in a row):"
   - Sound effects or terms of endearment if culturally appropriate
   - A final sentence about varying pace

4. "image_style": One short, comma-separated art style description for storybook illustrations (max 20 words). Match the character's culture/vibe.

5. "tagline": A 2–4 word tagline for this character (fun, evocative, kid-friendly).

6. "first_message": The character's opening line when a story begins. Rules:
   - Must use {{{{theme}}}} as the placeholder for the story theme
   - Must be entirely in {language}
   - Must be in-character and energetic
   - Must be SHORT — one sentence only, ending with a simple "ready?" or "shall we begin?" style close
   - Do NOT ask who should be in the story or invite the child to shape the plot
   - Examples of the right length/style: "A {{{{theme}}}} adventure awaits — shall we begin?" or "A {{{{theme}}}} tale! My powers are ready. Shall we start?"

Respond with ONLY valid JSON. No markdown fences, no explanation."""

    try:
        gclient_obj = _get_gemini()
        response = gclient_obj.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
            ),
        )
        data: dict[str, str] = json.loads(response.text)
        return (
            data["personality"],
            data["presence"],
            data["voice_section"],
            data["image_style"],
            data["tagline"],
            data["first_message"],
        )
    except Exception as e:
        logger.error("[character] Gemini config generation failed: %s", e)
        # Safe fallback so character creation still succeeds
        return (
            f"You are {name}.\n\n"
            f"You are a warm, imaginative storyteller who loves taking children on adventures.\n\n"
            f"You do not lecture. You do not explain. You tell stories — and you carry the child into them with warmth and wonder.\n\n"
            f"You are not a narrator. You are the adventure itself, alive with joy and curiosity.",
            "You are genuinely delighted that this child has come to hear a story today.\n\n"
            "Every word should make the child feel safe, loved, and ready for an extraordinary adventure.\n\n"
            "Your warmth is real. Your wonder is contagious. Your joy in storytelling is boundless.",
            f'You use warm, clear {language} — simple and full of life.\n\n'
            f'Signature expressions (use sparingly, never repeat twice in a row):\n'
            f'- "And then something wonderful happened!"\n'
            f'- "What do YOU think comes next?"\n'
            f'- "Oh, this is the exciting part!"\n\n'
            f'Vary your pace — slow down for magical moments, speed up when the adventure surges.',
            "soft watercolor, children's picture book art, warm colors, whimsical illustration",
            "Magical tales",
            f"Hello! I'm so excited for our {{{{theme}}}} story today! Quick — who should be our brave hero?",
        )


def _load_custom_characters() -> dict[str, dict]:
    if not CUSTOM_CHARACTERS_PATH.exists():
        return {}
    with open(CUSTOM_CHARACTERS_PATH) as f:
        return json.load(f)


def _save_custom_character(char_id: str, data: dict[str, Any]) -> None:
    existing = _load_custom_characters()
    existing[char_id] = data
    with open(CUSTOM_CHARACTERS_PATH, "w") as f:
        json.dump(existing, f, indent=2)
