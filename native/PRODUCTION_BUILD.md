# Production Build Guide - Real Emotion

## Overview

This guide explains how to build a **standalone production version** of the app that:

- ✅ Runs without Metro bundler
- ✅ Runs without network connection
- ✅ Has JavaScript bundle embedded in the app
- ✅ Ready for TestFlight or App Store

## Quick Start - Production Build

### Step 1: Export the JavaScript Bundle

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npx expo export --platform ios
```

This creates:

- `dist/_expo/static/js/ios/entry-[hash].hbc` - JavaScript bundle
- `dist/assets/` - Image and other assets
- `dist/metadata.json` - Bundle metadata

**Output**: ~3.59 MB bundle with all your app code

### Step 2: Add Build Phase in Xcode (One-time Setup)

1. **Open Xcode**:

   ```bash
   open ios/RealEmotion.xcworkspace
   ```

2. **Select the Project** (RealEmotion) in the navigator

3. **Select the Target** (RealEmotion under TARGETS)

4. **Go to Build Phases tab**

5. **Click the + button** → "New Run Script Phase"

6. **Name it**: "Copy Production Bundle"

7. **Paste this script**:

   ```bash
   if [ "${CONFIGURATION}" = "Release" ]; then
       "${SRCROOT}/copy-bundle.sh"
   fi
   ```

8. **Drag this phase** to be BEFORE "Copy Bundle Resources"

### Step 3: Build for Release

In Xcode:

1. **Select Release Configuration**:

   - Product → Scheme → Edit Scheme...
   - Run → Info tab
   - Build Configuration: **Release**
   - Close

2. **Build the App**:

   - Press **`Cmd + B`** to build
   - Or **`Cmd + R`** to build and run

3. **App will use embedded bundle** (no Metro needed!)

## Alternative: Build from Command Line

### Build Release Version

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native

# 1. Export bundle
npx expo export --platform ios

# 2. Build with xcodebuild
cd ios
xcodebuild \
  -workspace RealEmotion.xcworkspace \
  -scheme RealEmotion \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  archive \
  -archivePath ./build/RealEmotion.xcarchive
```

## Understanding Build Configurations

### Debug Configuration (Development)

**When used**: Daily development  
**JS Bundle from**: Metro bundler (localhost:8081)  
**Features**:

- ✅ Fast Refresh
- ✅ Hot Reload
- ✅ Dev Menu (shake device)
- ✅ Chrome DevTools
- ❌ Requires Metro running
- ❌ Requires network connection

**Code in AppDelegate**:

```swift
#if DEBUG
    return RCTBundleURLProvider.sharedSettings()
           .jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#endif
```

### Release Configuration (Production)

**When used**: TestFlight, App Store, Production Testing  
**JS Bundle from**: Embedded `main.jsbundle` in app  
**Features**:

- ✅ No Metro needed
- ✅ No network needed
- ✅ Optimized & minified code
- ✅ Smaller file size
- ✅ Faster startup
- ❌ No dev menu
- ❌ No debugging

**Code in AppDelegate**:

```swift
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
```

## Complete Production Build Workflow

### 1. Prepare the App

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native

# Clean everything
rm -rf dist
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/RealEmotion-*

# Install dependencies (if needed)
npm install
cd ios && LANG=en_US.UTF-8 pod install && cd ..
```

### 2. Export JavaScript Bundle

```bash
npx expo export --platform ios
```

**Verify**:

```bash
ls -lh dist/_expo/static/js/ios/*.hbc
# Should show ~3.59 MB bundle file
```

### 3. Build in Xcode

1. Open workspace:

   ```bash
   open ios/RealEmotion.xcworkspace
   ```

2. Select **Release** configuration:

   - Product → Scheme → Edit Scheme
   - Run → Build Configuration → **Release**

3. Select target device:

   - Your iPhone (for device testing)
   - Or "Any iOS Device" (for archive)

4. Build:
   - `Cmd + B` (build only)
   - `Cmd + R` (build and run)

### 4. Create Archive for App Store

```bash
# In Xcode:
# 1. Select "Any iOS Device (arm64)"
# 2. Product → Archive
# 3. Wait for build (2-5 minutes)
# 4. Organizer will open with your archive
```

### 5. Export for Distribution

In Xcode Organizer:

1. Select your archive
2. Click "Distribute App"
3. Choose distribution method:
   - **App Store Connect**: For TestFlight/App Store
   - **Ad Hoc**: For internal testing
   - **Development**: For specific devices
   - **Enterprise**: For in-house distribution

## Verify Production Build

### Check Bundle is Embedded

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios

# After building, check the app bundle
ls -lh ~/Library/Developer/Xcode/DerivedData/RealEmotion-*/Build/Products/Release-iphoneos/RealEmotion.app/main.jsbundle

# Should show ~3.59 MB file
```

### Test Without Network

1. Build with Release configuration
2. Install on device
3. **Turn off WiFi and Cellular**
4. Launch app
5. App should work perfectly without network!

## Troubleshooting

### "Could not connect to development server"

**Cause**: App is trying to use Metro bundler  
**Solution**: Make sure you're building with **Release** configuration

```bash
# In Xcode:
# Product → Scheme → Edit Scheme → Run → Build Configuration → Release
```

### "main.jsbundle not found"

**Cause**: Bundle wasn't copied into app  
**Solution**:

1. Export bundle:

   ```bash
   cd /Users/kianbahia/Stuff/Coding/real_emotion/native
   npx expo export --platform ios
   ```

2. Check dist folder exists:

   ```bash
   ls -lh dist/_expo/static/js/ios/
   ```

3. Rebuild in Xcode with Release configuration

### "App crashes on launch in Release"

**Possible causes**:

1. Bundle is corrupted
2. Assets missing
3. Production-only bug

**Solution**:

```bash
# Clean everything
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
rm -rf dist
rm -rf ios/build

# Re-export
npx expo export --platform ios

# Rebuild
cd ios
xcodebuild clean -workspace RealEmotion.xcworkspace -scheme RealEmotion
```

### Bundle size too large

**Current size**: ~3.59 MB (good for most apps)

**To reduce**:

1. Remove unused dependencies from `package.json`
2. Use Hermes (already enabled ✅)
3. Enable minification (enabled by default in Release)

## Build Phase Script Explanation

The `copy-bundle.sh` script:

1. **Finds the bundle** in `dist/_expo/static/js/ios/`
2. **Copies it** to app bundle as `main.jsbundle`
3. **Copies assets** from `dist/assets/`
4. **Only runs** in Release configuration

This happens automatically when building Release configuration in Xcode.

## File Sizes

| Component       | Debug       | Release            |
| --------------- | ----------- | ------------------ |
| **JS Bundle**   | N/A (Metro) | ~3.59 MB           |
| **Assets**      | ~100 KB     | ~100 KB            |
| **Native Code** | ~50 MB      | ~30 MB (optimized) |
| **Total App**   | ~50 MB      | ~35 MB             |

## Performance Comparison

| Metric            | Debug   | Release            |
| ----------------- | ------- | ------------------ |
| **Cold Start**    | 2-3s    | 1-2s               |
| **Hot Reload**    | Instant | N/A                |
| **Bundle Load**   | Network | Instant (embedded) |
| **Memory Usage**  | Higher  | Lower              |
| **Battery Usage** | Higher  | Lower              |

## App Store Submission Checklist

Before submitting:

- [ ] Build with Release configuration
- [ ] Test app without network connection
- [ ] Verify all features work
- [ ] Check app icon is correct
- [ ] Verify bundle identifier: `com.anonymous.Real-Emotion`
- [ ] Update version in `app.json` if needed
- [ ] Create archive in Xcode
- [ ] Upload to App Store Connect
- [ ] Submit for TestFlight beta testing
- [ ] Submit for App Store review

## Development vs Production

### For Daily Development

```bash
# Use Debug configuration
# Metro bundler must be running
npm start

# In Xcode: Configuration = Debug
# Build and run
```

### For Testing Production Behavior

```bash
# Export bundle
npx expo export --platform ios

# In Xcode: Configuration = Release
# Build and run
```

### For App Store Submission

```bash
# Export bundle
npx expo export --platform ios

# In Xcode:
# 1. Select "Any iOS Device"
# 2. Product → Archive
# 3. Distribute to App Store Connect
```

## Summary

✅ **Exported**: JavaScript bundle (~3.59 MB)  
✅ **Configured**: AppDelegate handles Debug vs Release  
✅ **Script Ready**: `copy-bundle.sh` copies bundle in Release builds  
✅ **Ready**: Build with Release configuration for production

### Next Steps:

1. **Add build phase** in Xcode (one-time setup)
2. **Change to Release** configuration in scheme
3. **Build app** (`Cmd + B`)
4. **Test** on device without network
5. **Archive** for App Store when ready

Your app will now work **completely standalone** without any network connection!
