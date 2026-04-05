import { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  right?: ReactNode;
}

/**
 * Fixed top navigation bar shown on all screens except the landing page.
 * Always shows the ElevenTales title centered.
 */
const TopNav = ({ onBack, backLabel = "← Back", onHome, right }: Props) => (
  <motion.header
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-14 border-b border-border/30 bg-background/70 backdrop-blur-md"
  >
    {/* Left */}
    <div className="flex items-center gap-4 flex-1">
      {onBack && (
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground font-body transition-colors text-sm"
        >
          {backLabel}
        </button>
      )}
      {onHome && (
        <button
          onClick={onHome}
          className="text-muted-foreground hover:text-foreground font-body transition-colors text-sm"
        >
          Home
        </button>
      )}
    </div>

    {/* Center */}
    <h1 className="font-display text-lg sm:text-xl font-bold text-primary absolute left-1/2 -translate-x-1/2">
      ElevenTales
    </h1>

    {/* Right */}
    <div className="flex items-center justify-end gap-3 flex-1">
      {right}
    </div>
  </motion.header>
);

export default TopNav;
