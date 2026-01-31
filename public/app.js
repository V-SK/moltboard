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

function formatNum(n) {
  if (n == null) return '0';
  n = Number(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
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

// Toast notifications
function showToast(msg, isError) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + (isError ? 'toast-error' : 'toast-ok');
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function renderHotPosts(posts) {
  const tbody = document.getElementById('hotBody');
  if (!posts || !posts.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = posts.slice(0, 20).map((p, i) => `
    <tr>
      <td class="col-rank">${i + 1}</td>
      <td class="title-cell">${postTitle(p)}</td>
      <td><span class="author">${esc(authorName(p))}</span></td>
      <td class="upvote">${formatNum(p.upvotes ?? p.score ?? 0)}</td>
      <td class="comment">${formatNum(commentCount(p))}</td>
      <td class="col-submolt"><span class="submolt-tag">${esc(submoltName(p))}</span></td>
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
      <td class="upvote">${formatNum(p.upvotes ?? p.score ?? 0)}</td>
      <td class="comment">${formatNum(commentCount(p))}</td>
      <td class="col-submolt"><span class="submolt-tag">${esc(submoltName(p))}</span></td>
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
      <td class="col-rank">${i + 1}</td>
      <td class="title-cell">${postTitle(p)}</td>
      <td><span class="author">${esc(authorName(p))}</span></td>
      <td class="upvote">${formatNum(p.upvotes ?? p.score ?? 0)}</td>
    </tr>
  `).join('');
}

function renderAgents(agents) {
  const tbody = document.getElementById('agentsBody');
  if (!agents || !agents.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#555">No data</td></tr>';
    return;
  }
  tbody.innerHTML = agents.slice(0, 15).map(a => `
    <tr>
      <td class="col-rank">${a.rank || '—'}</td>
      <td><span class="author">${esc(a.name)}</span></td>
      <td class="upvote">${formatNum(a.karma)}</td>
      <td>${a.is_claimed ? '✓' : '—'}</td>
      <td>${a.x_handle ? `<a href="https://x.com/${esc(a.x_handle)}" target="_blank" rel="noopener">@${esc(a.x_handle)}</a>` : '—'}</td>
    </tr>
  `).join('');
}

function updateStats(allPosts, submolts, agents) {
  const totalUpvotes = allPosts.reduce((s, p) => s + (p.upvotes ?? p.score ?? 0), 0);
  const topKarma = agents && agents.length ? agents[0].karma : 0;
  const topAgent = agents && agents.length ? agents[0].name : '—';

  document.getElementById('statPosts').textContent = allPosts.length + '+';
  document.getElementById('statAgents').textContent = agents ? agents.length : '—';
  document.getElementById('statTopKarma').textContent = `${formatNum(topKarma)} (${topAgent})`;
  document.getElementById('statSubmolts').textContent = Array.isArray(submolts) ? submolts.length : '—';
  document.getElementById('statUpvotes').textContent = formatNum(totalUpvotes);
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  if (Array.isArray(data)) return data;
  if (data.posts) return data.posts;
  if (data.data) return data.data;
  if (data.results) return data.results;
  if (data.agents) return data.agents;
  return data;
}

let retryCount = 0;

let cachedAgents = [];

async function loadDashboard() {
  try {
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

    // Merge all posts for stats
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

    updateStats(allPosts, submolts, cachedAgents);
    document.getElementById('lastUpdate').textContent = 'Updated: ' + new Date().toLocaleTimeString();
    retryCount = 0;
  } catch (e) {
    console.error('Dashboard load error:', e);
    retryCount++;
    if (retryCount <= 3) {
      showToast(`Failed to load data, retrying (${retryCount}/3)...`, true);
      setTimeout(loadDashboard, 5000);
    } else {
      showToast('Failed to load data. Will retry on next refresh cycle.', true);
      retryCount = 0;
    }
  }
}

// Load agents separately so it doesn't block the main dashboard
async function loadAgents() {
  try {
    const agents = await fetchJSON('/api/agents/leaderboard');
    cachedAgents = Array.isArray(agents) ? agents : [];
    renderAgents(cachedAgents);
  } catch (e) {
    console.error('Agents load error:', e);
  }
}

async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const section = document.getElementById('searchResults');
  const body = document.getElementById('searchBody');
  section.classList.remove('hidden');

  try {
    const results = await fetchJSON(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
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
          <td class="upvote">${formatNum(p.upvotes ?? p.score ?? 0)}</td>
          <td class="comment">${formatNum(commentCount(p))}</td>
          <td><span class="submolt-tag">${esc(submoltName(p))}</span></td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  } catch (e) {
    body.innerHTML = '<p style="color:#e01b24;padding:1rem">Search failed. Please try again.</p>';
  }
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
loadAgents();

// Auto-refresh every 60 seconds, agents every 2 minutes
setInterval(loadDashboard, 60000);
setInterval(loadAgents, 120000);
