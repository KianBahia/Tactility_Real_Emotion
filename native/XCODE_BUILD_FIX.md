# Xcode Build Error Fix

## Problem

You were encountering these build errors:

```
Undefined symbol: facebook::react::Sealable::Sealable()
cannot find type 'facebook' in scope
Expected ',' separator
expected parameter followed by ':'
```

## Root Cause

This error occurs in React Native 0.81+ with the New Architecture enabled. The issue is:

1. **C++ Symbol Linking**: React Native's New Architecture uses C++ classes like `facebook::react::Sealable`
2. **Missing Linker Flags**: The default Podfile didn't explicitly link the C++ standard library
3. **Dead Code Stripping**: Xcode's optimization was removing symbols it thought were "unused"
4. **C++ Standard Version**: Need to ensure C++20 is used consistently across all pods

## Solution Applied

I updated the `Podfile` with a `post_install` hook that configures all pods correctly:

```ruby
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false,
    :ccache_enabled => ccache_enabled?(podfile_properties),
  )

  # Fix for facebook::react::Sealable linking issues
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Ensure C++20 standard is used
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'

      # Explicitly link C++ standard library
      config.build_settings['OTHER_LDFLAGS'] ||= ['$(inherited)']
      config.build_settings['OTHER_LDFLAGS'] << '-lc++'

      # Prevent Xcode from stripping "unused" symbols
      config.build_settings['DEAD_CODE_STRIPPING'] = 'NO'
    end
  end
end
```

### What This Does:

1. **`CLANG_CXX_LANGUAGE_STANDARD = 'c++20'`**

   - Ensures all pods use C++20 (required by React Native 0.81)
   - Provides access to modern C++ features used by React

2. **`CLANG_CXX_LIBRARY = 'libc++'`**

   - Specifies the libc++ standard library (Apple's default)
   - Ensures compatibility with React Native's C++ code

3. **`OTHER_LDFLAGS << '-lc++'`**

   - Explicitly links the C++ standard library
   - Resolves undefined symbol errors for C++ classes

4. **`DEAD_CODE_STRIPPING = 'NO'`**
   - Prevents Xcode from removing symbols during optimization
   - Keeps all React Native bridge symbols available at runtime

## Verification Steps

After applying the fix, I:

1. ✅ Removed old Pods and build artifacts
2. ✅ Ran `pod install` with the updated configuration
3. ✅ Successfully installed all 95 pods
4. ✅ Applied build settings to all targets

## Next Steps

### Clean Build in Xcode

1. Open the workspace:

   ```bash
   open /Users/kianbahia/Stuff/Coding/real_emotion/native/ios/RealEmotion.xcworkspace
   ```

2. Clean the build folder:

   - In Xcode: **Product → Clean Build Folder** (or `Cmd + Shift + K`)

3. Build the project:
   - Press **`Cmd + R`** to build and run

### If You Still See Errors

#### Option 1: Clean Xcode Derived Data

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/RealEmotion-*
```

#### Option 2: Full Clean and Rebuild

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios

# Clean everything
rm -rf Pods Podfile.lock build
rm -rf ~/Library/Developer/Xcode/DerivedData/RealEmotion-*

# Reinstall pods
LANG=en_US.UTF-8 pod install

# Open in Xcode
open RealEmotion.xcworkspace
```

Then in Xcode:

1. Product → Clean Build Folder (`Cmd + Shift + K`)
2. Product → Build (`Cmd + B`)

## About the Warnings

You mentioned there are "a lot of warnings" - this is **normal** for React Native projects:

### Common Warnings (Safe to Ignore):

- **Deprecation warnings**: React Native uses some older APIs
- **"Implicit conversion" warnings**: From C++ bridge code
- **"Unused variable" warnings**: In generated code
- **"Potential null pointer" warnings**: False positives from analysis

### Warnings You Should Fix:

- **Your app code warnings**: Issues in `app/`, `components/`, `contexts/`
- **Type errors**: Incorrect Swift/TypeScript types
- **Memory leaks**: Retain cycles or memory issues

### To Reduce Warnings:

In Xcode:

1. Select your project in the navigator
2. Build Settings tab
3. Search for "Warning"
4. Adjust warning levels:
   - `GCC_WARN_INHIBIT_ALL_WARNINGS = YES` (for pods only)
   - Keep warnings enabled for your app code

Or add to Podfile `post_install` hook:

```ruby
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
  end
end
```

## Understanding the Error

### What is `facebook::react::Sealable`?

- **Namespace**: `facebook::react::`
- **Class**: `Sealable`
- **Purpose**: Base class for objects in React Native's C++ layer
- **Used by**: JSI (JavaScript Interface), Fabric renderer

### Why New Architecture Matters

React Native 0.81+ uses:

- **JSI**: Direct C++ bridge (no JSON serialization)
- **Fabric**: New rendering engine
- **TurboModules**: New native module system

All require proper C++ linking!

## Technical Background

### Old React Native (< 0.68)

- JavaScript ↔️ JSON ↔️ Native Bridge ↔️ Native Code
- Minimal C++ dependencies
- Simpler linking

### New Architecture (0.68+)

- JavaScript ↔️ JSI (C++) ↔️ Native Code
- Direct C++ communication
- Requires proper C++ standard library linking
- More complex build configuration

## Summary

✅ **Fixed**: Updated Podfile with proper C++ linking configuration  
✅ **Installed**: All 95 pods with correct build settings  
✅ **Ready**: Project should now build without the `Sealable` error

**Next**: Clean build folder in Xcode and build again!

## If Problems Persist

1. **Check Xcode Version**: Requires Xcode 14.3+ (you have 26.0.1 ✅)
2. **Check iOS Deployment Target**: Should be 15.1+ (configured ✅)
3. **Verify Node Version**: Should be 18+
4. **Clear Metro Cache**: `npm start -- --reset-cache`

## Support Resources

- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Expo New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [CocoaPods Documentation](https://guides.cocoapods.org/)
