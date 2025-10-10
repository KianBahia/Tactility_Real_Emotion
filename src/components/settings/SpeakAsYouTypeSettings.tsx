import { ChevronLeft } from 'lucide-react';
import type { SpeechSettings } from '../../App';

interface SpeakAsYouTypeSettingsProps {
  settings: SpeechSettings;
  onUpdateSettings: (settings: Partial<SpeechSettings>) => void;
  onBack: () => void;
}

export function SpeakAsYouTypeSettings({ settings, onUpdateSettings, onBack }: SpeakAsYouTypeSettingsProps) {
  const options = [
    { value: 'off', label: 'Off', icon: '⏸️', description: 'Speak only when you press play' },
    { value: 'words', label: 'Words by Words', icon: '📝', description: 'Speak each word as you type' },
    { value: 'sentences', label: 'Sentences by Sentences', icon: '📄', description: 'Speak each sentence when complete' },
    { value: 'lines', label: 'Lines by Lines', icon: '📋', description: 'Speak each line when you press enter' },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-16 flex items-center bg-gradient-to-r from-orange-500 to-red-600 px-4">
        <button onClick={onBack} className="text-white mr-3">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl text-white">Speak as You Type</h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdateSettings({ speakAsYouType: option.value })}
              className={`w-full bg-white rounded-lg shadow-sm p-4 text-left transition-all ${
                settings.speakAsYouType === option.value
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border-2 border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>{option.label}</div>
                    {settings.speakAsYouType === option.value && (
                      <div className="text-blue-500">✓</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
