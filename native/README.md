# Real Emotion - React Native App

This is a React Native implementation of the Real Emotion text-to-speech application, matching the design and functionality of the web version.

## Features

- **4 Main Screens**: Shortcuts, Text, History, and Settings
- **Text-to-Speech**: Uses expo-speech for native speech synthesis
- **Custom Keyboard**: On-screen keyboard with emoji support
- **Shortcuts Management**: Add, delete, and speak saved phrases
- **History Tracking**: Keep track of recently spoken text
- **Settings**: Configure voice, rate, pitch, and other speech options
- **Shared State**: Context-based state management across screens

## Screens

### 1. Shortcuts Screen
- View and manage saved text shortcuts
- Tap to speak shortcuts instantly
- Delete unwanted shortcuts
- Green gradient header with lightning bolt icon

### 2. Text Screen
- Main text input area with custom keyboard
- Play/pause speech controls
- Add text to shortcuts
- Blue gradient header with speech bubble icon
- Real-time text highlighting during speech

### 3. History Screen
- View recently spoken text
- Tap to replay any history item
- Purple gradient header with document icon

### 4. Settings Screen
- Voice selection and configuration
- Speech rate and pitch controls
- Speak-as-you-type options
- Highlight spoken text toggle
- Phone/video call settings
- Orange gradient header with gear icon

## Technical Implementation

### Navigation
- Uses Expo Router with tab navigation
- 4 tabs matching the web app's screen structure
- Custom tab icons using SF Symbols

### State Management
- React Context for shared state across screens
- Centralized shortcuts, history, and settings management
- TypeScript interfaces for type safety

### Speech Integration
- expo-speech for cross-platform text-to-speech
- Configurable voice, rate, and pitch
- Speech event handling (start, done, stopped)

### UI/UX
- Native iOS/Android design patterns
- Consistent color scheme and typography
- Responsive layouts and touch interactions
- Visual feedback for speech states

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device/simulator:
```bash
npm run ios    # iOS
npm run android # Android
npm run web    # Web
```

## Dependencies

- **expo-speech**: Text-to-speech functionality
- **expo-router**: File-based routing
- **@expo/vector-icons**: Icon components
- **react-native-gesture-handler**: Touch interactions
- **react-native-reanimated**: Animations

## Architecture

```
app/
├── (tabs)/
│   ├── shortcuts.tsx    # Shortcuts screen
│   ├── text.tsx         # Text input screen
│   ├── history.tsx      # History screen
│   └── settings.tsx     # Settings screen
├── _layout.tsx          # Root layout with providers
contexts/
└── AppContext.tsx       # Shared state management
```

## Key Features Implemented

✅ **Tab Navigation**: 4-screen tab structure
✅ **Speech Synthesis**: Native text-to-speech
✅ **Custom Keyboard**: On-screen keyboard with emojis
✅ **State Management**: Context-based shared state
✅ **Settings**: Voice and speech configuration
✅ **Shortcuts**: Save and manage text shortcuts
✅ **History**: Track spoken text
✅ **Visual Design**: Matching web app design
✅ **TypeScript**: Full type safety

## Differences from Web Version

- Uses native tab navigation instead of swipe gestures
- expo-speech instead of Web Speech API
- React Native components instead of HTML/CSS
- Context API instead of prop drilling
- Native iOS/Android design patterns

The React Native app provides the same core functionality as the web version while leveraging native mobile capabilities for better performance and user experience.