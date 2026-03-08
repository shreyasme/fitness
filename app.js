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

  // Load sessions from MongoDB (async — also handles createSession / loadSession for users)
  if (profile.mode === 'user') {
    fetch('/api/sessions/' + profile.username)
      .then(r => r.json())
      .then(data => {
        sessions = data;
        if (sessions.length > 0) {
          activeId = sessions[0].id;
          loadSession(activeId);
        } else {
          createSession();
        }
        renderHistory();
      })
      .catch(() => { createSession(); renderHistory(); });
  }

  renderHistory();
  initActivityCard();
}

// ─── Session Management ──────────────────────────────────────
function saveSessions() {
  if (profile.mode !== 'user') return;
  fetch('/api/sessions/' + profile.username, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessions)
  }).catch(console.error);
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

// ─── AI Response via Groq (through backend) ──────────────────
async function getAIReply(session) {
  // Send last 20 messages as context to keep tokens manageable
  const history = session.messages.slice(-20);
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, profile: profile || {} })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || 'AI request failed');
  }
  const data = await resp.json();
  return data.reply;
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

  try {
    const aiText = await getAIReply(session);
    hideTyping();

    const aiTime = new Date().toISOString();
    const aiMsg  = { role: 'ai', text: aiText, time: aiTime };
    session.messages.push(aiMsg);
    renderBubble('ai', aiText, aiTime);
  } catch (err) {
    hideTyping();
    const errMsg = { role: 'ai', text: `⚠️ Sorry, I couldn't connect to the AI service. Please make sure the server is running.\n\n*${err.message}*`, time: new Date().toISOString() };
    session.messages.push(errMsg);
    renderBubble('ai', errMsg.text, errMsg.time);
  }

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
let activityCache      = {};     // loaded from MongoDB on init

// ── Storage helpers ─────────────────────────────────────────
function actUserKey() {
  return profile.username || profile.name || 'guest';
}

function actLoadAll() {
  return activityCache;
}

function actSaveAll(data) {
  activityCache = data;
  if (profile.mode === 'user') {
    fetch('/api/activity/' + actUserKey(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(console.error);
  }
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
        if (day.muscles[g]) freq[g]++;
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
    return day && ((day.steps > 0) || MUSCLE_GROUPS.some(g => !!day.muscles?.[g]));
  });
}

// ── Render the full card ─────────────────────────────────────
function renderActivityCard() {
  const body     = document.getElementById('activityCardBody');
  const daysData = actDaysWithData();
  const freq     = actMonthlyMuscleFreq();

  // -- Day tabs --
  const todayDow  = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayName = DAYS[todayDow - 1];

  const tabsHTML = DAYS.map(d => {
    const hasDot  = daysData.includes(d) ? ' has-data' : '';
    const active  = d === actSelectedDay ? ' active' : '';
    const isToday = d === todayName ? ' today' : '';
    return `<button class="act-day-tab${active}${hasDot}${isToday}" data-day="${d}">${d}</button>`;
  }).join('');

  // -- Muscle chips + steps for selected day --
  let dayHTML = '';
  if (actSelectedDay) {
    const dayData = actLoadDay(actSelectedDay);
    const chipsHTML = MUSCLE_GROUPS.map(g => {
      const done = actSelectedMuscles.includes(g);
      return `<button class="act-chip${done ? ' selected' : ''}" data-muscle="${g}">${done ? '\u2713 ' : ''}${g}</button>`;
    }).join('');

    dayHTML = `
      <div style="font-size:10px;opacity:0.65;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">
        ${actSelectedDay === todayName ? 'Today' : actSelectedDay} \u2014 Tap muscles you trained
      </div>
      <div class="act-muscle-chips">${chipsHTML}</div>
      <div class="act-steps-row" style="margin-top:10px">
        <label for="act-steps">\ud83e\uddff Steps</label>
        <input class="activity-input" id="act-steps" type="number" min="0"
          placeholder="e.g. 8000" value="${dayData.steps || ''}" style="max-width:110px">
      </div>
      <div id="act-autosaved" style="font-size:10px;opacity:0;text-align:right;transition:opacity 0.3s">\u2705 Saved</div>`;
  }

  // -- Compact pie chart --
  const pieSegs = MUSCLE_GROUPS
    .map(g => ({ label: g, value: freq[g], color: MG_COLORS[g] }))
    .filter(s => s.value > 0);

  const legendHTML = MUSCLE_GROUPS
    .filter(g => freq[g] > 0)
    .map(g => `<div class="act-legend-item">
      <div class="act-legend-dot" style="background:${MG_COLORS[g]}"></div>
      <span>${g}&nbsp;${freq[g]}d</span>
    </div>`).join('');

  body.innerHTML = `
    <div class="act-day-tabs">${tabsHTML}</div>
    ${dayHTML}
    <hr class="activity-divider">
    <div class="act-chart-subtitle">This month</div>
    <div class="act-chart-wrap">
      <canvas id="actPieCanvas" width="110" height="110"></canvas>
      <div class="act-legend">${legendHTML || '<div style="font-size:11px;opacity:0.55">Log workouts to see chart</div>'}</div>
    </div>`;

  drawPie('actPieCanvas', pieSegs);

  // -- Wire: day tabs --
  body.querySelectorAll('.act-day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;
      actSelectedDay = (actSelectedDay === day) ? null : day;
      if (actSelectedDay) {
        const saved = actLoadDay(actSelectedDay);
        actSelectedMuscles = MUSCLE_GROUPS.filter(g => (saved.muscles?.[g] || 0) > 0);
      } else {
        actSelectedMuscles = [];
      }
      renderActivityCard();
    });
  });

  // -- Wire: muscle chips -- auto-save on tap --
  body.querySelectorAll('.act-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const m = chip.dataset.muscle;
      if (actSelectedMuscles.includes(m)) {
        actSelectedMuscles = actSelectedMuscles.filter(x => x !== m);
      } else {
        actSelectedMuscles.push(m);
      }
      autoSaveDay();
      renderActivityCard();
    });
  });

  // -- Wire: steps -- auto-save on change --
  const stepsInput = document.getElementById('act-steps');
  if (stepsInput) {
    stepsInput.addEventListener('change', autoSaveDay);
    stepsInput.addEventListener('blur', autoSaveDay);
  }
}
function autoSaveDay() {
  if (!actSelectedDay) return;
  const dayData = actLoadDay(actSelectedDay);
  const stepsEl = document.getElementById('act-steps');
  if (stepsEl) dayData.steps = parseInt(stepsEl.value) || 0;
  dayData.muscles = {};
  actSelectedMuscles.forEach(g => { dayData.muscles[g] = 1; });
  actSaveDay(actSelectedDay, dayData);
  const el = document.getElementById('act-autosaved');
  if (el) { el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 1200); }
}

async function initActivityCard() {
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

  // Show loading state while fetching
  body.innerHTML = `<div style="text-align:center;padding:20px 0;opacity:0.6;font-size:13px">⏳ Loading activity...</div>`;

  // Load from MongoDB
  try {
    const resp = await fetch('/api/activity/' + profile.username);
    activityCache = await resp.json();
  } catch {
    activityCache = {};
  }

  // Default selected day = today
  const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
  actSelectedDay     = DAYS[todayDow - 1];
  const saved = actLoadDay(actSelectedDay);
  actSelectedMuscles = MUSCLE_GROUPS.filter(g => (saved.muscles?.[g] || 0) > 0);

  renderActivityCard();
}

// ─── Bootstrap ────────────────────────────────────────────
initProfile();

// For guest mode, sessions are not loaded from server — init immediately.
// For user mode, session init is handled inside the async fetch callback in initProfile.
const _pRaw = sessionStorage.getItem('dfitProfile');
if (_pRaw && JSON.parse(_pRaw).mode !== 'user') {
  if (sessions.length === 0) {
    createSession();
  } else {
    activeId = sessions[0].id;
    loadSession(activeId);
  }
}
