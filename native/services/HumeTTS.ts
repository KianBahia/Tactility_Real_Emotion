import { Audio } from 'expo-av';
import { Voice } from '@/contexts/AppContext';

export interface HumeTTSOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'doubt';
}

export interface HumeTTSResponse {
  generations: Array<{
    audio: string; // base64 encoded audio
  }>;
}

class HumeTTSService {
  private static instance: HumeTTSService;
  private apiKey: string = '';
  private sound: Audio.Sound | null = null;
  private isCurrentlyPlaying: boolean = false;

  static getInstance(): HumeTTSService {
    if (!HumeTTSService.instance) {
      HumeTTSService.instance = new HumeTTSService();
    }
    return HumeTTSService.instance;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string, options: HumeTTSOptions = {}): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Hume API key not set');
    }

    if (!text.trim()) {
      return;
    }

    try {
      // Stop any currently playing audio
      await this.stop();

      // Generate audio using Hume TTS API
      const audioData = await this.generateAudio(text, options);
      
      // Play the generated audio
      await this.playAudio(audioData);
      
    } catch (error) {
      console.error('Hume TTS Error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
    this.isCurrentlyPlaying = false;
  }

  async pause(): Promise<void> {
    if (this.sound && this.isCurrentlyPlaying) {
      try {
        await this.sound.pauseAsync();
        this.isCurrentlyPlaying = false;
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  }

  async resume(): Promise<void> {
    if (this.sound && !this.isCurrentlyPlaying) {
      try {
        await this.sound.playAsync();
        this.isCurrentlyPlaying = true;
      } catch (error) {
        console.error('Error resuming sound:', error);
      }
    }
  }

  isSpeaking(): boolean {
    return this.isCurrentlyPlaying;
  }

  isPaused(): boolean {
    return this.sound !== null && !this.isCurrentlyPlaying;
  }

  private async generateAudio(text: string, options: HumeTTSOptions): Promise<string> {
    const emotion = options.emotion || 'neutral';
    const voiceName = options.voice || 'Ava Song';
    
    // Emotion presets for more natural speech
    const emotionPresets = {
      neutral: {
        description: "neutral, clear, conversational, medium pace, natural emphasis",
        speed: 1.0,
      },
      happy: {
        description: "happy, bright, upbeat, smiling tone, lively rhythm, warm and friendly",
        speed: 1.1,
      },
      sad: {
        description: "sad, soft, low energy, slow pace, gentle downward intonation, subdued",
        speed: 0.85,
      },
      angry: {
        description: "angry, sharp, intense, clipped consonants, firm emphasis, fast pace",
        speed: 1.15,
      },
      doubt: {
        description: "uncertain, hesitant, thoughtful, light pauses, rising intonation at phrase ends",
        speed: 0.95,
      },
    };

    const preset = emotionPresets[emotion];
    const speed = (options.rate || 1.0) * preset.speed;

    const payload = {
      utterances: [
        {
          text,
          description: preset.description,
          voice: { 
            name: voiceName, 
            provider: "HUME_AI" 
          },
          speed: speed,
        },
      ],
      format: { type: "mp3" },
      num_generations: 1,
    };

    const response = await fetch('https://api.hume.ai/v0/tts', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hume TTS API error: ${response.status} - ${errorText}`);
    }

    const data: HumeTTSResponse = await response.json();
    const audioBase64 = data?.generations?.[0]?.audio;

    if (!audioBase64) {
      throw new Error('No audio data returned from Hume TTS API');
    }

    return audioBase64;
  }

  private async playAudio(audioBase64: string): Promise<void> {
    try {
      // Create a data URI from the base64 audio
      const audioUri = `data:audio/mp3;base64,${audioBase64}`;
      
      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      this.sound = sound;
      this.isCurrentlyPlaying = true;

      // Set up event listeners
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            this.isCurrentlyPlaying = false;
          }
        }
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      this.isCurrentlyPlaying = false;
      throw error;
    }
  }

  getStatus() {
    return {
      isSpeaking: this.isCurrentlyPlaying,
      isPaused: this.isPaused(),
      hasSound: this.sound !== null,
    };
  }
}

export const humeTTS = HumeTTSService.getInstance();