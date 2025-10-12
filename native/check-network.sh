#!/bin/bash

# Network Configuration Checker for iOS Device Development
# This script helps diagnose Metro bundler connectivity issues

set -e

echo "🔍 Real Emotion - Network Configuration Check"
echo "=============================================="
echo ""

# Get IP address
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "NOT_FOUND")

if [ "$IP" = "NOT_FOUND" ]; then
    echo "❌ Could not find IP address"
    echo "   Make sure you're connected to WiFi"
    echo ""
    exit 1
fi

echo "✅ Mac IP Address: $IP"
echo ""

# Check if Metro is running
echo "📦 Checking Metro Bundler..."
if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "✅ Metro bundler is running on localhost:8081"
    
    # Check if it's accessible from network
    if curl -s http://$IP:8081/status > /dev/null 2>&1; then
        echo "✅ Metro bundler is accessible from network"
        echo "   URL: http://$IP:8081"
    else
        echo "⚠️  Metro bundler is NOT accessible from network"
        echo "   This might be a firewall issue"
    fi
else
    echo "❌ Metro bundler is NOT running"
    echo ""
    echo "To start Metro:"
    echo "  cd /Users/kianbahia/Stuff/Coding/real_emotion/native"
    echo "  npm start"
fi

echo ""
echo "📱 Device Configuration"
echo "======================="
echo ""
echo "On your iPhone, make sure:"
echo "  1. Connected to same WiFi network"
echo "  2. Open the app"
echo "  3. If needed, shake device and configure bundler"
echo "  4. Enter this URL: $IP:8081"
echo ""

# Check firewall status
echo "🔥 Checking Firewall..."
if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
    echo "⚠️  Firewall is ENABLED"
    echo "   If you have connection issues, you may need to:"
    echo "   - Allow Node.js in System Settings → Network → Firewall"
    echo "   - Or temporarily disable firewall for testing"
else
    echo "✅ Firewall is disabled"
fi

echo ""
echo "🧪 Test Commands"
echo "================"
echo ""
echo "Test from Mac:"
echo "  curl http://$IP:8081/status"
echo ""
echo "Test from iPhone Safari:"
echo "  Open: http://$IP:8081/status"
echo "  Should see: {\"packager\":\"running\"}"
echo ""

# Check port 8081
echo "🔌 Checking Port 8081..."
PORT_CHECK=$(lsof -i :8081 2>/dev/null | grep LISTEN || echo "")
if [ -n "$PORT_CHECK" ]; then
    echo "✅ Port 8081 is in use (good)"
    echo "   Process: $PORT_CHECK"
else
    echo "⚠️  Port 8081 is not in use"
    echo "   Metro bundler might not be running"
fi

echo ""
echo "=============================================="
echo "📋 Summary"
echo "=============================================="
echo ""
echo "Your Mac's IP: $IP"
echo "Metro Port: 8081"
echo "Full URL: http://$IP:8081"
echo ""
echo "Next steps:"
echo "  1. Make sure Metro is running: npm start"
echo "  2. Rebuild app in Xcode with updated Info.plist"
echo "  3. Connect iPhone via USB"
echo "  4. Build and run from Xcode"
echo ""
echo "If app shows error:"
echo "  1. Shake iPhone"
echo "  2. Tap 'Configure Bundler'"
echo "  3. Enter: $IP:8081"
echo "  4. Reload app"
echo ""

