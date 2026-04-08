import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import FloatingElements from "@/components/FloatingElements";

interface Props {
  onStoryMode: () => void;
}

const PreviewNotice = ({ onConfirm }: { onConfirm: () => void }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onConfirm} />
      <motion.div
        className="relative z-10 bg-background/95 backdrop-blur-md border border-primary/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <h2 className="font-display text-lg font-bold text-primary mb-2">Free Preview</h2>
        <p className="font-body text-sm text-foreground/75 leading-relaxed mb-4">
          Stories are limited to <strong>2 minutes</strong> and image generation is throttled to conserve credits.
          <br /><br />
          For the best experience, choose <strong>Nano Banana ⚡</strong> over Nano Banana 2 — it's faster and uses fewer credits.
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-display font-bold text-base hover:brightness-110 transition-all"
        >
          Got it — let's go! ✨
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const LandingPage = ({ onStoryMode }: Props) => {
  const [showNotice, setShowNotice] = useState(false);

  const handleBegin = () => setShowNotice(true);
  const handleConfirm = () => { setShowNotice(false); onStoryMode(); };

  return (
    <>
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Magical night sky" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/50" />
      </div>

      <FloatingElements />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 text-center">
        {/* Hero section */}
        <div className="flex flex-col items-center justify-center flex-1 pt-16 pb-8">
          {/* Moon glow */}
          <motion.div
            className="absolute top-8 sm:top-16 w-24 h-24 sm:w-32 sm:h-32 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(42 100% 75% / 0.3) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold text-primary drop-shadow-lg mb-3"
          >
            ElevenTales
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl text-foreground/80 font-body max-w-lg mb-12"
          >
            Where magical stories come alive ✨
          </motion.p>

          {/* Floating creatures */}
          <motion.div
            className="absolute left-[8%] top-[30%] text-4xl sm:text-5xl select-none"
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            🦉
          </motion.div>
          <motion.div
            className="absolute right-[10%] top-[25%] text-4xl sm:text-5xl select-none"
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            🧚
          </motion.div>
          <motion.div
            className="absolute left-[15%] bottom-[20%] text-3xl sm:text-4xl select-none"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌙
          </motion.div>
          <motion.div
            className="absolute right-[15%] bottom-[25%] text-3xl sm:text-4xl select-none"
            animate={{ y: [0, -12, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          >
            🐉
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBegin}
            className="px-10 py-5 rounded-full bg-primary text-primary-foreground font-display text-xl sm:text-2xl font-bold magic-glow animate-glow-pulse hover:brightness-110 transition-all"
          >
            ✨ Begin Your Adventure ✨
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 flex items-center gap-2.5"
          >
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-foreground/70" aria-label="ElevenLabs">
              <rect x="11" y="4" width="3.5" height="24" rx="1.75" fill="currentColor" />
              <rect x="17.5" y="4" width="3.5" height="24" rx="1.75" fill="currentColor" />
            </svg>
            <span className="font-body text-lg sm:text-xl text-foreground/70 font-semibold">
              Powered by ElevenLabs AI magic ✨
            </span>
          </motion.div>
        </div>

      </div>
    </div>
    {showNotice && <PreviewNotice onConfirm={handleConfirm} />}
    </>
  );
};

export default LandingPage;
