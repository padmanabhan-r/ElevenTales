# Changelog

All notable changes to ElevenTales are documented here.

---

## [1.0.2] — 2026-04-09

### Added

- **PDF story download** — Story Recap screen now has a "⬇ Download PDF" button that generates a full illustrated storybook as an A4 PDF, with a title page, per-scene illustration and narration pages, badges page, and a closing "The End" page
- **Dynamic language detection in voice cloning** — ElevenLabs Scribe v2 STT detects the spoken language from the recorded audio sample; the preview is played back in the detected language using `eleven_multilingual_v2`, and a "Detected Language" badge is shown in the preview step; the language selector is pre-filled accordingly
- **Graceful 2-minute preview timeout** — when a free session hits the 2-minute limit, a dedicated end screen appears with options to view the story recap or start a new adventure (instead of a silent disconnect)
- **Preview voice cleanup** — IVC preview voices are automatically deleted when a user re-records, generates a new preview, or navigates away without completing character creation, preventing the 30-voice quota from filling up with orphaned clones
- `DELETE /api/voice-clone/preview/{voice_id}` endpoint for best-effort IVC voice cleanup

### Fixed

- **"See our story" missing after timeout** — Story Recap and PDF download are now accessible after the 2-minute preview ends, not only after a full session
- **Card hover clipping in My Created Storytellers** — added `pt-4` to card grids so the `whileHover={{ y: -8 }}` lift animation is no longer clipped by the container
- **TypeScript errors in StoryScreen** — removed stale `"ready"` session state references, fixed `TargetAndTransition` type for Framer Motion, replaced `.at(-1)` with ES2021-compatible index access
- **Voice clone preview text** — preview was always in English regardless of the user's language; now plays in the detected language with the correct TTS model

### Changed

- IVC voices are renamed from `ElevenTales - Clone Preview ...` to `ElevenTales - <CharacterName>` when a character is successfully created

---

## [1.0.1] — 2026-04-07

First public release. Built for the ElevenHacks hackathon.

### Core Features

- **Voice conversations** — children talk to AI storyteller characters via ElevenLabs Conversational AI using signed session URLs, so raw API keys never reach the browser
- **5 built-in characters** — Wizard Wally, Fairy Flora, Captain Coco (English), Dadi Maa (Hindi), and Raja Vikram (Tamil)
- **Dynamic themes** — child-selected themes are injected into the storyteller's opening and system prompt using `{{theme}}`
- **Storybook illustrations** — Gemini scene generation can be triggered by agent tool calls, with a frontend fallback timer to keep story visuals moving
- **Illustration cooldown** — 8-second forced cooldown prevents duplicate image generation when tool calls and fallback timing overlap
- **Magic Camera** — camera mode identifies a real-world object and uses it as a story prop with a seeded illustration
- **Sketch Mode** — child drawings are transformed into storybook-style art and woven directly into the adventure
- **Barge-in support** — children can interrupt the storyteller naturally mid-sentence
- **Achievement badges** — the agent can silently award up to 3 creative badges per session
- **Story recap** — end-of-session summary with title and scene-by-scene narrations
- **Past Adventures** — previous stories are stored locally and shown in a replayable gallery
- **Child-safe moderation** — Gemini Flash Lite screens themes and content before story content is spoken or shown

### Voice Creation

- **Voice Design flow** — multi-step custom storyteller creation: describe character, generate 3 previews, pick a voice, choose name and emoji, then save
- **Voice Cloning flow** — user voice cloning support to turn a recorded voice into a storyteller
- **Custom character persistence** — created storytellers are stored server-side in `custom_characters.json` and loaded on app startup
- **Tabbed character selection** — built-in storytellers and user-created storytellers are separated in Character Select
- **Emoji avatar fallback** — custom characters use emoji avatars in Story Screen when no image URL exists
- **409 preview recovery** — if a voice preview was already consumed, the UI sends the user back to restart with a clear message
- **Correct custom badge labels** — Character Select shows `user cloned` for cloned custom voices and `user designed` for designed custom voices

### Fixed

- **Custom voice badge labeling** — corrected the Character Select badge logic for custom cloned vs designed voices

### Documentation

- **README refresh** — expanded and reorganized the project overview, ElevenLabs feature coverage, and Replit deployment notes
- **Product screenshots added** — added a full image set covering landing, character selection, theme selection, Magic Camera, Sketch Mode, story scenes, badge awards, Voice Design, and Voice Cloning flows
- **README polish** — fixed the opening line spacing so it no longer runs into the badge row

### Agent Setup

- `setup_voices.py` supports `--char` and `--force` for iterating on individual built-in storytellers
- Built-in agent config uses `gemini-2.5-flash` with `eleven_flash_v2` / `eleven_multilingual_v2`, `temperature 0.0`, and `7.0s` turn timeout
- Narration is tuned for short bursts of 2 to 3 sentences before pausing for the child
- `generate_illustration` and `award_badge` are registered as agent tools
- `first_messages.md` provides theme-dynamic opening lines for the built-in characters

### Infrastructure

- **FastAPI backend** — serves signed ElevenLabs session URLs, image generation, sound effects, recap generation, voice design, and voice cloning endpoints
- **Dual-key ElevenLabs fallback** — backend can switch to a backup API key on quota or auth failures
- **Single-process deployment** — `start.sh` builds the frontend, copies it into the backend bundle, syncs Python deps, and starts Uvicorn
- **Tracked secret protection** — runtime secrets stay in env files or platform secret stores, while `custom_characters.json`, `character_ids.json`, `.replit`, and env files are excluded from version control
