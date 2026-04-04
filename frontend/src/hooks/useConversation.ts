import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useConversation as useElevenLabsConversation } from "@elevenlabs/react";
import { Character } from "@/characters";

export type SessionState = "idle" | "connecting" | "active" | "error" | "ended";
export type CharacterState = "idle" | "speaking" | "listening";

export interface BadgeAward {
  emoji: string;
  name: string;
  reason: string;
}

interface Transcription {
  type: "child" | "character";
  text: string;
}

interface UseConversationOptions {
  character: Character;
  theme?: string;
  propImage?: string;
  propDescription?: string;
  onGenerateIllustration?: ((sceneDescription: string, narratorText: string) => void) | null;
  onBadgeAwarded?: ((badge: BadgeAward) => void) | null;
  onTranscription?: ((msg: Transcription) => void) | null;
  onImageTrigger?: ((text: string) => void) | null;
  onChildSpoke?: (() => void) | null;
}

export function useConversation({
  character,
  theme,
  propDescription,
  onGenerateIllustration,
  onBadgeAwarded,
  onTranscription,
  onImageTrigger,
  onChildSpoke,
}: UseConversationOptions) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const intentionalEndRef = useRef(false);

  // Keep latest callbacks in refs so closures never go stale
  const onGenerateIllustrationRef = useRef(onGenerateIllustration);
  const onBadgeAwardedRef = useRef(onBadgeAwarded);
  const onTranscriptionRef = useRef(onTranscription);
  const onImageTriggerRef = useRef(onImageTrigger);
  const onChildSpokeRef = useRef(onChildSpoke);
  useEffect(() => { onGenerateIllustrationRef.current = onGenerateIllustration; }, [onGenerateIllustration]);
  useEffect(() => { onBadgeAwardedRef.current = onBadgeAwarded; }, [onBadgeAwarded]);
  useEffect(() => { onTranscriptionRef.current = onTranscription; }, [onTranscription]);
  useEffect(() => { onImageTriggerRef.current = onImageTrigger; }, [onImageTrigger]);
  useEffect(() => { onChildSpokeRef.current = onChildSpoke; }, [onChildSpoke]);

  // Accumulate character speech across message chunks for transcript
  const outputTextAccRef = useRef("");

  const clientTools = useMemo(() => ({
    generate_illustration: ({ scene_description }: { scene_description: string }) => {
      onGenerateIllustrationRef.current?.(scene_description, outputTextAccRef.current.trim());
      return "Illustration generated.";
    },
    award_badge: (args: BadgeAward) => {
      onBadgeAwardedRef.current?.(args);
      return "Badge shown on screen. Continue the story — do not mention the badge.";
    },
  }), []);

  const elevenLabs = useElevenLabsConversation({
    clientTools,
    onMessage: ({ message, source }) => {
      if (source === "user") {
        onChildSpokeRef.current?.();
        onTranscriptionRef.current?.({ type: "child", text: message });
      } else {
        // Accumulate AI speech for image trigger
        outputTextAccRef.current += " " + message;
        onTranscriptionRef.current?.({ type: "character", text: message });
        onImageTriggerRef.current?.(outputTextAccRef.current.trim());
        outputTextAccRef.current = "";
      }
    },
    onDisconnect: () => {
      setSessionState(intentionalEndRef.current ? "ended" : "error");
      intentionalEndRef.current = false;
    },
    onError: () => {
      setSessionState("error");
    },
  });

  const { status, isSpeaking } = elevenLabs;

  const characterState: CharacterState =
    status !== "connected" ? "idle" :
    isSpeaking             ? "speaking" : "listening";

  const connect = useCallback(async () => {
    if (sessionState !== "idle") return;
    intentionalEndRef.current = false;
    outputTextAccRef.current = "";
    setSessionState("connecting");

    try {
      const params = new URLSearchParams({ character_id: character.id });
      if (theme) params.set("theme", theme);
      const res = await fetch(`/api/session?${params}`);
      if (!res.ok) {
        setSessionState("error");
        return;
      }
      const { signed_url } = await res.json();
      const themeLabel =
        theme === "camera_prop" ? (propDescription ?? "your special prop") :
        theme === "sketch"      ? (propDescription ?? "your drawing") :
        theme                   ?? "a wonderful adventure";
      await elevenLabs.startSession({
        signedUrl: signed_url,
        dynamicVariables: { theme: themeLabel },
      });
      setSessionState("active");
    } catch {
      setSessionState("error");
    }
  }, [character.id, sessionState, theme, elevenLabs]);

  const disconnect = useCallback(() => {
    intentionalEndRef.current = true;
    setIsPaused(false);
    elevenLabs.endSession();
  }, [elevenLabs]);

  const togglePause = useCallback(() => {
    elevenLabs.setMicMuted(!isPaused);
    setIsPaused((p) => !p);
  }, [isPaused, elevenLabs]);

  return {
    connect,
    disconnect,
    togglePause,
    isPaused,
    sessionState,
    characterState,
  };
}
