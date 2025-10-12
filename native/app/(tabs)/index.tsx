import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useApp } from "@/contexts/AppContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { humeTTS } from "@/services/HumeTTS";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { storage } from "@/utils/storage"; // ✅ added import

export default function ShortcutsScreen() {
  const colorScheme = useColorScheme();
  const { shortcuts, deleteShortcut, setShortcuts, settings } = useApp();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isHumeInitialized, setIsHumeInitialized] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState<string[]>([]); // ✅ local persisted state

  // Load shortcuts from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem("shortcuts");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setLocalShortcuts(parsed);
        } catch (err) {
          console.error("Failed to parse shortcuts from storage:", err);
        }
      } else {
        // if nothing stored yet, fallback to context
        setLocalShortcuts(shortcuts);
      }
    })();
  }, []);

  // Sync from context to local state when shortcuts change
  useEffect(() => {
    // Only sync if the context has more items than local state (indicating something was added)
    if (shortcuts.length > localShortcuts.length) {
      console.log("Syncing shortcuts from context to local state");
      setLocalShortcuts(shortcuts);
      // Also save to storage
      storage.setItem("shortcuts", JSON.stringify(shortcuts));
    }
  }, [shortcuts, localShortcuts.length]);


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

  const handleDeleteShortcut = (index: number) => {
    // For web, use confirm dialog; for mobile, use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to delete this shortcut?");
      if (confirmed) {
        const updated = localShortcuts.filter((_, i) => i !== index);
        setLocalShortcuts(updated);
        
        // Save to storage
        storage.setItem("shortcuts", JSON.stringify(updated));
        
        // Update context to match local state
        setShortcuts(updated);
      }
    } else {
      Alert.alert(
        "Delete Shortcut",
        "Are you sure you want to delete this shortcut?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              const updated = localShortcuts.filter((_, i) => i !== index);
              setLocalShortcuts(updated);
              
              // Save to storage
              storage.setItem("shortcuts", JSON.stringify(updated));
              
              // Update context to match local state
              setShortcuts(updated);
            },
          },
        ]
      );
    }
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

      {/* Shortcuts List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {localShortcuts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No shortcuts yet. Add from Text screen!
            </Text>
          </View>
        ) : (
          <View style={styles.shortcutsList}>
            {localShortcuts.map((shortcut, index) => (
              <View
                key={index}
                style={[
                  styles.shortcutItem,
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
                  style={styles.shortcutTextContainer}
                  onPress={() => handleSpeak(shortcut, index)}
                >
                  <Text
                    style={[
                      styles.shortcutText,
                      { color: Colors[colorScheme ?? "light"].text },
                    ]}
                  >
                    {shortcut}
                  </Text>
                </TouchableOpacity>
                <View style={styles.shortcutActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSpeak(shortcut, index)}
                  >
                    <IconSymbol
                      name="speaker.wave.2.fill"
                      size={16}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteShortcut(index)}
                    activeOpacity={0.7}
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
          Tap a shortcut to speak it instantly
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
    backgroundColor: "#10B981", // green-500
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
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  shortcutsList: {
    gap: 12,
  },
  shortcutItem: {
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
    borderColor: "#3B82F6",
  },
  shortcutTextContainer: {
    flex: 1,
    marginBottom: 12,
  },
  shortcutText: {
    fontSize: 16,
    lineHeight: 24,
  },
  shortcutActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    cursor: "pointer",
  },
  footer: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
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
