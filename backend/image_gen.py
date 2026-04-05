# backend/image_gen.py
"""Story scene image generation via Gemini API (AI Studio key — no Vertex AI needed)."""

import asyncio
import base64
import os
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from characters import get_character

router = APIRouter()

IMAGE_MODEL = os.environ.get("IMAGE_MODEL", "gemini-3.1-flash-image-preview")
EXTRACT_MODEL = "gemini-2.5-flash-lite"

_CHILD_SAFETY_SETTINGS = [
    types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",         threshold="BLOCK_LOW_AND_ABOVE"),
    types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",        threshold="BLOCK_LOW_AND_ABOVE"),
]

SAFETY_PREFIX = (
    "child-safe illustration, age-appropriate for children aged 4-10, "
    "no violence, no scary content, no adult themes, cartoon style, "
    "no text, no words, no letters, no captions, no speech bubbles, no labels, purely visual, "
)

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY environment variable not set")
        _client = genai.Client(api_key=api_key)
    return _client


def _build_scene_prompt(scene_description: str, story_context: str) -> str:
    context_line = (
        f"Story context (characters and setting established so far): {story_context[:600]}\n\n"
    ) if story_context else ""
    return f"{context_line}Story narration to illustrate: {scene_description[:1500]}"


def _build_contents(
    prompt: str,
    previous_image_data: str,
    previous_image_mime_type: str,
    previous_scene_description: str = "",
):
    if not previous_image_data:
        return prompt

    prev_note = (
        f'The previous scene showed: "{previous_scene_description[:300]}"\n'
        if previous_scene_description else ""
    )

    instruction = (
        f"{prev_note}"
        "You are given the previous story illustration as a reference.\n\n"
        "CONTINUITY RULES:\n"
        "1. SAME CONTEXT: Maintain full visual continuity — identical character designs, same color palette.\n"
        "2. SHIFTED CONTEXT (new location or characters): Use the reference only to preserve characters that carry over.\n"
        "3. COMPLETELY NEW CAST: Use reference only to maintain overall art style.\n\n"
        "ALWAYS prioritize the new scene description below over the reference image.\n"
    )

    return [
        types.Part(text=instruction),
        types.Part(inline_data=types.Blob(
            mime_type=previous_image_mime_type,
            data=base64.b64decode(previous_image_data),
        )),
        types.Part(text=f"New scene to illustrate: {prompt}"),
    ]


async def _generate_image(
    prompt: str,
    previous_image_data: str = "",
    previous_image_mime_type: str = "image/png",
    previous_scene_description: str = "",
) -> tuple[str, str]:
    """Generate image using Gemini AI Studio API key."""
    client = _get_client()
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = await client.aio.models.generate_content(
                model=IMAGE_MODEL,
                contents=_build_contents(prompt, previous_image_data, previous_image_mime_type, previous_scene_description),
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    safety_settings=_CHILD_SAFETY_SETTINGS,
                ),
            )
            candidate = response.candidates[0] if response.candidates else None
            parts = (candidate.content.parts if candidate and candidate.content else None) or []
            for part in parts:
                if part.inline_data and part.inline_data.data:
                    return base64.b64encode(part.inline_data.data).decode("utf-8"), part.inline_data.mime_type or "image/png"
            raise HTTPException(status_code=500, detail="No image in response")
        except HTTPException:
            raise
        except Exception as e:
            last_exc = e
            if attempt == 0:
                print(f"[image_gen] Attempt 1 failed ({e}), retrying…")
                await asyncio.sleep(2)
    raise last_exc  # type: ignore[misc]


async def _is_safe_for_children(content: str) -> bool:
    """Return True if the content is appropriate for children aged 4-10."""
    client = _get_client()
    prompt = (
        f"You are a content moderator for a children's story app for ages 4-10.\n"
        f"Evaluate this theme or object: \"{content}\"\n\n"
        "Reply with exactly one word: SAFE or UNSAFE.\n\n"
        "Mark UNSAFE ONLY if the content explicitly involves:\n"
        "- Weapons or items designed to harm: guns, firearms, bombs, explosives, knives, daggers, swords, scissors, blades, or any sharp cutting tool\n"
        "- Sexual or explicit adult content, nudity\n"
        "- Graphic violence, gore, or self-harm\n"
        "- Drugs, alcohol, or smoking\n"
        "- Hate speech or terrorism\n\n"
        "Mark SAFE for everything else — including everyday objects (toys, books, food, clothing, vehicles), animals, nature, and fantasy.\n\n"
        "When in doubt, mark UNSAFE."
    )
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(model=EXTRACT_MODEL, contents=prompt),
            timeout=6.0,
        )
        return "UNSAFE" not in response.text.strip().upper()
    except Exception:
        return True  # fail open — don't block on classifier error


# ── Character avatar ──────────────────────────────────────────────────────────

async def generate_character_avatar(name: str, persona: str, image_style: str) -> tuple[str, str]:
    """Generate a cute chibi portrait for a custom storyteller character."""
    client = _get_client()
    prompt = (
        f"{SAFETY_PREFIX}"
        f"cute chibi kawaii cartoon character portrait, pure white background, "
        f"head and upper body only, large expressive eyes, round friendly face, "
        f"bright cheerful colors, clean children's storybook illustration, "
        f"character: {name} — {persona[:200]}. "
        f"Art style: {image_style[:100]}. "
        f"No text, no words, no letters, no background scenery."
    )
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=IMAGE_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                    safety_settings=_CHILD_SAFETY_SETTINGS,
                ),
            ),
            timeout=45.0,
        )
        for part in (response.candidates[0].content.parts if response.candidates else []):
            if part.inline_data and part.inline_data.data:
                return (
                    base64.b64encode(part.inline_data.data).decode("utf-8"),
                    part.inline_data.mime_type or "image/png",
                )
    except Exception as e:
        print(f"[avatar] Generation failed for {name}: {e}")
    return "", ""  # graceful fallback — caller will use emoji instead


# ── Routes ────────────────────────────────────────────────────────────────────

class ThemeCheckRequest(BaseModel):
    theme: str


class ThemeCheckResponse(BaseModel):
    safe: bool


@router.post("/api/check-theme", response_model=ThemeCheckResponse)
async def check_theme(request: ThemeCheckRequest):
    if not request.theme.strip():
        return ThemeCheckResponse(safe=True)
    safe = await _is_safe_for_children(request.theme.strip())
    print(f"[check-theme] '{request.theme}' → {'SAFE' if safe else 'UNSAFE'}")
    return ThemeCheckResponse(safe=safe)


# ── Sketch Preview ────────────────────────────────────────────────────────────

class SketchPreviewRequest(BaseModel):
    sketch_data: str   # raw base64 JPEG — no data: prefix
    image_style: str


class SketchPreviewResponse(BaseModel):
    label: str         # e.g. "a friendly blue dragon"
    image_data: str    # base64 illustration
    mime_type: str


async def _generate_from_sketch(sketch_bytes: bytes, image_style: str, label: str = "") -> tuple[str, str]:
    """Recreate a child's sketch as a storybook illustration using the sketch as direct input."""
    client = _get_client()
    subject_hint = f"The subject is: {label}. " if label else ""
    contents = [
        types.Part(text=(
            f"{SAFETY_PREFIX}"
            f"{subject_hint}"
            "Recreate this as a warm, colorful children's storybook illustration. "
            "Keep the exact same subject and composition as the original. "
            "Friendly, charming, simple clean background, no text, no words."
        )),
        types.Part(inline_data=types.Blob(mime_type="image/jpeg", data=sketch_bytes)),
    ]
    response = await client.aio.models.generate_content(
        model=IMAGE_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.data:
            return base64.b64encode(part.inline_data.data).decode("utf-8"), part.inline_data.mime_type or "image/png"
    raise HTTPException(status_code=500, detail="No image in sketch response")


@router.post("/api/sketch-preview", response_model=SketchPreviewResponse)
async def sketch_preview(request: SketchPreviewRequest) -> SketchPreviewResponse:
    """Recreate a child's sketch/photo as a storybook illustration."""
    try:
        sketch_bytes = base64.b64decode(request.sketch_data)
        print(f"[sketch-preview] Starting — image size: {len(sketch_bytes)} bytes, model: {IMAGE_MODEL}")

        client = _get_client()
        print("[sketch-preview] Step 1 — extracting label")
        label_result = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=EXTRACT_MODEL,
                contents=[
                    types.Part(inline_data=types.Blob(mime_type="image/jpeg", data=sketch_bytes)),
                    types.Part(text=(
                        "A young child drew or photographed this. In 3–6 simple, friendly words describe "
                        "the main subject — e.g. 'a friendly blue dragon', 'a big rainbow castle', "
                        "'a red toy car'. No punctuation at the end. Keep it imaginative and warm."
                    )),
                ],
            ),
            timeout=15.0,
        )
        label = label_result.text.strip().rstrip(".")
        print(f"[sketch-preview] Label: {label!r}")

        if not await _is_safe_for_children(label):
            print(f"[sketch-preview] Blocked unsafe content: {label!r}")
            raise HTTPException(status_code=400, detail="unsafe_content")

        print("[sketch-preview] Generating image-from-sketch with label hint")
        image_b64, mime_type = await asyncio.wait_for(
            _generate_from_sketch(sketch_bytes, request.image_style, label),
            timeout=45.0,
        )

        print(f"[sketch-preview] Done — label: {label!r}, image: {len(image_b64)} chars")
        return SketchPreviewResponse(label=label, image_data=image_b64, mime_type=mime_type)

    except asyncio.TimeoutError:
        print("[sketch-preview] Timed out after 45s")
        raise HTTPException(status_code=504, detail="Preview timed out — please try again")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[sketch-preview] Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Sketch preview failed")


class ImageRequest(BaseModel):
    scene_description: str
    story_context: str = ""
    image_style: str
    session_id: str
    previous_image_data: str = ""
    previous_image_mime_type: str = "image/png"
    previous_scene_description: str = ""


class ImageResponse(BaseModel):
    image_data: str
    mime_type: str
    scene_description: str


@router.post("/api/image", response_model=ImageResponse)
async def generate_scene_image(request: ImageRequest):
    if len(request.scene_description) > 2000:
        raise HTTPException(status_code=400, detail="Scene description too long")

    try:
        scene_text = _build_scene_prompt(request.scene_description, request.story_context)
        print(f"[image_gen] Scene: {request.scene_description[:80]}...")

        prompt = f"{SAFETY_PREFIX}{request.image_style}. {scene_text}"

        image_b64, mime_type = await _generate_image(
            prompt,
            request.previous_image_data,
            request.previous_image_mime_type,
            request.previous_scene_description,
        )

        return ImageResponse(
            image_data=image_b64,
            mime_type=mime_type,
            scene_description=request.scene_description,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        print(f"[image_gen] Error: {e}")
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            raise HTTPException(status_code=429, detail="Rate limited — try again later")
        raise HTTPException(status_code=500, detail="Image generation failed")


# ── Story Recap ───────────────────────────────────────────────────────────────

class RecapScene(BaseModel):
    image_data: str
    mime_type: str = "image/png"
    description: str = ""


class StoryRecapRequest(BaseModel):
    character_name: str
    image_style: str
    scenes: list[RecapScene] = []
    scene_descriptions: list[str] = []
    narrations: list[str] = []


class StoryRecapResponse(BaseModel):
    title: str
    narrations: list[str]


async def _generate_title(scenes: list[RecapScene], character_name: str) -> str:
    client = _get_client()
    try:
        first = scenes[0]
        contents = [types.Content(role="user", parts=[
            types.Part(inline_data=types.Blob(
                data=base64.b64decode(first.image_data),
                mime_type=first.mime_type,
            )),
            types.Part(text=(
                f"A children's story was told by {character_name}. "
                "Looking at this opening illustration, generate a magical 4-6 word storybook title. "
                "Return ONLY the title — no quotes, no punctuation at the end."
            )),
        ])]
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=EXTRACT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(safety_settings=_CHILD_SAFETY_SETTINGS),
            ),
            timeout=15.0,
        )
        return response.candidates[0].content.parts[0].text.strip().strip('"').strip("'")
    except Exception as e:
        print(f"[story-recap] Title generation error: {e}")
        return f"A Story with {character_name}"


async def _narrate_scene(scene: RecapScene, character_name: str) -> str:
    client = _get_client()
    try:
        contents = [types.Content(role="user", parts=[
            types.Part(inline_data=types.Blob(
                data=base64.b64decode(scene.image_data),
                mime_type=scene.mime_type,
            )),
            types.Part(text=(
                f"You are {character_name}, a beloved children's storyteller. "
                f"Write exactly 2 warm, vivid sentences narrating THIS specific moment — "
                f"describe what is actually happening in this image. No preamble, just the narration."
            )),
        ])]
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=EXTRACT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(safety_settings=_CHILD_SAFETY_SETTINGS),
            ),
            timeout=20.0,
        )
        return response.candidates[0].content.parts[0].text.strip()
    except Exception as e:
        print(f"[story-recap] Narration error: {e}")
        return scene.description or "And the adventure continued…"


@router.post("/api/story-recap", response_model=StoryRecapResponse)
async def generate_story_recap(request: StoryRecapRequest):
    scenes = [s for s in request.scenes if s.image_data]
    if not scenes:
        raise HTTPException(status_code=400, detail="No scene images provided.")

    if request.narrations:
        print(f"[story-recap] Title-only for {request.character_name} ({len(scenes)} scenes)")
        title = await _generate_title(scenes, request.character_name)
        narrations = request.narrations
    else:
        print(f"[story-recap] Narrating {len(scenes)} scenes for {request.character_name}")
        title = await _generate_title(scenes, request.character_name)
        narrations = []
        for s in scenes:
            narrations.append(await _narrate_scene(s, request.character_name))

    print(f"[story-recap] Done — title: {title!r}")
    return StoryRecapResponse(title=title, narrations=narrations)
