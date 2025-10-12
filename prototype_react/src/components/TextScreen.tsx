import { useState, useRef, useEffect } from 'react';
import { Keyboard } from './Keyboard';
import { Play, Pause, Plus } from 'lucide-react';
import type { SpeechSettings } from '../App';

interface TextScreenProps {
  onAddToHistory: (text: string) => void;
  onAddShortcut: (text: string) => void;
  settings: SpeechSettings;
}

export function TextScreen({ onAddToHistory, onAddShortcut, settings }: TextScreenProps) {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const prevTextRef = useRef('');

  useEffect(() => {
    if (settings.speakAsYouType === 'off') return;

    const newText = text.slice(prevTextRef.current.length);
    prevTextRef.current = text;

    if (!newText) return;

    let shouldSpeak = false;
    let textToSpeak = '';

    if (settings.speakAsYouType === 'words' && newText.includes(' ')) {
      const words = text.trim().split(/\s+/);
      textToSpeak = words[words.length - 2] || '';
      shouldSpeak = true;
    } else if (settings.speakAsYouType === 'sentences' && /[.!?]/.test(newText)) {
      const sentences = text.split(/[.!?]/);
      textToSpeak = sentences[sentences.length - 2]?.trim() || '';
      shouldSpeak = true;
    } else if (settings.speakAsYouType === 'lines' && newText.includes('\n')) {
      const lines = text.split('\n');
      textToSpeak = lines[lines.length - 2] || '';
      shouldSpeak = true;
    }

    if (shouldSpeak && textToSpeak) {
      setTimeout(() => speakText(textToSpeak), settings.delay);
    }
  }, [text, settings.speakAsYouType, settings.delay]);

  const speakText = (textToSpeak: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    if (settings.highlightSpokenText) {
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const start = event.charIndex;
          const end = start + (event.charLength || 0);
          setHighlightedText(textToSpeak.substring(start, end));
        }
      };

      utterance.onend = () => {
        setHighlightedText('');
      };
    }

    window.speechSynthesis.speak(utterance);
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setText(prev => {
        prevTextRef.current = prev.slice(0, -1);
        return prev.slice(0, -1);
      });
    } else if (key === 'space') {
      setText(prev => {
        prevTextRef.current = prev + ' ';
        return prev + ' ';
      });
    } else if (key === '↵') {
      setText(prev => {
        prevTextRef.current = prev + '\n';
        return prev + '\n';
      });
    } else {
      setText(prev => {
        prevTextRef.current = prev + key;
        return prev + key;
      });
    }
  };

  const handlePlay = () => {
    if (!text) return;
    
    onAddToHistory(text);
    
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current = utterance;
      
      if (settings.voice) {
        utterance.voice = settings.voice;
      }
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setHighlightedText('');
      };

      if (settings.highlightSpokenText) {
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const start = event.charIndex;
            const end = start + (event.charLength || 0);
            setHighlightedText(text.substring(start, end));
          }
        };
      }
      
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }, settings.delay);
    }
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleAddShortcut = () => {
    if (text) {
      onAddShortcut(text);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo Header */}
      <div className="h-16 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-2">
          <div className="text-3xl">💬</div>
          <h1 className="text-2xl text-white">Text</h1>
        </div>
      </div>

      {/* Chat/Text Area */}
      <div className="flex-[2] px-4 py-2 overflow-auto relative">
        <textarea
          value={text}
          onChange={(e) => {
            prevTextRef.current = e.target.value;
            setText(e.target.value);
          }}
          placeholder="Start typing..."
          className={`w-full h-full resize-none border-none outline-none p-2 ${
            settings.highlightSpokenText && highlightedText ? 'bg-yellow-100' : ''
          }`}
        />
      </div>

      {/* Controls */}
      <div className="h-14 border-t border-gray-300 bg-gray-50 flex items-center justify-center gap-3 px-4">
        <button
          onClick={handlePlay}
          disabled={!text || isPlaying}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white disabled:bg-gray-300 disabled:text-gray-500 active:bg-blue-600 transition-colors"
        >
          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
        </button>
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white disabled:bg-gray-300 disabled:text-gray-500 active:bg-blue-600 transition-colors"
        >
          <Pause className="w-5 h-5" fill="currentColor" />
        </button>
        <button
          onClick={handleAddShortcut}
          disabled={!text}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white disabled:bg-gray-300 disabled:text-gray-500 active:bg-green-600 transition-colors"
          title="Add to shortcuts"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard Area */}
      <div className="flex-1 bg-[#D1D5DB] border-t border-gray-300">
        <Keyboard onKeyPress={handleKeyPress} />
      </div>
    </div>
  );
}
