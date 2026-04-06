import { useState } from "react";
import LandingPage from "./screens/LandingPage";
import CharacterSelect from "./screens/CharacterSelect";
import ThemeSelect from "./screens/ThemeSelect";
import StoryScreen from "./screens/StoryScreen";
import VoiceDesignScreen from "./screens/VoiceDesignScreen";
import VoiceCloneScreen from "./screens/VoiceCloneScreen";
import MuteButton from "./components/MuteButton";
import { Character } from "./characters";
import { useAmbientSound } from "./hooks/useAmbientSound";

type Screen = "landing" | "story-select" | "voice-design" | "voice-clone" | "theme-select" | "story";

const App = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [theme, setTheme] = useState<string | undefined>();
  const [propImage, setPropImage] = useState<string | undefined>();
  const [propDescription, setPropDescription] = useState<string | undefined>();
  const [propImageMimeType, setPropImageMimeType] = useState<string | undefined>();
  const [imageModel, setImageModel] = useState<string | undefined>();
  const [muted, setMuted] = useState(false);
  // Custom characters created this session — passed down so they appear immediately
  const [sessionCustomChars, setSessionCustomChars] = useState<Character[]>([]);

  // Ambient music plays on landing + character select; stops during story, voice cloning, or when muted
  useAmbientSound(screen !== "story" && screen !== "voice-clone" && !muted);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setScreen("theme-select");
  };

  const handleThemeConfirm = (t: string, img?: string, desc?: string, mimeType?: string, model?: string) => {
    setTheme(t);
    setPropImage(img);
    setPropDescription(desc);
    setPropImageMimeType(mimeType);
    setImageModel(model);
    setScreen("story");
  };

  const handleBackFromTheme = () => {
    setSelectedCharacter(null);
    setScreen("story-select");
  };

  const handleBackFromStory = () => {
    setTheme(undefined);
    setPropImage(undefined);
    setPropDescription(undefined);
    setPropImageMimeType(undefined);
    setImageModel(undefined);
    setScreen("theme-select");
  };

  const handleBackToLanding = () => {
    setScreen("landing");
    setSelectedCharacter(null);
    setTheme(undefined);
    setPropImage(undefined);
    setPropDescription(undefined);
    setPropImageMimeType(undefined);
  };

  const handleVoiceDesignCreated = (character: Character) => {
    setSessionCustomChars((prev) => [...prev, character]);
    setScreen("story-select");
  };

  const handleVoiceCloneCreated = (character: Character) => {
    setSessionCustomChars((prev) => [...prev, character]);
    setScreen("story-select");
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage onStoryMode={() => setScreen("story-select")} />
      )}
      {screen === "story-select" && (
        <CharacterSelect
          onSelect={handleCharacterSelect}
          onBack={handleBackToLanding}
          onVoiceDesign={() => setScreen("voice-design")}
          onVoiceClone={() => setScreen("voice-clone")}
          customCharacters={sessionCustomChars}
        />
      )}
      {screen === "voice-design" && (
        <VoiceDesignScreen
          onBack={() => setScreen("story-select")}
          onCreated={handleVoiceDesignCreated}
        />
      )}
      {screen === "voice-clone" && (
        <VoiceCloneScreen
          onBack={() => setScreen("story-select")}
          onCreated={handleVoiceCloneCreated}
        />
      )}
      {screen === "theme-select" && selectedCharacter && (
        <ThemeSelect
          character={selectedCharacter}
          onBack={handleBackFromTheme}
          onHome={handleBackToLanding}
          onConfirm={handleThemeConfirm}
        />
      )}
      {screen === "story" && selectedCharacter && (
        <StoryScreen
          character={selectedCharacter}
          theme={theme}
          propImage={propImage}
          propDescription={propDescription}
          propImageMimeType={propImageMimeType}
          imageModel={imageModel}
          onBack={handleBackFromStory}
          onHome={handleBackToLanding}
        />
      )}
      {screen !== "story" && (
        <MuteButton muted={muted} onToggle={() => setMuted((m) => !m)} />
      )}
    </>
  );
};

export default App;
