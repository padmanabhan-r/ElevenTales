import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CHARACTERS, Character } from "@/characters";
import FloatingElements from "@/components/FloatingElements";

interface Props {
  onSelect: (character: Character) => void;
  onBack?: () => void;
}

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
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted/30 border-2 transition-colors ${
        selected ? "border-primary" : "border-primary/30 group-hover:border-primary"
      }`}
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: selected ? Infinity : 0 }}
    >
      <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
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

const CharacterSelect = ({ onSelect, onBack }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const englishChars = CHARACTERS.filter((c) => c.category === "english");
  const otherChars = CHARACTERS.filter((c) => c.category === "other");

  const handleSelect = useCallback(
    (character: Character) => {
      if (selectedId) return;
      setSelectedId(character.id);
      setTimeout(() => onSelect(character), 600);
    },
    [selectedId, onSelect]
  );

  return (
    <div className="relative h-screen bg-sky-gradient overflow-hidden flex flex-col">
      <FloatingElements />

      <div className="relative z-10 flex flex-col justify-center h-full container mx-auto px-4 py-4 gap-3">
        {/* Home button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="self-start text-muted-foreground hover:text-foreground font-body transition-colors"
          >
            ← Home
          </motion.button>
        )}

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-primary mb-1">
            Choose Your Storyteller
          </h1>
          <p className="text-foreground/70 font-body text-base sm:text-lg">
            Pick a friend to tell you a magical story ✨
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60 font-body">
            Voices crafted with{" "}
            <a
              href="https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/voice-design"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              ElevenLabs Voice Design
            </a>
            {" "}and{" "}
            <a
              href="https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/instant-voice-cloning"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
            >
              Voice Cloning
            </a>
          </p>
        </motion.div>

        {/* English characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-magic-teal mb-3 text-center">
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
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedId ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4"
        >
          <div className="flex-1 h-px bg-border/50" />
          <span className="font-display text-xl sm:text-2xl text-magic-orange font-bold">
            🌏 World Language Storytellers
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </motion.div>

        {/* World language characters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
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

        {/* Divider — Create */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedId ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4"
        >
          <div className="flex-1 h-px bg-border/50" />
          <span className="font-display text-sm text-magic-pink font-bold px-3 py-1 rounded-full border border-magic-pink/30 bg-card/40 backdrop-blur-sm">
            ✨ Create Your Storyteller
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </motion.div>

        {/* Create cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: selectedId ? 0 : 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center gap-4"
        >
          {/* Design a Voice */}
          <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 w-44 sm:w-52 opacity-60 cursor-not-allowed select-none">
            <span className="absolute -top-2 -right-2 bg-magic-orange text-white font-display text-xs font-bold px-2 py-0.5 rounded-full">
              Soon
            </span>
            <span className="text-2xl shrink-0">🎨</span>
            <div>
              <p className="font-display text-sm font-bold text-foreground leading-tight">Design a Voice</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Describe your character</p>
            </div>
          </div>

          {/* Clone a Voice */}
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
        </motion.div>
      </div>
    </div>
  );
};

export default CharacterSelect;
