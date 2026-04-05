# backend/sfx.py
"""Sound effects endpoint — proxies ElevenLabs Sound Generation API."""

import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter()

_ELEVENLABS_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation"


@router.get("/api/sfx")
async def generate_sfx(
    prompt: str = Query(..., max_length=200, description="Sound effect description"),
    duration: float = Query(default=3.0, ge=0.5, le=10.0, description="Duration in seconds"),
) -> Response:
    """Generate a sound effect via ElevenLabs and stream it back as audio/mpeg."""
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                _ELEVENLABS_SFX_URL,
                headers={"xi-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "text": prompt,
                    "duration_seconds": duration,
                    "prompt_influence": 0.3,
                },
            )
        if resp.status_code != 200:
            logger.error("[sfx] ElevenLabs returned %s: %s", resp.status_code, resp.text[:200])
            raise HTTPException(status_code=502, detail="SFX generation failed")

        return Response(content=resp.content, media_type="audio/mpeg")

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="SFX generation timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[sfx] Unexpected error: %s", e)
        raise HTTPException(status_code=502, detail="SFX generation failed")
