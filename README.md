# ElevenTales

[![Live App](https://img.shields.io/badge/Live%20App-ElevenTales-orange?style=flat&logo=googlechrome&logoColor=white)](https://replit.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs%20Conv%20AI-FF6B35?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+&logoColor=white)](https://elevenlabs.io)
[![Voice Design](https://img.shields.io/badge/Voice%20Design-ElevenLabs-FF6B35?style=flat&logoColor=white)](https://elevenlabs.io/voice-design)
[![Voice Cloning](https://img.shields.io/badge/Voice%20Cloning%20IVC-ElevenLabs-FF6B35?style=flat&logoColor=white)](https://elevenlabs.io/voice-cloning)
[![Python](https://img.shields.io/badge/Python%203.13-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Replit](https://img.shields.io/badge/Deployed%20on-Replit-F26207?style=flat&logo=replit&logoColor=white)](https://replit.com)

**ElevenTales turns a child's words into a living, breathing story.**

A voice-first interactive storytelling app for kids, powered by **ElevenLabs Conversational AI**, **Voice Design**, and **Voice Cloning**.

A child picks a storyteller, says "dragons" or "my toy dinosaur" or "space" — and a real story begins. Not pre-written. Not scripted. Alive, branching in real time around whatever the child says next. The storyteller listens, reacts, adapts, and keeps the adventure growing.

Every voice is distinct. Children can **design their own storyteller** from scratch, shaping a voice that has never existed before. They can **clone their own voice** and become the narrator. The story is always theirs. **ElevenLabs makes it real.**

Built for the **ElevenHacks** hackathon.

<p align="center">
  <a href="#">
    <img src="images/0-eleventales-landing.png" alt="ElevenTales Demo" width="700"/>
  </a>
  <br/>
  <em>▶ Watch the demo</em>
</p>

## Contents

- [Meet ElevenTales](#meet-eleventales)
  - [The Storytellers](#the-storytellers)
  - [The Experience](#the-experience)
    - [Pick a Theme](#1-pick-a-theme)
    - [Magic Camera](#2-magic-camera)
    - [Sketch a Theme](#3-sketch-a-theme)
  - [A Living, Illustrated Story](#a-living-illustrated-story)
  - [Creativity Rewards](#creativity-rewards)
  - [Story Recap](#story-recap)
  - [Voice Design — Build a Storyteller](#voice-design--build-a-storyteller)
  - [Voice Cloning — Become the Storyteller](#voice-cloning--become-the-storyteller)
- [ElevenLabs — The Engine of Everything](#elevenlabs--the-engine-of-everything)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Built With](#built-with)
- [Try It Out](#try-it-out)
- [Running Locally](#running-locally)
- [Roadmap](#roadmap)

---

# Meet ElevenTales

## The Storytellers

ElevenTales is powered by **ElevenLabs Conversational AI** — every character has a real voice, designed specifically for them via the Voice Design API. Not generic TTS. Not a chatbot. A living storyteller who listens, responds, and improvises.

**5 built-in storytellers. Unlimited custom ones.**

| Character | Language | Personality |
|---|---|---|
| Wizard Wally | English | Wise, mysterious, full of riddles |
| Fairy Flora | English | Joyful, whimsical, bursting with wonder |
| Captain Coco | English | Swashbuckling, adventurous, loves treasure |
| Dadi Maa | Hindi | Warm, grandmotherly, rooted in Indian folklore |
| Raja Vikram | Tamil | Ancient, mythic, storytelling from a royal court |

Children can also **design their own character** — describe a voice, hear three generated previews, and instantly create a new storyteller. Or **clone their own voice** and become the narrator.

<p align="center">
  <img src="images/1-choose-storyteller.png" alt="Choose Your Storyteller" width="700"/>
</p>

---

## The Experience

Children start a story in **three magical ways**:

<p align="center">
  <img src="images/2-pick-mode.png" alt="Choose How to Start" width="700"/>
</p>

---

### 1. Pick a Theme

Choose from adventure themes or life-skills topics — or type **anything their imagination invents**.

<p align="center">
  <img src="images/3-pick-theme.png" alt="Pick a Theme" width="700"/>
</p>

If a custom theme isn't appropriate for children, a friendly message blocks it before the story starts.

<p align="center">
  <img src="images/9-safety-filter.png" alt="Content Safety Filter" width="700"/>
</p>

---

### 2. Magic Camera

Hold up **any toy or object**.

The AI will:

1. Recognise the object
2. Transform it into a **storybook character**
3. Turn it into the **hero of the story**

Examples:

```
Stuffed penguin   → A fluffy penguin pal on a frozen quest
LEGO rocket       → Galactic rescue pilot saving the stars
```

If the object shown is inappropriate, the safety filter blocks it before the story starts.

<p align="center">
  <img src="images/4-magic-camera-photo.png" alt="Magic Camera - Photo" width="340"/>
  <img src="images/5-magic-camera-illustrated.png" alt="Magic Camera - Illustrated" width="340"/>
</p>

---

### 3. Sketch a Theme

Kids can **draw anything** on a canvas.

The AI turns the drawing into a **storybook illustration** and starts a story around it.

Draw mountains, a castle, a robot, a dragon, a flying whale — and watch it come to life.

<p align="center">
  <img src="images/6-sketch-drawing.png" alt="Sketch - Drawing" width="340"/>
  <img src="images/7-sketch-illustrated.png" alt="Sketch - Illustrated" width="340"/>
</p>

---

## A Living, Illustrated Story

Unlike traditional story generators, ElevenTales is **fully conversational**. Children can interrupt the storyteller, change the story direction, add characters, and invent new twists at any moment.

```
AI:    The dragon and the little knight stood at the edge of the volcano...

Child: Make the dragon sneeze and blow them into the sky!

AI:    And with one enormous sneeze, the dragon launched them both
       into the clouds — and the knight discovered she could fly.
```

Barge-in is native — ElevenLabs detects when the child starts speaking, stops the current narration, and weaves their words into the next story beat.

As the story unfolds, **illustrations appear automatically**. The agent decides the right visual moment — a new location, character reveal, or dramatic transformation — and generates an image from its own scene description, so it always matches what was just narrated. Each new image receives the **previous image as context**, keeping characters and art style consistent across every scene.

<p align="center">
  <img src="images/10-story-screen.png" alt="Story Screen" width="700"/>
</p>

---

## Creativity Rewards

ElevenTales recognises and celebrates when a child contributes something genuinely imaginative.

When a child names a character, invents a wild idea, or takes the story in an unexpected direction, **the agent awards them a creativity badge** on the spot.

The badge appears in the centre of the screen and auto-dismisses after a few seconds — a small moment of delight that tells the child their imagination matters.

Badges are saved with the story and shown in the **Story Recap** and **Past Adventures gallery**.

<p align="center">
  <img src="images/8-creative-badge.png" alt="Creative Badge Award" width="700"/>
</p>

---

## Story Recap

When the adventure ends, the app generates a **storybook recap**.

All session images are sent to Gemini, which generates a storybook title and a narration for each scene. Original session images are reused — no new images generated during recap.

Children get a scrollable storybook with title, illustrated scenes, narration captions, and creativity badges. All saved to the **Past Adventures gallery**.

<p align="center">
  <img src="images/11-story-recap.png" alt="Story Recap Storybook" width="700"/>
</p>

All completed stories are saved locally and accessible from the landing page. Tap any card to re-read the full storybook.

<p align="center">
  <img src="images/12-past-adventures.png" alt="Past Adventures Gallery" width="700"/>
</p>

---

## Voice Design — Build a Storyteller

<p align="center">
  <img src="images/13-voice-design.png" alt="Voice Design Screen" width="700"/>
</p>

1. Go to **My Created Storytellers** → **Design a Voice**
2. Describe the character — name, personality, voice style, language
3. Listen to **3 generated voice previews** from the ElevenLabs Voice Design API
4. Pick your favourite — a full ElevenLabs Conversational AI agent is created instantly
5. The character is immediately ready to tell stories

---

## Voice Cloning — Become the Storyteller

<p align="center">
  <img src="images/14-voice-cloning.png" alt="Voice Cloning Screen" width="700"/>
</p>

1. Go to **My Created Storytellers** → **Clone a Voice**
2. Record a short voice sample (or upload audio)
3. Give the character a name and personality
4. Your cloned voice becomes a full ElevenLabs Conversational AI agent — **you narrate your own story**

---

# ElevenLabs — The Engine of Everything

ElevenLabs is not a feature in ElevenTales. It is the foundation.

| Feature | How We Use It |
|---------|--------------|
| **Conversational AI Agents** | Every built-in storyteller is a live ElevenLabs agent — real-time voice conversation, barge-in, tool calling, dynamic branching. The story is never scripted; the agent improvises around what the child says. |
| **Voice Design API** | Parents and children describe a character — "a gentle old wizard with a deep voice" — and the Voice Design API generates three distinct voice previews. The selected voice becomes a permanent storyteller. |
| **Instant Voice Cloning (IVC)** | A child records their own voice and clones it. Their voice, their storyteller, their story — narrated by themselves. |
| **Signed URLs** | Agent sessions are authenticated server-side. The ElevenLabs API key never reaches the browser. The frontend calls `/api/session`, which returns a short-lived signed WebSocket URL. |
| **Dynamic Variables** | `{{theme}}` is injected at session start — the child's chosen theme, camera prop label, or sketch description. The agent receives this before speaking its first word and builds the entire story around it. |
| **Client Tools** | The agent calls `generate_illustration` at the exact dramatic moment it chooses to trigger a Gemini scene illustration. It calls `award_badge` silently when a child earns one. Both tools fire in the browser — no round-trip to the backend. |
| **Sound Effects Generation** | Scene reveal sound effects are generated live via the ElevenLabs Sound Effects API — a soft magical chime as each illustration appears. |
| **Multilingual TTS** | Built-in characters speak in English (`eleven_flash_v2`), Hindi, and Tamil (`eleven_multilingual_v2`). The storyteller's language is the child's language. |
| **`@11labs/client` SDK** | The frontend connects directly to the ElevenLabs WebSocket using the official SDK — real-time audio, barge-in, and tool call dispatch, all handled natively. |

---

# Key Features

- **Live voice conversations** — children talk, the storyteller listens and responds in real time; no typing ever
- **Barge-in support** — children can interrupt and redirect the story at any point mid-sentence
- **5 built-in storytellers** — English, Hindi, and Tamil characters with distinct AI-designed voices
- **Voice Design** — describe a character; hear 3 generated voice previews; create a custom storyteller instantly
- **Voice Cloning** — clone your own voice and become the narrator of your own story
- **Magic Camera** — point at any toy or object; the story builds itself around it with a storybook illustration
- **Sketch Mode** — draw anything; it becomes the story's centrepiece, illustrated in storybook style
- **Dynamic scene illustrations** — Gemini generates storybook art as the story unfolds, each scene visually continuous with the last
- **Dual illustration trigger** — agent calls `generate_illustration` at dramatic moments; a frontend fallback fires if the agent pauses
- **Creativity badges** — silently awarded for genuine creative contribution (naming a character, inventing a twist — not just saying "yes")
- **Story recap** — full illustrated storybook with a generated title at the end of every session
- **Past Adventures** — gallery of every previous story with its illustrations
- **Child-safe content moderation** — themes, camera subjects, and sketches screened before the story begins
- **Sound effects** — ElevenLabs-generated audio chimes on every scene reveal
- **Ambient sound** — background music on the landing screen, silenced during story and voice cloning

---

# Architecture

```
Browser (@11labs/client + React)
  ├── GET  /api/session?character_id=   → Backend issues signed ElevenLabs URL
  ├── WebSocket → signed_url            → ElevenLabs Conv AI agent (direct, no proxy)
  ├── Client tool: generate_illustration → POST /api/image → Gemini illustration
  ├── Client tool: award_badge          → badge displayed in browser
  └── GET  /api/sfx                     → ElevenLabs Sound Effects proxy

Backend (FastAPI)
  ├── /api/session                      → ElevenLabs signed URL
  ├── /api/image                        → Gemini scene illustration
  ├── /api/sketch-preview               → Gemini sketch → storybook art + label
  ├── /api/check-theme                  → content moderation
  ├── /api/story-recap                  → Gemini title + per-scene narration
  ├── /api/sfx                          → ElevenLabs sound effects
  ├── /api/characters/custom            → list custom characters
  ├── /api/characters/design-previews   → Voice Design previews
  ├── /api/characters/save              → save character + create agent
  └── /api/character/avatar             → Gemini character portrait
```

### The Agent

Each character is a full **ElevenLabs Conversational AI agent** configured with:

- **LLM:** Gemini 2.5 Flash (inside the ElevenLabs platform)
- **Dynamic variable:** `{{theme}}` — injected at session start before the first word
- **Two client tools** — `generate_illustration` and `award_badge` — called autonomously mid-narration
- **Auth:** Signed URL — the API key never leaves the backend

### Session Flow

The browser calls `/api/session` → receives a short-lived signed WebSocket URL → connects directly to ElevenLabs via `@11labs/client`. No audio proxy. The backend's only role during a story is serving image generation and sound effects.

### Illustration Pipeline

The agent decides the visual moment, writes its own scene description, and fires `generate_illustration`. The frontend sends the description + the previous image to `/api/image`, which calls Gemini for a storybook illustration. Each image seeds the next — visual continuity is maintained without any external state.

---

# Built With

### AI & Voice
| Model / API | Role |
|---|---|
| **ElevenLabs Conversational AI** | **The Agent** — real-time voice conversation, barge-in, autonomous tool calls (`generate_illustration`, `award_badge`) |
| **ElevenLabs Voice Design API** | Generate 3 voice previews from a text description; create custom storyteller voices |
| **ElevenLabs Instant Voice Cloning (IVC)** | Clone a child's voice into a full storyteller agent |
| **ElevenLabs Sound Effects API** | Live-generated audio chimes on scene reveal |
| `eleven_flash_v2` | English character TTS |
| `eleven_multilingual_v2` | Hindi and Tamil character TTS |
| `gemini-3.1-flash-image-preview` | Storybook scene illustration |
| `gemini-2.5-flash-lite` | Content moderation + story recap titles and narrations |
| `gemini-2.5-flash` | LLM inside each ElevenLabs agent |

### SDKs & Frameworks
| SDK / Framework | Usage |
|---|---|
| **`@11labs/client`** | Browser-side WebSocket connection to ElevenLabs — real-time audio, barge-in, tool call dispatch |
| **Google GenAI Python SDK** | Image generation, content moderation, story recap — all Gemini API calls on the backend |
| **FastAPI** | Python backend — session auth, image generation, voice design/cloning endpoints, SPA serving |
| **React 18 + Vite + TypeScript** | Frontend SPA |
| **TailwindCSS** | Styling |
| **Framer Motion** | Character and UI animations |
| **Web Audio API** | Microphone capture and audio playback in the browser |

### Infrastructure
| Service | Role |
|---|---|
| **Replit** | Deployment — `bash start.sh` runs identically locally and on Replit |
| **Replit Secrets** | Environment variable management — no secrets in code |

---

# Try It Out

> **Live on Replit** — open the app, pick a storyteller, and speak.

1. Open the app on a device with a microphone
2. Click **Begin Your Adventure** → pick a storyteller → choose a theme, use Magic Camera, or draw a Sketch
3. Allow microphone access — the story starts immediately
4. Speak to redirect the story, interrupt mid-sentence, or suggest ideas

---

# Running Locally

**Prerequisites:** Python 3.12+, Node.js 18+, [uv](https://docs.astral.sh/uv/), an ElevenLabs API key, and a Gemini API key.

### 1. Clone and install

```bash
git clone https://github.com/padmanabhan-r/ElevenTales.git
cd ElevenTales
cd frontend && npm install
cd ../backend && uv sync
```

### 2. Configure environment

Create `backend/.env`:

```env
ELEVENLABS_API_KEY=your-elevenlabs-key
GEMINI_API_KEY=your-gemini-key
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

| | URL |
|---|---|
| App | http://localhost:8080 |
| Backend | http://localhost:8080 |
| Health | http://localhost:8080/api/health |

> On Replit: set secrets in the Secrets panel. `bash start.sh` works identically.

---

# Roadmap

The immediate focus is polish — refining agent prompts, hardening edge cases, and perfecting the end-to-end voice experience. Hindi and Tamil characters need more testing before they're ready for everyday use.

Native **iOS and Android apps** are the natural next step — putting ElevenTales where children actually are, with proper mobile audio handling.

| Feature | Notes |
|---|---|
| **World-language expansion** | Add Spanish, French, Mandarin storytellers — ElevenLabs multilingual models already support them |
| **Rive Animated Characters** | Replace Framer Motion portraits with Rive state machine animations — real lip-sync tied to audio amplitude |
| **Learning Mode** | Storyteller weaves curriculum goals (phonics, counting, colours) into the narrative without the child realising they're learning |
| **Cloud Storage for Past Adventures** | Move from `localStorage` to cloud — stories persist across devices indefinitely |
| **Parent Dashboard** | Session summaries, badge history, themes explored — a window into how your child's imagination works |
| **Live Camera in Story Mode** | Keep the camera active during narration so the storyteller reacts to what it sees in real time |
| **Multi-child profiles** | Each child gets their own storytellers, cloned voices, and adventure gallery |
