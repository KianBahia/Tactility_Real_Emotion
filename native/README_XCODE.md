# Real Emotion - Xcode Build Setup

## ✅ Status: READY TO BUILD

Your project is fully configured and ready to be built in Xcode.

---

## 🚀 Quick Start (3 Steps)

### 1. Open the Workspace in Xcode

```bash
open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
```

### 2. Select Target

In Xcode's top toolbar:

- **Scheme**: Select `RealEmotion`
- **Device**: Select `iPhone 17 Pro` (or any simulator/device)

### 3. Build and Run

- Press **`Cmd + R`** or click the **Play button (▶️)**
- First build takes 2-5 minutes
- App will launch automatically in simulator

---

## 📁 Important Files

### Main Workspace (Open This)

```
/Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
```

⚠️ **Always open `.xcworkspace`, never `.xcodeproj`**

### Project Structure

```
native/
├── ios/
│   ├── RealEmotion.xcworkspace  ← Open this in Xcode
│   ├── RealEmotion.xcodeproj
│   ├── Podfile
│   ├── Pods/                    ← 95 dependencies installed
│   ├── RealEmotion/
│   │   ├── AppDelegate.swift
│   │   └── Info.plist
│   └── build.sh                 ← Helper script
├── app/                         ← React Native code
├── XCODE_SETUP.md              ← Full documentation
├── BUILD_INSTRUCTIONS.md       ← Build guide
└── QUICK_START.txt             ← Quick reference
```

---

## 📦 What's Configured

| Component            | Status        | Details                    |
| -------------------- | ------------- | -------------------------- |
| **iOS Workspace**    | ✅ Ready      | RealEmotion.xcworkspace    |
| **CocoaPods**        | ✅ Installed  | 95 total pods              |
| **expo-speech**      | ✅ Updated    | Version 14.0.7             |
| **React Native**     | ✅ Configured | Version 0.81.4             |
| **Expo SDK**         | ✅ Configured | Version 54.0.13            |
| **New Architecture** | ✅ Enabled    | Hermes + Fabric            |
| **Bundle ID**        | ✅ Set        | com.anonymous.Real-Emotion |
| **Xcode**            | ✅ Compatible | Version 26.0.1             |
| **Build Scheme**     | ✅ Available  | RealEmotion                |

---

## 🎯 Build Process

### What Happens When You Build

1. **Xcode compiles native code** (Swift, Objective-C, C++)
2. **Metro bundler starts** (JavaScript bundling)
3. **React Native bridge initializes**
4. **App launches** in simulator/device

### Build Times

- **First build**: 2-5 minutes (compiles everything)
- **Incremental builds**: 30-60 seconds (only changed files)
- **Clean build**: 2-5 minutes (rebuilds everything)

---

## 🔧 Build Configurations

### Debug (Default)

- Use for: Daily development
- Features: Fast compilation, debugging enabled
- Command: `Cmd + R`

### Release

- Use for: App Store, performance testing
- Features: Optimized, smaller size
- Command: Product → Scheme → Edit Scheme → Build Configuration → Release

---

## 📱 Target Devices

### Simulators (No setup needed)

- ✅ iPhone 17 Pro
- ✅ iPhone 16 Pro
- ✅ iPhone 15 Pro
- ✅ Any iOS Simulator

### Physical Devices (Requires signing)

1. Connect iPhone/iPad via USB
2. Select device in Xcode
3. Configure code signing (Signing & Capabilities tab)
4. Build and run (`Cmd + R`)

---

## 🐛 Troubleshooting

### Issue: "No scheme named RealEmotion"

**Cause**: Opened .xcodeproj instead of .xcworkspace  
**Fix**: Open `RealEmotion.xcworkspace`

### Issue: CocoaPods errors

**Cause**: Pods not installed or outdated  
**Fix**:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
LANG=en_US.UTF-8 pod install
```

### Issue: Metro bundler not connecting

**Cause**: Metro not running  
**Fix**:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npm start
```

### Issue: Build hangs or fails

**Cause**: Corrupted build cache  
**Fix**: In Xcode: Product → Clean Build Folder (`Cmd + Shift + K`)

### Issue: Module not found

**Cause**: Missing node_modules  
**Fix**:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

- **`QUICK_START.txt`** - Quick reference guide
- **`XCODE_SETUP.md`** - Comprehensive Xcode guide
- **`BUILD_INSTRUCTIONS.md`** - Detailed build instructions
- **`ios/build.sh`** - Command-line build script

---

## 🛠️ Command Line Build (Optional)

### Using Helper Script

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
./build.sh
```

### Using xcodebuild

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios

xcodebuild \
  -workspace RealEmotion.xcworkspace \
  -scheme RealEmotion \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

---

## ✨ App Features

Your app includes:

- ✅ **Text-to-Speech** with emotional voices
- ✅ **Emoji Bar** with quick access emojis
- ✅ **Shortcuts Management** for frequently used phrases
- ✅ **History Tracking** with clear all functionality
- ✅ **Settings** for voice customization
- ✅ **Highlight Spoken Text** feature
- ✅ **Dark Mode Support**
- ✅ **Native iOS Keyboard**

---

## 🎉 You're All Set!

### To Build Your App:

1. **Open Terminal** and run:

   ```bash
   open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
   ```

2. **In Xcode**: Select `RealEmotion` scheme

3. **Press `Cmd + R`**

4. **Wait for build** (2-5 minutes first time)

5. **App launches automatically!**

---

## 💡 Tips

- **First time is slowest**: Xcode needs to compile all dependencies
- **Use incremental builds**: Only changed code gets recompiled
- **Clean when stuck**: Product → Clean Build Folder
- **Restart Metro if needed**: Kill terminal and run `npm start`
- **Check scheme**: Make sure "RealEmotion" is selected

---

## 🆘 Need Help?

1. Check `XCODE_SETUP.md` for comprehensive guide
2. Review `BUILD_INSTRUCTIONS.md` for step-by-step instructions
3. Try troubleshooting section above
4. Clean and rebuild: `Cmd + Shift + K`, then `Cmd + R`

---

**Ready? Let's build! 🚀**

```bash
open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
```
