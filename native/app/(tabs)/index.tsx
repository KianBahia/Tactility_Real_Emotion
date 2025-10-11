import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/contexts/AppContext';
import { humeTTS } from '@/services/HumeTTS';
import * as Speech from 'expo-speech';

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHumeInitialized, setIsHumeInitialized] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    if (settings.humeApiKey) {
      humeTTS.setApiKey(settings.humeApiKey);
      setIsHumeInitialized(true);
    } else {
      setIsHumeInitialized(false);
    }
  }, [settings.humeApiKey]);

  type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'doubt';

  // Presets provided by the user
  const MOTION_PRESETS: Record<Emotion, { description: string; speed: number; trailing_silence?: number }> = {
    neutral: {
      description:
        'Neutral voice with smooth prosody. The speaker sounds calm, balanced, and sonically neutral. Use this preset when you want a simple, clear read without emotional color.',
      speed: 1.0,
    },
    happy: {
      description:
        'A warm, upbeat voice conveying happiness: bright tone, slightly faster tempo, and positive intonation. Use for cheerful messages and friendly prompts.',
      speed: 1.05,
      trailing_silence: 0.06,
    },
    sad: {
      description:
        'A soft, lower-volume voice with slower tempo and a melancholic timbre. Use subtle breathiness and elongated vowels to convey sadness.',
      speed: 0.97,
      trailing_silence: 0.06,
    },
    angry: {
      description:
        'An intense, clipped delivery with higher energy and sharper consonants. Higher pitch variability and slightly faster speed to convey frustration or anger.',
      speed: 1.03,
      trailing_silence: 0.03,
    },
    doubt: {
      description:
        'A questioning, cautious tone with small hesitations and a tentative upward inflection at the end of phrases. Use slight pauses between clauses and a subtle breathy quality.',
      speed: 0.99,
      trailing_silence: 0.04,
    },
  };

  const parseSegments = (input: string): Array<{ emotion: Emotion; text: string }> => {
    const regex = /\[(neutral|happy|sad|angry|doubt)\]/g;
    const parts: Array<{ emotion: Emotion; text: string }> = [];
    let lastIndex = 0;
    let currentEmotion: Emotion = 'neutral';
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      const idx = match.index;
      const before = input.slice(lastIndex, idx);
      if (before.length > 0) parts.push({ emotion: currentEmotion, text: before });
      currentEmotion = match[1] as Emotion;
      lastIndex = regex.lastIndex;
    }
    const rest = input.slice(lastIndex);
    if (rest.length > 0) parts.push({ emotion: currentEmotion, text: rest });
    return parts.map((p) => ({ emotion: p.emotion, text: p.text.trim() })).filter((p) => p.text.length > 0);
  };

  const insertTokenAtCursor = (tokenKey: string) => {
    const token = `[${tokenKey}]`;
    const start = selection.start ?? text.length;
    const end = selection.end ?? text.length;
    const newText = text.slice(0, start) + token + text.slice(end);
    setText(newText);
    const pos = start + token.length;
    setTimeout(() => setSelection({ start: pos, end: pos }), 0);
  };

  const handlePlay = async () => {
    if (!text) return;
    if (!isHumeInitialized) {
      Alert.alert('API Key Required', 'Please set your Hume API key in settings to use text-to-speech.');
      return;
    }

    addToHistory(text);
    setIsPlaying(true);

    const segments = parseSegments(text);
    for (const seg of segments) {
      const preset = MOTION_PRESETS[seg.emotion] || MOTION_PRESETS['neutral'];
      try {
        await humeTTS.speak(seg.text, {
          rate: preset.speed,
          pitch: settings.pitch,
          voice: settings.voice?.name || 'Ava Song',
          emotion: seg.emotion,
          description: preset.description,
          trailing_silence: preset.trailing_silence,
        });
        // wait until playback completed
        while (humeTTS.isSpeaking()) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 120));
        }
      } catch (err) {
        console.warn('Hume segment failed, falling back to device TTS', err);
        Speech.speak(seg.text);
        // small wait to avoid overlap
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, Math.max(500, seg.text.length * 60)));
      }
    }

    setIsPlaying(false);
  };

  const handlePause = async () => {
    try {
      await humeTTS.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Pause error:', error);
      setIsPlaying(false);
    }
  };

  const handleAddShortcut = () => {
    if (text) {
      addShortcut(text);
      Alert.alert('Shortcut Added', 'Text added to shortcuts!');
    }
  };

  const handleEmojiPress = (key: string) => {
    // insert token at cursor
    insertTokenAtCursor(key);
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClearText = () => {
    setText('');
    dismissKeyboard();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerEmoji}>💬</Text>
              <Text style={styles.headerTitle}>Text</Text>
            </View>
          </View>

          <View style={styles.emojiBar}>
            <EmojiBar onEmojiPress={handleEmojiPress} />
          </View>

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.textArea}>
              <TextInput
                value={text}
                onChangeText={setText}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                placeholder="Start typing..."
                style={[styles.textInput]}
                multiline
                textAlignVertical="top"
                autoFocus={false}
              />
            </View>
          </ScrollView>

          <View style={styles.controls}>
            <View style={styles.controlsLeft} />
            <View style={styles.controlsCenter}>
              <TouchableOpacity style={[styles.controlButton, (!text || isPlaying) && styles.disabledButton]} onPress={handlePlay} disabled={!text || isPlaying}>
                <IconSymbol name="play.fill" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlButton, !isPlaying && styles.disabledButton]} onPress={handlePause} disabled={!isPlaying}>
                <IconSymbol name="pause.fill" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlButton, styles.addButton, !text && styles.disabledButton]} onPress={handleAddShortcut} disabled={!text}>
                <IconSymbol name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.controlsRight}>
              <TouchableOpacity style={[styles.clearButton, !text && styles.disabledButton]} onPress={handleClearText} disabled={!text}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

interface EmojiBarProps {
  onEmojiPress: (emojiKey: string) => void;
}

function EmojiBar({ onEmojiPress }: EmojiBarProps) {
  const list: Array<{ key: string; emoji: string }> = [
    { key: 'neutral', emoji: '�' },
    { key: 'happy', emoji: '�' },
    { key: 'sad', emoji: '�' },
    { key: 'angry', emoji: '�' },
    { key: 'doubt', emoji: '🤔' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScrollView} contentContainerStyle={styles.emojiContainer}>
      {list.map((it) => (
        <TouchableOpacity key={it.key} style={styles.emojiButton} onPress={() => onEmojiPress(it.key)}>
          <Text style={styles.emojiText}>{it.emoji}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  emojiBar: { height: 60, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#D1D5DB' },
  emojiScrollView: { flex: 1 },
  emojiContainer: { alignItems: 'center', paddingHorizontal: 16 },
  emojiButton: { width: 44, height: 44, backgroundColor: 'white', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  emojiText: { fontSize: 20 },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  textArea: { flex: 1, padding: 16, minHeight: 200 },
  textInput: { flex: 1, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  controls: { height: 56, borderTopWidth: 1, borderTopColor: '#D1D5DB', backgroundColor: '#F9FAFB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  controlsLeft: { flex: 1 },
  controlsCenter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  controlsRight: { flex: 1, alignItems: 'flex-end' },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  addButton: { backgroundColor: '#10B981' },
  disabledButton: { backgroundColor: '#D1D5DB' },
  clearButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  clearButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
