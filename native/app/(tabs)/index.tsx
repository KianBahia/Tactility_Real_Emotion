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
} from "react-native";
import * as Speech from "expo-speech";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useApp } from "@/contexts/AppContext";

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");

  const handlePlay = () => {
    if (!text) return;

    addToHistory(text);

    Speech.speak(text, {
      rate: settings.rate,
      pitch: settings.pitch,
      onStart: () => setIsPlaying(true),
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
    });
  };

  const handlePause = () => {
    Speech.stop();
    setIsPlaying(false);
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

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>💬</Text>
          <Text style={styles.headerTitle}>Text</Text>
        </View>
      </View>

      {/* Emoji Bar */}
      <View style={styles.emojiBar}>
        <EmojiBar onEmojiPress={handleEmojiPress} />
      </View>

      {/* Text Area */}
      <View style={styles.textArea}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Start typing..."
          style={[
            styles.textInput,
            settings.highlightSpokenText && highlightedText
              ? styles.highlightedText
              : null,
          ]}
          multiline
          textAlignVertical="top"
          autoFocus={false}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
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
          style={[styles.controlButton, !isPlaying && styles.disabledButton]}
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
    </KeyboardAvoidingView>
  );
}

// Emoji Bar Component
interface EmojiBarProps {
  onEmojiPress: (emoji: string) => void;
}

function EmojiBar({ onEmojiPress }: EmojiBarProps) {
  const emojis = [
    "😊",
    "😢",
    "😠",
    "😐",
    "😂",
    "🙏",
    "❤️",
    "👍",
    "👎",
    "🎉",
    "🔥",
    "💯",
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.emojiScrollView}
      contentContainerStyle={styles.emojiContainer}
    >
      {emojis.map((emoji, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.emojiButton}
          onPress={() => onEmojiPress(emoji)}
        >
          <Text style={styles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
      ))}
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
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  emojiBar: {
    height: 60,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },
  emojiScrollView: {
    flex: 1,
  },
  emojiContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emojiButton: {
    width: 44,
    height: 44,
    backgroundColor: "white",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiText: {
    fontSize: 20,
  },
  textArea: {
    flex: 1,
    padding: 16,
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
  controls: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
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
});
