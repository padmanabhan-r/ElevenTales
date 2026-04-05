# backend/main.py
"""ElevenTales FastAPI backend — session token issuer + image generation."""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

load_dotenv()

from image_gen import router as image_router
from sfx import router as sfx_router
from voice_design import router as voice_design_router
from session import get_session_url
from characters import get_character

app = FastAPI(title="ElevenTales Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://eleven-tales.replit.app",
        "https://eleventales.replit.app",
        "http://localhost:5173",
        "http://localhost:8080",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router)
app.include_router(sfx_router)
app.include_router(voice_design_router)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Session ───────────────────────────────────────────────────────────────────

class SessionResponse(BaseModel):
    signed_url: str
    character_name: str
    character_id: str


@app.get("/api/session", response_model=SessionResponse)
async def create_session(character_id: str):
    """
    Issue a signed ElevenLabs Conversational AI URL.

    The frontend connects directly to ElevenLabs via this URL — no proxy needed.
    """
    character = get_character(character_id)
    if not character:
        raise HTTPException(status_code=404, detail=f"Unknown character: {character_id}")

    try:
        signed_url = get_session_url(character_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[session] Failed to get signed URL for {character_id}: {e}")
        raise HTTPException(status_code=502, detail="Failed to create session — ElevenLabs error")

    return SessionResponse(
        signed_url=signed_url,
        character_name=character.name,
        character_id=character_id,
    )


# ── Frontend SPA ──────────────────────────────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"


def _serve_spa(path: str = ""):
    if not FRONTEND_DIST.exists():
        return {"error": "Frontend not built", "hint": "Run: cd frontend && npm run build"}
    if path:
        candidate = FRONTEND_DIST / path
        if candidate.is_file():
            return FileResponse(candidate)
    return FileResponse(FRONTEND_DIST / "index.html")


@app.get("/", include_in_schema=False)
async def serve_root():
    return _serve_spa()


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    return _serve_spa(full_path)
