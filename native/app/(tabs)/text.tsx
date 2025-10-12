import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useApp } from "@/contexts/AppContext";
import { humeTTS } from "@/services/HumeTTS";

type Emotion =
  | 'neutral'
  | 'angry'
  | 'angry_2'
  | 'angry_3'
  | 'happy'
  | 'happy_2'
  | 'happy_3'
  | 'enthusiastic_formal'
  | 'enthusiastic_formal_2'
  | 'enthusiastic_formal_3'
  | 'doubt'
  | 'funny_sarcastic'
  | 'anxious'
  | 'shy'
  | 'dont_care'
  | 'admire'
  | 'awe'
  | 'shock'
  | 'scared'
  | 'scared_2'
  | 'scared_3'
  | 'disgusted'
  | 'disgusted_2'
  | 'disgusted_3'
  | 'sad'
  | 'sad_2'
  | 'sad_3';


const emojis = [
  "😊", // enthusiasm for a job (formal)
  "🤪", // funny/sarcastic
  "🥳", // happy
  "😡", // angrys
  "😢", // sadly/depression
  "👩‍🎓", // neutral
  "🫠", // anxious
  "🤢", // awful
  "🙈", // shy
  "😑", // don't care
  "🤩", // admire
  "🥺", //awe
  "😱", //scared
  "😨", //shock
  "🤔", //doubt
];

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();
  const [text, setText] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const isSpeakingRef = useRef(false);

  // Presets provided by the user
  const EMOTION_PRESETS: Record<Emotion, { description: string; speed: number; trailing_silence?: number }> = {
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

  const parseSegments = (input: string): Array<{ emotion: Emotion; text: string }> => {
    console.log('parseSegments - input:', input);
    
    // Create a mapping from emojis to emotions
    const emojiToEmotion: Record<string, Emotion> = {
      "😊": "enthusiastic_formal",    // enthusiasm for a job (formal)
      "😊😊": "enthusiastic_formal_2",
      "😊😊😊": "enthusiastic_formal_3",
      "🤪": "funny_sarcastic",    // funny/sarcastic (matching emojis array)
      "🥳": "happy",    // happy
      "🥳🥳": "happy_2",    // happy
      "🥳🥳🥳": "happy_3",    // happy
      "😡": "angry",    // angry
      "😡😡": "angry_2",    // angry
      "😡😡😡": "angry_3",    // angry
      "😢": "sad",      // sadly/depression
      "😢😢": "sad_2",      // sadly/depression
      "😢😢😢": "sad_3",      // sadly/depression
      "👩‍🎓": "neutral",  // neutral (matching emojis array)
      "🤔": "doubt",    
      "🙈": "shy",    // shy (matching emojis array)
      "😑": "dont_care",  // don't care
      "🤩": "admire",      // admire
      "🥺": "awe",
      "😨": "shock",
      "😱": "scared",
      "😱😱": "scared_2",
      "😱😱😱": "scared_3",
      "🤢": "disgusted",
      "🤢🤢": "disgusted_2",
      "🤢🤢🤢": "disgusted_3",
      "🫠": "anxious"
    };

    const segments: Array<{ emotion: Emotion; text: string }> = [];
    let currentEmotion: Emotion = "neutral"; // Default emotion
    let currentText = "";

    // Use a regex that properly handles emojis - longer sequences first to avoid partial matches
    const emojiRegex = /(😊😊😊|😊😊|😊|🤪|🥳🥳🥳|🥳🥳|🥳|😡😡😡|😡😡|😡|😢😢😢|😢😢|😢|👩‍🎓|🤔|🙈|😑|🤩|🥺|😨|😱😱😱|😱😱|😱|🤢🤢🤢|🤢🤢|🤢|🫠)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = emojiRegex.exec(input)) !== null) {
      const emoji = match[0];
      const emojiIndex = match.index;
      
      // Add text before the emoji
      if (emojiIndex > lastIndex) {
        const textBefore = input.slice(lastIndex, emojiIndex).trim();
        if (textBefore) {
          currentText += textBefore;
        }
      }
      
      // If we have accumulated text, add it with the current emotion
      if (currentText.trim()) {
        segments.push({
          emotion: currentEmotion,
          text: currentText.trim()
        });
        currentText = "";
      }
      
      // Update the current emotion based on the emoji
      if (emojiToEmotion[emoji]) {
        currentEmotion = emojiToEmotion[emoji];
        console.log('parseSegments - matched emoji:', emoji, '-> emotion:', currentEmotion);
      }
      
      lastIndex = emojiIndex + emoji.length;
    }
    
    // Add any remaining text after the last emoji
    if (lastIndex < input.length) {
      const remainingText = input.slice(lastIndex).trim();
      if (remainingText) {
        currentText += remainingText;
      }
    }
    
    // Add any remaining text
    if (currentText.trim()) {
      segments.push({
        emotion: currentEmotion,
        text: currentText.trim()
      });
    }

    // If no segments were found, return the entire text as neutral
    if (segments.length === 0 && input.trim()) {
      segments.push({
        emotion: "neutral",
        text: input.trim()
      });
    }
    
    console.log('parseSegments - final segments:', segments);
    return segments;
  };


  const handlePlay = async () => {
    if (!text) return;

    addToHistory(text);

    // Check if Hume TTS is initialized
    if (!settings.humeApiKey) {
      Alert.alert('API Key Required', 'Please set your Hume API key in settings to use text-to-speech.');
      return;
    }

    const segments = parseSegments(text);
    
    // Send all segments as a single request with multiple utterances
    await speakMultipleSegments(segments);
  }

  const speakMultipleSegments = async (segments: Array<{ emotion: Emotion; text: string }>) => {
    try {
      // Set API key for Hume TTS
      humeTTS.setApiKey(settings.humeApiKey);

      // Build utterances array with emotion-specific settings
      const utterances = segments.map(seg => {
        const preset = EMOTION_PRESETS[seg.emotion] || EMOTION_PRESETS['neutral'];
        
        // Remove emojis from the text before sending to API
        const cleanText = seg.text.replace(/[🤩🤪🥳😡😢👩‍🎓🫠🤢🙈😑🥺🤔😨😱]/g, '').trim();
        
        const voiceName = settings.voice?.name || 'Ava Song';
        const isCustomVoice = settings.voice?.provider === 'CUSTOM_VOICE';
        
        return {
          text: cleanText,
          voice: { 
            name: voiceName,
            provider: isCustomVoice ? 'CUSTOM_VOICE' : 'HUME_AI'
          },
          description: preset.description,
          speed: preset.speed,
          trailing_silence: preset.trailing_silence,
        };
      });

      // Send single request with all utterances
      await humeTTS.speakMultiple(utterances);
    } catch (error) {
      console.error('Error in speakMultipleSegments:', error);
      throw error;
    }
  }
  const speakSegment = async (text: string, emotion: Emotion) => {
    console.log('speakSegment - text:', text, 'emotion:', emotion);
    const preset = EMOTION_PRESETS[emotion] || EMOTION_PRESETS['neutral'];
    console.log('speakSegment - preset:', preset);
    try {
      // Set API key for Hume TTS
      humeTTS.setApiKey(settings.humeApiKey);

      // Remove emojis from the text before sending to API
      const cleanText = text.replace(/[🤩🤪🥳😡😢👩‍🎓🫠🤢🙈😑🥺🤔😨😱]/g, '').trim();
      
      // Split text by newlines to get sentences
      const sentences = cleanText.split("\n").filter((s) => s.trim().length > 0);

      if (!settings.highlightSpokenText || sentences.length === 0) {
        // If highlighting is off or no sentences, just speak the whole text
        setIsPlaying(true);
        await humeTTS.speak(cleanText, {
          voice: settings.voice?.name || 'Ava Song',
          emotion: emotion,
          rate: preset.speed,
          pitch: settings.pitch,
          isCustomVoice: settings.voice?.provider === 'CUSTOM_VOICE',
          description: preset.description,
          trailing_silence: preset.trailing_silence,
        });
        setIsPlaying(false);
        setCurrentSentenceIndex(-1);
        return;
      }

      // Speak each sentence with highlighting
      setIsPlaying(true);
      isSpeakingRef.current = true;

      for (let i = 0; i < sentences.length; i++) {
        if (!isSpeakingRef.current) break;

        setCurrentSentenceIndex(i);
        await humeTTS.speak(sentences[i], {
          voice: settings.voice?.name || 'Ava Song',
          emotion: emotion,
          rate: preset.speed,
          pitch: settings.pitch,
          isCustomVoice: settings.voice?.provider === 'CUSTOM_VOICE',
          description: preset.description,
          trailing_silence: preset.trailing_silence,
        });
      }

      isSpeakingRef.current = false;
      setIsPlaying(false);
      setCurrentSentenceIndex(-1);
    } catch (error) {
      console.error('Error with Hume TTS:', error);
      Alert.alert('TTS Error', 'Failed to speak text. Please check your API key and try again.');
      setIsPlaying(false);
      setCurrentSentenceIndex(-1);
    }
  };

  const handlePause = () => {
    humeTTS.stop();
    isSpeakingRef.current = false;
    setIsPlaying(false);
    setCurrentSentenceIndex(-1);
  };

  const handleAddShortcut = () => {
    if (text) {
      addShortcut(text);
      Alert.alert("Shortcut Added", "Text added to shortcuts!");
    }
  };

  const handleEmojiPress = (emoji: string) => {
    setText((prev) => {
      const before = prev.slice(0, selection.start);
      const after = prev.slice(selection.end);
      const newText = before + emoji + after;
      const newPos = selection.start + emoji.length;
      setSelection({ start: newPos, end: newPos });
      return newText;
    });
  };


  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleClearText = () => {
    setText("");
    dismissKeyboard();
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header} />

        {/* Emoji Bar */}
        <View
          style={[
            styles.emojiBar,
            {
              backgroundColor: Colors[colorScheme ?? "light"].background,
              borderBottomColor: Colors[colorScheme ?? "light"].icon,
            },
          ]}
        >
          <EmojiBar onEmojiPress={handleEmojiPress} />
        </View>

        {/* Scrollable Content */}
        <TouchableWithoutFeedback 
          onPress={Platform.OS === 'web' ? undefined : dismissKeyboard}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Text Area */}
            <View style={styles.textArea}>
              {settings.highlightSpokenText &&
              isPlaying &&
              currentSentenceIndex >= 0 ? (
                <View style={styles.highlightContainer}>
                  <ScrollView>
                    {text.split("\n").map((sentence, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.highlightedSentence,
                          {
                            color:
                              index === currentSentenceIndex
                                ? "#000000"
                                : Colors[colorScheme ?? "light"].text,
                          },
                          index === currentSentenceIndex &&
                            styles.activeSentence,
                        ]}
                      >
                        {sentence}
                        {index < text.split("\n").length - 1 && "\n"}
                      </Text>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.editOverlay}
                    onPress={() => {
                      handlePause();
                    }}
                  >
                    <Text style={styles.editOverlayText}>Tap to edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Start typing..."
                  placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                  style={[
                    styles.textInput,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                  multiline
                  textAlignVertical="top"
                  autoFocus={false}
                  autoCorrect={true}
                  autoCapitalize="sentences"
                  spellCheck={true}
                  selection={selection}
                  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                />
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Controls */}
        <View
          style={[
            styles.controls,
            {
              backgroundColor: Colors[colorScheme ?? "light"].background,
              borderTopColor: Colors[colorScheme ?? "light"].icon,
            },
          ]}
        >
          {/* Left side - empty for keyboard dismissal */}
          <View style={styles.controlsLeft} />

          {/* Center - main control buttons */}
          <View style={styles.controlsCenter}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                (!text || isPlaying) && styles.disabledButton,
              ]}
              onPress={handlePlay}
              disabled={!text || isPlaying}
            >
              <IconSymbol name="play.fill" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isPlaying && styles.disabledButton,
              ]}
              onPress={handlePause}
              disabled={!isPlaying}
            >
              <IconSymbol name="pause.fill" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.addButton,
                !text && styles.disabledButton,
              ]}
              onPress={handleAddShortcut}
              disabled={!text}
            >
              <IconSymbol name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Right side - Clear button */}
          <View style={styles.controlsRight}>
            <TouchableOpacity
              style={[styles.clearButton, !text && styles.disabledButton]}
              onPress={handleClearText}
              disabled={!text}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Emoji Bar Component
interface EmojiBarProps {
  onEmojiPress: (emoji: string) => void;
}

function EmojiBar({ onEmojiPress }: EmojiBarProps) {
  const colorScheme = useColorScheme();

  // Split emojis into two rows
  const midIndex = Math.ceil(emojis.length / 2);
  const row1 = emojis.slice(0, midIndex);
  const row2 = emojis.slice(midIndex);


return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.emojiScrollContainer}
    >
      <View>
        {/* First Row */}
        <View style={styles.emojiRow}>
          {row1.map((emoji: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.emojiButton,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].background === "#fff"
                      ? "white"
                      : "#2D2D2D",
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onEmojiPress(emoji);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Second Row */}
        <View style={styles.emojiRowOffset}>
          {row2.map((emoji: string, idx: number) => (
            <TouchableOpacity
              key={idx + 6}
              style={[
                styles.emojiButton,
                {
                  backgroundColor:
                    Colors[colorScheme ?? "light"].background === "#fff"
                      ? "white"
                      : "#2D2D2D",
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onEmojiPress(emoji);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    backgroundColor: "#3B82F6", // blue-500
  },
  emojiBar: {
    height: 130,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  emojiContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // consistent space between emojis
    marginBottom: 8,
  },
  emojiRowOffset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 24, // optional indent to slightly offset the second row
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiText: {
    fontSize: 28,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  textArea: {
    flex: 1,
    padding: 16,
    minHeight: 200,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  highlightedText: {
    backgroundColor: "#FEF3C7",
  },
  highlightContainer: {
    flex: 1,
    position: "relative",
  },
  highlightedSentence: {
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 4,
  },
  activeSentence: {
    backgroundColor: "#FEF3C7",
    fontWeight: "600",
  },
  editOverlay: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  controls: {
    height: 56,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  controlsLeft: {
    flex: 1,
  },
  controlsCenter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  controlsRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#10B981",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
    minHeight: 40,
  },
  clearButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emojiScrollContainer: {
  flexDirection: "row",
  paddingHorizontal: 8,
  },
});
