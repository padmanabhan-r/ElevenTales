# ElevenTales

A voice-first interactive storytelling platform for children. Kids have real-time voice conversations with AI-driven story characters that narrate and dynamically illustrate adventures.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Python FastAPI served via Uvicorn
- **Voice AI**: ElevenLabs Conversational AI SDK
- **LLM & Vision**: Google Gemini (2.0/2.5 Flash)
- **Image Generation**: Google Gemini image models

## Project Structure

```
/
├── frontend/          # React + Vite TypeScript app
│   └── src/
│       ├── screens/   # LandingPage, CharacterSelect, StoryScreen
│       ├── hooks/     # useConversation, useStoryImages, ambient sound
│       ├── components/# Visualizers, Modals, Scene Grids
│       └── characters/# Character metadata
├── backend/           # Python FastAPI app
│   ├── main.py        # API routing + serving frontend SPA
│   ├── session.py     # ElevenLabs signed session URL generation
│   ├── characters.py  # Character personalities and voice config
│   ├── image_gen.py   # Gemini image generation routes
│   └── setup_voices.py# One-time ElevenLabs voice/agent setup utility
├── agents-setup/      # Character persona markdown definitions
└── start.sh           # Build frontend, then start backend
```

## How It Runs

The `start.sh` script:
1. Builds the React frontend (`npm install && npm run build`)
2. Copies the built `dist/` into `backend/frontend/dist/`
3. Installs backend Python deps via `uv sync`
4. Starts Uvicorn serving both the API and the frontend SPA on the configured port

The single Uvicorn process serves the frontend at `/` and the API at `/api/*`.

## Required Environment Variables / Secrets

- `ELEVENLABS_API_KEY` — ElevenLabs API key (required for voice sessions)
- `ELEVENLABS_API_KEY_BACKUP` — Optional fallback key if primary hits quota
- `GEMINI_API_KEY` — Google AI Studio key for image generation and LLM calls
- `IMAGE_MODEL` — Optional override for Gemini image model (default: `gemini-3.1-flash-image-preview`)

## Workflow

- **Start application**: `PORT=5000 bash start.sh` — builds frontend and starts backend on port 5000

## Notes

- Before voice features work, run `backend/setup_voices.py` to create ElevenLabs agents and assign `agent_id` values to characters in `characters.py`.
- The backend serves the frontend as a SPA — all non-API routes return `index.html`.
