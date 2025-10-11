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
  const { history, settings, deleteHistory, clearAllHistory } = useApp();
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

  const handleDeleteHistory = (index: number) => {
    Alert.alert(
      'Delete History Item',
      'Are you sure you want to delete this history item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteHistory(index)
        }
      ]
    );
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all history items? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => clearAllHistory()
        }
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>📝</Text>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllHistory}
          >
            <IconSymbol name="trash.fill" size={16} color="white" />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

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
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHistory(index)}
                  >
                    <IconSymbol
                      name="trash.fill"
                      size={16}
                      color="white"
                    />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  clearAllText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF4444",
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
