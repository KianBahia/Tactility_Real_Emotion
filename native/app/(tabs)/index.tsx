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

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>

          {/* Controls */}
          <View style={styles.controls}>
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
  controls: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
