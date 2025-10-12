import React, { createContext, ReactNode, useContext, useState, useEffect, } from "react";
import { storage } from "@/utils/storage"; // ✅ added import

export interface Voice {
  id: string;
  name: string;
  provider: "HUME_AI" | "CUSTOM_VOICE";
}

export interface SpeechSettings {
  voice: Voice | null;
  selectedVoiceId: string | null;
  rate: number;
  pitch: number;
  speakAsYouType: "off" | "words" | "sentences" | "lines";
  highlightSpokenText: boolean;
  delay: number;
  humeApiKey: string;
}

interface AppContextType {
  shortcuts: string[];
  setShortcuts: (shortcuts: string[]) => void;
  addShortcut: (text: string) => void;
  deleteShortcut: (index: number) => void;
  history: string[];
  setHistory: (history: string[]) => void;
  addToHistory: (text: string) => void;
  clearHistory: () => void;
  deleteHistory: (index: number) => void;
  settings: SpeechSettings;
  updateSettings: (newSettings: Partial<SpeechSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ✅ storage key constant
const SETTINGS_KEY = "speech_settings";

export function AppProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<string[]>([
    "Hello, how are you?",
    "Thank you very much",
    "I need help",
    "Good morning",
  ]);

  const [history, setHistory] = useState<string[]>([
    "Hello, how are you today?",
    "Thank you for your help",
    "I need assistance with this",
    "Good morning everyone",
  ]);

  const [settings, setSettings] = useState<SpeechSettings>({
    voice: null,
    selectedVoiceId: null,
    rate: 1.0,
    pitch: 1.0,
    speakAsYouType: "off",
    highlightSpokenText: false,
    delay: 0,
    humeApiKey: "",
  });

  // ✅ Load settings (including API key) from persistent storage
  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.getItem(SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.error("Error loading settings from storage:", err);
      }
    })();
  }, []);

  // ✅ Save settings automatically when they change
  useEffect(() => {
    (async () => {
      try {
        await storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (err) {
        console.error("Error saving settings to storage:", err);
      }
    })();
  }, [settings]);

  const addShortcut = (text: string) => {
    if (text && !shortcuts.includes(text)) {
      setShortcuts([...shortcuts, text]);
    }
  };

  const deleteShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const addToHistory = (text: string) => {
    if (text && !history.includes(text)) {
      setHistory([text, ...history].slice(0, 10)); // Keep last 10
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const deleteHistory = (index: number) => {
    setHistory(history.filter((_, i) => i !== index));
  };

  const updateSettings = (newSettings: Partial<SpeechSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider
      value={{
        shortcuts,
        setShortcuts,
        addShortcut,
        deleteShortcut,
        history,
        setHistory,
        addToHistory,
        clearHistory,
        deleteHistory,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
