import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Voice } from '@/contexts/AppContext';

export interface HumeTTSOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'doubt';
  description?: string;
  trailing_silence?: number;
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
  // Don't force a custom default voice here. If a voice is provided, try it;
  // otherwise omit the voice field so the service uses a sensible default.
  const voiceName = options.voice || undefined;
    
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

    // allow caller to override description/trailing_silence
    const description = options.description || preset.description;
    const trailingSilence = typeof options.trailing_silence === 'number' ? options.trailing_silence : undefined;

    const utteranceObj: any = {
      text,
      description: description,
      speed: speed,
    };
    if (voiceName) utteranceObj.voice = { name: voiceName };
    if (typeof trailingSilence === 'number') utteranceObj.trailing_silence = trailingSilence;

    const payload = {
      utterances: [utteranceObj],
      format: { type: "mp3" },
      num_generations: 1,
    };

    // Try request; if a custom voice is not found we will retry without the
    // voice field so the API can pick a default voice for the account.
    let response = await fetch('https://api.hume.ai/v0/tts', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // attempt one retry without the voice field when the error looks like
      // a missing/forbidden custom voice resource
      try {
        const errorText = await response.text();
        const lower = errorText.toLowerCase();
        if (response.status === 404 || lower.includes('does not exist') || lower.includes('resource not found')) {
          // remove voice and retry
          const payload2: any = { ...payload };
          if (payload2.utterances && payload2.utterances[0]) {
            delete payload2.utterances[0].voice;
          }
          const resp2 = await fetch('https://api.hume.ai/v0/tts', {
            method: 'POST',
            headers: {
              'X-Hume-Api-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload2),
          });
          if (resp2.ok) {
            response = resp2;
          } else {
            const err2 = await resp2.text();
            throw new Error(`Hume TTS API error after retry: ${resp2.status} - ${err2}`);
          }
        } else {
          throw new Error(`Hume TTS API error: ${response.status} - ${errorText}`);
        }
      } catch (e) {
        // rethrow so outer catch handles fallback
        throw e;
      }
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