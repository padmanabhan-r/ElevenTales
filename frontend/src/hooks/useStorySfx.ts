import { useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const SFX_VOLUME = 0.2;

const THEME_SFX: Record<string, string> = {
  Magic:      "soft magical sparkle chime, fairy dust shimmer, enchanted bell reveal",
  Space:      "cosmic shimmer, soft sci-fi chime, starlight sparkle",
  Animals:    "gentle nature rustle, soft adventure chime, whimsical woodland reveal",
  Kingdoms:   "harp strum, royal fanfare shimmer, castle ambience chime",
  Ocean:      "soft ocean wave wash, gentle bubble pop, underwater shimmer",
  Jungle:     "tropical bird call, gentle jungle rustle, adventure chime",
  Robots:     "soft electronic beep, gentle mechanical chime, futuristic sparkle",
  Spooky:     "eerie soft chime, ghost whisper, mysterious shimmer",
  Adventure:  "heroic chime reveal, soft adventure fanfare, quest shimmer",
  Circus:     "playful carousel chime, carnival sparkle, fun reveal",
  Dinosaurs:  "soft prehistoric rumble, adventure chime, jungle reveal",
  Food:       "playful pop, happy chime, cheerful sparkle reveal",
  Sharing:    "warm heartfelt chime, gentle soft bell, kind reveal",
  Courage:    "uplifting chime, warm bell, gentle fanfare",
  Gratitude:  "warm soft chime, gentle harp shimmer, heartfelt bell",
  Creativity: "magical paint splash, soft sparkle, creative chime reveal",
  Kindness:   "warm gentle chime, soft shimmer, heartfelt sparkle",
};

const DEFAULT_SFX = "magical page turn, soft sparkle, gentle paper rustle, whimsical storybook chime";

/**
 * Pre-fetches a single theme-matched SFX blob at session start.
 * Exposes `playIllustrationSfx()` — call it each time a scene becomes visible.
 */
export function useStorySfx(theme?: string) {
  const sfxUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const prompt = (theme && THEME_SFX[theme]) ? THEME_SFX[theme] : DEFAULT_SFX;

    fetch(`${API_BASE}/api/sfx?prompt=${encodeURIComponent(prompt)}&duration=5.0`)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        objectUrl = URL.createObjectURL(blob);
        sfxUrlRef.current = objectUrl;
      })
      .catch(() => {});

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        sfxUrlRef.current = null;
      }
    };
  }, [theme]);

  const playIllustrationSfx = useCallback(() => {
    const url = sfxUrlRef.current;
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = SFX_VOLUME;
    audio.play().catch(() => {});
  }, []);

  return { playIllustrationSfx };
}
