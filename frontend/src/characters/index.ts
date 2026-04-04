import wizardImg from "@/assets/characters/wizard.png";
import fairyImg from "@/assets/characters/fairy.png";
import pirateImg from "@/assets/characters/pirate.png";
import robotImg from "@/assets/characters/robot.png";
import dadiImg from "@/assets/characters/dadi.png";
import rajkumariImg from "@/assets/characters/rajkumari.png";
// Tamil Raja Vikram reuses the maharaja portrait (same character, Tamil context)
import rajvikramImg from "@/assets/characters/maharaja.png";
// TODO: replace these with actual character portraits
import chineseImg from "@/assets/characters/chinese.png";
import spanishImg from "@/assets/characters/spanish.png";
import frenchImg from "@/assets/characters/french.png";

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
    id: "robot",
    name: "Robo Ricky",
    language: "English",
    tagline: "Futuristic fun",
    description: "A friendly robot from the future with amazing stories",
    image: robotImg,
    greeting: "Beep boop! Let's begin a fantastic story!",
    firstMessage: "BEEP BOOP — {{theme}} STORY MODE ACTIVATED! My circuits are BUZZING with excitement! This is going to be AMAZING! Tell me, human friend — what awesome character should appear in our story?",
    imageStyle: "bright cheerful colors, children's science fiction art, clean cartoon style, soft glow effects, playful digital illustration",
    category: "english",
  },
  {
    id: "rajkumari",
    name: "Rajkumari Meera",
    language: "English",
    tagline: "Indian tales · Indian accent",
    description: "A graceful Indian princess with Panchatantra tales in English",
    image: rajkumariImg,
    greeting: "Namaste! Come, let me tell you a wonderful story!",
    firstMessage: "Oh, how wonderful! A {{theme}} story — I have been waiting ALL day for this! This is going to be truly magical, dear one. Now tell me — what would you like to happen first in our tale?",
    imageStyle: "elegant warm watercolor style, golden light, children's picture book art, graceful Indian illustration, soft jewel tones, delicate detail",
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
    description: "A brave and just Tamil king with tales of wisdom and courage",
    image: rajvikramImg,
    greeting: "வணக்கம்! இன்று நாம் ஒரு அற்புதமான கதை கேட்போம்!",
    firstMessage: "வாவ்! {{theme}} கதை! அற்புதமான தேர்வு! இன்றைய கதை மிகவும் சுவாரஸ்யமாக இருக்கும்! சொல்லு — நம் கதையில் யார் வரணும்?",
    imageStyle: "vibrant jewel tones, golden lamp light, children's picture book art, rich South Indian illustration style, bold colors, decorative patterns",
    category: "other",
  },
  {
    id: "naInai",
    name: "Yé Ye",
    language: "Mandarin",
    tagline: "普通话故事",
    description: "A man with ancient Chinese tales and timeless wisdom",
    image: chineseImg,
    greeting: "小宝贝，来，爷爷给你讲一个好听的故事！",
    firstMessage: "哇！{{theme}}的故事！太棒了，宝贝！爷爷好高兴！今天的故事一定非常精彩！快告诉我——你想在故事里看到什么？",
    imageStyle: "soft watercolor, warm lantern light, children's picture book art, delicate Chinese ink brush style, gentle pastel tones",
    category: "other",
  },
  {
    id: "abuela",
    name: "Abuelo Miguel",
    language: "Spanish",
    tagline: "Cuentos en español",
    description: "A man with magical stories from Latin America",
    image: spanishImg,
    greeting: "¡Hola, mi amor! ¿Estás listo para un cuento maravilloso?",
    firstMessage: "¡Ay, qué emoción! ¡Una historia de {{theme}}! ¡Eso es maravilloso, corazón! ¡Abuelo Miguel está listo! Dime — ¿qué personaje tan especial quieres que aparezca en nuestra historia?",
    imageStyle: "warm vibrant colors, children's picture book art, lush Latin American illustration style, tropical flowers and warmth",
    category: "other",
  },
  {
    id: "mamie",
    name: "Mamie Claire",
    language: "French",
    tagline: "Contes en français",
    description: "A charming French girl with enchanting fairy tales",
    image: frenchImg,
    greeting: "Bonjour, mon petit ! Tu veux écouter une belle histoire ?",
    firstMessage: "Oh là là ! Une histoire de {{theme}} — quelle merveilleuse idée, mon petit ! Mamie Claire est tellement contente ! Dis-moi — quel personnage magique voudrais-tu voir dans notre histoire ?",
    imageStyle: "soft pastel watercolor, charming French countryside illustration, children's picture book art, gentle whimsical style",
    category: "other",
  },
];
