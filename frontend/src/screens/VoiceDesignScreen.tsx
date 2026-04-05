import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";
import TopNav from "@/components/TopNav";

interface Props {
  onBack: () => void;
  onCreated: (character: Character) => void;
}

type Step = "design" | "details" | "creating" | "done";

interface PreviewItem {
  generated_voice_id: string;
  audio_base64: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const LANGUAGES = ["English", "Hindi", "Tamil", "Spanish", "French", "Mandarin"];

const EMOJI_GROUPS = [
  {
    label: "Fantasy & Magic",
    emojis: ["🧚", "🧙", "🦄", "🐉", "🧜", "🧝", "🧞", "🪄", "⭐", "🌟", "✨", "🔮"],
  },
  {
    label: "Animals",
    emojis: ["🦁", "🐯", "🐻", "🦊", "🐺", "🦅", "🦋", "🐬", "🐙", "🦕", "🦖", "🐸", "🦗"],
  },
  {
    label: "Adventure",
    emojis: ["🏴‍☠️", "⚔️", "🚀", "🌊", "🏔️", "🗺️", "🎪", "🎠", "🌈", "🎭", "🎩", "🤠"],
  },
  {
    label: "Nature & Space",
    emojis: ["🌸", "🌻", "🍄", "🌙", "☀️", "🌍", "🌺", "🍀", "🦜", "🐝", "🌴", "🏝️"],
  },
];

const DESIGN_PLACEHOLDER =
  `Native English. Female, young adult (20s). Studio quality.\nPersona: cheerful forest guardian. Emotion: warm, playful, curious.\nLight, airy voice with a gentle lilt; slows to a whisper at magical moments, quickens with excitement.`;

const PREVIEW_PLACEHOLDER =
  `Oh! Something wonderful is stirring in the forest — can you feel it? A tiny door just appeared at the base of the oldest oak tree, glowing gold in the afternoon light. I wonder... shall we knock?`;

// ── Voice preview card ────────────────────────────────────────────────────────

const PreviewCard = ({
  index,
  item,
  selected,
  onSelect,
}: {
  index: number;
  item: PreviewItem;
  selected: boolean;
  onSelect: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) {
      const bytes = Uint8Array.from(atob(item.audio_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onSelect}
      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_0_2px_hsl(var(--primary)/0.4)]"
          : "border-border/50 bg-card/60 hover:border-primary/40"
      }`}
    >
      {/* Radio */}
      <div
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          selected ? "border-primary bg-primary" : "border-muted-foreground"
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-bold text-foreground">Voice {index + 1}</p>
        <p className="text-xs text-muted-foreground">Click to select · press play to preview</p>
      </div>

      {/* Play button */}
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          playing ? "bg-primary text-white" : "bg-muted/50 hover:bg-primary/20 text-foreground"
        }`}
      >
        {playing ? "⏸" : "▶"}
      </button>
    </motion.div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const VoiceDesignScreen = ({ onBack, onCreated }: Props) => {
  // Step 1: Voice design
  const [voiceDesc, setVoiceDesc] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [guidanceScale, setGuidanceScale] = useState(30);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Step 2: Character details
  const [charName, setCharName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [personaDesc, setPersonaDesc] = useState("");
  const [language, setLanguage] = useState("English");

  const [emojiPanelOpen, setEmojiPanelOpen] = useState(true);

  const [step, setStep] = useState<Step>("design");
  const [createError, setCreateError] = useState("");

  // ── Step 1: Generate previews ──────────────────────────────────────────────

  const handleGenerate = async () => {
    setPreviewError("");
    setLoadingPreviews(true);
    setPreviews([]);
    setSelectedPreviewId(null);
    try {
      const res = await fetch(`${API_BASE}/api/voice-design/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_description: voiceDesc,
          preview_text: previewText || PREVIEW_PLACEHOLDER,
          guidance_scale: guidanceScale,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Preview generation failed");
      }
      const data = await res.json();
      setPreviews(data.previews ?? []);
    } catch (e: unknown) {
      setPreviewError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingPreviews(false);
    }
  };

  // ── Step 2: Create character ───────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedPreviewId || !charName.trim() || !emoji.trim() || !personaDesc.trim()) return;
    setStep("creating");
    setCreateError("");
    const selectedPreview = previews.find((p) => p.generated_voice_id === selectedPreviewId)!;

    try {
      const res = await fetch(`${API_BASE}/api/character/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generated_voice_id: selectedPreview.generated_voice_id,
          voice_description: voiceDesc,
          character_name: charName.trim(),
          emoji: emoji.trim(),
          persona_description: personaDesc.trim(),
          language,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Character creation failed");
      }
      const data = await res.json();

      const newChar: Character = {
        id: data.id,
        name: data.name,
        language: data.language,
        tagline: data.tagline,
        description: personaDesc.trim(),
        image: "",
        emoji: data.emoji,
        greeting: `Hello! I'm ${data.name}!`,
        firstMessage: data.first_message,
        imageStyle: data.image_style,
        category: "custom",
      };

      setStep("done");
      setTimeout(() => onCreated(newChar), 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      const needsNewPreviews = msg.includes("already been used");
      setCreateError(msg);
      if (needsNewPreviews) {
        // Clear previews so user must regenerate
        setPreviews([]);
        setSelectedPreviewId(null);
        setStep("design");
      } else {
        setStep("details");
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-auto flex flex-col">
      <FloatingElements />

      <TopNav onBack={onBack} />

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-6 max-w-2xl flex flex-col gap-5">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-1">
            🎨 Design a Voice
          </h1>
          <p className="text-foreground/70 font-body text-base sm:text-lg">
            Craft a custom storyteller with ElevenLabs Voice Design
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(["design", "details"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display transition-colors ${
                  step === s
                    ? "bg-primary text-white"
                    : step === "details" && s === "design"
                    ? "bg-primary/30 text-primary"
                    : step === "creating" || step === "done"
                    ? "bg-primary/30 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {step === "creating" || step === "done" ? "✓" : i + 1}
              </div>
              <span className="text-xs text-muted-foreground font-body hidden sm:inline">
                {s === "design" ? "Voice Design" : "Character Details"}
              </span>
              {i === 0 && <div className="flex-1 h-px bg-border/50 w-6" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Voice Design ── */}
          {step === "design" && (
            <motion.div
              key="design"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              {/* Voice description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">
                  Voice Description <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground font-body">
                  Describe the voice — language, age, gender, tone, pacing, emotion. More detail = better results.
                </p>
                <textarea
                  value={voiceDesc}
                  onChange={(e) => setVoiceDesc(e.target.value)}
                  placeholder={DESIGN_PLACEHOLDER}
                  rows={4}
                  className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Preview text */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-display text-sm font-bold text-foreground">
                    Preview Text
                  </label>
                  <span className={`text-xs font-body tabular-nums ${previewText.length > 0 && previewText.length < 100 ? "text-destructive" : "text-muted-foreground"}`}>
                    {previewText.length > 0 ? `${previewText.length} / 100 min` : "100 chars min"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  Text the voice will speak in the preview. Must be at least 100 characters. Leave blank to use the default.
                </p>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder={PREVIEW_PLACEHOLDER}
                  rows={3}
                  className={`w-full rounded-xl border bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-colors ${
                    previewText.length > 0 && previewText.length < 100
                      ? "border-destructive/60 focus:ring-destructive/50"
                      : "border-border/60"
                  }`}
                />
              </div>

              {/* Guidance scale */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-display text-sm font-bold text-foreground">
                    Guidance Scale
                  </label>
                  <span className="text-xs font-body text-muted-foreground">{guidanceScale}%</span>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  Higher = closer to your prompt (may reduce quality for very specific voices). Lower = more creative freedom.
                </p>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-body">
                  <span>Creative</span>
                  <span>Precise</span>
                </div>
              </div>

              {/* Generate button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!voiceDesc.trim() || loadingPreviews || (previewText.length > 0 && previewText.length < 100)}
                onClick={handleGenerate}
                className="w-full py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loadingPreviews ? "✨ Generating…" : "✨ Generate Voice Previews"}
              </motion.button>

              {(previewError || (createError && step === "design")) && (
                <p className="text-sm text-destructive font-body text-center">
                  {previewError || createError}
                </p>
              )}

              {/* Previews */}
              {previews.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-display text-sm font-bold text-foreground">
                    Choose a voice:
                  </p>
                  {previews.map((p, i) => (
                    <PreviewCard
                      key={p.generated_voice_id}
                      index={i}
                      item={p}
                      selected={selectedPreviewId === p.generated_voice_id}
                      onSelect={() => setSelectedPreviewId(p.generated_voice_id)}
                    />
                  ))}

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!selectedPreviewId}
                    onClick={() => setStep("details")}
                    className="w-full py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    Next: Character Details →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Character Details ── */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              {/* Character name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">
                  Character Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="e.g. Captain Starlight"
                  maxLength={50}
                  className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Emoji */}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setEmojiPanelOpen((o) => !o)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <label className="font-display text-sm font-bold text-foreground pointer-events-none">
                    Character Icon <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {emoji && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xl">
                        {emoji}
                      </div>
                    )}
                    <span className="text-muted-foreground text-sm">
                      {emojiPanelOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {emojiPanelOpen && (
                    <motion.div
                      key="emoji-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-border/60 bg-card/80 p-2.5">
                        {EMOJI_GROUPS.map((group) => (
                          <div key={group.label} className="mb-2 last:mb-0">
                            <p className="text-[10px] font-bold font-display text-muted-foreground uppercase tracking-wide mb-1.5 px-0.5">
                              {group.label}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {group.emojis.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => { setEmoji(e); setEmojiPanelOpen(false); }}
                                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                                    emoji === e
                                      ? "bg-primary/20 border-2 border-primary scale-110"
                                      : "hover:bg-muted/60 border-2 border-transparent"
                                  }`}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">
                  Story Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Persona */}
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">
                  Character Persona <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground font-body">
                  Describe who this character is — personality, world, story specialty. The AI will craft their full storytelling style from this.
                </p>
                <textarea
                  value={personaDesc}
                  onChange={(e) => setPersonaDesc(e.target.value)}
                  placeholder="e.g. A brave young astronaut who explores magical planets and helps alien creatures solve puzzles. Enthusiastic, funny, and never gives up. Specialises in space adventures and science mysteries."
                  rows={4}
                  className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {createError && (
                <p className="text-sm text-destructive font-body text-center">{createError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("design")}
                  className="flex-1 py-3 rounded-2xl border border-border/60 text-foreground font-display font-bold text-sm transition-colors hover:bg-card/80"
                >
                  ← Back
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!charName.trim() || !emoji.trim() || !personaDesc.trim()}
                  onClick={handleCreate}
                  className="flex-[2] py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  ✨ Create My Storyteller
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── CREATING ── */}
          {step === "creating" && (
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-5xl"
              >
                ✨
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary mb-2">
                  Creating your storyteller…
                </h2>
                <p className="text-muted-foreground font-body text-sm">
                  Saving your voice, generating the character, and wiring up the magic.
                  <br />This takes about 15–30 seconds.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6 }}
                className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center text-5xl"
              >
                {emoji}
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary mb-1">
                  {charName} is ready!
                </h2>
                <p className="text-muted-foreground font-body text-sm">
                  Taking you back to choose your storyteller…
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceDesignScreen;
