import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp, Voice } from '@/contexts/AppContext';

// Function to fetch voices from Hume API
const fetchVoicesFromHumeAPI = async (apiKey: string, provider: 'HUME_AI' | 'CUSTOM_VOICE'): Promise<Voice[]> => {
  try {
    // Construct URL with query parameters as per the API documentation
    const url = new URL('https://api.hume.ai/v0/tts/voices');
    url.searchParams.append('provider', provider);
    url.searchParams.append('page_size', '100'); // Get more voices

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Hume-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.voices_page || [];
  } catch (error) {
    console.error('Error fetching voices from Hume API:', error);
    throw error;
  }
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { settings, updateSettings } = useApp();
  const [humeApiKey, setHumeApiKey] = useState(settings.humeApiKey);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'HUME_AI' | 'CUSTOM_VOICE'>('HUME_AI');

  const handleVoiceSettings = async () => {
    if (!settings.humeApiKey) {
      Alert.alert('API Key Required', 'Please set your Hume API key first to access voice options.');
      return;
    }

    setShowVoiceModal(true);
    await loadVoices();
  };

  const loadVoices = async () => {
    if (!settings.humeApiKey) return;

    setLoading(true);
    try {
      const fetchedVoices = await fetchVoicesFromHumeAPI(settings.humeApiKey, selectedProvider);
      setVoices(fetchedVoices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voices. Please check your API key.');
      console.error('Error loading voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    updateSettings({ 
      voice, 
      selectedVoiceId: voice.id 
    });
    setShowVoiceModal(false);
  };

  const handleProviderChange = async (provider: 'HUME_AI' | 'CUSTOM_VOICE') => {
    setSelectedProvider(provider);
    setLoading(true);
    try {
      const fetchedVoices = await fetchVoicesFromHumeAPI(settings.humeApiKey, provider);
      setVoices(fetchedVoices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load voices. Please check your API key.');
      console.error('Error loading voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakAsYouTypeSettings = () => {
    Alert.alert(
      "Speak as You Type",
      "Speak as you type settings would be implemented here"
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerEmoji}>⚙️</Text>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
          </View>

      {/* Settings List */}
      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                    {settings.voice?.name || 'Select a voice'}
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

          {/* Hume API Key Input */}
          <View style={styles.apiKeyContainer}>
            <Text style={styles.apiKeyLabel}>Hume API Key</Text>
            <TextInput
              style={styles.apiKeyInput}
              value={humeApiKey}
              onChangeText={setHumeApiKey}
              placeholder="Enter your Hume API key"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={dismissKeyboard}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                updateSettings({ humeApiKey });
                Alert.alert('Saved', 'Hume API key saved successfully!');
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVoiceModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Voice</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          {/* Provider Selection */}
          <View style={styles.providerContainer}>
            <TouchableOpacity
              style={[
                styles.providerButton,
                selectedProvider === 'HUME_AI' && styles.providerButtonActive
              ]}
              onPress={() => handleProviderChange('HUME_AI')}
            >
              <Text style={[
                styles.providerButtonText,
                selectedProvider === 'HUME_AI' && styles.providerButtonTextActive
              ]}>
                Hume AI Voices
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.providerButton,
                selectedProvider === 'CUSTOM_VOICE' && styles.providerButtonActive
              ]}
              onPress={() => handleProviderChange('CUSTOM_VOICE')}
            >
              <Text style={[
                styles.providerButtonText,
                selectedProvider === 'CUSTOM_VOICE' && styles.providerButtonTextActive
              ]}>
                Custom Voices
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voices List */}
          <ScrollView style={styles.voicesList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading voices...</Text>
              </View>
            ) : (
              voices.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceItem,
                    settings.selectedVoiceId === voice.id && styles.voiceItemSelected
                  ]}
                  onPress={() => handleVoiceSelect(voice)}
                >
                  <View style={styles.voiceContent}>
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceProvider}>
                      {voice.provider === 'HUME_AI' ? 'Hume AI' : 'Custom'}
                    </Text>
                  </View>
                  {settings.selectedVoiceId === voice.id && (
                    <IconSymbol name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))
            )}
            {!loading && voices.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No voices available</Text>
                <Text style={styles.emptySubtext}>
                  Make sure your API key is correct and try again
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    backgroundColor: "#F97316", // orange-500
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
  apiKeyContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20, // Add extra margin at bottom for keyboard
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  apiKeyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  apiKeyInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalPlaceholder: {
    width: 60,
  },
  providerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  providerButtonActive: {
    backgroundColor: '#3B82F6',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  providerButtonTextActive: {
    color: 'white',
  },
  voicesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceItemSelected: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  voiceContent: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  voiceProvider: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
