import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useApp } from "@/contexts/AppContext";

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { history, settings } = useApp();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handleSpeak = (text: string, index: number) => {
    Speech.stop();
    Speech.speak(text, {
      rate: settings.rate,
      pitch: settings.pitch,
      onStart: () => setPlayingIndex(index),
      onDone: () => setPlayingIndex(null),
      onStopped: () => setPlayingIndex(null),
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      {/* Header */}
      <View style={styles.header} />

      {/* History List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="clock" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.historyItem,
                  {
                    backgroundColor:
                      Colors[colorScheme ?? "light"].background === "#fff"
                        ? "white"
                        : "#2D2D2D",
                  },
                  playingIndex === index && styles.playingItem,
                ]}
              >
                <TouchableOpacity
                  style={styles.historyTextContainer}
                  onPress={() => handleSpeak(item, index)}
                >
                  <Text
                    style={[
                      styles.historyText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.speakButton}
                  onPress={() => handleSpeak(item, index)}
                >
                  <IconSymbol
                    name="speaker.wave.2.fill"
                    size={16}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Info Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: Colors[colorScheme ?? "light"].background,
            borderTopColor: Colors[colorScheme ?? "light"].icon,
          },
        ]}
      >
        <Text style={styles.footerText}>Recent texts you've spoken</Text>
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
    backgroundColor: "#8B5CF6", // purple-500
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  playingItem: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F3E8FF",
  },
  historyTextContainer: {
    flex: 1,
  },
  historyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    height: 64,
    borderTopWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});
