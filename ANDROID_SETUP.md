# D-Fit Android Setup Guide

## What's already done for you in this package ✅

| File | What it does |
|------|-------------|
| `manifest.json` | Makes the app installable on Android (PWA) |
| `service-worker.js` | Enables offline use + caching |
| `capacitor.config.json` | Capacitor settings for building the APK |
| `icon-192.png` | App icon (small) |
| `icon-512.png` | App icon (large) |
| `apple-touch-icon.png` | iOS home screen icon |
| `index.html` | Updated with PWA meta tags |
| `app.html` | Updated with PWA meta tags |
| `setup-android.sh` | Automated setup script |

---

## Before you start — install these tools

| Tool | Download link |
|------|--------------|
| Node.js (LTS) | https://nodejs.org |
| VS Code | https://code.visualstudio.com |
| Android Studio | https://developer.android.com/studio |
| Git | https://git-scm.com |

---

## Step 1 — Deploy your backend to Render.com

Your app.html and index.html talk to the server.js backend.
This backend must be online for the Android app to work.

1. Create account at https://github.com and https://render.com
2. Push project to GitHub:
   ```
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/d-fit-scheduler.git
   git push -u origin main
   ```
3. On Render.com: New Web Service → connect your GitHub repo
4. Set these:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `GROQ_API_KEY` = your Groq API key
6. Click Deploy → wait 2 minutes → copy your URL (e.g. https://d-fit.onrender.com)

---

## Step 2 — Update your backend URL

Open `capacitor.config.json` and replace `YOUR-APP-NAME` with your actual Render URL:

```json
"url": "https://d-fit.onrender.com"
```

---

## Step 3 — Run the setup script

Open VS Code → open the project folder → open Terminal (Ctrl + `)

On Mac/Linux:
```bash
chmod +x setup-android.sh
./setup-android.sh
```

On Windows:
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "D-Fit Scheduler" "com.dfit.scheduler" --web-dir "."
npx cap add android
npx cap sync android
```

---

## Step 4 — Build APK in Android Studio

```bash
npx cap open android
```

This opens Android Studio. Then:

1. Wait for Gradle to finish syncing (bottom progress bar)
2. Click **Build** menu → **Generate Signed Bundle/APK**
3. Choose **APK**
4. Click **Create new keystore** → fill in any details → remember the password
5. Click **Next** → choose **release** → click **Finish**
6. APK is saved at: `android/app/release/app-release.apk`

---

## Step 5 — Install on your Android phone

Option A — Direct install:
1. Connect phone via USB cable
2. Enable Developer Options on phone: Settings → About Phone → tap Build Number 7 times
3. Enable USB Debugging in Developer Options
4. In Android Studio click the ▶ Run button

Option B — Manual install:
1. Copy `app-release.apk` to your phone (USB or email to yourself)
2. Open the APK file on your phone
3. Allow "Install from unknown sources" when prompted
4. App installs and appears on home screen

---

## Troubleshooting

**"API not working" in app** → Check your Render URL in capacitor.config.json

**"Cannot read properties" error** → Run `npx cap sync android` again after any code changes

**Android Studio shows red errors** → File → Sync Project with Gradle Files

**App crashes on start** → Check your Render backend is running (visit the URL in a browser)
