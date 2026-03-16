#!/bin/bash
# ════════════════════════════════════════════════════
#  D-Fit Android Setup Script
#  Run this from inside the project folder
# ════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   D-Fit Android Conversion Setup    ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Install dependencies ──────────────────
echo "► Installing project dependencies..."
npm install
echo "✅ npm install done"
echo ""

# ── Step 2: Install Capacitor ─────────────────────
echo "► Installing Capacitor packages..."
npm install @capacitor/core @capacitor/cli @capacitor/android
echo "✅ Capacitor installed"
echo ""

# ── Step 3: Initialize Capacitor ──────────────────
echo "► Initializing Capacitor..."
npx cap init "D-Fit Scheduler" "com.dfit.scheduler" --web-dir "."
echo "✅ Capacitor initialized"
echo ""

# ── Step 4: Add Android platform ──────────────────
echo "► Adding Android platform..."
npx cap add android
echo "✅ Android platform added"
echo ""

# ── Step 5: Sync ──────────────────────────────────
echo "► Syncing files to Android..."
npx cap sync android
echo "✅ Sync complete"
echo ""

echo "════════════════════════════════════════"
echo ""
echo "✅ ALL DONE! Now do these last steps:"
echo ""
echo "  1. Open capacitor.config.json"
echo "     → Replace YOUR-APP-NAME with your Render URL"
echo ""
echo "  2. Run this to open Android Studio:"
echo "     npx cap open android"
echo ""
echo "  3. In Android Studio:"
echo "     Build → Generate Signed APK → follow wizard"
echo ""
echo "  4. APK location after build:"
echo "     android/app/release/app-release.apk"
echo ""
echo "  Transfer the APK to your phone and install!"
echo ""
