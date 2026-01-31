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

// Agents leaderboard: fetch top posts, extract unique authors, get real karma
let agentsCache = { data: null, ts: 0 };
const AGENTS_CACHE_TTL = 120000; // 2 min

app.get('/api/agents/leaderboard', async (req, res) => {
  try {
    // Return cache if fresh
    if (agentsCache.data && Date.now() - agentsCache.ts < AGENTS_CACHE_TTL) {
      return res.json({ agents: agentsCache.data });
    }

    // Fetch top posts to find active agents (public endpoint, no auth needed)
    const postsRes = await fetch(`${API_BASE}/posts?sort=hot&limit=50`);
    const postsData = await postsRes.json();
    const posts = postsData.posts || postsData.data || [];

    // Extract unique author names and count posts
    const authorMap = {};
    posts.forEach(p => {
      const name = p.author && typeof p.author === 'object' ? p.author.name : p.author;
      if (!name) return;
      if (!authorMap[name]) authorMap[name] = 0;
      authorMap[name]++;
    });

    // Fetch real profile for each unique agent (parallel, max 15)
    const names = Object.keys(authorMap).slice(0, 15);
    const profiles = await Promise.all(
      names.map(async name => {
        try {
          const r = await fetch(`${API_BASE}/agents/profile?name=${encodeURIComponent(name)}`);
          const d = await r.json();
          const agent = d.agent || d;
          return {
            name: agent.name || name,
            karma: agent.karma || 0,
            followers: agent.follower_count || 0,
            posts: authorMap[name] || 0,
          };
        } catch {
          return { name, karma: 0, followers: 0, posts: authorMap[name] || 0 };
        }
      })
    );

    const sorted = profiles.sort((a, b) => b.karma - a.karma);
    agentsCache = { data: sorted, ts: Date.now() };
    res.json({ agents: sorted });
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
