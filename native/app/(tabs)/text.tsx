import React, { useEffect, useMemo, useRef, useState } from "react";
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
import * as Speech from "expo-speech";

// ---- Emotion mapping (real emojis only)
type Emotion =
  | "neutral" | "happy" | "sad" | "angry" | "doubt"
  | "enthusiastic_formal" | "funny_sarcastic" | "anxious"
  | "disgusted" | "shy" | "dont_care" | "admire" | "depressed";

const EMOJI_TO_EMOTION: Record<string, Emotion> = {
  "🤩": "happy", "🤣": "happy", "🥳": "happy",
  "😡": "angry",
  "😢": "sad", "🤢": "sad",
  "🙂": "neutral", "😑": "neutral",
  "🫠": "doubt", "🫣": "doubt", "🥺": "doubt",
};

const PRESETS: Record<Emotion, { speed: number; description: string; trailing_silence?: number }> = {
  neutral: { speed: 1.0, description: "Calm, balanced, neutral delivery." },
  happy: { speed: 1.05, description: "Warm, upbeat, bright tone.", trailing_silence: 0.06 },
  sad: { speed: 0.97, description: "Soft, slow, melancholic timbre.", trailing_silence: 0.06 },
  angry: { speed: 1.03, description: "Intense, clipped, energetic.", trailing_silence: 0.03 },
  doubt: { speed: 0.99, description: "Hesitant, cautious tone.", trailing_silence: 0.04 },
  enthusiastic_formal: { speed: 1.05, description: "Enthusiastic but formal." },
  funny_sarcastic: { speed: 1.02, description: "Light, witty, sarcastic undertone." },
  anxious: { speed: 1.0, description: "Tense, slightly breathy." },
  disgusted: { speed: 1.0, description: "Repulsed tone." },
  shy: { speed: 0.98, description: "Soft and reserved." },
  dont_care: { speed: 1.0, description: "Flat, low involvement." },
  admire: { speed: 1.02, description: "Warm awe and appreciation." },
  depressed: { speed: 0.95, description: "Low energy, heavy tone." },
};

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+/gu;

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors] || Colors.light;
  const { addToHistory, addShortcut, settings } = useApp();

  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // Refs to orchestrate flow
  const isHumeReadyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const lastReadLineIndexRef = useRef(-1); // the last line index we have spoken
  const currentEmotionRef = useRef<Emotion>("neutral");

  useEffect(() => {
    if (settings.humeApiKey) {
      humeTTS.setApiKey(settings.humeApiKey);
      isHumeReadyRef.current = true;
    } else {
      isHumeReadyRef.current = false;
    }
  }, [settings.humeApiKey]);

  // ---------- helpers
  const splitLines = (t: string) => t.split(/\r?\n/);

  const detectEmotionFromLineEnd = (line: string): Emotion => {
    const m = line.match(/([\p{Emoji_Presentation}\p{Emoji}\uFE0F]+)\s*$/u);
    if (!m) return currentEmotionRef.current;
    const emojiCluster = m[1];
    const first = [...emojiCluster][0] || "";
    return EMOJI_TO_EMOTION[first] || currentEmotionRef.current;
  };

  const stripTrailingEmojis = (line: string) => line.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+\s*$/u, "").trim();

  const speakChunk = async (chunk: string, emotion: Emotion) => {
    if (!chunk.trim()) return;
    const preset = PRESETS[emotion] || PRESETS.neutral;
    try {
      await humeTTS.speak(chunk, {
        voice: settings.voice?.name || "Ava Song",
        rate: preset.speed,
        pitch: settings.pitch,
        isCustomVoice: settings.voice?.provider === "CUSTOM_VOICE",
        emotion,
        description: preset.description,
        trailing_silence: preset.trailing_silence,
      });
      while (humeTTS.isSpeaking()) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch {
      // fallback keeps UX flowing
      Speech.speak(chunk);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, Math.max(450, chunk.length * 50)));
    }
  };

  const speakLine = async (rawLine: string) => {
    if (!isHumeReadyRef.current) {
      Alert.alert("API Key Required", "Please set your Hume API key in settings to use text-to-speech.");
      return;
    }
    const emotion = detectEmotionFromLineEnd(rawLine);
    currentEmotionRef.current = emotion; // set emotion for this & following lines unless changed
    const lineToSpeak = stripTrailingEmojis(rawLine);
    if (!lineToSpeak) return;

    addToHistory(lineToSpeak);
    isSpeakingRef.current = true;
    setIsPlaying(true);
    await speakChunk(lineToSpeak, emotion);
    isSpeakingRef.current = false;
    setIsPlaying(false);
  };

  // ---------- auto speak on newline: speak the last completed non-empty line
  const onChangeText = (value: string) => {
    const wasTrailingNewline = /\n$/.test(value);
    setText(value);

    if (wasTrailingNewline && !isSpeakingRef.current && isHumeReadyRef.current) {
      // determine the last completed line index
      const lines = splitLines(value);
      // if text ends with newline, last element from split will be "", so last completed is length-2
      let idx = lines.length - 2;
      while (idx >= 0 && lines[idx].trim() === "") idx--;

      if (idx >= 0) {
        const lineToRead = lines[idx];
        // advance our pointer BEFORE speaking so play doesn't re-read
        lastReadLineIndexRef.current = idx;

        // keep caret at end (prevents jumpiness)
        requestAnimationFrame(() => {
          const pos = value.length;
          setSelection({ start: pos, end: pos });
        });

        // speak only that line
        (async () => {
          await speakLine(lineToRead);
        })();
      }
    }
  };

  const onSelectionChange = (e: any) => {
    const sel = e.nativeEvent.selection || { start: text.length, end: text.length };
    setSelection(sel);
  };

  // ---------- Play button: speak remaining lines from lastReadLineIndex+1
  const handlePlayAll = async () => {
    if (!isHumeReadyRef.current || isSpeakingRef.current) return;

    const lines = splitLines(text);
    let start = lastReadLineIndexRef.current + 1;

    // if nothing left, start over from 0
    let anySpoken = false;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        // skip blanks but still move the pointer past them
        lastReadLineIndexRef.current = i;
        continue;
      }
      await speakLine(lines[i]); // pass raw (with possible emoji)
      lastReadLineIndexRef.current = i;
      anySpoken = true;
    }

    if (!anySpoken) {
      // restart from the top
      lastReadLineIndexRef.current = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          lastReadLineIndexRef.current = i;
          continue;
        }
        await speakLine(lines[i]);
        lastReadLineIndexRef.current = i;
      }
    }
  };

  const handlePause = () => {
    try {
      humeTTS.stop();
    } finally {
      isSpeakingRef.current = false;
      setIsPlaying(false);
      // keep lastReadLineIndexRef so Play resumes correctly
    }
  };

  const handleAddShortcut = () => {
    if (!text) return;
    addShortcut(text);
    Alert.alert("Shortcut Added", "Text added to shortcuts!");
  };

  const handleEmojiPress = (emoji: string) => {
    const next = text + (text.endsWith(" ") || text.endsWith("\n") ? "" : " ") + emoji + " ";
    setText(next);
    requestAnimationFrame(() => {
      const pos = next.length;
      setSelection({ start: pos, end: pos });
    });
    // Note: emotion is picked up when pressing Play or when you end a line with Enter
  };

  const handleClear = () => {
    setText("");
    lastReadLineIndexRef.current = -1;
    currentEmotionRef.current = "neutral";
    Keyboard.dismiss();
    setSelection({ start: 0, end: 0 });
  };

  const displayLines = useMemo(() => splitLines(text), [text]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header} />
          <View style={[styles.emojiBar, { backgroundColor: colors.background, borderBottomColor: colors.icon }]}>
            <EmojiBar onEmojiPress={handleEmojiPress} />
          </View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.textArea}>
              <TextInput
                value={text}
                onChangeText={onChangeText}
                selection={selection}
                onSelectionChange={onSelectionChange}
                placeholder="Type lines. Press Enter to speak that line. Add emojis at the end to set tone."
                placeholderTextColor={colors.icon}
                style={[styles.textInput, { color: colors.text }]}
                multiline
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>
          </ScrollView>

          <View style={[styles.controls, { backgroundColor: colors.background, borderTopColor: colors.icon }]}>
            <View style={styles.controlsLeft} />
            <View style={styles.controlsCenter}>
              <TouchableOpacity
                style={[styles.controlButton, (!text || isPlaying) && styles.disabledButton]}
                onPress={handlePlayAll}
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
                onPress={handleClear}
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

// ---- Emoji bar (unchanged visual)
interface EmojiBarProps { onEmojiPress: (emoji: string) => void; }
function EmojiBar({ onEmojiPress }: EmojiBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors] || Colors.light;
  const emojis = ["🤩", "🤣", "🥳", "😡", "😢", "🤢", "🙂", "😑", "🫠", "🫣", "🥺"];
  const row1 = emojis.slice(0, 6), row2 = emojis.slice(6);
  return (
    <View style={styles.emojiContainer}>
      <View style={styles.emojiRow}>
        {row1.map((emoji, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.emojiButton, { backgroundColor: colors.background === "#fff" ? "white" : "#2D2D2D" }]}
            onPress={(e: any) => { e.stopPropagation(); onEmojiPress(emoji); }}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.emojiRowOffset}>
        {row2.map((emoji, idx) => (
          <TouchableOpacity
            key={idx + 6}
            style={[styles.emojiButton, { backgroundColor: colors.background === "#fff" ? "white" : "#2D2D2D" }]}
            onPress={(e: any) => { e.stopPropagation(); onEmojiPress(emoji); }}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ---- styles (same look as before)
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, backgroundColor: "#3B82F6" },
  emojiBar: { height: 130, borderBottomWidth: 1, paddingBottom: 12 },
  emojiContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 4, paddingTop: 8 },
  emojiRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginBottom: 8 },
  emojiRowOffset: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: "10%" },
  emojiButton: {
    width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  emojiText: { fontSize: 28 },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  textArea: { flex: 1, padding: 16, minHeight: 200 },
  textInput: { flex: 1, fontSize: 16, lineHeight: 24, textAlignVertical: "top" },
  controls: { height: 56, borderTopWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  controlsLeft: { flex: 1 },
  controlsCenter: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  controlsRight: { flex: 1, alignItems: "flex-end" },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center" },
  addButton: { backgroundColor: "#10B981" },
  disabledButton: { backgroundColor: "#D1D5DB" },
  clearButton: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: "#EF4444",
    justifyContent: "center", alignItems: "center", minWidth: 80, minHeight: 40,
  },
  clearButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
