import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useApp } from "@/contexts/AppContext";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { settings, updateSettings } = useApp();

  const handleVoiceSettings = () => {
    Alert.alert("Voice Settings", "Voice selection would be implemented here");
  };

  const handleSpeakAsYouTypeSettings = () => {
    Alert.alert(
      "Speak as You Type",
      "Speak as you type settings would be implemented here"
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

      {/* Settings List */}
      <ScrollView style={styles.content}>
        <View style={styles.settingsContainer}>
          {/* Voices Section */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
            onPress={handleVoiceSettings}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>🎤</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Voices
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  {settings.voice?.name || "Default Voice"}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Speak as You Type Section */}
          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
            onPress={handleSpeakAsYouTypeSettings}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>⌨️</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Speak as You Type
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  {settings.speakAsYouType === "off"
                    ? "Off"
                    : settings.speakAsYouType === "words"
                    ? "Words by Words"
                    : settings.speakAsYouType === "sentences"
                    ? "Sentences by Sentences"
                    : "Lines by Lines"}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Highlight Spoken Text */}
          <View
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>✨</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Highlight Spoken Text
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  Visual feedback while speaking
                </Text>
              </View>
            </View>
            <Switch
              value={settings.highlightSpokenText}
              onValueChange={(value) =>
                updateSettings({ highlightSpokenText: value })
              }
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor={settings.highlightSpokenText ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          {/* Delay */}
          <View
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>⏱️</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Delay
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  {settings.delay}ms before speaking
                </Text>
              </View>
            </View>
          </View>

          {/* Phone Call */}
          <View
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>📞</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Phone Call
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  Enable during phone calls
                </Text>
              </View>
            </View>
            <Switch
              value={settings.phoneCallEnabled}
              onValueChange={(value) =>
                updateSettings({ phoneCallEnabled: value })
              }
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor={settings.phoneCallEnabled ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          {/* Video Call */}
          <View
            style={[
              styles.settingItem,
              {
                backgroundColor:
                  Colors[colorScheme ?? "light"].background === "#fff"
                    ? "white"
                    : "#2D2D2D",
              },
            ]}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingEmoji}>📹</Text>
              </View>
              <View style={styles.settingText}>
                <Text
                  style={[
                    styles.settingTitle,
                    { color: Colors[colorScheme ?? "light"].text },
                  ]}
                >
                  Video Call
                </Text>
                <Text
                  style={[
                    styles.settingSubtitle,
                    { color: Colors[colorScheme ?? "light"].icon },
                  ]}
                >
                  Enable during video calls
                </Text>
              </View>
            </View>
            <Switch
              value={settings.videoCallEnabled}
              onValueChange={(value) =>
                updateSettings({ videoCallEnabled: value })
              }
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor={settings.videoCallEnabled ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    backgroundColor: "#F97316", // orange-500
  },
  content: {
    flex: 1,
  },
  settingsContainer: {
    padding: 16,
    gap: 16,
  },
  settingItem: {
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingEmoji: {
    fontSize: 24,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
});
