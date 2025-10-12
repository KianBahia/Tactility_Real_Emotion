import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useApp } from "@/contexts/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { humeTTS } from "@/services/HumeTTS";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const { history, settings, clearHistory, deleteHistory } = useApp();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isHumeInitialized, setIsHumeInitialized] = useState(false);

  // Initialize Hume TTS when API key is available
  useEffect(() => {
    if (settings.humeApiKey) {
      humeTTS.setApiKey(settings.humeApiKey);
      setIsHumeInitialized(true);
    } else {
      setIsHumeInitialized(false);
    }
  }, [settings.humeApiKey]);

  const handleSpeak = async (text: string, index: number) => {
    if (!isHumeInitialized) {
      Alert.alert(
        "API Key Required",
        "Please set your Hume API key in settings to use text-to-speech."
      );
      return;
    }

    try {
      await humeTTS.speak(text, {
        rate: settings.rate,
        pitch: settings.pitch,
        voice: settings.voice?.name || "Ava Song",
        isCustomVoice: settings.voice?.provider === "CUSTOM_VOICE",
      });
      setPlayingIndex(index);

      // Monitor speech status
      const checkStatus = setInterval(() => {
        if (!humeTTS.isSpeaking()) {
          setPlayingIndex(null);
          clearInterval(checkStatus);
        }
      }, 100);
    } catch (error) {
      console.error("Speech error:", error);
      Alert.alert(
        "Speech Error",
        "Failed to speak text. Please check your API key and try again."
      );
      setPlayingIndex(null);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => clearHistory(),
        },
      ]
    );
  };

  const handleDeleteHistory = (index: number) => {
    Alert.alert(
      "Delete History Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHistory(index),
        },
      ]
    );
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

      {/* Clear History Button */}
      {history.length > 0 && (
        <View
          style={[
            styles.clearButtonContainer,
            { backgroundColor: Colors[colorScheme ?? "light"].background },
          ]}
        >
          <TouchableOpacity
            style={styles.clearHistoryButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.clearHistoryButtonText}>Clear All History</Text>
          </TouchableOpacity>
        </View>
      )}

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
                <View style={styles.historyActions}>
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
                  <TouchableOpacity
                    style={[styles.speakButton, styles.deleteButton]}
                    onPress={() => handleDeleteHistory(index)}
                  >
                    <IconSymbol name="trash.fill" size={16} color="white" />
                  </TouchableOpacity>
                </View>
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
        <Text
          style={[
            styles.footerText,
            { color: Colors[colorScheme ?? "light"].icon },
          ]}
        >
          Recent texts you've spoken
        </Text>
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
  clearButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  clearHistoryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clearHistoryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  },
  playingItem: {
    borderColor: "#8B5CF6",
  },
  historyTextContainer: {
    flex: 1,
    marginBottom: 12,
  },
  historyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  historyActions: {
    flexDirection: "row",
    gap: 8,
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
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
