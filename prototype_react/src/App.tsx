import { useState, useRef } from 'react';
import { TextScreen } from './components/TextScreen';
import { ShortcutsScreen } from './components/ShortcutsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';

export interface SpeechSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  speakAsYouType: 'off' | 'words' | 'sentences' | 'lines';
  highlightSpokenText: boolean;
  delay: number;
  phoneCallEnabled: boolean;
  videoCallEnabled: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(1); // 0: Shortcuts, 1: Text, 2: History, 3: Settings
  const [shortcuts, setShortcuts] = useState<string[]>([
    'Hello, how are you?',
    'Thank you very much',
    'I need help',
    'Good morning',
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>({
    voice: null,
    rate: 1.0,
    pitch: 1.0,
    speakAsYouType: 'off',
    highlightSpokenText: false,
    delay: 0,
    phoneCallEnabled: false,
    videoCallEnabled: false,
  });
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentScreen < 3) {
        // Swipe left
        setCurrentScreen(currentScreen + 1);
      } else if (swipeDistance < 0 && currentScreen > 0) {
        // Swipe right
        setCurrentScreen(currentScreen - 1);
      }
    }
  };

  const handleAddToHistory = (text: string) => {
    if (text && !history.includes(text)) {
      setHistory([text, ...history].slice(0, 10)); // Keep last 10
    }
  };

  const handleAddShortcut = (text: string) => {
    if (text && !shortcuts.includes(text)) {
      setShortcuts([...shortcuts, text]);
    }
  };

  const handleDeleteShortcut = (index: number) => {
    setShortcuts(shortcuts.filter((_, i) => i !== index));
  };

  const handleUpdateSettings = (newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="size-full flex items-center justify-center bg-gray-900 p-8">
      {/* iPhone Frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* iPhone Screen */}
        <div 
          className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
          
          {/* Status Bar */}
          <div className="h-11 flex items-center justify-between px-6 pt-2">
            <span className="text-sm">9:41</span>
            <div className="flex items-center gap-1">
              <div className="text-sm">●●●●●</div>
            </div>
          </div>

          {/* Screens Container */}
          <div className="flex-1 relative overflow-hidden">
            <div 
              className="h-full flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentScreen * 100}%)` }}
            >
              {/* Shortcuts Screen */}
              <div className="min-w-full h-full">
                <ShortcutsScreen 
                  shortcuts={shortcuts}
                  onDeleteShortcut={handleDeleteShortcut}
                  settings={settings}
                />
              </div>

              {/* Text Screen */}
              <div className="min-w-full h-full">
                <TextScreen 
                  onAddToHistory={handleAddToHistory}
                  onAddShortcut={handleAddShortcut}
                  settings={settings}
                />
              </div>

              {/* History Screen */}
              <div className="min-w-full h-full">
                <HistoryScreen 
                  history={history}
                  settings={settings}
                />
              </div>

              {/* Settings Screen */}
              <div className="min-w-full h-full">
                <SettingsScreen 
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              </div>
            </div>
          </div>

          {/* Page Indicators */}
          <div className="h-8 flex items-center justify-center gap-2 bg-white">
            {[0, 1, 2, 3].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentScreen === index 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Screen Labels */}
          <div className="h-6 flex items-center justify-center bg-gray-50">
            <span className="text-xs text-gray-500">
              {currentScreen === 0 ? 'Shortcuts' : currentScreen === 1 ? 'Text' : currentScreen === 2 ? 'History' : 'Settings'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
