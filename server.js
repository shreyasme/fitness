const express  = require('express');
const { MongoClient } = require('mongodb');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = 3000;

const MONGO_URI = 'mongodb+srv://mrkushal321_db_user:25laQndhv6ZLuhXu@cluster0.s7vrwth.mongodb.net/?appName=Cluster0';
const DB_NAME   = 'dfit';

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
