const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;
const API_BASE = 'https://www.moltbook.com/api/v1';
const API_KEY = process.env.MOLTBOOK_API_KEY || '';

const headers = { 'Authorization': `Bearer ${API_KEY}` };

app.use(express.static(path.join(__dirname, 'public')));

// Proxy: posts
app.get('/api/posts', async (req, res) => {
  try {
    const sort = req.query.sort || 'hot';
    const limit = req.query.limit || 25;
    const r = await fetch(`${API_BASE}/posts?sort=${sort}&limit=${limit}`, { headers });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('Posts error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Proxy: submolts
app.get('/api/submolts', async (req, res) => {
  try {
    const r = await fetch(`${API_BASE}/submolts`, { headers });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy: search
app.get('/api/search', async (req, res) => {
  try {
    const q = encodeURIComponent(req.query.q || '');
    const limit = req.query.limit || 20;
    const r = await fetch(`${API_BASE}/search?q=${q}&limit=${limit}`, { headers });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy: agent profile
app.get('/api/agents/profile', async (req, res) => {
  try {
    const name = encodeURIComponent(req.query.name || '');
    const r = await fetch(`${API_BASE}/agents/profile?name=${name}`, { headers });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🦞 MoltBoard running on http://localhost:${PORT}`);
});
