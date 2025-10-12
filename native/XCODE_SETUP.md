# Xcode Build Setup - Real Emotion

## ✅ Project is Ready to Build!

Your iOS project is fully configured and ready to be opened and built in Xcode.

## 🎯 Quick Start - Open in Xcode

### Option 1: From Terminal

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
open RealEmotion.xcworkspace
```

### Option 2: From Finder

1. Navigate to: `/Users/kianbahia/Stuff/Coding/real_emotion/native/ios/`
2. Double-click `RealEmotion.xcworkspace`

### Option 3: From Xcode

1. Open Xcode
2. File → Open
3. Navigate to `/Users/kianbahia/Stuff/Coding/real_emotion/native/ios/`
4. Select `RealEmotion.xcworkspace` (NOT .xcodeproj)

## 🔨 Building in Xcode

### Step-by-Step Guide

1. **Open the Workspace**

   - File: `RealEmotion.xcworkspace`
   - Location: `/Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace`

2. **Select the Scheme**

   - In the toolbar, click the scheme selector (next to the play/stop buttons)
   - Select: **RealEmotion**

3. **Select Target Device**

   - Click the device selector (right next to the scheme)
   - Choose: **iPhone 17 Pro** (or any simulator/device)

4. **Build and Run**

   - Click the Play button (▶️) or press `Cmd + R`
   - Xcode will:
     - Build the native code
     - Start Metro bundler automatically
     - Launch the app in simulator

5. **Wait for Build**
   - First build takes 2-5 minutes
   - Subsequent builds are much faster

## 📁 Project Structure

```
RealEmotion.xcworkspace  ← ⚠️ ALWAYS OPEN THIS FILE
├── RealEmotion.xcodeproj
├── Pods/
│   └── (95 dependencies installed)
├── RealEmotion/
│   ├── AppDelegate.swift
│   ├── Info.plist
│   └── Images.xcassets/
├── Podfile
├── Podfile.lock
└── build.sh  ← Helper script for command-line builds
```

## 🔧 Build Configuration

### Current Setup

| Setting              | Value                      |
| -------------------- | -------------------------- |
| **App Name**         | Real_Emotion               |
| **Bundle ID**        | com.anonymous.Real-Emotion |
| **Version**          | 1.0.0                      |
| **Scheme**           | RealEmotion                |
| **React Native**     | 0.81.4                     |
| **Expo SDK**         | ~54.0.13                   |
| **Xcode Version**    | 26.0.1                     |
| **New Architecture** | ✅ Enabled                 |
| **Hermes Engine**    | ✅ Enabled                 |

### Dependencies Installed

✅ **89** CocoaPods dependencies  
✅ **95** total pods  
✅ All Expo modules configured  
✅ All React Native modules linked  
✅ expo-speech v14.0.7 (updated)

## 🎬 Build Schemes Available

- **RealEmotion** - Main app scheme (use this one)
- Plus 100+ dependency schemes (for internal use)

## 🚀 Command Line Build (Optional)

If you prefer building from the command line:

### Using the Helper Script

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
./build.sh Debug "iPhone 17 Pro"
```

### Using xcodebuild Directly

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios

# Build for simulator
xcodebuild \
  -workspace RealEmotion.xcworkspace \
  -scheme RealEmotion \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

## 📱 Running on Device

### For Physical iPhone/iPad:

1. **Connect Device via USB**

2. **Select Device in Xcode**

   - Your device will appear in the device selector

3. **Configure Signing**

   - Select `RealEmotion` target
   - Go to "Signing & Capabilities" tab
   - Select your Apple Developer team
   - Xcode will handle provisioning automatically

4. **Build and Run**
   - Press `Cmd + R`

## 🐛 Troubleshooting

### "No scheme named RealEmotion"

**Solution:** Make sure you opened `RealEmotion.xcworkspace`, not `.xcodeproj`

### "Library not found for -lPods-RealEmotion"

**Solution:** Install pods:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
LANG=en_US.UTF-8 pod install
```

### "Metro bundler connection failed"

**Solution:** Start Metro manually:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npm start
```

### Build takes forever / hangs

**Solution:** Clean build folder:

```bash
# In Xcode: Product → Clean Build Folder
# Or use Cmd + Shift + K
```

### "Expo modules not found"

**Solution:** Reinstall dependencies:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
rm -rf node_modules package-lock.json
npm install

cd ios
rm -rf Pods Podfile.lock
LANG=en_US.UTF-8 pod install
```

### CocoaPods encoding errors

**Solution:** Use UTF-8:

```bash
export LANG=en_US.UTF-8
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
pod install
```

## 📋 Pre-Build Checklist

Before building, make sure:

- ✅ `RealEmotion.xcworkspace` exists (not just .xcodeproj)
- ✅ `Pods/` directory exists with 95 pods
- ✅ `Podfile.lock` exists
- ✅ `node_modules/` exists in parent directory
- ✅ Xcode version 26+ installed
- ✅ Command Line Tools installed

## 🎨 Build Configurations

### Debug (Development)

- Faster compilation
- Debugging enabled
- Development warnings shown
- Not optimized

**Use for:** Daily development

### Release (Production)

- Optimized code
- Smaller binary size
- No debugging symbols
- Maximum performance

**Use for:** App Store submission, performance testing

## 📦 What's Included

### Native Modules

- ✅ expo-speech (Text-to-Speech)
- ✅ expo-haptics (Vibration)
- ✅ expo-router (Navigation)
- ✅ react-native-gesture-handler
- ✅ react-native-reanimated
- ✅ react-native-safe-area-context
- ✅ react-native-screens

### App Features

- ✅ Text-to-Speech with emotions
- ✅ Shortcuts management
- ✅ History tracking
- ✅ Settings & voice customization
- ✅ Emoji keyboard
- ✅ Dark mode support
- ✅ Highlight spoken text

## 🎯 Next Steps

1. **Open Xcode**

   ```bash
   open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
   ```

2. **Select RealEmotion scheme**

3. **Select iPhone 17 Pro (or your preferred device)**

4. **Press Cmd + R to build and run**

5. **Wait for Metro bundler to start**

6. **App will launch in simulator!**

## 💡 Tips

- **First build is slow**: 2-5 minutes. Subsequent builds are much faster.
- **Always use .xcworkspace**: Never open .xcodeproj directly
- **Metro must be running**: Xcode starts it automatically, but you can start it manually if needed
- **Clean build when stuck**: Product → Clean Build Folder (Cmd + Shift + K)
- **Restart Metro if needed**: Kill Metro terminal and run `npm start` again

## ✅ Current Status

**PROJECT IS READY TO BUILD IN XCODE!**

All dependencies installed ✅  
Workspace configured ✅  
Scheme available ✅  
Bundle identifier set ✅  
Info.plist configured ✅  
CocoaPods integrated ✅  
Metro bundler compatible ✅

**Just open `RealEmotion.xcworkspace` and press the Play button!**
