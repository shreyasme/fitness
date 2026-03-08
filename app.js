/* ============================================================
   app.js — D-Fit Scheduler Chatbot Chat Application
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
let profile   = null;
let sessions  = [];        // [{ id, title, messages: [{role,text,time}] }]
let activeId  = null;
let isTyping  = false;
let msgCount  = 0;

// ─── DOM refs ────────────────────────────────────────────────
const html             = document.documentElement;
const sideThemeToggle  = document.getElementById('sideThemeToggle');
const sideThemeLabel   = document.getElementById('sideThemeLabel');
const sidebar          = document.getElementById('sidebar');
const sidebarToggle    = document.getElementById('sidebarToggle');
const sidebarBody      = document.getElementById('sidebarBody');
const historyList      = document.getElementById('historyList');
const newChatBtn       = document.getElementById('newChatBtn');
const chatMessages     = document.getElementById('chatMessages');
const welcomeScreen    = document.getElementById('welcomeScreen');
const welcomeSub       = document.getElementById('welcomeSub');
const chatInput        = document.getElementById('chatInput');
const sendBtn          = document.getElementById('sendBtn');
const bmiBadgeCard     = document.getElementById('bmiBadgeCard');
const sidebarBmiValue  = document.getElementById('sidebarBmiValue');
const sidebarBmiCat    = document.getElementById('sidebarBmiCat');
const sidebarBmiStats  = document.getElementById('sidebarBmiStats');
const topbarBmiPill    = document.getElementById('topbarBmiPill');
const topbarUserAvatar = document.getElementById('topbarUserAvatar');
const topbarUserName   = document.getElementById('topbarUserName');
const profileChip      = document.getElementById('profileChip');
const profileDropdown  = document.getElementById('profileDropdown');
const dropdownAvatar   = document.getElementById('dropdownAvatar');
const dropdownName     = document.getElementById('dropdownName');
const dropdownMode     = document.getElementById('dropdownMode');
const logoutBtn        = document.getElementById('logoutBtn');
const suggestedPrompts = document.getElementById('suggestedPrompts');

// ─── Theme ───────────────────────────────────────────────────
function applyTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  sideThemeLabel.textContent = dark ? '🌙' : '☀️';
  localStorage.setItem('dfitTheme', dark ? 'dark' : 'light');
}

const savedTheme  = localStorage.getItem('dfitTheme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

sideThemeToggle.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') !== 'dark');
});

// ─── Sidebar Toggle ──────────────────────────────────────────
sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// ─── Logout ──────────────────────────────────────────────────
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('dfitProfile');
  window.location.href = 'index.html';
});

// ─── Profile chip dropdown toggle ─────────────────────────────────────
function closeDropdown() {
  profileChip.classList.remove('open');
  profileDropdown.classList.remove('open');
}
profileChip.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = profileDropdown.classList.contains('open');
  isOpen ? closeDropdown() : (profileChip.classList.add('open'), profileDropdown.classList.add('open'));
});
profileChip.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') profileChip.click(); });
document.addEventListener('click', closeDropdown);

// ─── BMI Utils ───────────────────────────────────────────────
function bmiCategory(bmi) {
  if (!bmi) return { label: 'N/A', color: 'var(--text-tertiary)', pct: 0 };
  if (bmi < 16)   return { label: 'Severely Underweight', color: '#FF3B30', pct: 5  };
  if (bmi < 18.5) return { label: 'Underweight',           color: '#FF9500', pct: 20 };
  if (bmi < 25)   return { label: 'Normal Weight',         color: '#34C759', pct: 50 };
  if (bmi < 30)   return { label: 'Overweight',            color: '#FF9500', pct: 72 };
  if (bmi < 35)   return { label: 'Obese Class I',         color: '#FF3B30', pct: 82 };
  if (bmi < 40)   return { label: 'Obese Class II',        color: '#FF3B30', pct: 92 };
  return             { label: 'Obese Class III',            color: '#FF3B30', pct: 99 };
}

function bmrValue(p) {
  // Mifflin-St Jeor
  if (!p.weight || !p.height || !p.age) return null;
  const base = p.gender === 'female'
    ? 10*p.weight + 6.25*p.height - 5*p.age - 161
    : 10*p.weight + 6.25*p.height - 5*p.age + 5;
  const mults = { sedentary:1.2, light:1.375, moderate:1.55, very:1.725, athlete:1.9 };
  return Math.round(base * (mults[p.activity] || 1.2));
}

// ─── Profile Setup ───────────────────────────────────────────
function initProfile() {
  const raw = sessionStorage.getItem('dfitProfile');
  if (!raw) { window.location.href = 'index.html'; return; }
  profile = JSON.parse(raw);

  // Topbar profile chip + dropdown
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : 'G';
  topbarUserAvatar.textContent = initial;
  topbarUserName.textContent   = profile.name || 'Guest';
  dropdownAvatar.textContent   = initial;
  dropdownName.textContent     = profile.name || 'Guest';
  dropdownMode.textContent     = profile.mode === 'user' ? 'Personal Profile' : 'Guest Session';

  // BMI card
  if (profile.bmi) {
    const cat = bmiCategory(profile.bmi);
    bmiBadgeCard.style.display = 'block';
    sidebarBmiValue.textContent = profile.bmi;
    sidebarBmiCat.textContent   = cat.label;

    const tdee = bmrValue(profile);
    let statsHTML = '';
    if (profile.height) statsHTML += `<div class="bmi-stat"><div class="bmi-stat-label">Height</div><div class="bmi-stat-val">${profile.height}cm</div></div>`;
    if (profile.weight) statsHTML += `<div class="bmi-stat"><div class="bmi-stat-label">Weight</div><div class="bmi-stat-val">${profile.weight}kg</div></div>`;
    if (profile.age)    statsHTML += `<div class="bmi-stat"><div class="bmi-stat-label">Age</div><div class="bmi-stat-val">${profile.age}y</div></div>`;
    if (tdee)           statsHTML += `<div class="bmi-stat"><div class="bmi-stat-label">TDEE</div><div class="bmi-stat-val">${tdee} kcal</div></div>`;
    sidebarBmiStats.innerHTML = statsHTML;

    // Topbar pill
    topbarBmiPill.textContent = `BMI ${profile.bmi}`;
    topbarBmiPill.style.display = 'inline-flex';
  }

  // Welcome sub text
  if (profile.name && profile.name !== 'Guest') {
    welcomeSub.textContent = `Welcome, ${profile.name}! I'm your personalised D-Fit AI coach. I have your biometric data ready — just ask me anything.`;
  }

  // Load saved sessions from localStorage
  const stored = localStorage.getItem('dfitSessions_' + (profile.username || profile.name || 'guest'));
  if (stored) {
    try { sessions = JSON.parse(stored); } catch { sessions = []; }
  }

  renderHistory();
  initActivityCard();
}

// ─── Session Management ──────────────────────────────────────
function saveSessions() {
  localStorage.setItem('dfitSessions_' + (profile.username || profile.name || 'guest'), JSON.stringify(sessions));
}

function getActiveSession() {
  return sessions.find(s => s.id === activeId) || null;
}

function createSession() {
  const now = new Date();
  const session = {
    id:       Date.now(),
    title:    'New Chat',
    created:  now.toISOString(),
    messages: []
  };
  sessions.unshift(session);
  activeId = session.id;
  saveSessions();
  renderHistory();
  showWelcome();
  return session;
}

function loadSession(id) {
  activeId = id;
  const session = getActiveSession();
  if (!session) return;

  // Clear messages area
  chatMessages.innerHTML = '';

  if (session.messages.length === 0) {
    showWelcome();
  } else {
    session.messages.forEach(m => renderBubble(m.role, m.text, m.time, false));
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  renderHistory();
}

function showWelcome() {
  chatMessages.innerHTML = '';
  const ws = document.createElement('div');
  ws.className = 'welcome-screen';
  ws.id = 'welcomeScreen';
  ws.innerHTML = `
    <div class="welcome-icon">
      <svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg" width="64" height="28" aria-hidden="true">
        <rect x="0"  y="0" width="10" height="28" rx="2.5"  fill="white"/>
        <rect x="10" y="5" width="4"  height="18" rx="1.5"  fill="white" opacity="0.5"/>
        <rect x="14" y="9" width="3"  height="10" rx="1"    fill="white" opacity="0.72"/>
        <rect x="17" y="12" width="9" height="4"  rx="1"    fill="white" opacity="0.35"/>
        <text x="32" y="20" font-family="'Arial Black',Impact,'Helvetica Neue',sans-serif" font-size="18" font-weight="900" fill="white" text-anchor="middle">D</text>
        <rect x="38" y="12" width="9" height="4"  rx="1"    fill="white" opacity="0.35"/>
        <rect x="47" y="9" width="3"  height="10" rx="1"    fill="white" opacity="0.72"/>
        <rect x="50" y="5" width="4"  height="18" rx="1.5"  fill="white" opacity="0.5"/>
        <rect x="54" y="0" width="10" height="28" rx="2.5"  fill="white"/>
      </svg>
    </div>
    <h2 class="welcome-title">Hello! I'm D-Fit Coach</h2>
    <p class="welcome-sub">${welcomeSub.textContent || 'Your AI-powered fitness and nutrition assistant.'}</p>
    <div class="suggested-prompts" id="suggestedPrompts">
      <button class="suggested-prompt" data-prompt="Give me a beginner workout plan for this week">🗓️ Give me a beginner workout plan for this week</button>
      <button class="suggested-prompt" data-prompt="What should I eat to meet my fitness goal?">🥗 What should I eat to meet my fitness goal?</button>
      <button class="suggested-prompt" data-prompt="How many calories should I burn per day?">🔥 How many calories should I burn per day?</button>
      <button class="suggested-prompt" data-prompt="Explain my BMI and what it means for my health">📊 Explain my BMI and what it means</button>
    </div>
  `;
  chatMessages.appendChild(ws);

  // Reattach prompt click handlers
  ws.querySelectorAll('.suggested-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.prompt;
      adjustTextarea();
      sendMessage();
    });
  });
}

// ─── Render History ──────────────────────────────────────────
function renderHistory() {
  historyList.innerHTML = '';

  if (sessions.length === 0) {
    historyList.innerHTML = `<p style="font-size:12px;color:var(--text-tertiary);padding:8px 10px">No conversations yet. Start a new chat!</p>`;
    return;
  }

  // Group by date
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups    = {};

  sessions.forEach(s => {
    const d    = new Date(s.created).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(s.created).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  });

  Object.entries(groups).forEach(([label, list]) => {
    const section = document.createElement('div');
    section.className = 'history-section';
    section.innerHTML = `<div class="history-section-label">${label}</div>`;

    list.forEach(s => {
      const item = document.createElement('div');
      item.className = 'history-item' + (s.id === activeId ? ' active' : '');
      item.dataset.id = s.id;
      const preview = s.messages.length ? s.messages[s.messages.length-1].text.slice(0,40)+'…' : 'Empty conversation';
      item.innerHTML = `
        <div class="history-item-icon">💬</div>
        <div class="history-item-content">
          <div class="history-item-title">${escHtml(s.title)}</div>
          <div class="history-item-preview">${escHtml(preview)}</div>
        </div>
        <button class="history-delete-btn" data-id="${s.id}" title="Delete conversation" aria-label="Delete conversation">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      `;
      item.addEventListener('click', () => loadSession(s.id));

      // Delete button — stop propagation so it doesn't trigger loadSession
      item.querySelector('.history-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        sessions = sessions.filter(x => x.id !== s.id);
        saveSessions();
        if (activeId === s.id) {
          if (sessions.length > 0) {
            activeId = sessions[0].id;
            loadSession(activeId);
          } else {
            activeId = null;
            createSession();
          }
        }
        renderHistory();
      });

      section.appendChild(item);
    });

    historyList.appendChild(section);
  });
}

// ─── Message Rendering ────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}

function renderBubble(role, text, time, scroll = true) {
  // Remove welcome screen if present
  const ws = chatMessages.querySelector('.welcome-screen');
  if (ws) ws.remove();

  const row = document.createElement('div');
  row.className = `message-row ${role === 'user' ? 'user' : ''}`;

  const avatarLabel = role === 'user'
    ? (profile?.name || 'G').charAt(0).toUpperCase()
    : 'DF';
  const avatarClass = role === 'user' ? 'msg-avatar-user' : 'msg-avatar-ai';
  const bubbleClass = role === 'user' ? 'msg-bubble-user' : 'msg-bubble-ai';

  row.innerHTML = `
    <div class="msg-avatar ${avatarClass}">${avatarLabel}</div>
    <div class="msg-content">
      <div class="msg-bubble ${bubbleClass}">${formatMessageText(text)}</div>
      <div class="msg-time">${formatTime(time)}</div>
    </div>
  `;

  chatMessages.appendChild(row);
  if (scroll) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatMessageText(text) {
  // Convert **bold**, *italic*, line breaks, bullet lists
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin-top:8px">')
    .replace(/\n- /g, '</p><ul style="margin:6px 0 0 18px"><li>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'message-row';
  row.id = 'typingRow';
  row.innerHTML = `
    <div class="msg-avatar msg-avatar-ai" style="font-size:11px;font-weight:800;letter-spacing:-0.5px">DF</div>
    <div class="msg-content">
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  const row = document.getElementById('typingRow');
  if (row) row.remove();
}

// ─── AI Response Engine ──────────────────────────────────────
function buildContext() {
  if (!profile) return '';
  const parts = [];
  if (profile.bmi) {
    const cat = bmiCategory(profile.bmi);
    parts.push(`BMI ${profile.bmi} (${cat.label})`);
  }
  if (profile.height) parts.push(`height ${profile.height}cm`);
  if (profile.weight) parts.push(`weight ${profile.weight}kg`);
  if (profile.age)    parts.push(`age ${profile.age}`);
  if (profile.gender) parts.push(`gender: ${profile.gender}`);
  if (profile.goal)   parts.push(`goal: ${profile.goal.replace('-',' ')}`);
  if (profile.activity) parts.push(`activity level: ${profile.activity}`);
  return parts.length ? parts.join(', ') : '';
}

// AI response generator (local — no external API needed)
function generateAIResponse(userMsg) {
  const msg    = userMsg.toLowerCase();
  const ctx    = buildContext();
  const bmi    = profile?.bmi;
  const goal   = profile?.goal;
  const weight = profile?.weight;
  const height = profile?.height;
  const age    = profile?.age;
  const cat    = bmi ? bmiCategory(bmi) : null;
  const tdee   = bmrValue(profile);
  const name   = (profile?.name && profile.name !== 'Guest') ? profile.name : null;
  const greet  = name ? `Great question, ${name}! ` : '';

  // ── BMI Explanation ──
  if (msg.includes('bmi') || msg.includes('body mass')) {
    if (bmi) {
      return `${greet}Your current **BMI is ${bmi}**, which falls in the **${cat.label}** category.\n\n` +
        `Here's what that means for you:\n- BMI < 18.5: Underweight\n- BMI 18.5–24.9: Normal ✅\n- BMI 25–29.9: Overweight\n- BMI ≥ 30: Obese\n\n` +
        `${cat.label === 'Normal Weight'
          ? '**You\'re in the healthy range!** Focus on maintaining your current weight through balanced nutrition and regular exercise.'
          : `Your goal should be to move toward the Normal Weight range (18.5–24.9). I can help you build a plan tailored to your stats.`}`;
    }
    return `BMI (Body Mass Index) measures body fat based on height and weight. Go back to the home page and add your stats for a personalised BMI analysis! Your healthy range depends on your age, gender, and muscle mass.`;
  }

  // ── Calories / TDEE ──
  if (msg.includes('calori') || msg.includes('tdee') || msg.includes('burn') || msg.includes('energy')) {
    if (tdee) {
      const deficit  = Math.round(tdee - 500);
      const surplus  = Math.round(tdee + 300);
      return `${greet}Based on your stats (${ctx}), your **Total Daily Energy Expenditure (TDEE) is approximately ${tdee} kcal/day**.\n\n` +
        `Here's how to use it:\n- **Lose weight:** ~${deficit} kcal/day (500 kcal deficit)\n- **Maintain weight:** ~${tdee} kcal/day\n- **Gain muscle:** ~${surplus} kcal/day (300 kcal surplus)\n\n` +
        `${goal === 'weight-loss' ? '**Since your goal is weight loss**, aim for the deficit range. Focus on protein-rich foods to preserve muscle.' :
          goal === 'muscle-gain' ? '**Since your goal is muscle gain**, eat at a slight surplus and prioritise protein (1.6–2.2g per kg of body weight).' :
          'Adjust your intake based on your specific fitness goal.'}`;
    }
    return `To calculate your exact calorie needs, add your height, weight, age, and activity level from the home screen. Generally, women need ~2,000 kcal/day and men ~2,500 kcal/day, adjusted for activity.`;
  }

  // ── Workout Plan ──
  if (msg.includes('workout') || msg.includes('exercise') || msg.includes('training') || msg.includes('routine') || msg.includes('plan')) {
    const isBegineer = msg.includes('beginner') || msg.includes('start');
    let plan = `${greet}Here's a personalised **weekly workout plan** for you`;
    if (ctx) plan += ` (${ctx})`;
    plan += `:\n\n`;

    if (goal === 'weight-loss' || (bmi && bmi >= 25)) {
      plan += `**Monday** — Cardio: 30 min brisk walk/jog + 15 min core\n- **Tuesday** — Full-body strength (bodyweight squats, push-ups, rows)\n- **Wednesday** — Rest or light yoga/stretching\n- **Thursday** — HIIT: 20 min (30s on / 30s off intervals)\n- **Friday** — Strength: lower body focus (lunges, deadlifts, leg press)\n- **Saturday** — Cardio: 45 min cycle or swim\n- **Sunday** — Active rest: walking, mobility work\n\n**Key tip:** Pair this with a 300–500 kcal daily deficit for sustainable fat loss.`;
    } else if (goal === 'muscle-gain') {
      plan += `**Monday** — Chest & Triceps (bench press, dips, cable flies)\n- **Tuesday** — Back & Biceps (pull-ups, rows, curls)\n- **Wednesday** — Rest / Active Recovery\n- **Thursday** — Shoulders & Arms (OHP, lateral raises, face pulls)\n- **Friday** — Legs (squats, RDL, leg press, calf raises)\n- **Saturday** — Full-body compound lifts\n- **Sunday** — Complete Rest\n\n**Key tip:** Aim for progressive overload — add weight or reps each week.`;
    } else {
      plan += `**Monday** — Upper body strength (30 min)\n- **Tuesday** — Cardio (20–30 min moderate intensity)\n- **Wednesday** — Lower body & core (30 min)\n- **Thursday** — Rest or yoga\n- **Friday** — Full-body circuit (35 min)\n- **Saturday** — Outdoor activity (hiking, cycling, sport)\n- **Sunday** — Rest & recovery\n\nThis balanced plan builds strength, endurance, and flexibility together.`;
    }
    return plan;
  }

  // ── Nutrition / Diet ──
  if (msg.includes('eat') || msg.includes('diet') || msg.includes('nutrition') || msg.includes('food') || msg.includes('meal') || msg.includes('protein')) {
    let resp = `${greet}**Nutrition guidance** tailored for you`;
    if (ctx) resp += ` (${ctx})`;
    resp += `:\n\n`;
    resp += `**Macronutrient targets:**\n- **Protein:** ${weight ? Math.round(weight * 1.8) : '120'}–${weight ? Math.round(weight * 2.2) : '150'}g/day (muscle preservation & satiety)\n- **Carbs:** ${tdee ? Math.round(tdee * 0.45 / 4) : '200'}–${tdee ? Math.round(tdee * 0.55 / 4) : '250'}g/day (energy for workouts)\n- **Healthy Fats:** ${tdee ? Math.round(tdee * 0.25 / 9) : '60'}–${tdee ? Math.round(tdee * 0.35 / 9) : '85'}g/day\n\n`;
    resp += `**Top food recommendations:**\n- Lean proteins: chicken, fish, eggs, tofu, legumes\n- Complex carbs: oats, brown rice, sweet potatoes, quinoa\n- Healthy fats: avocado, olive oil, nuts, seeds\n- Vegetables: aim for 5+ servings/day\n\n`;
    if (goal === 'weight-loss') resp += `**For weight loss:** Prioritise high-volume, low-calorie foods — leafy greens, broth-based soups, berries. Avoid liquid calories.`;
    else if (goal === 'muscle-gain') resp += `**For muscle gain:** Eat within 30 minutes of training (protein + carb). Consider a pre-workout snack (banana + peanut butter).`;
    return resp;
  }

  // ── Water / Hydration ──
  if (msg.includes('water') || msg.includes('hydrat')) {
    const oz = weight ? Math.round(weight * 0.033 * 33.8) : 80;
    const L  = weight ? (weight * 0.033).toFixed(1) : '2.5';
    return `${greet}**Hydration is crucial for performance and recovery!**\n\nBased on your weight${weight ? ` (${weight}kg)` : ''}, you should drink approximately **${L} litres (${oz} oz) of water per day**.\n\n**Tips to stay hydrated:**\n- Start your day with a large glass of water\n- Drink 500ml 30 min before exercise\n- Sip steadily during workouts (150–250ml every 15–20 min)\n- Add electrolytes (sodium, potassium) for sessions over 60 minutes\n- Eat water-rich foods: cucumber, watermelon, celery\n\nYour urine colour is a great indicator — aim for pale yellow!`;
  }

  // ── Sleep / Recovery ──
  if (msg.includes('sleep') || msg.includes('recover') || msg.includes('rest')) {
    return `${greet}**Sleep & recovery** are just as important as your workouts!\n\n**Optimal sleep for fitness:**\n- Adults: 7–9 hours/night\n- Athletes: 8–10 hours/night\n\n**Why it matters:**\n- Growth hormone (muscle repair) peaks during deep sleep\n- Sleep deprivation increases cortisol (promotes fat storage)\n- Poor sleep impairs performance by up to 30%\n\n**Recovery tips:**\n- Schedule rest days (at least 1–2 per week)\n- Use active recovery: light walking, swimming, yoga\n- Post-workout nutrition within 1–2 hours\n- Cold/contrast showers can reduce muscle soreness\n- Foam rolling 10 min before bed improves recovery`;
  }

  // ── Motivation ──
  if (msg.includes('motivat') || msg.includes('stuck') || msg.includes('plateau') || msg.includes('give up') || msg.includes('hard')) {
    return `${greet}It's completely normal to hit rough patches on your fitness journey! 💪\n\n**Remember:** Progress is not linear. Here's how to break through:\n\n**Beat a plateau:**\n- Change your workout routine every 4–6 weeks\n- Increase intensity (add weight, reduce rest time)\n- Adjust calories (diet break or slight recalculation)\n- Prioritise sleep and stress management\n\n**Stay motivated:**\n- Track non-scale victories (strength, energy, mood)\n- Find a workout partner or community\n- Take progress photos every 4 weeks\n- Celebrate small wins every single day\n\nYou've already taken the hardest step — you showed up. Keep going! 🌟`;
  }

  // ── Stretching / Flexibility ──
  if (msg.includes('stretch') || msg.includes('flexib') || msg.includes('yoga') || msg.includes('mobility')) {
    return `${greet}Improving **flexibility and mobility** pays off massively long-term!\n\n**Daily stretch routine (15 min):**\n- Neck & shoulder rolls — 1 min\n- Chest opener (doorway stretch) — 1 min\n- Hip flexor stretch (kneeling lunge) — 2 min each side\n- Hamstring stretch — 2 min each side\n- Spinal twist (seated or supine) — 2 min each side\n- Child's pose — 2 min\n- Figure-4 glute stretch — 2 min each side\n\n**Best time to stretch:** After workouts when muscles are warm, or before bed for relaxation.\n\n**Yoga styles for fitness:** Vinyasa (strength + flow), Yin Yoga (deep tissue), Power Yoga (cardio + flexibility).`;
  }

  // ── Weight / Progress tracking ──
  if (msg.includes('track') || msg.includes('progress') || msg.includes('weigh') || msg.includes('measure')) {
    return `${greet}**Tracking progress** is key to staying on target${bmi ? ` — your current BMI of ${bmi} is a great baseline` : ''}!\n\n**What to track:**\n- **Weight:** Weigh yourself weekly (same time, same conditions)\n- **Measurements:** Waist, hips, chest, arms, thighs (monthly)\n- **Photos:** Full-body photos every 4 weeks\n- **Performance:** Weights lifted, reps, distance, time\n- **Energy levels & sleep quality (1–10 scale)**\n\n**Why weekly, not daily?** Weight fluctuates 1–3kg daily due to water, food, and hormones. Weekly averages are more meaningful.\n\n**Apps to try:** MyFitnessPal (nutrition), Strong (lifts), Hevy (workouts), Cronometer (micronutrients).`;
  }

  // ── Default / General ──
  const defaults = [
    `${greet}I'm your personal D-Fit AI coach! ${ctx ? `With your stats (${ctx}), ` : ''}I can help you with:\n\n- 🏋️ **Personalised workout plans**\n- 🥗 **Nutrition & meal planning**\n- 📊 **BMI analysis & health metrics**\n- 💧 **Hydration & recovery guidance**\n- 📅 **Weekly fitness scheduling**\n- 💡 **Motivation & habit building**\n\nWhat would you like help with today?`,
    `That's a great topic! ${ctx ? `Given your profile (${ctx}), ` : ''}let me give you a tailored answer. Could you be a bit more specific? For example, are you looking for workout advice, nutrition tips, or something else? I'm here to help you reach your fitness goals!`,
    `${greet}I'm here to support your fitness journey every step of the way! ${bmi ? `Your BMI of ${bmi} gives me a great starting point to personalise advice. ` : ''}Ask me about workouts, diet, calorie targets, recovery, or anything fitness-related!`
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── Send Message ─────────────────────────────────────────────
async function sendMessage(overrideText) {
  const text = (overrideText || chatInput.value).trim();
  if (!text || isTyping) return;

  // Ensure active session
  if (!activeId) createSession();

  const session = getActiveSession();
  if (!session) return;

  const now = new Date().toISOString();

  // Add user message
  const userMsg = { role: 'user', text, time: now };
  session.messages.push(userMsg);
  renderBubble('user', text, now);

  // Update session title from first user message
  if (session.messages.length === 1) {
    session.title = text.length > 40 ? text.slice(0, 38) + '…' : text;
  }

  chatInput.value = '';
  adjustTextarea();
  sendBtn.disabled = true;
  isTyping = true;

  // Typing indicator
  showTyping();

  // Simulate async AI response
  const delay = 800 + Math.random() * 900;
  await new Promise(r => setTimeout(r, delay));
  hideTyping();

  const aiText = generateAIResponse(text);
  const aiTime = new Date().toISOString();
  const aiMsg  = { role: 'ai', text: aiText, time: aiTime };
  session.messages.push(aiMsg);
  renderBubble('ai', aiText, aiTime);

  saveSessions();
  renderHistory();

  isTyping = false;
  sendBtn.disabled = chatInput.value.trim().length === 0;
}

// ─── Input Controls ───────────────────────────────────────────
function adjustTextarea() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  sendBtn.disabled = chatInput.value.trim().length === 0 || isTyping;
}

chatInput.addEventListener('input', adjustTextarea);

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', () => sendMessage());

// Suggested prompts (initial welcome)
document.querySelectorAll('.suggested-prompt').forEach(btn => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.prompt;
    adjustTextarea();
    sendMessage();
  });
});

// ─── New Chat ─────────────────────────────────────────────────
if (newChatBtn) newChatBtn.addEventListener('click', () => {
  createSession();
  renderHistory();
});

// ─── My Activity Card ────────────────────────────────────────
const MUSCLE_GROUPS = ['Chest','Shoulder','Triceps','Biceps','Back','Legs','Abs','Cardio'];
const DAYS          = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const STEP_GOAL     = 10000;
const MG_COLORS     = {
  Chest:'#FF6B6B', Shoulder:'#FFD93D', Triceps:'#6BCB77', Biceps:'#4D96FF',
  Back:'#C77DFF',  Legs:'#FF9A3C',     Abs:'#00C9A7',     Cardio:'#FF4D6D'
};

let actSelectedDay     = null;   // 'Mon'…'Sun'
let actSelectedMuscles = [];     // muscles toggled for that day

// ── Storage helpers ─────────────────────────────────────────
function actUserKey() {
  return 'dfitAct_' + (profile.username || profile.name || 'guest');
}

function actLoadAll() {
  try { return JSON.parse(localStorage.getItem(actUserKey())) || {}; } catch { return {}; }
}

function actSaveAll(data) {
  localStorage.setItem(actUserKey(), JSON.stringify(data));
}

// dateKey: "2026-3-8"
function actDateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// weekKey for current week: "2026-W10"   (ISO week)
function actWeekKeyForDate(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${wk}`;
}

// Get the date object for a given day-of-week tab in the current week
function actDateForDayTab(dayName) {
  const today    = new Date();
  const todayDow = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1..Sun=7
  const tabDow   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(dayName) + 1;
  const diff     = tabDow - todayDow;
  const d        = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

// Load one day's data  { steps, muscles:{ Chest:{exercises,sets,reps}, … } }
function actLoadDay(dayName) {
  const all = actLoadAll();
  const key = actDateKey(actDateForDayTab(dayName));
  return all[key] || { steps: 0, muscles: {} };
}

function actSaveDay(dayName, dayData) {
  const all = actLoadAll();
  const key = actDateKey(actDateForDayTab(dayName));
  all[key]  = dayData;
  actSaveAll(all);
}

// ── Pie chart (pure Canvas, no deps) ────────────────────────
function drawPie(canvasId, segments) {
  // segments: [{label, value, color}]
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const cx   = W / 2, cy = H / 2, r = Math.min(cx, cy) - 4;
  ctx.clearRect(0, 0, W, H);

  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No data', cx, cy);
    return;
  }

  let start = -Math.PI / 2;
  segments.forEach(seg => {
    if (!seg.value) return;
    const slice = (seg.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath(); ctx.fillStyle = seg.color; ctx.fill();
    start += slice;
  });

  // centre hole
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(88,86,214,0.85)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(total + ' days', cx, cy);
}

// ── Monthly muscle frequency data ────────────────────────────
function actMonthlyMuscleFreq() {
  const all   = actLoadAll();
  const now   = new Date();
  const freq  = {};
  MUSCLE_GROUPS.forEach(g => freq[g] = 0);

  for (let i = 0; i < 30; i++) {
    const d   = new Date(now); d.setDate(now.getDate() - i);
    const key = actDateKey(d);
    const day = all[key];
    if (day && day.muscles) {
      MUSCLE_GROUPS.forEach(g => {
        if ((day.muscles[g]?.exercises || 0) > 0) freq[g]++;
      });
    }
  }
  return freq;
}

// ── Which days this week have data ──────────────────────────
function actDaysWithData() {
  const all = actLoadAll();
  return DAYS.filter(d => {
    const key = actDateKey(actDateForDayTab(d));
    const day = all[key];
    return day && ((day.steps > 0) || MUSCLE_GROUPS.some(g => (day.muscles?.[g]?.exercises || 0) > 0));
  });
}

// ── Render the full card ─────────────────────────────────────
function renderActivityCard() {
  const body     = document.getElementById('activityCardBody');
  const daysData = actDaysWithData();
  const freq     = actMonthlyMuscleFreq();

  // ── Day tabs ──
  let tabsHTML = DAYS.map(d => {
    const hasDot = daysData.includes(d) ? ' has-data' : '';
    const active = d === actSelectedDay ? ' active' : '';
    return `<button class="act-day-tab${active}${hasDot}" data-day="${d}">${d}</button>`;
  }).join('');

  // ── Muscle chip grid (only if a day is selected) ──
  let chipsHTML = '';
  let inputsHTML = '';

  if (actSelectedDay) {
    const dayData = actLoadDay(actSelectedDay);

    chipsHTML = `
      <div style="font-size:10px;opacity:0.7;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">
        ${actSelectedDay} — Select workouts
      </div>
      <div class="act-muscle-chips">` +
      MUSCLE_GROUPS.map(g => {
        const sel = actSelectedMuscles.includes(g) ? ' selected' : '';
        return `<button class="act-chip${sel}" data-muscle="${g}">${g}</button>`;
      }).join('') +
      `</div>`;

    // Steps
    inputsHTML += `
      <div class="act-steps-row">
        <label for="act-steps">Steps</label>
        <input class="activity-input" id="act-steps" type="number" min="0"
          placeholder="Today's steps" value="${dayData.steps || ''}">
      </div>`;

    // Muscle inputs for selected muscles
    if (actSelectedMuscles.length) {
      inputsHTML += `<div class="act-inputs-panel">`;
      actSelectedMuscles.forEach(g => {
        const d = dayData.muscles?.[g] || {};
        inputsHTML += `
          <div class="act-muscle-block">
            <div class="act-muscle-block-label">${g}</div>
            <div class="act-three-cols">
              <div class="act-field">
                <label>Exercises</label>
                <input class="activity-input act-mi" type="number" min="0"
                  data-group="${g}" data-field="exercises"
                  value="${d.exercises||''}" placeholder="0">
              </div>
              <div class="act-field">
                <label>Sets</label>
                <input class="activity-input act-mi" type="number" min="0"
                  data-group="${g}" data-field="sets"
                  value="${d.sets||''}" placeholder="0">
              </div>
              <div class="act-field">
                <label>Reps</label>
                <input class="activity-input act-mi" type="number" min="0"
                  data-group="${g}" data-field="reps"
                  value="${d.reps||''}" placeholder="0">
              </div>
            </div>
          </div>`;
      });
      inputsHTML += `</div>`;
    }

    inputsHTML += `<button class="act-save-btn" id="actSaveBtn">💾 Save ${actSelectedDay}'s activity</button>`;
  }

  // ── Pie chart section ──
  const pieSegs = MUSCLE_GROUPS
    .map(g => ({ label: g, value: freq[g], color: MG_COLORS[g] }))
    .filter(s => s.value > 0);

  const maxFreq = Math.max(...MUSCLE_GROUPS.map(g => freq[g]), 1);
  const monthBars = MUSCLE_GROUPS.map(g => {
    const pct = Math.round((freq[g] / 30) * 100);
    return `
      <div class="act-month-bar-row">
        <div class="act-month-bar-label">
          <span>${g}</span>
          <span>${freq[g]} / 30 days</span>
        </div>
        <div class="act-month-bar-track">
          <div class="act-month-bar-fill" style="width:${pct}%;background:${MG_COLORS[g]}"></div>
        </div>
      </div>`;
  }).join('');

  const legendHTML = MUSCLE_GROUPS
    .filter(g => freq[g] > 0)
    .map(g => `
      <div class="act-legend-item">
        <div class="act-legend-dot" style="background:${MG_COLORS[g]}"></div>
        <span>${g} (${freq[g]})</span>
      </div>`).join('');

  body.innerHTML = `
    <div class="act-day-tabs">${tabsHTML}</div>
    ${chipsHTML}
    ${inputsHTML}
    <hr class="activity-divider">
    <div class="act-chart-subtitle">30-Day Muscle Distribution</div>
    <div class="act-chart-wrap">
      <canvas id="actPieCanvas" width="140" height="140"></canvas>
      <div class="act-legend">${legendHTML || '<div style="font-size:11px;opacity:0.6">Log workouts to see your chart</div>'}</div>
    </div>
    <div class="act-month-bar-list">${monthBars}</div>`;

  // Draw pie
  drawPie('actPieCanvas', pieSegs);

  // ── Wire events ──────────────────────────────────────────
  body.querySelectorAll('.act-day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;
      if (actSelectedDay === day) {
        actSelectedDay     = null;
        actSelectedMuscles = [];
      } else {
        actSelectedDay     = day;
        // restore previously saved muscles for this day
        const saved = actLoadDay(day);
        actSelectedMuscles = MUSCLE_GROUPS.filter(g => (saved.muscles?.[g]?.exercises||0) > 0);
      }
      renderActivityCard();
    });
  });

  body.querySelectorAll('.act-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const m = chip.dataset.muscle;
      if (actSelectedMuscles.includes(m)) {
        actSelectedMuscles = actSelectedMuscles.filter(x => x !== m);
      } else {
        actSelectedMuscles.push(m);
      }
      renderActivityCard();
    });
  });

  const saveBtn = document.getElementById('actSaveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const dayData = actLoadDay(actSelectedDay);
      dayData.steps = parseInt(document.getElementById('act-steps').value) || 0;
      if (!dayData.muscles) dayData.muscles = {};

      body.querySelectorAll('.act-mi').forEach(inp => {
        const g   = inp.dataset.group;
        const fld = inp.dataset.field;
        if (!dayData.muscles[g]) dayData.muscles[g] = {};
        dayData.muscles[g][fld] = parseInt(inp.value) || 0;
      });

      // Zero out muscles that were de-selected
      MUSCLE_GROUPS.forEach(g => {
        if (!actSelectedMuscles.includes(g)) delete dayData.muscles[g];
      });

      actSaveDay(actSelectedDay, dayData);
      saveBtn.textContent = '✅ Saved!';
      setTimeout(() => renderActivityCard(), 800);
    });
  }
}

function initActivityCard() {
  const card = document.getElementById('activityCard');
  const body = document.getElementById('activityCardBody');
  card.style.display = 'block';

  if (profile.mode !== 'user') {
    body.innerHTML = `
      <div class="activity-lock">
        <span class="activity-lock-icon">🔒</span>
        Login to track your daily activity
      </div>`;
    return;
  }

  // Default selected day = today
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
  actSelectedDay     = DAYS[todayDow - 1];
  actSelectedMuscles = [];
  const saved = actLoadDay(actSelectedDay);
  actSelectedMuscles = MUSCLE_GROUPS.filter(g => (saved.muscles?.[g]?.exercises||0) > 0);

  renderActivityCard();
}

// ─── Bootstrap ───────────────────────────────────────────────
initProfile();

// Create first session and start fresh
if (sessions.length === 0) {
  createSession();
} else {
  activeId = sessions[0].id;
  loadSession(activeId);
}
