require('dotenv').config();
const express  = require('express');
const { MongoClient } = require('mongodb');
const cors     = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI  = process.env.MONGO_URI;
const DB_NAME    = 'dfit';
const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, app.html, styles.css, etc.

let db;

// ─── Connect to MongoDB ───────────────────────────────────────
async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('✅ Connected to MongoDB Atlas — database: ' + DB_NAME);
}

// ─── Groq Chat ───────────────────────────────────────────────
// POST /api/chat   { messages: [{role,content}], profile }  →  { reply }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], profile = {} } = req.body;

    // Build system prompt with user profile context
    const profileParts = [];
    if (profile.name && profile.name !== 'Guest') profileParts.push(`User's name: ${profile.name}`);
    if (profile.bmi)      profileParts.push(`BMI: ${profile.bmi}`);
    if (profile.height)   profileParts.push(`Height: ${profile.height}cm`);
    if (profile.weight)   profileParts.push(`Weight: ${profile.weight}kg`);
    if (profile.age)      profileParts.push(`Age: ${profile.age}`);
    if (profile.gender)   profileParts.push(`Gender: ${profile.gender}`);
    if (profile.goal)     profileParts.push(`Fitness goal: ${profile.goal.replace(/-/g, ' ')}`);
    if (profile.activity) profileParts.push(`Activity level: ${profile.activity}`);

    const systemPrompt = `You are D-Fit, a world-class personal AI fitness coach. You give science-backed, practical, and motivating advice.
${profileParts.length ? `\nUser profile:\n${profileParts.join('\n')}` : ''}

Guidelines:
- Always personalise advice using the user's profile data above when available.
- Use **bold** for key terms and structure responses with bullet points for clarity.
- Be encouraging, concise, and specific — not generic.
- If the user asks something unrelated to fitness/health/nutrition, politely redirect them to fitness topics.
- Do not mention that you are built on any underlying model. You are D-Fit AI Coach.`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.text }))
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq API error:', data);
      return res.status(502).json({ error: 'AI service error', detail: data.error?.message });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Users ────────────────────────────────────────────────────
// POST /api/register   { username, password, profile }
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, profile } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await db.collection('users').findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    await db.collection('users').insertOne({ username, password, profile, createdAt: new Date() });
    res.json({ ok: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/login   { username, password }  →  { profile }
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ profile: user.profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Activity ─────────────────────────────────────────────────
// GET /api/activity/:username  →  { dateKey: { steps, muscles }, … }
app.get('/api/activity/:username', async (req, res) => {
  try {
    const doc = await db.collection('activity').findOne({ username: req.params.username });
    res.json(doc ? doc.data : {});
  } catch (err) {
    console.error('Activity get error:', err);
    res.status(500).json({});
  }
});

// PUT /api/activity/:username   body = full activity object
app.put('/api/activity/:username', async (req, res) => {
  try {
    await db.collection('activity').updateOne(
      { username: req.params.username },
      { $set: { data: req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Activity save error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Chat Sessions ────────────────────────────────────────────
// GET /api/sessions/:username  →  [ session, … ]
app.get('/api/sessions/:username', async (req, res) => {
  try {
    const doc = await db.collection('sessions').findOne({ username: req.params.username });
    res.json(doc ? doc.sessions : []);
  } catch (err) {
    console.error('Sessions get error:', err);
    res.status(500).json([]);
  }
});

// PUT /api/sessions/:username   body = [ session, … ]
app.put('/api/sessions/:username', async (req, res) => {
  try {
    await db.collection('sessions').updateOne(
      { username: req.params.username },
      { $set: { sessions: req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Sessions save error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Start ────────────────────────────────────────────────────
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 D-Fit server running at http://localhost:${PORT}`);
      console.log(`   Open http://localhost:${PORT}/index.html in your browser`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
