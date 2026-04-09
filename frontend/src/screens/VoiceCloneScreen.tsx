import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";
import TopNav from "@/components/TopNav";

interface Props {
  onBack: () => void;
  onCreated: (character: Character) => void;
}

type Step = "record" | "preview" | "details" | "avatar" | "creating" | "done";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const LANGUAGES = ["English", "Hindi", "Tamil", "Spanish", "French", "Mandarin"];


const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const formatSeconds = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ── Main screen ───────────────────────────────────────────────────────────────

const VoiceCloneScreen = ({ onBack, onCreated }: Props) => {
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  // Preview
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [previewAudioBase64, setPreviewAudioBase64] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState("");

  // Details
  const [charName, setCharName] = useState("");
  const [personaDesc, setPersonaDesc] = useState("");
  const [language, setLanguage] = useState("English");

  const [step, setStep] = useState<Step>("record");
  const [error, setError] = useState("");

  // Avatar preview
  const [avatarData, setAvatarData] = useState("");
  const [avatarMimeType, setAvatarMimeType] = useState("image/png");
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Track voiceId in a ref so the unmount cleanup can access the latest value
  const voiceIdRef = useRef<string | null>(null);
  const characterCreatedRef = useRef(false);

  const deletePreviewVoice = (id: string) => {
    // Fire-and-forget — best-effort cleanup, don't block the UI
    fetch(`${API_BASE}/api/voice-clone/preview/${id}`, { method: "DELETE" }).catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      // Delete the preview voice if the user navigates away without creating a character
      if (voiceIdRef.current && !characterCreatedRef.current) {
        deletePreviewVoice(voiceIdRef.current);
      }
    };
  }, [audioUrl]);

  // ── Recording ───────────────────────────────────────────────────────────────

  const startRecording = async () => {
    setError("");
    setAudioBlob(null);
    setAudioUrl(null);
    recordingAudioRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    recordingAudioRef.current = null;
    setRecordSeconds(0);
  };

  const toggleRecordingPlayback = () => {
    if (!audioUrl) return;
    if (!recordingAudioRef.current) {
      recordingAudioRef.current = new Audio(audioUrl);
      recordingAudioRef.current.onended = () => setIsPlayingRecording(false);
    }
    if (isPlayingRecording) {
      recordingAudioRef.current.pause();
      recordingAudioRef.current.currentTime = 0;
      setIsPlayingRecording(false);
    } else {
      recordingAudioRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  // ── Preview cloned voice ─────────────────────────────────────────────────────

  const handleGeneratePreview = async () => {
    if (!audioBlob) return;
    // If there's already a preview voice from a previous attempt, delete it first
    if (voiceIdRef.current) {
      deletePreviewVoice(voiceIdRef.current);
      voiceIdRef.current = null;
      setVoiceId(null);
    }
    setIsLoadingPreview(true);
    setError("");
    try {
      const audioBase64 = await toBase64(audioBlob);
      const res = await fetch(`${API_BASE}/api/voice-clone/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_data: audioBase64,
          mime_type: audioBlob.type || "audio/webm",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Cloning failed");
      }
      const data = await res.json();
      setVoiceId(data.voice_id);
      voiceIdRef.current = data.voice_id;
      setPreviewAudioBase64(data.audio_base64);
      previewAudioRef.current = null;
      const lang = data.detected_language as string | undefined;
      if (lang) {
        setDetectedLanguage(lang);
        if (LANGUAGES.includes(lang)) setLanguage(lang);
      }
      setStep("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const togglePreviewPlayback = () => {
    if (!previewAudioBase64) return;
    if (!previewAudioRef.current) {
      const bytes = Uint8Array.from(atob(previewAudioBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      previewAudioRef.current = new Audio(URL.createObjectURL(blob));
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleReRecord = () => {
    if (voiceIdRef.current) {
      deletePreviewVoice(voiceIdRef.current);
      voiceIdRef.current = null;
    }
    setVoiceId(null);
    setPreviewAudioBase64(null);
    previewAudioRef.current = null;
    setIsPlayingPreview(false);
    setDetectedLanguage("");
    setStep("record");
  };

  // ── Avatar preview ───────────────────────────────────────────────────────────

  const handleGenerateAvatar = async () => {
    setAvatarError("");
    setLoadingAvatar(true);
    setAvatarData("");
    try {
      const res = await fetch(`${API_BASE}/api/character/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_name: charName.trim(), persona_description: personaDesc.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Avatar generation failed");
      }
      const data = await res.json();
      setAvatarData(data.avatar_data);
      setAvatarMimeType(data.avatar_mime_type || "image/png");
      setStep("avatar");
    } catch (e: unknown) {
      setAvatarError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingAvatar(false);
    }
  };

  // ── Create character ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!voiceId || !charName.trim() || !personaDesc.trim()) return;
    setStep("creating");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/voice-clone/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice_id: voiceId,
          character_name: charName.trim(),
          persona_description: personaDesc.trim(),
          language,
          avatar_data: avatarData,
          avatar_mime_type: avatarMimeType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? "Character creation failed");
      }
      const data = await res.json();
      const newChar: Character = {
        id: data.id,
        name: data.name,
        language: data.language,
        tagline: data.tagline,
        description: personaDesc.trim(),
        image: data.avatar_data
          ? `data:${data.avatar_mime_type || "image/png"};base64,${data.avatar_data}`
          : "",
        emoji: data.emoji,
        greeting: `Hello! I'm ${data.name}!`,
        firstMessage: data.first_message,
        imageStyle: data.image_style,
        category: "custom",
        clonedVoice: true,
      };
      characterCreatedRef.current = true;
      setStep("done");
      setTimeout(() => onCreated(newChar), 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("details");
    }
  };

  const STEP_LABELS: Record<string, string> = {
    record: "Record", preview: "Preview", details: "Details", avatar: "Avatar",
  };
  const STEP_ORDER = ["record", "preview", "details", "avatar"] as const;

  return (
    <div className="relative min-h-screen bg-sky-gradient overflow-auto flex flex-col">
      <FloatingElements />
      <TopNav onBack={onBack} />

      <div className="relative z-10 container mx-auto px-4 pt-20 pb-6 max-w-2xl flex flex-col gap-5">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-1">🎙️ Clone a Voice</h1>
          <p className="text-foreground/70 font-body text-base sm:text-lg">Record your voice to create a personal storyteller</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 self-center">
          {STEP_ORDER.map((s, i) => {
            const currentIdx = STEP_ORDER.indexOf(step as typeof STEP_ORDER[number]);
            const isDone = currentIdx > i || step === "creating" || step === "done";
            const isActive = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display transition-colors ${
                  isDone ? "bg-primary/30 text-primary" : isActive ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {isDone && !isActive ? "✓" : i + 1}
                </div>
                <span className="text-xs text-muted-foreground font-body hidden sm:inline">{STEP_LABELS[s]}</span>
                {i < STEP_ORDER.length - 1 && <div className="h-px bg-border/50 w-6" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Record ── */}
          {step === "record" && (
            <motion.div key="record" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-muted-foreground font-body max-w-sm">
                  Record at least <strong>30 seconds</strong> of clear speech — read a story, describe a character, or just talk naturally.
                </p>

                <motion.button whileTap={{ scale: 0.94 }} onClick={isRecording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 text-white font-display font-bold text-sm shadow-lg transition-colors ${
                    isRecording ? "bg-destructive animate-pulse" : "bg-primary hover:bg-primary/90"
                  }`}>
                  <span className="text-3xl">{isRecording ? "⏹" : "🎙️"}</span>
                  <span>{isRecording ? "Stop" : "Record"}</span>
                </motion.button>

                {isRecording && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-xl font-bold text-destructive tabular-nums">
                    {formatSeconds(recordSeconds)}
                    {recordSeconds < 30 && (
                      <span className="text-sm font-body text-muted-foreground ml-2">({30 - recordSeconds}s more recommended)</span>
                    )}
                  </motion.p>
                )}

                {audioBlob && !isRecording && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <button onClick={toggleRecordingPlayback} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPlayingRecording ? "bg-primary text-white" : "bg-muted/60 hover:bg-primary/20 text-foreground"}`}>
                      {isPlayingRecording ? "⏸" : "▶"}
                    </button>
                    <span className="text-sm font-body text-foreground">
                      Recording ready{recordSeconds > 0 ? ` · ${formatSeconds(recordSeconds)}` : ""}
                    </span>
                    <button onClick={startRecording} className="text-xs text-muted-foreground hover:text-foreground underline">Re-record</button>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-body shrink-0">or upload a file</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 rounded-xl border border-border/60 bg-card/60 text-sm font-body text-foreground hover:bg-card/80 transition-colors">
                📁 Upload audio file (MP3, WAV, M4A…)
              </button>

              {error && <p className="text-sm text-destructive font-body text-center">{error}</p>}

              <motion.button whileTap={{ scale: 0.97 }} disabled={!audioBlob || isLoadingPreview} onClick={handleGeneratePreview}
                className="w-full py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                {isLoadingPreview ? "🎙️ Cloning voice…" : "🎙️ Preview My Cloned Voice →"}
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-6 flex flex-col items-center gap-4 text-center">
                <span className="text-4xl">🎧</span>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground mb-1">Your cloned voice is ready!</h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Listen to the preview below — the AI is reading a sample story opening in your voice.
                  </p>
                </div>

                <motion.button whileTap={{ scale: 0.95 }} onClick={togglePreviewPlayback}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 text-white font-display font-bold text-sm shadow-lg transition-colors ${
                    isPlayingPreview ? "bg-primary animate-pulse" : "bg-primary hover:bg-primary/90"
                  }`}>
                  <span className="text-3xl">{isPlayingPreview ? "⏸" : "▶"}</span>
                  <span className="text-xs">{isPlayingPreview ? "Pause" : "Play"}</span>
                </motion.button>

                {detectedLanguage && (
                  <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-4 py-2">
                    <span className="text-sm text-muted-foreground font-body">Detected Language:</span>
                    <span className="text-sm font-display font-bold text-primary">{detectedLanguage}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={handleReRecord} className="flex-1 py-3 rounded-2xl border border-border/60 text-foreground font-display font-bold text-sm transition-colors hover:bg-card/80">
                  ← Re-record
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("details")}
                  className="flex-[2] py-3 rounded-2xl bg-primary text-white font-display font-bold text-base shadow-md">
                  Sounds good! Next →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Details ── */}
          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">Character Name <span className="text-destructive">*</span></label>
                <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="e.g. Dad's Dragon Tales" maxLength={50}
                  className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">Story Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-display text-sm font-bold text-foreground">Character Persona <span className="text-destructive">*</span></label>
                <p className="text-xs text-muted-foreground font-body">Describe who this character is — personality, world, story style.</p>
                <textarea value={personaDesc} onChange={(e) => setPersonaDesc(e.target.value)}
                  placeholder="e.g. Dad's playful, adventurous voice — loves pirate stories, always adds funny sound effects, and makes every kid feel like the hero."
                  rows={4} className="w-full rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>

              {avatarError && <p className="text-sm text-destructive font-body text-center">{avatarError}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep("preview")} className="flex-1 py-3 rounded-2xl border border-border/60 text-foreground font-display font-bold text-sm transition-colors hover:bg-card/80">← Back</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={!charName.trim() || !personaDesc.trim() || loadingAvatar} onClick={handleGenerateAvatar}
                  className="flex-[2] py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  {loadingAvatar ? "🎨 Generating…" : "🎨 Generate Avatar →"}
                </motion.button>
              </div>
              <button disabled={!charName.trim() || !personaDesc.trim()} onClick={handleCreate}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Skip, create without avatar
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: Avatar Preview ── */}
          {step === "avatar" && (
            <motion.div key="avatar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center gap-5">
              <div className="text-center">
                <h2 className="font-display text-lg font-bold text-foreground mb-1">Your character's portrait</h2>
                <p className="text-sm text-muted-foreground font-body">Not happy with it? Regenerate as many times as you like.</p>
              </div>

              {avatarData ? (
                <motion.img key={avatarData} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  src={`data:${avatarMimeType};base64,${avatarData}`} alt={charName}
                  className="w-48 h-48 rounded-3xl object-cover shadow-lg border-4 border-primary/20" />
              ) : (
                <div className="w-48 h-48 rounded-3xl bg-muted/30 border border-border/40" />
              )}

              {avatarError && <p className="text-sm text-destructive font-body">{avatarError}</p>}

              <div className="flex gap-3 w-full">
                <button onClick={() => setStep("details")} className="flex-1 py-3 rounded-2xl border border-border/60 text-foreground font-display font-bold text-sm transition-colors hover:bg-card/80">← Back</button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={loadingAvatar} onClick={handleGenerateAvatar}
                  className="flex-1 py-3 rounded-2xl border border-primary/40 text-primary font-display font-bold text-sm disabled:opacity-40 transition-all hover:bg-primary/10">
                  {loadingAvatar ? "Generating…" : "🔄 Regenerate"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} disabled={loadingAvatar} onClick={handleCreate}
                  className="flex-[2] py-3 rounded-2xl bg-primary text-white font-display font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  🎙️ Create!
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── CREATING ── */}
          {step === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-12 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-5xl">🎙️</motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary mb-2">Creating your storyteller…</h2>
                <p className="text-muted-foreground font-body text-sm">Generating the character and wiring up the magic.<br />This takes about 15–20 seconds.</p>
              </div>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.6 }} className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-4 border-primary/30 flex items-center justify-center">
                {avatarData
                  ? <img src={`data:${avatarMimeType};base64,${avatarData}`} alt={charName} className="w-full h-full object-cover" />
                  : <span className="text-4xl">✨</span>
                }
              </motion.div>
              <div>
                <h2 className="font-display text-2xl font-bold text-primary mb-1">{charName} is ready!</h2>
                <p className="text-muted-foreground font-body text-sm">Taking you back to choose your storyteller…</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceCloneScreen;
