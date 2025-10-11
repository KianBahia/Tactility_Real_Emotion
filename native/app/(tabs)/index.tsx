import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/contexts/AppContext';
import { humeTTS } from '@/services/HumeTTS';

export default function ShortcutsScreen() {
  const colorScheme = useColorScheme();
  const { shortcuts, deleteShortcut, settings } = useApp();
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
      Alert.alert('API Key Required', 'Please set your Hume API key in settings to use text-to-speech.');
      return;
    }

    try {
      await humeTTS.speak(text, {
        rate: settings.rate,
        pitch: settings.pitch,
        voice: settings.voice?.name || 'Ava Song',
        isCustomVoice: settings.voice?.provider === 'CUSTOM_VOICE',
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
      console.error('Speech error:', error);
      Alert.alert('Speech Error', 'Failed to speak text. Please check your API key and try again.');
      setPlayingIndex(null);
    }
  };

  const handleDeleteShortcut = (index: number) => {
    Alert.alert(
      'Delete Shortcut',
      'Are you sure you want to delete this shortcut?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteShortcut(index)
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>⚡</Text>
          <Text style={styles.headerTitle}>Shortcuts</Text>
        </View>
      </View>

      {/* Shortcuts List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {shortcuts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No shortcuts yet. Add from Text screen!</Text>
          </View>
        ) : (
          <View style={styles.shortcutsList}>
            {shortcuts.map((shortcut, index) => (
              <View
                key={index}
                style={[
                  styles.shortcutItem,
                  playingIndex === index && styles.playingItem
                ]}
              >
                <TouchableOpacity
                  style={styles.shortcutTextContainer}
                  onPress={() => handleSpeak(shortcut, index)}
                >
                  <Text style={styles.shortcutText}>{shortcut}</Text>
                </TouchableOpacity>
                <View style={styles.shortcutActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSpeak(shortcut, index)}
                  >
                    <IconSymbol name="speaker.wave.2.fill" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteShortcut(index)}
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
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap a shortcut to speak it instantly</Text>
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
    backgroundColor: '#10B981', // green-500
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  shortcutsList: {
    gap: 12,
  },
  shortcutItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playingItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
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
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  footer: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});