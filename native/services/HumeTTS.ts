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
  isCustomVoice?: boolean;
}

export interface HumeTTSResponse {
  generations: Array<{
    audio: string; // base64 encoded audio
  }>;
}

export interface StreamingMessage {
  type: 'utterance' | 'end' | 'error';
  data?: any;
}

class HumeTTSService {
  private static instance: HumeTTSService;
  private apiKey: string = '';
  private sound: Audio.Sound | null = null;
  private isCurrentlyPlaying: boolean = false;
  private websocket: WebSocket | null = null;
  private audioQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private currentOptions: HumeTTSOptions = {};

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

      // Store options for this session
      this.currentOptions = options;

      // Use WebSocket streaming only
      await this.speakWithStreaming(text, options);
    } catch (error) {
      console.error('Error in speak:', error);
      throw error;
    }
  }

  private async speakWithHTTP(text: string, options: HumeTTSOptions): Promise<void> {
    try {
      console.log('Using HTTP API for TTS');
      
      const config = this.buildUtteranceConfig(options);
      const payload = {
        utterances: [{
          text: text,
          ...config
        }]
      };
      
      console.log('HTTP API payload:', payload);
      
      const response = await fetch('https://api.hume.ai/v0/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hume-Api-Key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP API error: ${response.status} - ${errorText}`);
      }
      
      // The response is JSON with base64 audio data, not a direct audio file
      const responseText = await response.text();
      console.log('HTTP API response received, text length:', responseText.length);
      
      try {
        const responseData = JSON.parse(responseText);
        const cleanedResponse = JSON.parse(JSON.stringify(responseData)); // deep copy
        delete cleanedResponse.generations?.[0]?.audio;
        console.log('Parsed response data:', cleanedResponse);
        
        // Extract audio data from the response
        let audioBase64 = null;
        
        if (responseData.generations && responseData.generations[0] && responseData.generations[0].audio) {
          audioBase64 = responseData.generations[0].audio;
          console.log('Found audio in responseData.generations[0].audio');
        } else if (responseData.audio) {
          audioBase64 = responseData.audio;
          console.log('Found audio in responseData.audio');
        } else {
          console.error('No audio data found in response:', responseData);
          throw new Error('No audio data found in API response');
        }
        
        if (audioBase64) {
          console.log('Audio data found, length:', audioBase64.length);
          console.log('Audio data preview:', audioBase64.substring(0, 50));
          
          // Validate base64 format
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(audioBase64)) {
            console.error('Invalid base64 format detected');
            throw new Error('Invalid base64 audio data format');
          }
          
          const audioUri = `data:audio/mp3;base64,${audioBase64}`;
          await this.playAudioChunk(audioUri);
        } else {
          throw new Error('Audio data is empty');
        }
        
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.error('Response text preview:', responseText.substring(0, 200));
        throw new Error('Failed to parse API response as JSON');
      }
      console.log('HTTP API audio played successfully');
      
    } catch (error) {
      console.error('HTTP API error:', error);
      throw error;
    }
  }

  private async speakWithStreaming(text: string, options: HumeTTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Try HTTP API first to test if the message format works
        this.speakWithHTTP(text, options).then(resolve).catch(reject);
        return;
        
        // Create WebSocket connection to Hume TTS streaming endpoint
        // Use correct authentication parameter name
        const wsUrl = `wss://api.hume.ai/v0/tts/stream/input?apiKey=${encodeURIComponent(this.apiKey)}`;
        this.websocket = new WebSocket(wsUrl);

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.websocket!.onopen = () => {
          console.log('WebSocket connected to Hume TTS');
          clearTimeout(connectionTimeout);
          
          // Send everything in a single message as per Hume API docs
          const config = this.buildUtteranceConfig(options);
          const message = {
            utterances: [{
              text: text,
              ...config
            }]
          };
          console.log('Sending complete message:', message);
          
          try {
            if (this.websocket) {
              this.websocket.send(JSON.stringify(message));
              console.log('Message sent successfully');
            }
          } catch (error) {
            console.error('Error sending message:', error);
          }
          
          // Let the WebSocket stay open to receive audio chunks
          // It will close naturally when the generation is complete
        };

        this.websocket!.onmessage = async (event) => {
          console.log('WebSocket message received, raw data:', event.data);
          try {
            const message = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', message);
            await this.handleStreamingMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Raw data that failed to parse:', event.data);
          }
        };

        this.websocket!.onclose = (event) => {
          console.log('WebSocket closed - Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
          clearTimeout(connectionTimeout);
          this.websocket = null;
          if (event.code !== 1000) {
            const errorMessage = `WebSocket closed unexpectedly: ${event.code} - ${event.reason}`;
            console.error(errorMessage);
            reject(new Error(errorMessage));
          } else {
            console.log('WebSocket closed normally');
            resolve();
          }
        };

        this.websocket!.onerror = (error) => {
          console.error('WebSocket error occurred:', error);
          console.error('WebSocket readyState:', this.websocket?.readyState);
          clearTimeout(connectionTimeout);
          reject(new Error(`WebSocket connection failed: ${error}`));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private buildUtteranceConfig(options: HumeTTSOptions): any {
    const emotion = options.emotion || 'neutral';
    const voiceName = options.voice || 'Ava Song';
    const isCustomVoice = options.isCustomVoice || false;

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
      description: description,
      speed: speed,
    };
    if (voiceName) utteranceObj.voice = { name: voiceName };
    if (typeof trailingSilence === 'number') utteranceObj.trailing_silence = trailingSilence;
    if (!isCustomVoice) {
      utteranceObj.voice.provider = "HUME_AI";
    }

    // Return the utterance-level configuration
    return utteranceObj;
  };

  private async handleStreamingMessage(message: any): Promise<void> {
    try {
      console.log('Received WebSocket message:', message);
      
      // Check for audio data in various possible formats
      let audioBase64 = null;
      
      if (message.audio) {
        audioBase64 = message.audio;
        console.log('Found audio in message.audio');
      } else if (message.data) {
        audioBase64 = message.data;
        console.log('Found audio in message.data');
      } else if (message.snippet && message.snippet.audio) {
        audioBase64 = message.snippet.audio;
        console.log('Found audio in message.snippet.audio');
      } else if (message.generations && message.generations[0] && message.generations[0].audio) {
        audioBase64 = message.generations[0].audio;
        console.log('Found audio in message.generations[0].audio');
      }
      
      if (audioBase64) {
        console.log('Audio data found, length:', audioBase64.length);
        this.audioQueue.push(audioBase64);
        await this.processAudioQueue();
      } else if (message.type === 'generation_complete' || message.generation_complete) {
        console.log('Generation complete');
        // Close the WebSocket when generation is complete
        if (this.websocket) {
          this.websocket.close();
        }
      } else if (message.type === 'error' || message.error) {
        console.error('Streaming error:', message.message || message.error);
        throw new Error(`Streaming error: ${message.message || message.error}`);
      } else {
        console.log('No audio data found in message');
      }
    } catch (error) {
      console.error('Error handling streaming message:', error);
    }
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.audioQueue.length > 0) {
      const audioBase64 = this.audioQueue.shift();
      if (audioBase64) {
        try {
          await this.playAudioChunk(audioBase64);
        } catch (error) {
          console.error('Error playing audio chunk:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async playAudioChunk(audioBase64: string): Promise<void> {
    try {
      console.log('Playing audio chunk, base64 length:', audioBase64.length);
      console.log('Audio base64 preview:', audioBase64.substring(0, 100));
      
      // Clean the base64 string (remove any data URL prefix if present)
      let cleanBase64 = audioBase64;
      if (audioBase64.includes(',')) {
        cleanBase64 = audioBase64.split(',')[1];
      }
      
      console.log('Cleaned base64 length:', cleanBase64.length);
      
      // Try different audio formats - MP3 should work for Hume TTS
      const audioFormats = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];
      
      for (const format of audioFormats) {
        try {
          const audioUri = `data:${format};base64,${cleanBase64}`;
          console.log(`Trying audio format: ${format}`);
          console.log(`Audio URI preview: ${audioUri.substring(0, 100)}...`);
          
          // Create and load the sound
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );

          console.log(`Audio sound created successfully with format: ${format}`);

          // Set up playback status monitoring
          sound.setOnPlaybackStatusUpdate((status: any) => {
            const status_without_payload = status;
            delete status_without_payload['uri'];
            console.log('Audio playback status:', status_without_payload);
            if (status.didJustFinish) {
              console.log('Audio chunk finished playing');
              sound.unloadAsync();
            }
          });

          this.isCurrentlyPlaying = true;
          console.log('Audio chunk started playing');
          return; // Success, exit the loop
        } catch (formatError) {
          console.log(`Failed with format ${format}:`, formatError);
          // Log more details about the error
          if (formatError instanceof Error && formatError.message) {
            console.log(`Error message: ${formatError.message}`);
          }
          continue; // Try next format
        }
      }
      
      // If all formats failed, try a different approach
      console.error('All audio formats failed, trying alternative approach');
      
      // Try with just the base64 data without any format specification
      try {
        const audioUri = `data:;base64,${cleanBase64}`;
        console.log('Trying without format specification');
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );

        console.log('Audio sound created successfully without format specification');
        this.isCurrentlyPlaying = true;
        console.log('Audio chunk started playing');
        return;
      } catch (noFormatError) {
        console.error('Failed without format specification:', noFormatError);
      }
      
      // If everything failed
      console.error('All audio playback attempts failed');
      throw new Error('Unable to play audio with any supported format');
      
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      console.error('Audio base64 preview:', audioBase64.substring(0, 100));
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      // Close WebSocket connection
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Stop current audio
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Clear audio queue
      this.audioQueue = [];
      this.isProcessingQueue = false;
      this.isCurrentlyPlaying = false;
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
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
    return this.isCurrentlyPlaying || this.audioQueue.length > 0;
  }

  isPaused(): boolean {
    return this.sound !== null && !this.isCurrentlyPlaying;
  }

  // Legacy method for backward compatibility - now uses streaming
  private async generateAudio(text: string, options: HumeTTSOptions): Promise<string> {
    // This method is kept for backward compatibility but now uses streaming
    // In a real implementation, you might want to use the non-streaming API
    // for cases where you need the full audio as a single base64 string
    throw new Error('generateAudio method is deprecated. Use speak() with streaming instead.');
  }


  // Legacy method for backward compatibility
  private async playAudio(audioBase64: string): Promise<void> {
    await this.playAudioChunk(audioBase64);
  }
}

export const humeTTS = HumeTTSService.getInstance();
