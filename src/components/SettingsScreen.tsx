import { useState, useEffect } from 'react';
import { ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { VoiceSettings } from './settings/VoiceSettings';
import { SpeakAsYouTypeSettings } from './settings/SpeakAsYouTypeSettings';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import type { SpeechSettings } from '../App';

interface SettingsScreenProps {
  settings: SpeechSettings;
  onUpdateSettings: (settings: Partial<SpeechSettings>) => void;
}

type SubScreen = 'main' | 'voices' | 'speak-as-you-type';

export function SettingsScreen({ settings, onUpdateSettings }: SettingsScreenProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('main');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (!settings.voice && voices.length > 0) {
        onUpdateSettings({ voice: voices[0] });
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  if (subScreen === 'voices') {
    return (
      <VoiceSettings
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubScreen('main')}
        availableVoices={availableVoices}
      />
    );
  }

  if (subScreen === 'speak-as-you-type') {
    return (
      <SpeakAsYouTypeSettings
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onBack={() => setSubScreen('main')}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600">
        <div className="flex items-center gap-2">
          <div className="text-3xl">⚙️</div>
          <h1 className="text-2xl text-white">Settings</h1>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Voices Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setSubScreen('voices')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎤</div>
                <div className="text-left">
                  <div>Voices</div>
                  <div className="text-xs text-gray-500">
                    {settings.voice?.name || 'Default Voice'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Speak as You Type Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setSubScreen('speak-as-you-type')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">⌨️</div>
                <div className="text-left">
                  <div>Speak as You Type</div>
                  <div className="text-xs text-gray-500">
                    {settings.speakAsYouType === 'off' ? 'Off' : 
                     settings.speakAsYouType === 'words' ? 'Words by Words' :
                     settings.speakAsYouType === 'sentences' ? 'Sentences by Sentences' :
                     'Lines by Lines'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Highlight Spoken Text */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <div>Highlight Spoken Text</div>
                  <div className="text-xs text-gray-500">Visual feedback while speaking</div>
                </div>
              </div>
              <Switch
                checked={settings.highlightSpokenText}
                onCheckedChange={(checked) => onUpdateSettings({ highlightSpokenText: checked })}
              />
            </div>
          </div>

          {/* Delay */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">⏱️</div>
              <div className="flex-1">
                <div>Delay</div>
                <div className="text-xs text-gray-500">{settings.delay}ms before speaking</div>
              </div>
            </div>
            <Slider
              value={[settings.delay]}
              onValueChange={(value) => onUpdateSettings({ delay: value[0] })}
              min={0}
              max={2000}
              step={100}
              className="w-full"
            />
          </div>

          {/* Phone Call */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📞</div>
                <div>
                  <div>Phone Call</div>
                  <div className="text-xs text-gray-500">Enable during phone calls</div>
                </div>
              </div>
              <Switch
                checked={settings.phoneCallEnabled}
                onCheckedChange={(checked) => onUpdateSettings({ phoneCallEnabled: checked })}
              />
            </div>
          </div>

          {/* Video Call */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📹</div>
                <div>
                  <div>Video Call</div>
                  <div className="text-xs text-gray-500">Enable during video calls</div>
                </div>
              </div>
              <Switch
                checked={settings.videoCallEnabled}
                onCheckedChange={(checked) => onUpdateSettings({ videoCallEnabled: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
