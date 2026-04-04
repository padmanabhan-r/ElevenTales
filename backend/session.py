# backend/session.py
"""Issues signed ElevenLabs Conversational AI URLs for the frontend."""

import os
import re

from elevenlabs import ElevenLabs

from characters import get_character

_primary_client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])


def _get_fallback_client() -> ElevenLabs | None:
    key = os.environ.get("ELEVENLABS_API_KEY_BACKUP")
    return ElevenLabs(api_key=key) if key else None


def _with_fallback(operation, label: str):
    """Retry ElevenLabs calls on quota/auth errors using backup API key."""
    try:
        return operation(_primary_client)
    except Exception as e:
        msg = str(e)
        is_quota = bool(re.search(r"quota|limit|exceeded|429|401|insufficient|credits", msg, re.I))
        if not is_quota:
            raise
        fallback = _get_fallback_client()
        if not fallback:
            raise
        print(f"[session] {label}: primary key failed ({msg}), switching to backup")
        return operation(fallback)


def get_session_url(character_id: str) -> str:
    character = get_character(character_id)
    if not character:
        raise ValueError(f"Unknown character: {character_id}")
    if not character.agent_id:
        raise ValueError(f"Character '{character_id}' has no agent_id — run setup_voices.py first")
    response = _with_fallback(
        lambda c: c.conversational_ai.conversations.get_signed_url(agent_id=character.agent_id),
        "get-signed-url",
    )
    return response.signed_url
