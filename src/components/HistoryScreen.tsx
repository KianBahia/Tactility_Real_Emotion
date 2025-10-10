import { useState } from "react";
import { Volume2, Clock } from "lucide-react";
import type { SpeechSettings } from "../App";

interface HistoryScreenProps {
  history: string[];
  settings: SpeechSettings;
}

export function HistoryScreen({
  history,
  settings,
}: HistoryScreenProps) {
  const [playingIndex, setPlayingIndex] = useState<
    number | null
  >(null);

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
      <div className="h-16 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-600">
        <div className="flex items-center gap-2">
          <div className="text-3xl">📝</div>
          <h1 className="text-2xl text-white">History</h1>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto p-4">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No history yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg p-4 shadow-sm border-2 transition-all ${
                  playingIndex === index
                    ? "border-purple-500 bg-purple-50"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => handleSpeak(item, index)}
                    className="flex-1 text-left"
                  >
                    <p className="break-words">{item}</p>
                  </button>
                  <button
                    onClick={() => handleSpeak(item, index)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center active:bg-purple-600 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="h-16 border-t border-gray-300 bg-white flex items-center justify-center px-4">
        <p className="text-xs text-gray-500 text-center">
          Recent texts you've spoken
        </p>
      </div>
    </div>
  );
}