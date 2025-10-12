import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { storage } from "@/utils/storage";

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

// ✅ Storage keys
const SETTINGS_KEY = "speech_settings";
const SHORTCUTS_KEY = "shortcuts";
const HISTORY_KEY = "history";

export function AppProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
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

  // ✅ Load all persisted data
  useEffect(() => {
    (async () => {
      try {
        const [savedSettings, savedShortcuts, savedHistory] = await Promise.all([
          storage.getItem(SETTINGS_KEY),
          storage.getItem(SHORTCUTS_KEY),
          storage.getItem(HISTORY_KEY),
        ]);

        if (savedSettings) setSettings((p) => ({ ...p, ...JSON.parse(savedSettings) }));
        if (savedShortcuts) setShortcuts(JSON.parse(savedShortcuts));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error("Error loading data:", err);
      }
    })();
  }, []);

  // ✅ Auto-save on change
  useEffect(() => {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    storage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  useEffect(() => {
    storage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // ✅ Context operations
  const addShortcut = (text: string) => {
    if (text && !shortcuts.includes(text)) setShortcuts([...shortcuts, text]);
  };

  const deleteShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const addToHistory = (text: string) => {
    if (text && !history.includes(text)) {
      const updated = [text, ...history].slice(0, 50);
      setHistory(updated);
    }
  };

  const clearHistory = () => setHistory([]);
  const deleteHistory = (index: number) => setHistory(history.filter((_, i) => i !== index));
  const updateSettings = (newSettings: Partial<SpeechSettings>) =>
    setSettings((prev) => ({ ...prev, ...newSettings }));

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
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
