# Building Real Emotion in Xcode

## Quick Start

1. **Open the workspace in Xcode:**

   ```bash
   open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
   ```

2. **Select the target:**

   - In Xcode, select the `RealEmotion` scheme from the scheme selector
   - Choose your target device or simulator

3. **Build and Run:**
   - Press `Cmd + R` or click the Play button to build and run
   - Or use Product → Run from the menu

## Prerequisites

- **Xcode**: Version 26.0.1 or later
- **CocoaPods**: Already installed and configured
- **Node.js**: For running metro bundler
- **iOS Simulator**: Or a physical iOS device

## Project Structure

```
native/
├── ios/
│   ├── RealEmotion.xcworkspace  ← Open this in Xcode
│   ├── RealEmotion.xcodeproj
│   ├── Podfile
│   ├── Pods/
│   └── RealEmotion/
│       ├── AppDelegate.swift
│       └── Info.plist
├── app/                         ← React Native source code
├── components/
├── contexts/
└── package.json
```

## Building from Xcode

### Method 1: Using Xcode GUI

1. Open Xcode
2. File → Open → Select `RealEmotion.xcworkspace`
3. Wait for indexing to complete
4. Select `RealEmotion` scheme
5. Choose your target device
6. Click the Play button or press `Cmd + R`

### Method 2: Using Command Line

```bash
# Navigate to iOS directory
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios

# Build for simulator
xcodebuild -workspace RealEmotion.xcworkspace \
  -scheme RealEmotion \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'

# Build for device
xcodebuild -workspace RealEmotion.xcworkspace \
  -scheme RealEmotion \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS'
```

## Metro Bundler

The Metro bundler needs to be running to serve the JavaScript bundle:

```bash
# In a separate terminal
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npm start
```

Or Xcode will automatically start it when you build.

## Troubleshooting

### If CocoaPods dependencies are missing:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
LANG=en_US.UTF-8 pod install
```

### If npm packages are missing:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npm install
```

### Clear build cache:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
rm -rf ~/Library/Developer/Xcode/DerivedData/RealEmotion-*
xcodebuild clean -workspace RealEmotion.xcworkspace -scheme RealEmotion
```

### Reset everything:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native

# Clean iOS
cd ios
rm -rf Pods Podfile.lock build
LANG=en_US.UTF-8 pod install

# Reinstall node modules
cd ..
rm -rf node_modules package-lock.json
npm install
```

## Build Configurations

- **Debug**: For development with debugging enabled
- **Release**: Optimized build for production

## Important Files

- `ios/RealEmotion.xcworkspace` - **Main workspace file (OPEN THIS)**
- `ios/Podfile` - CocoaPods dependencies
- `ios/RealEmotion/Info.plist` - App configuration
- `app.json` - Expo configuration
- `package.json` - NPM dependencies

## Architecture

- **React Native**: 0.81.4
- **Expo SDK**: ~54.0.13
- **New Architecture**: Enabled
- **Hermes Engine**: Enabled

## Dependencies

All CocoaPods dependencies are installed and ready:

- 89 dependencies from Podfile
- 95 total pods installed
- Including: Expo modules, React Native core, and native modules

## Current Status

✅ iOS project fully configured  
✅ CocoaPods dependencies installed  
✅ expo-speech updated to v14.0.7  
✅ Xcode workspace ready to build  
✅ All native modules linked  
✅ New Architecture enabled

**You can now open `RealEmotion.xcworkspace` in Xcode and build!**
