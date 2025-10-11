import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/contexts/AppContext';

export default function TextScreen() {
  const colorScheme = useColorScheme();
  const { addToHistory, addShortcut, settings } = useApp();
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');

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
      Alert.alert('Shortcut Added', 'Text added to shortcuts!');
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'space') {
      setText(prev => prev + ' ');
    } else if (key === '↵') {
      setText(prev => prev + '\n');
    } else {
      setText(prev => prev + key);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>💬</Text>
          <Text style={styles.headerTitle}>Text</Text>
        </View>
      </View>

      {/* Text Area */}
      <View style={styles.textArea}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Start typing..."
          style={[
            styles.textInput,
            settings.highlightSpokenText && highlightedText ? styles.highlightedText : null
          ]}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, (!text || isPlaying) && styles.disabledButton]}
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
          style={[styles.controlButton, styles.addButton, !text && styles.disabledButton]}
          onPress={handleAddShortcut}
          disabled={!text}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Keyboard Area */}
      <View style={styles.keyboardArea}>
        <Keyboard onKeyPress={handleKeyPress} />
      </View>
    </View>
  );
}

// Keyboard Component
interface KeyboardProps {
  onKeyPress: (key: string) => void;
}

function Keyboard({ onKeyPress }: KeyboardProps) {
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
  const emojis = ['😊', '😢', '😠', '😐', '😂', '🙏'];

  return (
    <View style={styles.keyboard}>
      {/* Emoji Row */}
      <View style={styles.keyboardRow}>
        {emojis.map((emoji, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.emojiKey}
            onPress={() => onKeyPress(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* First Row */}
      <View style={styles.keyboardRow}>
        {row1.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => onKeyPress(key)}
          >
            <Text style={styles.keyText}>{key.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Second Row */}
      <View style={[styles.keyboardRow, styles.secondRow]}>
        {row2.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => onKeyPress(key)}
          >
            <Text style={styles.keyText}>{key.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Third Row */}
      <View style={styles.keyboardRow}>
        <TouchableOpacity
          style={styles.shiftKey}
          onPress={() => onKeyPress('⇧')}
        >
          <Text style={styles.keyText}>⇧</Text>
        </TouchableOpacity>
        {row3.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => onKeyPress(key)}
          >
            <Text style={styles.keyText}>{key.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.backspaceKey}
          onPress={() => onKeyPress('backspace')}
        >
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
      </View>

      {/* Fourth Row - Space Bar */}
      <View style={styles.keyboardRow}>
        <TouchableOpacity
          style={styles.numberKey}
          onPress={() => onKeyPress('123')}
        >
          <Text style={styles.keyText}>123</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.spaceKey}
          onPress={() => onKeyPress('space')}
        >
          <Text style={styles.keyText}>space</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.enterKey}
          onPress={() => onKeyPress('↵')}
        >
          <Text style={styles.keyText}>↵</Text>
        </TouchableOpacity>
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
    backgroundColor: '#3B82F6', // blue-500
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
  textArea: {
    flex: 2,
    padding: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  highlightedText: {
    backgroundColor: '#FEF3C7',
  },
  controls: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  keyboardArea: {
    flex: 1,
    backgroundColor: '#D1D5DB',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  keyboard: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
    gap: 4,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  secondRow: {
    paddingHorizontal: 12,
  },
  key: {
    width: 32,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  emojiKey: {
    width: 40,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  emojiText: {
    fontSize: 18,
  },
  keyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  shiftKey: {
    width: 48,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  backspaceKey: {
    width: 48,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  numberKey: {
    width: 56,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  spaceKey: {
    flex: 1,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  enterKey: {
    width: 56,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});
