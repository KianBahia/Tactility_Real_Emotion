import { useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Slider } from '../ui/slider';
import type { SpeechSettings } from '../../App';

interface VoiceSettingsProps {
  settings: SpeechSettings;
  onUpdateSettings: (settings: Partial<SpeechSettings>) => void;
  onBack: () => void;
  availableVoices: SpeechSynthesisVoice[];
}

type VoiceSubScreen = 'main' | 'rate' | 'pitch';

export function VoiceSettings({ settings, onUpdateSettings, onBack, availableVoices }: VoiceSettingsProps) {
  const [subScreen, setSubScreen] = useState<VoiceSubScreen>('main');

  const testVoice = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Hello, this is a test');
    utterance.voice = voice;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    window.speechSynthesis.speak(utterance);
  };

  if (subScreen === 'rate') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-16 flex items-center bg-gradient-to-r from-orange-500 to-red-600 px-4">
          <button onClick={() => setSubScreen('main')} className="text-white mr-3">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">Rate</h1>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 text-center">
              <div className="text-3xl mb-2">{settings.rate.toFixed(1)}x</div>
              <div className="text-sm text-gray-500">Speech Rate</div>
            </div>
            <Slider
              value={[settings.rate]}
              onValueChange={(value) => onUpdateSettings({ rate: value[0] })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0.5x (Slow)</span>
              <span>2.0x (Fast)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subScreen === 'pitch') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-16 flex items-center bg-gradient-to-r from-orange-500 to-red-600 px-4">
          <button onClick={() => setSubScreen('main')} className="text-white mr-3">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">Pitch</h1>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 text-center">
              <div className="text-3xl mb-2">{settings.pitch.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Voice Pitch</div>
            </div>
            <Slider
              value={[settings.pitch]}
              onValueChange={(value) => onUpdateSettings({ pitch: value[0] })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0.5 (Low)</span>
              <span>2.0 (High)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center bg-gradient-to-r from-orange-500 to-red-600 px-4">
        <button onClick={onBack} className="text-white mr-3">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl text-white">Voices</h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Voice Selection */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm text-gray-600">Select Voice</h3>
            </div>
            <div className="max-h-48 overflow-auto">
              {availableVoices.map((voice, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onUpdateSettings({ voice });
                    testVoice(voice);
                  }}
                  className={`w-full p-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${
                    settings.voice?.name === voice.name ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-left text-sm">
                    <div>{voice.name}</div>
                    <div className="text-xs text-gray-500">{voice.lang}</div>
                  </div>
                  {settings.voice?.name === voice.name && (
                    <div className="text-blue-500">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setSubScreen('rate')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🏃</div>
                <div className="text-left">
                  <div>Rate</div>
                  <div className="text-xs text-gray-500">{settings.rate.toFixed(1)}x speed</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Pitch */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setSubScreen('pitch')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎵</div>
                <div className="text-left">
                  <div>Pitch</div>
                  <div className="text-xs text-gray-500">{settings.pitch.toFixed(1)} tone</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Test Voice Button */}
          <button
            onClick={() => {
              if (settings.voice) {
                testVoice(settings.voice);
              }
            }}
            className="w-full bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center gap-2 active:bg-blue-600 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Test Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
