import React, { useRef, useState } from "react";
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

type Emotion = "neutral" | "happy" | "sad" | "angry" | "doubt";

// --- Your exact presets (kept verbatim) ---
const MOTION_PRESETS: Record<
  Emotion,
  { description: string; speed: number; trailing_silence?: number }
> = {
  neutral: {
    description:
      "Neutral voice with smooth prosody. The speaker sounds calm, balanced, and sonically neutral. Use this preset when you want a simple, clear read without emotional color.",
    speed: 1.0,
  },
  happy: {
    description:
      "A warm, upbeat voice conveying happiness: bright tone, slightly faster tempo, and positive intonation. Use for cheerful messages and friendly prompts.",
    speed: 1.05,
    trailing_silence: 0.06,
  },
  sad: {
    description:
      "A soft, lower-volume voice with slower tempo and a melancholic timbre. Use subtle breathiness and elongated vowels to convey sadness.",
    speed: 0.97,
    trailing_silence: 0.06,
  },
  angry: {
    description:
      "An intense, clipped delivery with higher energy and sharper consonants. Higher pitch variability and slightly faster speed to convey frustration or anger.",
    speed: 1.03,
    trailing_silence: 0.03,
  },
  doubt: {
    description:
      "A questioning, cautious tone with small hesitations and a tentative upward inflection at the end of phrases. Use slight pauses between clauses and a subtle breathy quality.",
    speed: 0.99,
    trailing_silence: 0.04,
  },
};

// --- Emoji → your 5 emotions ---
const EMOJI_TO_EMOTION: Record<string, Emotion> = {
  "🤩": "happy",
  "🤣": "happy",
  "🥳": "happy",
  "😡": "angry",
  "😢": "sad",
  "🙂": "neutral",
  "🫠": "doubt",
  "🤢": "angry",
  "🫣": "doubt",
  "😑": "neutral",
  "🥺": "sad",
};

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+/u;

const emojis = [
  "🤩",
  "🤣",
  "🥳",
  "😡",
  "😢",
  "🙂",
  "🫠",
  "🤢",
  "🫣",
  "😑",
  "🥺",
];

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();

  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);

  const isSpeakingRef = useRef(false);
  const prevTextRef = useRef(text);
  const selectionRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // ----- Helpers -----

  // Detect single newline insertion and return its index in the *new* text.
  const detectInsertedNewlineIndex = (prev: string, next: string): number | null => {
    if (next.length !== prev.length + 1) return null;

    // find first mismatch
    let i = 0;
    const min = Math.min(prev.length, next.length);
    while (i < min && prev[i] === next[i]) i++;

    // we expect exactly one extra char at i in next
    if (next[i] === "\n" && prev.slice(i) === next.slice(i + 1)) {
      return i;
    }
    return null;
  };

  // Extract a line (without the trailing newline) that ends at newlineIndex
  const extractLineBeforeNewline = (src: string, newlineIndex: number): string => {
    const start = src.lastIndexOf("\n", newlineIndex - 1) + 1; // -1 => returns -1, so +1 makes 0
    const end = newlineIndex; // not inclusive
    return src.slice(start, end);
  };

  // Detect emotion from emoji(s) anywhere in the line (beginning or end)
  const detectEmotionFromLine = (line: string): Emotion => {
    // Remove any leading/trailing whitespace first
    const trimmedLine = line.trim();
    
    console.log('detectEmotionFromLine input:', JSON.stringify(trimmedLine));
    
    // Look for emojis at the end of the line first
    let emojiPattern = new RegExp(`(${emojis.join('|')})\\s*$`, 'u');
    let m = trimmedLine.match(emojiPattern);
    
    // If no emoji at end, look for emoji at the beginning
    if (!m) {
      emojiPattern = new RegExp(`^\\s*(${emojis.join('|')})`, 'u');
      m = trimmedLine.match(emojiPattern);
    }
    
    if (!m) {
      console.log('No matching emoji found, returning neutral');
      return "neutral";
    }
    
    const foundEmoji = m[1];
    const emotion = EMOJI_TO_EMOTION[foundEmoji] ?? "neutral";
    
    console.log('Emoji detection result:');
    console.log('- Found emoji:', JSON.stringify(foundEmoji));
    console.log('- Mapped emotion:', emotion);
    
    return emotion;
  };

  // Strip emojis from both beginning and end (so they are not spoken)
  const stripEmojis = (line: string): string => {
    let cleaned = line;
    
    // Remove emojis from end
    const endPattern = new RegExp(`(${emojis.join('|')})\\s*$`, 'gu');
    cleaned = cleaned.replace(endPattern, "");
    
    // Remove emojis from beginning
    const startPattern = new RegExp(`^\\s*(${emojis.join('|')})\\s*`, 'gu');
    cleaned = cleaned.replace(startPattern, "");
    
    return cleaned.trim();
  };

  const speakChunk = async (chunk: string, emotion: Emotion) => {
    if (!chunk.trim()) return;

    if (!settings.humeApiKey) {
      Alert.alert("API Key Required", "Please set your Hume API key in settings to use text-to-speech.");
      return;
    }

    const preset = MOTION_PRESETS[emotion] || MOTION_PRESETS.neutral;

    console.log('Speaking chunk:');
    console.log('- Text:', JSON.stringify(chunk));
    console.log('- Emotion:', emotion);
    console.log('- Preset speed:', preset.speed);

    try {
      humeTTS.setApiKey(settings.humeApiKey);
      isSpeakingRef.current = true;
      setIsPlaying(true);

      await humeTTS.speak(chunk, {
        voice: settings.voice?.name || "Ava Song",
        emotion,
        rate: preset.speed,
        pitch: settings.pitch,
        isCustomVoice: settings.voice?.provider === "CUSTOM_VOICE",
        description: preset.description,
        trailing_silence: preset.trailing_silence,
      });

      // wait until done
      while (humeTTS.isSpeaking()) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      console.error("speakChunk error:", e);
    } finally {
      isSpeakingRef.current = false;
      setIsPlaying(false);
    }
  };

  // Speak all lines in the editor (applies emoji → emotion per line)
  const speakAll = async () => {
    if (!text.trim()) return;
    addToHistory(text);

    // split by newline; ignore empty lines
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    console.log('Speaking all lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      console.log(`Processing line ${i}:`, JSON.stringify(lines[i]));
      setCurrentSentenceIndex(i);
      const emotion = detectEmotionFromLine(lines[i]);
      const cleanLine = stripEmojis(lines[i]);
      if (cleanLine) {
        await speakChunk(cleanLine, emotion);
      }
    }

    setCurrentSentenceIndex(-1);
  };

  // Called whenever user types and a single newline was inserted anywhere
  const handleNewlineInserted = async (nextText: string, nlIndex: number) => {
    console.log('handleNewlineInserted called:');
    console.log('- Next text:', JSON.stringify(nextText));
    console.log('- Newline index:', nlIndex);
    
    // Extract the just-completed line (text before the inserted newline)
    const fullLine = extractLineBeforeNewline(nextText, nlIndex);
    console.log('- Extracted full line:', JSON.stringify(fullLine));
    
    const cleanLine = stripEmojis(fullLine);
    console.log('- Clean line:', JSON.stringify(cleanLine));
    
    if (!cleanLine) {
      console.log('No clean text to speak, returning');
      return;
    }

    const emotion = detectEmotionFromLine(fullLine);
    console.log('- Final emotion for speaking:', emotion);

    await speakChunk(cleanLine, emotion);
  };

  // ----- Event handlers -----

  const onChangeText = (value: string) => {
    const prev = prevTextRef.current;
    
    console.log('=== onChangeText ===');
    console.log('Previous:', JSON.stringify(prev));
    console.log('New:', JSON.stringify(value));
    
    prevTextRef.current = value;

    // always update UI first
    setText(value);

    // If exactly 1 newline inserted, speak the line that ended at that newline
    const nlIndex = detectInsertedNewlineIndex(prev, value);
    console.log('Detected newline index:', nlIndex);
    
    if (nlIndex !== null) {
      // Defer to next frame so selection/caret stays stable
      requestAnimationFrame(() => {
        handleNewlineInserted(value, nlIndex);
      });
    }
  };

  const onSelectionChange = (e: any) => {
    selectionRef.current = e?.nativeEvent?.selection || { start: 0, end: 0 };
  };

  const handlePause = () => {
    try {
      humeTTS.stop();
    } finally {
      isSpeakingRef.current = false;
      setIsPlaying(false);
      setCurrentSentenceIndex(-1);
    }
  };

  const handleAddShortcut = () => {
    if (!text) return;
    addShortcut(text);
    Alert.alert("Shortcut Added", "Text added to shortcuts!");
  };

  const handleEmojiPress = (emoji: string) => {
    console.log('Emoji button pressed:', emoji);
    
    // Insert emoji at caret position; do not auto-speak until user hits Enter
    const sel = selectionRef.current || { start: text.length, end: text.length };
    const before = text.slice(0, sel.start);
    const after = text.slice(sel.end);
    const withSpaces =
      (before.endsWith(" ") ? before : before + " ") +
      emoji +
      (after.startsWith(" ") ? "" : " ") +
      after;

    console.log('Text after emoji insertion:', JSON.stringify(withSpaces));

    prevTextRef.current = withSpaces;
    setText(withSpaces);

    // Move caret to just after the inserted emoji + trailing space
    requestAnimationFrame(() => {
      const newPos = (before.endsWith(" ") ? before.length : before.length + 1) + [...emoji].length + 1;
      selectionRef.current = { start: newPos, end: newPos };
    });
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClearText = () => {
    setText("");
    prevTextRef.current = "";
    setCurrentSentenceIndex(-1);
    dismissKeyboard();
  };

  // ----- UI -----

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header */}
          <View className="header" style={styles.header} />

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
              {isPlaying && currentSentenceIndex >= 0 ? (
                <View style={styles.highlightContainer}>
                  <ScrollView>
                    {text
                      .split("\n")
                      .filter((s) => s.length > 0)
                      .map((sentence, index) => (
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
                            index === currentSentenceIndex && styles.activeSentence,
                          ]}
                        >
                          {sentence}
                          {index < text.split("\n").length - 1 && "\n"}
                        </Text>
                      ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.editOverlay} onPress={handlePause}>
                    <Text style={styles.editOverlayText}>Tap to edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  value={text}
                  onChangeText={onChangeText}
                  onSelectionChange={onSelectionChange}
                  placeholder="Type a line and press Enter (↵) to speak it. Add emojis at the beginning or end to set tone."
                  placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                  style={[styles.textInput, { color: Colors[colorScheme ?? "light"].text }]}
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
            <View style={styles.controlsLeft} />
            <View style={styles.controlsCenter}>
              <TouchableOpacity
                style={[styles.controlButton, (!text || isPlaying) && styles.disabledButton]}
                onPress={speakAll}
                disabled={!text || isPlaying}
              >
                <IconSymbol name="play.fill" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, !isPlaying && styles.disabledButton]}
                onPress={handlePause}
                disabled={!isPlaying}
              >
                <IconSymbol name="pause.fill" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.addButton, !text && styles.disabledButton]}
                onPress={handleAddShortcut}
                disabled={!text}
              >
                <IconSymbol name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>

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

  const row1 = emojis.slice(0, 6);
  const row2 = emojis.slice(6);

  return (
    <View style={styles.emojiContainer}>
      {/* First Row */}
      <View style={styles.emojiRow}>
        {row1.map((emoji, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.emojiButton,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff" ? "white" : "#2D2D2D",
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
        {row2.map((emoji, idx) => (
          <TouchableOpacity
            key={idx + 6}
            style={[
              styles.emojiButton,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff" ? "white" : "#2D2D2D",
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
  container: { flex: 1 },
  header: { height: 80, backgroundColor: "#3B82F6" },
  emojiBar: { height: 130, borderBottomWidth: 1, paddingBottom: 12 },
  emojiContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 4, paddingTop: 8 },
  emojiRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginBottom: 8 },
  emojiRowOffset: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: "10%" },
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
  emojiText: { fontSize: 28 },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  textArea: { flex: 1, padding: 16, minHeight: 200 },
  textInput: { flex: 1, fontSize: 16, lineHeight: 24, textAlignVertical: "top" },
  highlightedText: { backgroundColor: "#FEF3C7" },
  highlightContainer: { flex: 1, position: "relative" },
  highlightedSentence: { fontSize: 16, lineHeight: 24, paddingVertical: 4 },
  activeSentence: { backgroundColor: "#FEF3C7", fontWeight: "600" },
  editOverlay: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editOverlayText: { color: "white", fontSize: 12, fontWeight: "600" },
  controls: { height: 56, borderTopWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  controlsLeft: { flex: 1 },
  controlsCenter: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  controlsRight: { flex: 1, alignItems: "flex-end" },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center" },
  addButton: { backgroundColor: "#10B981" },
  disabledButton: { backgroundColor: "#D1D5DB" },
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
  clearButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});