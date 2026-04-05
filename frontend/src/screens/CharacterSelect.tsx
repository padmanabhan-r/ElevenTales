import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHARACTERS, Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";
import TopNav from "@/components/TopNav";

interface Props {
  onSelect: (character: Character) => void;
  onBack?: () => void;
  onVoiceDesign?: () => void;
  customCharacters?: Character[];
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

type Tab = "predesigned" | "mine";

// ── Character card ─────────────────────────────────────────────────────────────

const CharacterCard = ({
  character,
  onSelect,
  index,
  disabled,
  selected,
  dismissed,
}: {
  character: Character;
  onSelect: (c: Character) => void;
  index: number;
  disabled: boolean;
  selected: boolean;
  dismissed: boolean;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: dismissed ? 0 : 1, y: 0, scale: dismissed ? 0.85 : selected ? 1.1 : 1 }}
    transition={{ delay: index * 0.07, duration: 0.45 }}
    whileHover={!disabled ? { scale: 1.08, y: -8 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    onClick={() => onSelect(character)}
    disabled={disabled}
    className={`group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur-sm character-glow cursor-pointer border transition-colors w-44 sm:w-52 ${
      selected
        ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.5)]"
        : "border-border/50 hover:border-primary/50"
    }`}
  >
    <motion.div
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted/30 border-2 transition-colors flex items-center justify-center ${
        selected ? "border-primary" : "border-primary/30 group-hover:border-primary"
      }`}
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0 }}
    >
      {character.emoji ? (
        <span className="text-4xl sm:text-5xl">{character.emoji}</span>
      ) : (
        <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
      )}
    </motion.div>
    <div className="text-center">
      <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-tight">
        {character.name}
      </h3>
      <div className="flex items-center justify-center gap-1.5 mt-0.5">
        <p className="text-xs text-muted-foreground">{character.language}</p>
        {character.clonedVoice ? (
          <span className="text-[10px] font-semibold font-body px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 leading-none">
            cloned voice
          </span>
        ) : character.category === "custom" ? (
          <span className="text-[10px] font-semibold font-body px-1.5 py-0.5 rounded-full bg-magic-pink/20 text-magic-pink border border-magic-pink/30 leading-none">
            user designed
          </span>
        ) : (
          <span className="text-[10px] font-semibold font-body px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 leading-none">
            designed voice
          </span>
        )}
      </div>
      <p className="text-xs text-primary/70 mt-1 italic leading-tight">{character.tagline}</p>
    </div>
  </motion.button>
);

// ── Main component ─────────────────────────────────────────────────────────────

const CharacterSelect = ({ onSelect, onBack, onVoiceDesign, customCharacters: propCustomChars }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [apiChars, setApiChars] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("predesigned");

  // Always fetch persisted custom characters from the API
  useEffect(() => {
    fetch(`${API_BASE}/api/characters/custom`)
      .then((r) => r.json())
      .then((data: Array<{
        id: string; name: string; emoji: string; language: string;
        tagline: string; image_style: string; first_message: string;
        voice_id: string; agent_id: string;
      }>) => {
        const chars: Character[] = data.map((d) => ({
          id: d.id,
          name: d.name,
          language: d.language,
          tagline: d.tagline,
          description: d.tagline,
          image: "",
          emoji: d.emoji,
          greeting: `Hello! I'm ${d.name}!`,
          firstMessage: d.first_message,
          imageStyle: d.image_style,
          category: "custom" as const,
        }));
        setApiChars(chars);
      })
      .catch(() => {});
  }, []);

  // Merge API chars with any chars created this session (session ones take precedence)
  const sessionIds = new Set((propCustomChars ?? []).map((c) => c.id));
  const customChars = [
    ...(propCustomChars ?? []),
    ...apiChars.filter((c) => !sessionIds.has(c.id)),
  ];

  // Switch to "mine" tab when a new character is created this session
  const prevSessionCountRef = useRef(0);
  useEffect(() => {
    const next = propCustomChars?.length ?? 0;
    if (next > prevSessionCountRef.current) {
      prevSessionCountRef.current = next;
      setActiveTab("mine");
    }
  }, [propCustomChars]);

  const handleSelect = useCallback(
    (character: Character) => {
      if (selectedId) return;
      setSelectedId(character.id);
      setTimeout(() => onSelect(character), 600);
    },
    [selectedId, onSelect]
  );

  const englishChars = CHARACTERS.filter((c) => c.category === "english");
  const otherChars = CHARACTERS.filter((c) => c.category === "other");

  return (
    <div className="relative h-screen bg-sky-gradient overflow-hidden flex flex-col">
      <FloatingElements />

      <TopNav onBack={onBack} backLabel="← Home" />

      <div className="relative z-10 flex flex-col h-full container mx-auto px-4 pt-16 pb-4 gap-3 overflow-hidden">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2 shrink-0"
        >
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-1">
            Choose Your Storyteller
          </h1>
          <p className="text-foreground/70 font-body text-base sm:text-lg">
            Pick a friend to tell you a magical story ✨
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex shrink-0 self-center bg-card/50 backdrop-blur-sm rounded-xl border border-border/40 p-0.5 gap-0.5"
        >
          <button
            onClick={() => setActiveTab("predesigned")}
            className={`px-4 py-1.5 rounded-lg font-display text-xs font-bold transition-all ${
              activeTab === "predesigned"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌟 Built-in Storytellers
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`px-4 py-1.5 rounded-lg font-display text-xs font-bold transition-all ${
              activeTab === "mine"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✨ My Created Storytellers
            {customChars.length > 0 && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                activeTab === "mine" ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
              }`}>
                {customChars.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">

            {/* ── Predesigned tab ── */}
            {activeTab === "predesigned" && (
              <motion.div
                key="predesigned"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5 py-2"
              >
                {/* English */}
                <div>
                  <h2 className="font-display text-base font-bold text-magic-teal mb-3 text-center">
                    🌍 English Storytellers
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {englishChars.map((char, i) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        onSelect={handleSelect}
                        index={i}
                        disabled={!!selectedId}
                        selected={selectedId === char.id}
                        dismissed={!!selectedId && selectedId !== char.id}
                      />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="font-display text-sm font-bold text-magic-orange shrink-0">🌏 World Languages</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Other languages */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pb-2">
                  {otherChars.map((char, i) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      onSelect={handleSelect}
                      index={i + englishChars.length}
                      disabled={!!selectedId}
                      selected={selectedId === char.id}
                      dismissed={!!selectedId && selectedId !== char.id}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── My Characters tab ── */}
            {activeTab === "mine" && (
              <motion.div
                key="mine"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6 py-2"
              >
                {/* Custom characters grid */}
                {customChars.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {customChars.map((char, i) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        onSelect={handleSelect}
                        index={i}
                        disabled={!!selectedId}
                        selected={selectedId === char.id}
                        dismissed={!!selectedId && selectedId !== char.id}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-10 text-center"
                  >
                    <span className="text-5xl">🎨</span>
                    <p className="font-display text-lg font-bold text-foreground">No characters yet</p>
                    <p className="text-sm text-muted-foreground font-body max-w-xs">
                      Design your own storyteller with a custom voice using ElevenLabs Voice Design.
                    </p>
                  </motion.div>
                )}

                {/* Create section */}
                <div className="flex flex-col items-center gap-3 pb-2">
                  <div className="flex items-center gap-4 w-full max-w-sm">
                    <div className="flex-1 h-px bg-border/50" />
                    <span className="text-xs text-muted-foreground font-body shrink-0">create new</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  <div className="flex justify-center gap-4">
                    {/* Design a Voice */}
                    <motion.button
                      whileHover={{ scale: 1.04, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onVoiceDesign}
                      className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-magic-pink/40 hover:border-magic-pink/80 w-44 sm:w-52 transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <span className="text-2xl shrink-0">🎨</span>
                      <div className="text-left">
                        <p className="font-display text-sm font-bold text-foreground leading-tight">Design a Voice</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Describe your character</p>
                      </div>
                    </motion.button>

                    {/* Clone a Voice — coming soon */}
                    <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 w-44 sm:w-52 opacity-60 cursor-not-allowed select-none">
                      <span className="absolute -top-2 -right-2 bg-magic-teal text-white font-display text-xs font-bold px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                      <span className="text-2xl shrink-0">🎙️</span>
                      <div>
                        <p className="font-display text-sm font-bold text-foreground leading-tight">Clone a Voice</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Use your own voice</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
