# D-Fit Scheduler Chatbot

A clean, professional AI-powered fitness assistant web app with an Apple-inspired white interface, dark mode support, BMI calculator, personalised AI chat, and full conversation history.

---

## Features

- **Landing Page** — Choose between Guest Access or Personal Profile login
- **BMI Calculator** — Enter height, weight, age, and gender to compute BMI live with a colour-coded category bar
- **AI Chat Coach** — Personalised fitness, nutrition, hydration, sleep, and workout advice driven by your BMI and profile data
- **Chat History** — All conversations saved per user in the left sidebar using `localStorage`
- **Delete Conversations** — Bin icon on hover to remove individual chat sessions
- **Profile Chip** — Top-right avatar with dropdown showing name, session type, and Sign Out
- **Dark Mode** — Toggle persists across sessions via `localStorage`
- **Responsive** — Works on desktop and mobile; sidebar collapses on small screens

---

## Project Structure

```
Dfit/
├── index.html      # Landing page — guest / user login + BMI modal
├── app.html        # Chat application shell
├── styles.css      # Full Apple-style design system (light + dark)
├── landing.js      # Landing page logic, BMI calculator, modal controls
└── app.js          # Chat engine, AI response generator, session history
```

---

## Getting Started

No build step or dependencies required — plain HTML, CSS, and JavaScript.

### Run locally

```bash
# Using Python (built-in on macOS)
python3 -m http.server 5500

# Then open in browser
open http://localhost:5500
```

Or just open `index.html` directly in any modern browser.

---

## Usage

1. Open the app — you land on the **D-Fit Scheduler** home page
2. Choose **Guest Access** (skip signup, optional stats) or **Personal Profile** (full biometric setup)
3. Enter your **Height**, **Weight**, **Age**, and **Gender** — BMI is calculated live with a colour bar
4. Optionally set your **Fitness Goal** and **Activity Level** for more tailored advice
5. Click **Launch** — you enter the AI chat interface
6. Type any fitness question or pick a suggested prompt
7. Chat history is saved in the left sidebar — click any session to resume, hover to delete
8. Click your **profile chip** (top right) → **Sign out** to return to the landing page

---

## AI Topics Covered

| Topic | What it covers |
|---|---|
| BMI | Category explanation and health implications |
| Calories / TDEE | Daily energy needs via Mifflin-St Jeor formula |
| Workout Plans | Weekly schedules based on goal (weight loss, muscle gain, general) |
| Nutrition | Macro targets, food recommendations, meal timing |
| Hydration | Daily water intake based on body weight |
| Sleep & Recovery | Sleep targets, recovery protocols, active rest tips |
| Motivation | Plateau-busting strategies and habit building |
| Flexibility | Daily stretch routines and yoga style guidance |
| Progress Tracking | Measurement advice and recommended tracking apps |

---

## Design System

- **Font** — Inter (Google Fonts) with Apple SF Pro fallback
- **Light mode** — `#F2F2F7` backgrounds, pure white surfaces, `#007AFF` accent
- **Dark mode** — `#000000` base, `#1C1C1E` surfaces, `#0A84FF` accent
- **Logo** — Custom SVG dumbbell with a bold **D** centered between the plates on a dark charcoal `#111827` background
- **Radius scale** — 8 px → 100 px pill, matching Apple HIG guidelines
- **Transitions** — `cubic-bezier(0.4, 0, 0.2, 1)` throughout for smooth, natural feel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — custom properties, grid, flexbox, backdrop-filter |
| Logic | Vanilla JavaScript ES2020 — no frameworks |
| Persistence | `localStorage` (chat history) + `sessionStorage` (active profile) |
| Fonts | Google Fonts — Inter |

---

## License

MIT — free to use, modify, and distribute.
