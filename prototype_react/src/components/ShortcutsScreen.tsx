import { useState } from 'react';
import { Trash2, Volume2 } from 'lucide-react';
import type { SpeechSettings } from '../App';

interface ShortcutsScreenProps {
  shortcuts: string[];
  onDeleteShortcut: (index: number) => void;
  settings: SpeechSettings;
}

export function ShortcutsScreen({ shortcuts, onDeleteShortcut, settings }: ShortcutsScreenProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handleSpeak = (text: string, index: number) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    
    utterance.onstart = () => {
      setPlayingIndex(index);
    };

    utterance.onend = () => {
      setPlayingIndex(null);
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, settings.delay);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-600">
        <div className="flex items-center gap-2">
          <div className="text-3xl">⚡</div>
          <h1 className="text-2xl text-white">Shortcuts</h1>
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="flex-1 overflow-auto p-4">
        {shortcuts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No shortcuts yet. Add from Text screen!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
                  playingIndex === index 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => handleSpeak(shortcut, index)}
                    className="flex-1 text-left"
                  >
                    <p className="break-words">{shortcut}</p>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSpeak(shortcut, index)}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center active:bg-blue-600 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteShortcut(index)}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center active:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="h-16 border-t border-gray-300 bg-white flex items-center justify-center px-4">
        <p className="text-xs text-gray-500 text-center">
          Tap a shortcut to speak it instantly
        </p>
      </div>
    </div>
  );
}
