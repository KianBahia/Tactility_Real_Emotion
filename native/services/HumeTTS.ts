import { Audio } from 'expo-av';
import { Voice } from '@/contexts/AppContext';

export interface HumeTTSOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  emotion?: 'neutral' | 'angry' | 'angry_2' | 'angry_3' | 'happy' | 'happy_2' | 'happy_3' | 'enthusiastic_formal' | 'enthusiastic_formal_2' | 'enthusiastic_formal_3' | 'doubt' | 'funny_sarcastic' | 'anxious' | 'shy' | 'dont_care' | 'admire' | 'awe' | 'shock' | 'scared' | 'scared_2' | 'scared_3' | 'disgusted' | 'disgusted_2' | 'disgusted_3' | 'sad' | 'sad_2' | 'sad_3';
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

  async speakMultiple(utterances: any[]): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Hume API key not set');
    }

    if (!utterances || utterances.length === 0) {
      return;
    }

    try {
      // Stop any currently playing audio
      await this.stop();

      console.log('Using HTTP API for multiple utterances TTS');
      
      const payload = {
        utterances: utterances
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
      description:
        'Neutral voice with smooth prosody. The speaker sounds calm, balanced, and sonically neutral. Use this preset when you want a simple, clear read without emotional color.',
      speed: 0.95,
    },

    angry: {
      description:
        'Angry tone with sharp, intense energy and clipped consonants. Firm emphasis, fast pacing, and forceful delivery conveying irritation.',
      speed: 0.85,
    },

    angry_2: {
      description:
        'Very angry tone with raised voice, sharper emphasis, and rapid, tense rhythm — expressing clear frustration and loss of patience.',
      speed: 1.0,
    },

    angry_3: {
      description:
        'Furious, explosive tone filled with tension. Loud, clipped words, forceful rhythm, and harsh downward inflection — sounds genuinely enraged and emotional.',
      speed: 1.15,
    },

    happy: {
      description:
        'Genuinely happy voice with bright, energetic tone and friendly warmth. Medium-fast rhythm, expressive intonation, and clear articulation — like sharing good news with a friend.',
      speed: 1.07,
    },

    happy_2: {
      description:
        'Delighted, lively tone with stronger brightness and dynamic rhythm. Smiling through every word, playful and expressive with warmth and energy that fills the voice.',
      speed: 1.12,
    },

    happy_3: {
      description:
        'Ecstatic, overjoyed voice with wide-pitched laughter and quick rhythm. Overflowing enthusiasm and genuine excitement — thrilled beyond words.',
      speed: 1.22,
    },

    enthusiastic_formal: {
      description:
        'Enthusiastic but formal tone with confident projection, clear diction, and positive emphasis — upbeat yet polished.',
      speed: 1.02,
    },

    enthusiastic_formal_2: {
      description:
        'Very enthusiastic, expressive intonation and confident rhythm; polished yet dynamic delivery with vibrant projection and upbeat emphasis.',
      speed: 1.08,
    },

    enthusiastic_formal_3: {
      description:
        'Extremely enthusiastic, passionate yet articulate tone, elevated pitch range, strong rhythm, and conviction — inspiring, contagious energy as if highly motivated.',
      speed: 1.18,
    },

    doubt: {
      description:
        'Hesitant, tentative tone with light pauses and rising intonation. Elongated vowels and gentle upward phrasing convey uncertainty.',
      speed: 0.92,
      trailing_silence: 0.6,
    },

    funny_sarcastic: {
      description:
        'Playful, lightly mocking tone with exaggerated intonation and slightly slower pacing. Sounds amused but insincere — as if teasing or feigning surprise. The word "wow" is drawn out with dry humor, not genuine admiration.',
      speed: 0.98,
      trailing_silence: 0.25,
    },

    anxious: {
      description:
        'Rapid, breathy, tense tone with slight tremor and rising intonation. Scattered pacing conveys nervous energy or worry.',
      speed: 1.12,
    },

    shy: {
      description:
        'Soft, quiet, hesitant, and breathy tone with minimal projection and gentle downward intonation.',
      speed: 0.9,
    },

    dont_care: {
      description:
        'Low-energy, slightly dismissive but weary tone. Soft sighs, short pauses, and a casual rhythm — minimal affect but still humanized with small breaths.',
      speed: 0.96,
      trailing_silence: 0.25,
    },

    admire: {
      description:
        'Warm, energetic tone with elevated pitch on key words, sincere resonance, and glowing vocal quality.',
      speed: 1.0,
    },


    awe: {
      description:
        'Breathless, reverent tone with widened pitch range and long, airy pauses. Soft but intense delivery as if witnessing something vast, beautiful, or beyond comprehension.',
      speed: 0.88,
      trailing_silence: 0.4,
    },

    shock: {
      description:
        'Sudden, sharp intake of breath followed by tense, clipped delivery. Uneven pacing with bursts of speech reflecting disbelief or surprise. Pitch jumps unpredictably, with urgency but not anger — emphasizing exclamation points naturally.',
      speed: 0.95,
      trailing_silence: 0.2,
    },

    scared: {
      description:
        'Slightly scared, uneasy tone — tense but trying to stay calm. Voice trembles subtly, breath a bit shallow, cautious pacing.',
      speed: 0.95,
    },

    scared_2: {
      description:
        'Scared, trembling voice with faster breathing and rising pitch. Nervous hesitations and rushed words reflect real fear.',
      speed: 1.05,
    },

    scared_3: {
      description:
        'Terrified, panicked tone with gasping between words. High-pitched, desperate voice with uneven rhythm — sounds like shouting to survive.',
      speed: 1.15,
    },

    disgusted: {
      description:
        'Slightly disgusted tone with mild tension and restrained annoyance. Short, clipped phrasing and quiet exhalation at sentence ends.',
      speed: 1.0,
    },

    disgusted_2: {
      description:
        'Clearly disgusted tone with nasal tension and sharper articulation. Audible scoffing or sighing between phrases, expressing strong disapproval.',
      speed: 0.95,
    },

    disgusted_3: {
      description:
        'Intensely disgusted tone with harsh, repelled resonance. Thick with contempt and audible recoil — drawn-out vowels and strong emphasis as if physically repulsed.',
      speed: 0.9,
    },

    sad: {
      description:
        'Slightly sad, soft and reflective tone. Mild melancholy, gentle downward inflection, calm breathing, and subtle emotional weight.',
      speed: 0.95,
    },

    sad_2: {
      description:
        'Sad tone with audible emotional weight; slower pace, longer pauses, gentle tremble, and subdued emphasis conveying quiet sorrow.',
      speed: 0.85,
    },

    sad_3: {
      description:
        'Deeply sad, grieving tone; trembling, low-pitched voice, long pauses, breathy delivery, and near-whispering through tears.',
      speed: 0.75,
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
      
      // Clean the base64 string (remove any data URL prefix if present)
      let cleanBase64 = audioBase64;
      if (audioBase64.includes(',')) {
        cleanBase64 = audioBase64.split(',')[1];
      }
      
      // Try different audio formats - MP3 should work for Hume TTS
      const audioFormats = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];
      
      for (const format of audioFormats) {
        try {
          const audioUri = `data:${format};base64,${cleanBase64}`;
          console.log(`Trying audio format: ${format}`);
          
          // Create and load the sound
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );

          console.log(`Audio sound created successfully with format: ${format}`);

          // Set up playback status monitoring
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              console.log('Audio chunk finished playing');
              this.isCurrentlyPlaying = false;
              sound.unloadAsync();
            }
          });

          this.isCurrentlyPlaying = true;
          console.log('Audio chunk started playing');
          return; // Success, exit the loop
        } catch (formatError) {
          console.log(`Failed with format ${format}:`, formatError);
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
        
        // Set up playback status monitoring
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            console.log('Audio chunk finished playing');
            this.isCurrentlyPlaying = false;
            sound.unloadAsync();
          }
        });

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
