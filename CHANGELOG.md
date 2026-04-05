# Changelog

All notable changes to StoryForge are documented here.

---

## [1.0.0] — 2026-04-05

First public release. Built for the ElevenHacks hackathon.

### Core Features

- **Voice conversations** — children talk to AI storyteller characters via ElevenLabs Conversational AI (signed URL auth, no API key in browser)
- **5 built-in characters** — Wizard Wally, Fairy Flora, Captain Coco (English), Dadi Maa (Hindi), Raja Vikram (Tamil)
- **ElevenLabs Voice Design** — unique voices created per character via the Voice Design API
- **Dynamic themes** — child picks a story theme; `{{theme}}` injected into agent's first message and system prompt
- **Storybook illustrations** — Gemini image generation triggered by agent tool calls and a frontend fallback timer
- **Illustration cooldown** — 8-second force cooldown prevents rapid-fire double generation when tool call and fallback fire together
- **Magic Camera** — Gemini identifies a real-world object from camera; builds the story around it with a seeded illustration
- **Sketch Mode** — child draws something; Gemini illustrates it in storybook style and weaves it into the story
- **Barge-in** — children can interrupt the narrator naturally mid-sentence
- **Achievement badges** — silently awarded by the agent when children contribute creative ideas (max 3 per session)
- **Story recap** — illustrated summary with title and per-scene narrations at session end
- **Past Adventures** — localStorage gallery of all previous story sessions
- **Child-safe moderation** — theme and content moderation via Gemini Flash Lite before any story content is spoken or shown

### Voice Design (Custom Characters)

- **VoiceDesignScreen** — multi-step flow: describe character → generate 3 voice previews → pick one → name + emoji → save
- **Collapsible emoji picker** — 100+ emoji across categories; auto-closes on selection
- **Custom character persistence** — saved server-side in `custom_characters.json`; loaded on every app start
- **My Created Storytellers tab** — tabbed CharacterSelect screen separates built-in from user-designed characters
- **Custom character avatar** — emoji fallback in StoryScreen when no image URL is set
- **409 error handling** — if a voice preview has already been used, user is sent back to step 1 with a clear message

### Agent Setup

- `setup_voices.py` with `--char` and `--force` flags for iterating on individual characters
- Agent config: `gemini-2.5-flash` LLM, `eleven_flash_v2` / `eleven_multilingual_v2` TTS, temperature `0.0`, turn timeout `7.0s`
- Short-burst narration rule: 2–3 sentences max before pausing for the child
- `generate_illustration` and `award_badge` tools registered inside `prompt` config
- `first_messages.md` — theme-dynamic opening lines for all 5 built-in characters

### Infrastructure

- FastAPI backend with dual ElevenLabs API key fallback (primary + backup)
- Replit deployment via `start.sh` + `.replit` config
- `custom_characters.json` and `character_ids.json` gitignored
