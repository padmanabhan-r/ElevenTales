import wizardImg from "@/assets/characters/wizard.png";
import fairyImg from "@/assets/characters/fairy.png";
import pirateImg from "@/assets/characters/pirate.png";
import dadiImg from "@/assets/characters/dadi.png";
// Tamil Raja Vikram reuses the maharaja portrait (same character, Tamil context)
import rajvikramImg from "@/assets/characters/maharaja.png";

export interface Character {
  id: string;
  name: string;
  language: string;
  tagline: string;
  description: string;
  image: string;
  greeting: string;
  /** First message spoken by the agent. Use {{theme}} as the placeholder. */
  firstMessage: string;
  imageStyle: string;
  category: "english" | "other";
  /** True if this character uses a cloned voice (IVC). */
  clonedVoice?: boolean;
}

export const CHARACTERS: Character[] = [
  // ── English storytellers ──────────────────────────────────────────────
  {
    id: "fairy",
    name: "Fairy Flora",
    language: "English",
    tagline: "Enchanted adventures",
    description: "A kind fairy princess from the Enchanted Garden",
    image: fairyImg,
    greeting: "Hello, little one! Let me sprinkle some story magic!",
    firstMessage: "Oh! Oh! Oh! A {{theme}} adventure — my wings are already sparkling with excitement! This is going to be SO magical! Quick, tell me — what wonderful character should we meet first?",
    imageStyle: "soft pastel watercolor, children's picture book art, magical sparkles, delicate line work, dreamy warm atmosphere",
    category: "english",
  },
  {
    id: "pirate",
    name: "Captain Coco",
    language: "English",
    tagline: "Bold sea adventures",
    description: "A brave pirate captain with exciting sea adventures",
    image: pirateImg,
    greeting: "Ahoy, matey! Ready to sail into a grand adventure?",
    firstMessage: "AHOY there, matey! A {{theme}} adventure — SHIVER ME TIMBERS, that's the BEST kind! All hands on deck! Now tell me — who should be the brave hero of our voyage?",
    imageStyle: "bold vibrant colors, bright sunny palette, children's adventure book art, dynamic composition, clean cartoon illustration",
    category: "english",
  },
  {
    id: "wizard",
    name: "Wizard Wally",
    language: "English",
    tagline: "Magical tales",
    description: "A wise and playful wizard who loves magical tales",
    image: wizardImg,
    greeting: "Greetings, young adventurer! Ready for a magical story?",
    firstMessage: "Oh ho HO! A {{theme}} story — by the moons of Merlin, you've chosen MAGNIFICENTLY! My spell-book is already glowing! Now tell me, young adventurer — who should be the hero of our tale?",
    imageStyle: "children's fantasy storybook art, warm golden light, rich jewel tones, magical atmosphere, watercolor and ink",
    category: "english",
  },
  // ── World language storytellers ───────────────────────────────────────
  {
    id: "dadi",
    name: "Dadi Maa",
    language: "Hindi",
    tagline: "Hindi कहानियाँ",
    description: "A loving grandmother with timeless Indian folktales",
    image: dadiImg,
    greeting: "आओ बच्चों, आज दादी एक कहानी सुनाएगी!",
    firstMessage: "अरे वाह, बेटा! {{theme}} की कहानी! दादी तो बहुत खुश हो गई! आज की कहानी बड़ी मज़ेदार होगी! अच्छा बताओ — कहानी में पहले कौन आना चाहिए?",
    imageStyle: "warm watercolor, rich saffron and gold tones, children's picture book art, heartwarming illustration style, soft evening light",
    category: "other",
  },
  {
    id: "rajvikram",
    name: "Raja Vikram",
    language: "Tamil",
    tagline: "Tamil கதைகள்",
    clonedVoice: true,
    description: "A brave and just Tamil king with tales of wisdom and courage",
    image: rajvikramImg,
    greeting: "வணக்கம்! இன்று நாம் ஒரு அற்புதமான கதை கேட்போம்!",
    firstMessage: "வாவ்! {{theme}} கதை! அற்புதமான தேர்வு! இன்றைய கதை மிகவும் சுவாரஸ்யமாக இருக்கும்! சொல்லு — நம் கதையில் யார் வரணும்?",
    imageStyle: "vibrant jewel tones, golden lamp light, children's picture book art, rich South Indian illustration style, bold colors, decorative patterns",
    category: "other",
  },
];
