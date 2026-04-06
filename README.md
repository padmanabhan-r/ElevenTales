# ElevenTales

A child picks a storyteller. Says a word — "dragons", "my toy dinosaur", "space" — and a story begins. Not a pre-written one. A real one, alive, branching in real time around whatever the child says next. The storyteller listens. Reacts. Pauses. Asks what happens next. And the story keeps growing until the child says stop.

Every voice is distinct — some warm and grandmotherly in Hindi, some swashbuckling in English, some ancient and mythic in Tamil. Children can design their own storyteller from scratch, shaping a voice that has never existed before. They can hold up a toy to the camera and watch the story build itself around it. They can draw something wild and see it come to life. And if they want — truly want — they can clone their own voice and become the narrator themselves.

The story is always theirs. ElevenLabs makes it real.

Built for the **ElevenHacks** hackathon.

---

## What It Does

A child arrives. They pick a storyteller — Wizard Wally, Fairy Flora, Captain Coco, Dadi Maa, or Raja Vikram — or design one of their own. They choose how to spark the story: pick a theme, hold up something to the camera, sketch it, or just speak. Then the story begins.

The storyteller speaks 2–3 sentences of vivid narration, then stops. Waits. The child responds — agrees, argues, invents something new — and the story weaves it in. A storybook illustration appears as the scene unfolds, generated on the fly and visually anchored to everything that came before. Badges appear silently when the child does something genuinely creative — not for saying "yes", but for naming a character, inventing a twist, surprising the story.

At the end: a full illustrated recap. Every scene, every moment, saved as a past adventure they can revisit.

No typing. No menus mid-story. Just voice.

---

## ElevenLabs — The Engine of Everything

ElevenLabs is not a feature in ElevenTales. It is the foundation.

| Feature | How We Use It |
|---------|--------------|
| **Conversational AI Agents** | Every built-in storyteller is a live ElevenLabs agent — real-time voice conversation, barge-in support, tool calling, dynamic branching. The story is never scripted; the agent improvises around what the child says. |
| **Voice Design API** | Parents and children can describe a character — "a gentle old wizard with a deep voice" — and the Voice Design API generates three distinct voice previews to choose from. The selected voice becomes a permanent storyteller. |
| **Instant Voice Cloning (IVC)** | A child can record their own voice and clone it. Their voice, their storyteller, their story — narrated by themselves. |
| **Signed URLs** | Agent sessions are authenticated server-side. The ElevenLabs API key never reaches the browser. The frontend calls `/api/session`, which returns a short-lived signed WebSocket URL. |
| **Dynamic Variables** | `{{theme}}` is injected at session start — the child's chosen theme, their camera prop label, or their sketch description. The agent receives this before speaking its first word and builds the entire story around it. |
| **Client Tools** | The agent calls `generate_illustration` to trigger a Gemini scene illustration at the exact dramatic moment it chooses. It calls `award_badge` silently when a child earns one. Both tools fire in the browser — no round-trip to the backend. |
| **Sound Effects Generation** | Scene reveal sound effects are generated live via the ElevenLabs Sound Effects API — a soft magical chime as each illustration appears. |
| **Multilingual TTS** | Built-in characters speak in English (`eleven_flash_v2`), Hindi, and Tamil (`eleven_multilingual_v2`). The storyteller's language is the child's language. |
| **`@11labs/client` SDK** | The frontend connects directly to the ElevenLabs WebSocket using the official SDK — real-time audio streaming, mic management, barge-in, tool call dispatch, all handled natively. |

---

## Replit — Where Iteration Lives

ElevenTales was built fast, iterated faster, and deployed without friction — because of Replit.

Replit meant there was no "deployment step". `bash start.sh` builds the frontend and starts the backend. That same command runs on Replit exactly as it runs locally. No Docker. No CI pipeline. No environment drift between dev and prod.

Every iteration — new character voice, new illustration trigger, new badge logic — was live on a public URL within seconds of being committed. Testing with a real child's device, sharing a link with collaborators, demoing mid-hackathon: all of it happened through Replit without configuration.

Secrets live in Replit's Secrets panel, never in code. The app reads them as environment variables whether running locally or deployed. One model, one codebase, one command.

For a hackathon where every hour matters, Replit removed the hours that would have disappeared to infrastructure.

---

## Features

- **Live voice conversations** — children talk, the storyteller listens and responds in real time, no typing ever
- **5 built-in storytellers** — English, Hindi, and Tamil characters with distinct voices and personalities
- **Voice Design** — design a custom storyteller character with a unique AI-generated voice
- **Voice Cloning** — clone your own voice and become the narrator of your own story
- **Magic Camera** — point at a toy or object; the story builds itself around it with a storybook illustration
- **Sketch Mode** — draw something; it becomes the story's centrepiece, illustrated in storybook style
- **Dynamic scene illustrations** — Gemini generates storybook art as the story unfolds, each scene visually continuous with the last
- **Dual illustration trigger** — agent calls `generate_illustration` at dramatic moments; a frontend fallback fires if the agent pauses
- **Barge-in support** — children can interrupt and redirect the story at any point
- **Achievement badges** — silently awarded for genuine creative contribution (naming a character, inventing a twist, not just saying "yes")
- **Story recap** — full illustrated storybook summary with a generated title at the end of every session
- **Past Adventures** — gallery of every previous story with its illustrations
- **Child-safe content moderation** — themes, camera subjects, and sketches screened before the story begins
- **Image quality toggle** — choose between faster generation (Nano Banana) and richer visuals (Nano Banana 2)
- **Ambient sound** — background music on the landing screen, silenced during story and voice cloning

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + TailwindCSS + Framer Motion |
| **Voice & Conversation** | ElevenLabs Conversational AI + `@11labs/client` SDK |
| **Voice Design** | ElevenLabs Voice Design API |
| **Voice Cloning** | ElevenLabs Instant Voice Cloning (IVC) |
| **Sound Effects** | ElevenLabs Sound Effects API |
| **Agent LLM** | Gemini 2.5 Flash (inside ElevenLabs agents) |
| **Scene Illustrations** | Gemini image generation (`gemini-3.1-flash-image-preview`) |
| **Image Subject Extraction** | Gemini 2.5 Flash Lite |
| **Content Moderation** | Gemini 2.5 Flash Lite |
| **Backend** | Python FastAPI |
| **Deployment** | Replit |

---

## Architecture

```
Browser (@11labs/client + React)
  ├── GET  /api/session?character_id=   → Backend issues signed ElevenLabs URL
  ├── WebSocket → signed_url            → ElevenLabs Conv AI agent (direct, no proxy)
  ├── Client tool: generate_illustration → POST /api/image → Gemini image generation
  ├── Client tool: award_badge          → badge displayed in browser
  └── GET  /api/sfx                     → ElevenLabs Sound Effects API

Backend (FastAPI)
  ├── /api/session          → ElevenLabs signed URL
  ├── /api/image            → Gemini scene illustration
  ├── /api/sketch-preview   → Gemini sketch → storybook illustration + label
  ├── /api/check-theme      → content moderation
  ├── /api/story-recap      → Gemini title + per-scene narration
  ├── /api/sfx              → ElevenLabs sound effects
  ├── /api/characters/custom         → list custom characters
  ├── /api/characters/design-previews → Voice Design previews
  ├── /api/characters/save            → save character + create agent
  └── /api/character/avatar           → Gemini character portrait
```

---

## Quick Start

### 1. Clone and install

```bash
cd frontend && npm install
cd ../backend && uv sync
```

### 2. Set up environment variables

Create `backend/.env`:

```env
ELEVENLABS_API_KEY=...
GEMINI_API_KEY=...
IMAGE_MODEL=gemini-3.1-flash-image-preview
```

### 3. Create built-in characters (one-time)

```bash
cd backend && uv run python setup_voices.py
```

Creates ElevenLabs Voice Design voices and Conversational AI agents for all 5 built-in characters. Writes `backend/character_ids.json` (gitignored).

To recreate a single character:

```bash
uv run python setup_voices.py --char fairy --force
```

### 4. Run

```bash
bash start.sh
```

Builds the frontend, starts FastAPI at `http://localhost:8080`.

> On Replit: set secrets in the Secrets panel. `bash start.sh` works identically.

---

## Built-in Characters

| ID | Name | Language | Personality |
|----|------|----------|-------------|
| `wizard` | Wizard Wally | English | Wise, mysterious, full of riddles |
| `fairy` | Fairy Flora | English | Joyful, whimsical, bursting with wonder |
| `pirate` | Captain Coco | English | Swashbuckling, adventurous, loves treasure |
| `dadi` | Dadi Maa | Hindi | Warm, grandmotherly, rooted in Indian folklore |
| `rajvikram` | Raja Vikram | Tamil | Ancient, mythic, storytelling from a royal court |

---

## Voice Design — Create Your Own Storyteller

1. Go to **My Created Storytellers** → **Design a Voice**
2. Describe the character — name, personality, voice style, language
3. Listen to 3 generated voice previews, pick your favourite
4. A full ElevenLabs agent is created around that voice — the character is immediately ready to tell stories

## Voice Cloning — Become the Storyteller

1. Go to **My Created Storytellers** → **Clone a Voice**
2. Record a short voice sample (or upload audio)
3. Give the character a name and personality
4. Your cloned voice is turned into a full Conversational AI agent — you narrate your own story

---

## How Illustrations Work

Scene illustrations are triggered two ways:

1. **Agent tool call** (`generate_illustration`) — the agent fires this at story start, scene changes, character introductions, and dramatic moments. It chooses the exact moment; the frontend honours it.
2. **Frontend fallback** (`triggerImageGeneration`) — if the agent hasn't called the tool within the configured interval, the frontend triggers generation automatically. Requires ≥150 characters of accumulated narration before the first image fires.

A **force cooldown** (8 seconds) prevents double-firing when both paths activate close together.

For Magic Camera and Sketch sessions, the illustrated prop/sketch is silently seeded as `previous_image_data` for the first story scene generation — the story's visuals begin from the child's own object, without showing it on the canvas.

---

## Agent Configuration

Each character is a full ElevenLabs Conversational AI agent:

| Setting | Value |
|---------|-------|
| LLM | `gemini-2.5-flash` |
| TTS (English) | `eleven_flash_v2` |
| TTS (multilingual) | `eleven_multilingual_v2` |
| Stability | 0.5 |
| Similarity boost | 0.8 |
| Streaming latency | 3 |
| Turn timeout | 7.0s |
| Auth | Signed URL (API key server-side only) |
| Dynamic variable | `{{theme}}` — injected at session start |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `ELEVENLABS_API_KEY_BACKUP` | No | Backup key — swaps in silently on 429 errors |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (AI Studio) |
| `IMAGE_MODEL` | No | Gemini image model override |

---

## Project Structure

```
ElevenTales/
├── frontend/src/
│   ├── characters/       # Character metadata (frontend)
│   ├── components/       # Badges, recap modal, scene grid, past adventures, audio visualizer
│   ├── hooks/            # useConversation, useStoryImages, useAmbientSound, useLiveAPI
│   └── screens/          # LandingPage, CharacterSelect, ThemeSelect, StoryScreen,
│                         #   VoiceDesignScreen, VoiceCloneScreen
├── backend/
│   ├── main.py           # FastAPI entry point
│   ├── session.py        # ElevenLabs signed URL endpoint
│   ├── characters.py     # Character config + system prompts
│   ├── voice_design.py   # Voice Design + custom character endpoints
│   ├── voice_clone.py    # Voice Cloning (IVC) endpoints
│   ├── image_gen.py      # Gemini image generation, sketch preview, content moderation
│   ├── sfx.py            # ElevenLabs Sound Effects proxy
│   ├── setup_voices.py   # One-time character setup script
│   ├── character_ids.json     # voice_id + agent_id per character (gitignored)
│   └── custom_characters.json # User-created characters (gitignored)
├── agents-setup/         # Agent system prompts and first-message reference docs
└── start.sh              # Build frontend + start backend (one command)
```

---

## License

[Creative Commons Attribution 4.0 International](LICENSE)
