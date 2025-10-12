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

type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'doubt';

const emojis = [
  "🤩", // enthusiasm for a job (formal)
  "🤣", // funny/sarcastic
  "🥳", // happy
  "😡", // angry
  "😢", // sadly/depression
  "🙂", // neutral
  "🫠", // anxious
  "🤢", // awful
  "🫣", // shy
  "😑", // don't care
  "🥺", // admire
];

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const isSpeakingRef = useRef(false);

  // Presets provided by the user
  const EMOTION_PRESETS: Record<Emotion, { description: string; speed: number; trailing_silence?: number }> = {
    neutral: {
      description:
        'Neutral voice with smooth prosody. The speaker sounds calm, balanced, and sonically neutral. Use this preset when you want a simple, clear read without emotional color.',
      speed: 1.0,
    },
    happy: {
      description:
        'A warm, upbeat voice conveying happiness: bright tone, slightly faster tempo, and positive intonation. Use for cheerful messages and friendly prompts.',
      speed: 1.05,
      trailing_silence: 0.06,
    },
    sad: {
      description:
        'A soft, lower-volume voice with slower tempo and a melancholic timbre. Use subtle breathiness and elongated vowels to convey sadness.',
      speed: 0.97,
      trailing_silence: 0.06,
    },
    angry: {
      description:
        'An intense, clipped delivery with higher energy and sharper consonants. Higher pitch variability and slightly faster speed to convey frustration or anger.',
      speed: 1.03,
      trailing_silence: 0.03,
    },
    doubt: {
      description:
        'A questioning, cautious tone with small hesitations and a tentative upward inflection at the end of phrases. Use slight pauses between clauses and a subtle breathy quality.',
      speed: 0.99,
      trailing_silence: 0.04,
    },
  };

  const parseSegments = (input: string): Array<{ emotion: Emotion; text: string }> => {
    // Create a mapping from emojis to emotions
    const emojiToEmotion: Record<string, Emotion> = {
      "🤩": "happy",    // enthusiasm for a job (formal)
      "🤣": "happy",    // funny/sarcastic
      "🥳": "happy",    // happy
      "😡": "angry",    // angry
      "😢": "sad",      // sadly/depression
      "🙂": "neutral",  // neutral
      "🫠": "doubt",    // anxious
      "🤢": "angry",    // awful
      "🫣": "doubt",    // shy
      "😑": "neutral",  // don't care
      "🥺": "sad",      // admire
    };

    const segments: Array<{ emotion: Emotion; text: string }> = [];
    let currentEmotion: Emotion = "neutral"; // Default emotion
    let currentText = "";

    // Use a regex that properly handles emojis
    const emojiRegex = /(🤩|🤣|🥳|😡|😢|🙂|🫠|🤢|🫣|😑|🥺)/g;
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
        const cleanText = seg.text.replace(/[🤩🤣🥳😡😢🙂🫠🤢🫣😑🥺]/g, '').trim();
        
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
      const cleanText = text.replace(/[🤩🤣🥳😡😢🙂🫠🤢🫣😑🥺]/g, '').trim();
      
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
    setText((prev) => prev + emoji);
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
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
                />
              )}
            </View>
          </ScrollView>

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
      </TouchableWithoutFeedback>
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
  const row1 = emojis.slice(0, 6);
  const row2 = emojis.slice(6);

  return (
    <View style={styles.emojiContainer}>
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
      {/* Second Row - Offset */}
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
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 8,
  },
  emojiRowOffset: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: "10%",
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
});
