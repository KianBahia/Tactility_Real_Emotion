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
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Start typing..."
                placeholderTextColor={Colors[colorScheme ?? "light"].icon}
                style={[
                  styles.textInput,
                  { color: Colors[colorScheme ?? "light"].text },
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.emojiScrollView}
      contentContainerStyle={styles.emojiContainer}
      keyboardShouldPersistTaps="always"
    >
      {emojis.map((emoji, idx) => (
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
    height: 60,
    borderBottomWidth: 1,
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
