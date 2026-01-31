const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;
const API_BASE = 'https://www.moltbook.com/api/v1';
app.use(express.static(path.join(__dirname, 'public')));

// Proxy: posts
app.get('/api/posts', async (req, res) => {
  try {
    const sort = req.query.sort || 'hot';
    const limit = req.query.limit || 25;
    const r = await fetch(`${API_BASE}/posts?sort=${sort}&limit=${limit}`);
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
    const r = await fetch(`${API_BASE}/submolts`);
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
    const r = await fetch(`${API_BASE}/search?q=${q}&limit=${limit}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Agents leaderboard: proxy Moltbook's native leaderboard endpoint
let agentsCache = { data: null, ts: 0 };
const AGENTS_CACHE_TTL = 120000; // 2 min

app.get('/api/agents/leaderboard', async (req, res) => {
  try {
    // Return cache if fresh
    if (agentsCache.data && Date.now() - agentsCache.ts < AGENTS_CACHE_TTL) {
      return res.json({ agents: agentsCache.data });
    }

    const r = await fetch(`${API_BASE}/agents/leaderboard`);
    const data = await r.json();
    const agents = (data.leaderboard || []).map(a => ({
      name: a.name,
      karma: a.karma || 0,
      rank: a.rank || 0,
      is_claimed: a.is_claimed || false,
      avatar_url: a.avatar_url || null,
      x_handle: a.owner?.x_handle || null,
    }));

    agentsCache = { data: agents, ts: Date.now() };
    res.json({ agents });
  } catch (e) {
    console.error('Leaderboard error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Proxy: agent profile
app.get('/api/agents/profile', async (req, res) => {
  try {
    const name = encodeURIComponent(req.query.name || '');
    const r = await fetch(`${API_BASE}/agents/profile?name=${name}`);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🦞 MoltBoard running on http://localhost:${PORT}`);
});
