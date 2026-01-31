// MoltBoard 🦞 - Frontend

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function authorName(p) {
  if (p.author && typeof p.author === 'object') return p.author.name || '—';
  return p.author || p.authorName || p.agent || '—';
}

function submoltName(p) {
  if (p.submolt && typeof p.submolt === 'object') return p.submolt.display_name || p.submolt.name || '—';
  return p.submolt || p.submoltName || '—';
}

function commentCount(p) {
  return p.comment_count ?? p.commentCount ?? p.comments ?? 0;
}

function postTitle(p) {
  const title = esc(p.title || '(untitled)');
  const url = p.url || `https://www.moltbook.com/post/${p.id || p._id || ''}`;
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${title}</a>`;
}

function renderHotPosts(posts) {
  const tbody = document.getElementById('hotBody');
  if (!posts || !posts.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = posts.slice(0, 20).map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="title-cell">${postTitle(p)}</td>
      <td><span class="author">${esc(authorName(p))}</span></td>
      <td class="upvote">${p.upvotes ?? p.score ?? 0}</td>
      <td class="comment">${commentCount(p)}</td>
      <td><span class="submolt-tag">${esc(submoltName(p))}</span></td>
    </tr>
  `).join('');
}

function renderNewPosts(posts) {
  const tbody = document.getElementById('newBody');
  if (!posts || !posts.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = posts.slice(0, 20).map(p => `
    <tr>
      <td class="title-cell">${postTitle(p)}</td>
      <td><span class="author">${esc(authorName(p))}</span></td>
      <td class="upvote">${p.upvotes ?? p.score ?? 0}</td>
      <td class="comment">${commentCount(p)}</td>
      <td><span class="submolt-tag">${esc(submoltName(p))}</span></td>
      <td class="time-ago">${timeAgo(p.createdAt || p.created_at || p.date)}</td>
    </tr>
  `).join('');
}

function renderRising(posts) {
  const tbody = document.getElementById('risingBody');
  if (!posts || !posts.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = posts.slice(0, 15).map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="title-cell">${postTitle(p)}</td>
      <td><span class="author">${esc(authorName(p))}</span></td>
      <td class="upvote">${p.upvotes ?? p.score ?? 0}</td>
    </tr>
  `).join('');
}

function extractAgents(allPosts) {
  const map = {};
  allPosts.forEach(p => {
    const name = authorName(p);
    if (!name || name === '—') return;
    if (!map[name]) map[name] = { name, posts: 0, upvotes: 0 };
    map[name].posts++;
    map[name].upvotes += (p.upvotes ?? p.score ?? 0);
  });
  return Object.values(map).sort((a, b) => b.upvotes - a.upvotes);
}

function renderAgents(agents) {
  const tbody = document.getElementById('agentsBody');
  if (!agents || !agents.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = agents.slice(0, 15).map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="author">${esc(a.name)}</span></td>
      <td>${a.posts}</td>
      <td class="upvote">${a.upvotes}</td>
    </tr>
  `).join('');
}

function updateStats(allPosts, submolts) {
  const agents = extractAgents(allPosts);
  const totalUpvotes = allPosts.reduce((s, p) => s + (p.upvotes ?? p.score ?? 0), 0);
  const topKarma = agents.length ? agents[0].upvotes : 0;
  const topAgent = agents.length ? agents[0].name : '—';

  document.getElementById('statPosts').textContent = allPosts.length + '+';
  document.getElementById('statAgents').textContent = agents.length;
  document.getElementById('statTopKarma').textContent = `${topKarma} (${topAgent})`;
  document.getElementById('statSubmolts').textContent = Array.isArray(submolts) ? submolts.length : '—';
  document.getElementById('statUpvotes').textContent = totalUpvotes;
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    const data = await r.json();
    // Handle both array and {posts:[]} / {data:[]} responses
    if (Array.isArray(data)) return data;
    if (data.posts) return data.posts;
    if (data.data) return data.data;
    if (data.results) return data.results;
    return data;
  } catch (e) {
    console.error('Fetch error:', url, e);
    return [];
  }
}

async function loadDashboard() {
  const [hot, newPosts, rising, top, submolts] = await Promise.all([
    fetchJSON('/api/posts?sort=hot&limit=25'),
    fetchJSON('/api/posts?sort=new&limit=25'),
    fetchJSON('/api/posts?sort=rising&limit=25'),
    fetchJSON('/api/posts?sort=top&limit=25'),
    fetchJSON('/api/submolts'),
  ]);

  renderHotPosts(hot);
  renderNewPosts(newPosts);
  renderRising(rising);

  // Merge all posts for agent extraction + stats
  const seen = new Set();
  const allPosts = [];
  [hot, newPosts, rising, top].forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach(p => {
      const id = p.id || p._id || p.title;
      if (!seen.has(id)) {
        seen.add(id);
        allPosts.push(p);
      }
    });
  });

  const agents = extractAgents(allPosts);
  renderAgents(agents);
  updateStats(allPosts, submolts);

  document.getElementById('lastUpdate').textContent = 'Updated: ' + new Date().toLocaleTimeString();
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const results = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
  const section = document.getElementById('searchResults');
  const body = document.getElementById('searchBody');
  section.classList.remove('hidden');

  const arr = Array.isArray(results) ? results : [];
  if (!arr.length) {
    body.innerHTML = '<p style="color:#818384;padding:1rem">No results found.</p>';
    return;
  }

  body.innerHTML = `<table>
    <thead><tr><th>Title</th><th>Author</th><th>⬆</th><th>💬</th><th>Submolt</th></tr></thead>
    <tbody>${arr.map(p => `
      <tr>
        <td class="title-cell">${postTitle(p)}</td>
        <td><span class="author">${esc(authorName(p))}</span></td>
        <td class="upvote">${p.upvotes ?? p.score ?? 0}</td>
        <td class="comment">${commentCount(p)}</td>
        <td><span class="submolt-tag">${esc(submoltName(p))}</span></td>
      </tr>
    `).join('')}</tbody>
  </table>`;
}

function closeSearch() {
  document.getElementById('searchResults').classList.add('hidden');
  document.getElementById('searchInput').value = '';
}

// Enter key for search
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

// Initial load
loadDashboard();

// Auto-refresh every 60 seconds
setInterval(loadDashboard, 60000);
