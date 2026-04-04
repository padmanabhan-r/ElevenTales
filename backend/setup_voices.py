#!/usr/bin/env python3
"""
Setup script: create Voice Design voices + ElevenLabs agents for characters.

Run for all characters:
    uv run python setup_voices.py

Run for a single character (iterate without touching others):
    uv run python setup_voices.py --char fairy

Force re-creation even if IDs already exist:
    uv run python setup_voices.py --char fairy --force

Writes backend/character_ids.json mapping character_id → { voice_id, agent_id }.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv()

from characters import SYSTEM_PROMPT_BASE, _CHARACTER_DEFS

OUTPUT_PATH = Path(__file__).parent / "character_ids.json"

CLIENT = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

SAMPLE_TEXT = (
    "And HERE is where the magic truly begins — deep in the heart of the Enchanted Forest, "
    "something extraordinary was about to happen! Come, let me tell you the most wonderful story!"
)

# Voice Design descriptions per character — ElevenLabs recommended format:
# "Native <Language>. <Gender>, <Age>. <Quality>. Persona: <2–5 words>. Emotion: <2–3 adjectives>. <1–2 sentences timbre + pacing>"
VOICE_DESCRIPTIONS: dict[str, str] = {
    "wizard": (
        "Native British English. Male, elder (60s–70s). Studio quality. "
        "Persona: ancient wizard, warm grandfather. Emotion: playful, wise, warm. "
        "Rich, full baritone with natural theatrical resonance; measured and deliberate for mysterious moments, brighter and faster when the magic crackles."
    ),
    "fairy": (
        "Native British English. Female, young adult (20s). Studio quality. "
        "Persona: whimsical fairy storyteller. Emotion: warm, delighted, magical. "
        "Light soprano voice with an airy, breathy quality and natural musical lilt; pacing varies from slow hushed near-whispers at magical reveals to bright and quick with excitement."
    ),
    "pirate": (
        "Native English. Female, adult (30s). Studio quality. "
        "Persona: bold, warm-hearted pirate captain. Emotion: energetic, brave, joyful. "
        "Clear mid-range voice with bold, punchy delivery and natural forward momentum; slows to wonder at discoveries, speeds up with the thrill of adventure."
    ),
    "dadi": (
        "Native Hindi. Female, elder (60s–70s). Studio quality. "
        "Persona: loving Indian grandmother. Emotion: warm, gentle, maternal. "
        "Soft mid-range voice with slow, deliberate pacing and natural age in the warmth; rises softly with delight and lowers warmly for mystery, never rushing."
    ),
    "rajvikram": (
        "Native Tamil. Male, adult (40s–50s). Studio quality. "
        "Persona: regal, kind Tamil king. Emotion: warm, dignified, gentle. "
        "Deep baritone with clear resonance and natural Tamil cadence; measured and confident delivery that slows for wisdom and mystery, brightens with storytelling energy."
    ),
}

# Agent tool definitions — registered in conversation_config.agent.prompt.tools
AGENT_TOOLS = [
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
        "description": "Award a creativity badge silently. Call when child contributes any creative idea. Max 2 per session.",
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


def create_voice(char_id: str, char_name: str) -> str:
    """Create a voice via Voice Design API. Returns voice_id."""
    desc = VOICE_DESCRIPTIONS[char_id]
    print(f"  [{char_id}] Creating voice via Voice Design...")

    # Step 1: Generate previews
    previews = CLIENT.text_to_voice.create_previews(
        voice_description=desc,
        text=SAMPLE_TEXT,
    )
    if not previews.previews:
        raise RuntimeError(f"No previews returned for {char_id}")

    # Pick the first preview
    preview = previews.previews[0]
    generated_voice_id = preview.generated_voice_id
    print(f"  [{char_id}] Preview generated: {generated_voice_id}")

    # Step 2: Save as permanent voice
    voice = CLIENT.text_to_voice.create(
        voice_name=f"ElevenTales — {char_name}",
        voice_description=desc,
        generated_voice_id=generated_voice_id,
    )
    print(f"  [{char_id}] Voice saved: {voice.voice_id}")
    return voice.voice_id


_LANG_CODE = {
    "English": "en", "Hindi": "hi", "Tamil": "ta",
    "Mandarin": "zh", "Spanish": "es", "French": "fr",
}


def create_agent(char_id: str, char_name: str, voice_id: str, extra_prompt: str, first_message: str, language: str = "English") -> str:
    """Create an ElevenLabs Conversational AI agent. Returns agent_id."""
    print(f"  [{char_id}] Creating agent...")
    system_prompt = SYSTEM_PROMPT_BASE.format(name=char_name) + extra_prompt
    # eleven_flash_v2 = English only; eleven_multilingual_v2 = multilingual
    # eleven_v3_conversational = more expressive but currently in alpha
    tts_model = "eleven_flash_v2" if language == "English" else "eleven_multilingual_v2"
    lang_code = _LANG_CODE.get(language, "en")

    agent = CLIENT.conversational_ai.agents.create(
        name=f"ElevenTales - {char_name}",
        conversation_config={
            "agent": {
                "prompt": {
                    "prompt": system_prompt,
                    "llm": "gemini-2.5-flash",
                    "temperature": 0.0,
                    "tools": AGENT_TOOLS,
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
    print(f"  [{char_id}] Agent created: {agent.agent_id} (lang={lang_code}, model={tts_model})")
    return agent.agent_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Create ElevenLabs voices + agents for ElevenTales characters.")
    parser.add_argument(
        "--char",
        metavar="CHARACTER_ID",
        help="Only process this character (e.g. --char fairy). Omit to process all.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-creation even if voice_id / agent_id already exist.",
    )
    args = parser.parse_args()

    # Validate --char if provided
    if args.char and args.char not in _CHARACTER_DEFS:
        print(f"Unknown character: {args.char!r}. Valid IDs: {', '.join(_CHARACTER_DEFS)}")
        sys.exit(1)

    # Load existing IDs so we can skip already-created characters
    existing: dict = {}
    if OUTPUT_PATH.exists():
        with open(OUTPUT_PATH) as f:
            existing = json.load(f)
        print(f"Loaded {len(existing)} existing entries from {OUTPUT_PATH.name}")

    ids: dict = dict(existing)

    targets = {args.char: _CHARACTER_DEFS[args.char]} if args.char else _CHARACTER_DEFS

    for char_id, defn in targets.items():
        char_name = defn["name"]
        entry = dict(ids.get(char_id, {}))

        print(f"\n=== {char_name} ({char_id}) ===")

        # Voice
        if entry.get("voice_id") and not args.force:
            print(f"  [{char_id}] Voice already exists: {entry['voice_id']} — skipping (use --force to recreate)")
            voice_id = entry["voice_id"]
        else:
            voice_id = create_voice(char_id, char_name)
            entry["voice_id"] = voice_id
            ids[char_id] = entry
            with open(OUTPUT_PATH, "w") as f:
                json.dump(ids, f, indent=2)
            time.sleep(1)

        # Agent
        if entry.get("agent_id") and not args.force:
            print(f"  [{char_id}] Agent already exists: {entry['agent_id']} — skipping (use --force to recreate)")
        else:
            agent_id = create_agent(char_id, char_name, voice_id, defn["extra_prompt"], defn.get("first_message", ""), defn["language"])
            entry["agent_id"] = agent_id
            ids[char_id] = entry
            with open(OUTPUT_PATH, "w") as f:
                json.dump(ids, f, indent=2)
            time.sleep(1)

    scope = args.char or "all characters"
    print(f"\n✓ Done! {OUTPUT_PATH} written ({scope}).")
    print("Restart the backend to pick up the new IDs.")


if __name__ == "__main__":
    main()
