# Running on Physical Device - Setup Guide

## Problem You Encountered

When running the app on your physical iPhone, you saw these errors:

```
Cannot start load of Task since it does not conform to ATS policy
Error Domain=NSURLErrorDomain Code=-1022
"The resource could not be loaded because the App Transport Security policy
requires the use of a secure connection."

No script URL provided. Make sure the packager is running or you have
embedded a JS bundle in your application bundle.
```

## Root Cause

1. **App Transport Security (ATS)**: iOS blocks HTTP connections by default
2. **Metro Bundler**: Runs on HTTP (not HTTPS) during development
3. **Network Connection**: Your iPhone needs to connect to Metro on your Mac over WiFi

## Solution Applied

### 1. Updated Info.plist

I've configured the app to allow HTTP connections to Metro bundler:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>localhost</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

This allows:

- ✅ Local network connections (Metro on your Mac)
- ✅ HTTP to localhost
- ❌ Still blocks arbitrary HTTP connections (secure by default)

## Steps to Run on Physical Device

### Step 1: Make Sure iPhone and Mac are on Same WiFi

**Critical**: Both devices MUST be on the same WiFi network!

Check on iPhone:

- Settings → WiFi → Check network name

Check on Mac:

- System Settings → WiFi → Check network name

### Step 2: Find Your Mac's IP Address

**Option A: From Terminal**

```bash
ipconfig getifaddr en0
```

**Option B: From System Settings**

1. System Settings → Network
2. WiFi → Details
3. Look for "IP Address" (usually starts with 192.168.x.x or 10.0.x.x)

Example IP: `192.168.1.5`

### Step 3: Start Metro Bundler

In Terminal:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npm start
```

You should see:

```
Metro waiting on exp://192.168.x.x:8081
```

**Important**: Note the IP address shown!

### Step 4: Configure Xcode for Your IP

#### Option A: Automatic (Preferred)

1. Build the app in Xcode with your iPhone connected
2. Xcode should automatically detect and configure the connection

#### Option B: Manual Configuration

If automatic doesn't work, shake your iPhone after the app launches:

1. Open the app on iPhone
2. Shake the device
3. Tap "Configure Bundler"
4. Enter: `192.168.x.x:8081` (your Mac's IP + port 8081)
5. Reload the app

### Step 5: Build and Run

1. **Connect iPhone via USB**
2. **Select your iPhone** in Xcode's device selector
3. **Trust the developer** (first time only):
   - iPhone: Settings → General → VPN & Device Management
   - Tap your developer profile
   - Tap "Trust"
4. **Build and Run**: Press `Cmd + R` in Xcode

## Troubleshooting

### Error: "No script URL provided"

**Cause**: App can't connect to Metro bundler

**Solutions**:

1. **Check Metro is running**:

   ```bash
   cd /Users/kianbahia/Stuff/Coding/real_emotion/native
   npm start
   ```

2. **Verify same WiFi network**:

   - iPhone and Mac must be on same WiFi
   - Corporate/School WiFi may block device-to-device communication

3. **Check firewall settings** on Mac:

   - System Settings → Network → Firewall
   - Ensure Node.js is allowed
   - Or temporarily disable firewall for testing

4. **Shake device and configure manually**:
   - Open app on iPhone
   - Shake device
   - Tap "Settings"
   - Enter your Mac's IP address and port 8081

### Error: "ATS policy" still appearing

**Solution**: Clean and rebuild

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native/ios
rm -rf build
```

Then in Xcode:

- Product → Clean Build Folder (`Cmd + Shift + K`)
- Product → Build (`Cmd + B`)

### Metro bundler can't be reached

**Solutions**:

1. **Check IP address is correct**:

   ```bash
   # Get your Mac's IP
   ipconfig getifaddr en0

   # Verify Metro is listening on that IP
   curl http://YOUR_IP:8081/status
   # Should return: {"packager":"running"}
   ```

2. **Restart Metro with explicit host**:

   ```bash
   cd /Users/kianbahia/Stuff/Coding/real_emotion/native
   npx expo start --host $(ipconfig getifaddr en0)
   ```

3. **Check port 8081 is not blocked**:
   ```bash
   lsof -i :8081
   # Should show Node.js process
   ```

### Device shows "Untrusted Developer"

**Solution**: Trust your development profile

1. iPhone → Settings → General → VPN & Device Management
2. Tap on your developer profile
3. Tap "Trust"
4. Confirm

### Build succeeds but app shows white screen

**Cause**: Metro connection established but bundle not loaded

**Solution**:

1. Shake device
2. Tap "Reload"
3. Or force quit app and relaunch

## Alternative: Use Release Build

If you can't get Metro working, build a standalone release version:

### In Xcode:

1. Product → Scheme → Edit Scheme
2. Run → Build Configuration → **Release**
3. Build and run (`Cmd + R`)

**Note**: Release builds don't need Metro, but you lose:

- Hot reload
- Fast refresh
- Dev menu
- Chrome debugging

## Network Requirements

### What You Need:

✅ **Same WiFi network** for iPhone and Mac  
✅ **Port 8081 open** on your Mac  
✅ **Firewall allows Node.js** connections  
✅ **Network allows device-to-device** communication

### What Won't Work:

❌ iPhone on cellular, Mac on WiFi  
❌ Different WiFi networks  
❌ VPN active on either device (sometimes)  
❌ Corporate WiFi with device isolation

## Testing Your Setup

### 1. Test Metro is Running

From your Mac:

```bash
curl http://localhost:8081/status
```

Should return: `{"packager":"running"}`

### 2. Test from iPhone's Perspective

From your Mac (substitute YOUR_IP):

```bash
curl http://YOUR_IP:8081/status
```

Should return: `{"packager":"running"}`

If this fails, Metro isn't accessible on your network.

### 3. Test iPhone Can Reach Mac

On your iPhone:

1. Open Safari
2. Navigate to: `http://YOUR_MAC_IP:8081/status`
3. Should see: `{"packager":"running"}`

If Safari can't reach it, your network is blocking connections.

## Quick Start Command

Start Metro with automatic IP detection:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npx expo start --ios --host $(ipconfig getifaddr en0)
```

## For Production/TestFlight

When ready for production, you'll want to embed the JS bundle:

```bash
cd /Users/kianbahia/Stuff/Coding/real_emotion/native
npx expo export --platform ios
```

Then build with Release configuration in Xcode.

## Summary

✅ **Fixed**: Info.plist now allows local network HTTP connections  
✅ **Required**: iPhone and Mac on same WiFi  
✅ **Required**: Metro bundler running on Mac  
✅ **Port**: 8081 must be accessible

### Next Steps:

1. **Rebuild the app** in Xcode (with Info.plist changes)
2. **Start Metro**: `cd native && npm start`
3. **Connect iPhone** via USB
4. **Build and run** from Xcode
5. **Verify connection**: App should load from Metro

If problems persist, try the manual configuration by shaking the device!
