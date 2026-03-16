# D-Fit AI Fitness Coach

A full-stack AI-powered personal fitness coach web app. Features a real LLM (Groq / LLaMA 3.3 70B), MongoDB Atlas database, user authentication, activity tracking, BMI analysis, and Apple-inspired UI with dark mode.

---

## Features

- **User Auth** — Register with username + password, login, logout. All data persists in MongoDB across sessions.
- **Guest Access** — Try the app without signing up (no data saved to DB).
- **Groq AI Coach** — Powered by LLaMA 3.3 70B via Groq API. Gives real, personalised fitness advice based on your profile.
- **BMI Calculator** — Live BMI with colour-coded category bar and TDEE estimation.
- **My Activity Card** — Log daily workouts by muscle group + steps. Auto-saves. 30-day pie chart overview.
- **Chat History** — Full conversation history saved per user in MongoDB. Survives logout and browser close.
- **Dark Mode** — Toggle persists via `localStorage`.
- **Responsive** — Works on desktop and mobile; sidebar collapses on small screens.

---

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES2020) |
| Backend  | Node.js + Express                        |
| Database | MongoDB Atlas                            |
| AI       | Groq API — LLaMA 3.3 70B Versatile       |
| Auth     | Username/password stored in MongoDB      |
| Fonts    | Google Fonts — Inter                     |

---

## Project Structure

```
D-fit-scheduler-main/
├── server.js         # Express backend — API routes for auth, chat, activity, sessions
├── package.json      # Node.js dependencies
├── .env              # Secret keys (NOT committed to git)
├── index.html        # Landing page — login / register modals
├── app.html          # Chat application shell
├── styles.css        # Full Apple-style design system (light + dark)
├── landing.js        # Landing page logic — auth, BMI preview, modal routing
└── app.js            # Chat engine, activity card, session management
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A MongoDB Atlas cluster
- A Groq API key (from [console.groq.com](https://console.groq.com))

### 1. Clone the repo

```bash
git clone https://github.com/shreyasme/fitness.git
cd fitness
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

Create a file named `.env` in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=your_mongodb_atlas_connection_string_here
```

### 4. Start the server

```bash
node server.js
```

You should see:

```
✅ Connected to MongoDB Atlas — database: dfit
🚀 D-Fit server running at http://localhost:3000
```

### 5. Open in browser

```
http://localhost:3000/index.html
```

### Stop the server

```bash
pkill -f "node server.js"
```

Or press `Ctrl + C` in the terminal where it's running.

---

## API Endpoints

| Method | Endpoint                  | Description                     |
| ------ | ------------------------- | ------------------------------- |
| `POST` | `/api/register`           | Create a new user account       |
| `POST` | `/api/login`              | Login and get profile           |
| `POST` | `/api/chat`               | Send message, get Groq AI reply |
| `GET`  | `/api/activity/:username` | Load activity data              |
| `PUT`  | `/api/activity/:username` | Save activity data              |
| `GET`  | `/api/sessions/:username` | Load chat sessions              |
| `PUT`  | `/api/sessions/:username` | Save chat sessions              |

---

## Usage

1. Open `http://localhost:3000/index.html`
2. Click **Create My Profile** → enter your name, height, weight, age, gender, goal, username, password
3. Login with your username and password
4. Chat with the AI fitness coach — ask anything about workouts, nutrition, BMI, calories, sleep, etc.
5. Log your daily workouts in the **My Activity** card in the sidebar
6. All your data is saved to MongoDB and available after logout

---

## MongoDB Collections

| Collection | Stores                               |
| ---------- | ------------------------------------ |
| `users`    | username, password, profile data     |
| `activity` | daily muscle logs and steps per user |
| `sessions` | full chat history per user           |

---

## Design System

- **Font** — Inter (Google Fonts) with Apple SF Pro fallback
- **Light mode** — `#F2F2F7` backgrounds, pure white surfaces, `#007AFF` accent
- **Dark mode** — `#000000` base, `#1C1C1E` surfaces, `#0A84FF` accent
- **Radius scale** — 8px → 100px pill, matching Apple HIG guidelines

---

## License

MIT — free to use, modify, and distribute.

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

| Topic             | What it covers                                                     |
| ----------------- | ------------------------------------------------------------------ |
| BMI               | Category explanation and health implications                       |
| Calories / TDEE   | Daily energy needs via Mifflin-St Jeor formula                     |
| Workout Plans     | Weekly schedules based on goal (weight loss, muscle gain, general) |
| Nutrition         | Macro targets, food recommendations, meal timing                   |
| Hydration         | Daily water intake based on body weight                            |
| Sleep & Recovery  | Sleep targets, recovery protocols, active rest tips                |
| Motivation        | Plateau-busting strategies and habit building                      |
| Flexibility       | Daily stretch routines and yoga style guidance                     |
| Progress Tracking | Measurement advice and recommended tracking apps                   |

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

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Markup      | HTML5                                                             |
| Styling     | CSS3 — custom properties, grid, flexbox, backdrop-filter          |
| Logic       | Vanilla JavaScript ES2020 — no frameworks                         |
| Persistence | `localStorage` (chat history) + `sessionStorage` (active profile) |
| Fonts       | Google Fonts — Inter                                              |

---

## License

MIT — free to use, modify, and distribute.
