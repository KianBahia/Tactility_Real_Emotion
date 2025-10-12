#!/bin/bash

# Complete Production Build Script for Real Emotion
# This script exports the bundle and prepares for production build

set -e

echo "🏗️  Real Emotion - Production Build"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

echo -e "${BLUE}Step 1: Cleaning previous builds...${NC}"
rm -rf dist
rm -rf ios/build
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

echo -e "${BLUE}Step 2: Exporting JavaScript bundle...${NC}"
npx expo export --platform ios
echo -e "${GREEN}✅ Bundle exported${NC}"
echo ""

echo -e "${BLUE}Step 3: Verifying bundle...${NC}"
BUNDLE_PATH=$(ls dist/_expo/static/js/ios/*.hbc 2>/dev/null | head -n 1)

if [ -f "$BUNDLE_PATH" ]; then
    BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
    echo -e "${GREEN}✅ Bundle found: $BUNDLE_SIZE${NC}"
    echo "   Path: $BUNDLE_PATH"
else
    echo -e "${YELLOW}⚠️  Bundle not found! Something went wrong.${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 4: Copying bundle to iOS...${NC}"
# Copy the bundle with a consistent name
DEST_DIR="ios"
DEST_FILE="$DEST_DIR/main.jsbundle"

cp "$BUNDLE_PATH" "$DEST_FILE"
echo -e "${GREEN}✅ Bundle copied to: $DEST_FILE${NC}"
echo ""

echo "===================================="
echo -e "${GREEN}✅ Production bundle ready!${NC}"
echo "===================================="
echo ""
echo "Next steps in Xcode:"
echo ""
echo "1. Open workspace:"
echo "   open ios/RealEmotion.xcworkspace"
echo ""
echo "2. Change to Release configuration:"
echo "   Product → Scheme → Edit Scheme"
echo "   Run → Build Configuration → Release"
echo ""
echo "3. Build and run:"
echo "   Cmd + R"
echo ""
echo "4. App will run WITHOUT Metro bundler!"
echo ""
echo "For App Store:"
echo "   Product → Archive"
echo "   Then distribute to App Store Connect"
echo ""
echo "Bundle info:"
echo "   Size: $BUNDLE_SIZE"
echo "   Location: $DEST_FILE"
echo ""

