/* =========================================================
   History & Analytics page logic
   Reads from localStorage key 'iph_history' (array of attempts).
   Each attempt: { slug, domain, score, total, accuracy, date, topics?: {name:pct} }
   For Flask: replace loadHistory() with a fetch to /history.
   ========================================================= */

const HISTORY_KEY = 'iph_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveHistory(arr) { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); }

function seedDemoHistory() {
  const samples = [
    { slug:'python', topics:{ 'OOP':82,'Async':70,'StdLib':88 } },
    { slug:'java',   topics:{ 'Collections':80,'Concurrency':62,'JVM':74 } },
    { slug:'dsa',    topics:{ 'Arrays':74,'Trees':66,'Graphs':45,'DP':30 } },
    { slug:'sql',    topics:{ 'Joins':94,'Indexes':88,'Tuning':90 } },
    { slug:'ml',     topics:{ 'Models':78,'Metrics':72,'Regularization':65 } },
    { slug:'dl',     topics:{ 'CNN':70,'RNN':60,'Transformers':68 } },
  ];
  const now = Date.now();
  const out = [];
  samples.forEach((s, i) => {
    const d = getDomain(s.slug) || { name: s.slug, icon: '📘' };
    const acc = [84,76,68,91,74,70][i];
    const total = 50;
    const score = Math.round(total * acc / 100);
    out.push({
      slug: s.slug, domain: d.name, icon: d.icon,
      score, total, accuracy: acc,
      date: now - i * 86400000 * (i === 0 ? 0 : 1),
      topics: s.topics,
    });
  });
  // a couple extra older attempts to make the trend chart interesting
  out.push({ slug:'python', domain:'Python', icon:'🐍', score:36, total:50, accuracy:72, date: now - 6*86400000, topics:{} });
  out.push({ slug:'dsa',    domain:'DSA',    icon:'🧠', score:30, total:50, accuracy:60, date: now - 8*86400000, topics:{} });
  out.push({ slug:'sql',    domain:'SQL',    icon:'🗄️', score:40, total:50, accuracy:80, date: now -10*86400000, topics:{} });
  saveHistory(out);
  return out;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0,0,0,0);
  const that  = new Date(ts); that.setHours(0,0,0,0);
  const diff = (today - that) / 86400000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}
function badgeFor(acc) {
  if (acc >= 85) return ['excellent','Excellent'];
  if (acc >= 70) return ['good','Good'];
  if (acc >= 55) return ['average','Average'];
  return ['weak','Needs Work'];
}
function barClass(acc) {
  if (acc >= 80) return 'good';
  if (acc >= 60) return 'warn';
  return 'bad';
}

/* ---------- Renderers ---------- */
function renderSummary(history) {
  const total = history.length;
  const avg = total ? Math.round(history.reduce((s,h)=>s+h.accuracy,0)/total) : 0;
  const best = total ? Math.max(...history.map(h=>h.accuracy)) : 0;
  // best performing domain by average accuracy
  const byDomain = {};
  history.forEach(h => {
    (byDomain[h.slug] ||= { name:h.domain, icon:h.icon, sum:0, n:0 }).sum += h.accuracy;
    byDomain[h.slug].n += 1;
  });
  let bestDomain = null;
  Object.values(byDomain).forEach(d => {
    const a = d.sum / d.n;
    if (!bestDomain || a > bestDomain.avg) bestDomain = { ...d, avg: Math.round(a) };
  });

  document.getElementById('sumTotal').textContent = total;
  document.getElementById('sumAvg').textContent   = avg + '%';
  document.getElementById('sumBest').textContent  = best + '%';
  document.getElementById('sumDomain').textContent = bestDomain ? `${bestDomain.icon} ${bestDomain.name}` : '—';
  document.getElementById('sumDomainHint').textContent = bestDomain ? `Avg ${bestDomain.avg}% across ${bestDomain.n} attempt${bestDomain.n>1?'s':''}` : '';
}

function renderPerformance(history) {
  const byDomain = {};
  history.forEach(h => {
    (byDomain[h.slug] ||= { name:h.domain, icon:h.icon, sum:0, n:0 }).sum += h.accuracy;
    byDomain[h.slug].n += 1;
  });
  const rows = Object.values(byDomain)
    .map(d => ({ ...d, avg: Math.round(d.sum/d.n) }))
    .sort((a,b)=>b.avg-a.avg);

  const html = rows.map(r => `
    <div class="perf-row">
      <div class="perf-name"><span class="dot">${r.icon||'📘'}</span>${r.name}</div>
      <div class="perf-bar ${barClass(r.avg)}"><span style="width:${r.avg}%"></span></div>
      <div class="perf-pct">${r.avg}%</div>
    </div>
  `).join('');
  document.getElementById('perfList').innerHTML = html || '<p style="color:var(--muted);font-size:14px;">No data.</p>';
}

function renderAttempts(history) {
  const rows = [...history].sort((a,b)=>b.date-a.date).slice(0, 8);
  document.getElementById('attemptsBody').innerHTML = rows.map(h => {
    const [cls, label] = badgeFor(h.accuracy);
    return `
      <tr>
        <td><div class="domain-cell"><span class="ico">${h.icon||'📘'}</span>${h.domain}</div></td>
        <td><span class="score-pill">${h.score}/${h.total}</span></td>
        <td>
          <div class="acc-mini">
            <div class="bar"><span style="width:${h.accuracy}%"></span></div>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;">${h.accuracy}%</span>
          </div>
        </td>
        <td style="color:var(--muted);">${fmtDate(h.date)}</td>
        <td><span class="badge ${cls}">${label}</span></td>
      </tr>`;
  }).join('');
}

/* ---------- Trend chart (SVG) ---------- */
function renderTrend(history) {
  const wrap = document.getElementById('trendWrap');
  const tooltip = document.getElementById('trendTooltip');
  wrap.innerHTML = '';
  const data = [...history].sort((a,b)=>a.date-b.date);
  if (data.length < 2) {
    wrap.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:20px;">Take a few quizzes to see your trend.</p>';
    return;
  }
  const W = wrap.clientWidth || 600, H = 240, P = { l:36, r:16, t:18, b:28 };
  const xs = data.map((_,i) => P.l + i * (W - P.l - P.r) / (data.length - 1));
  const ys = data.map(d => P.t + (1 - d.accuracy/100) * (H - P.t - P.b));

  const path = xs.map((x,i)=>`${i?'L':'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${path} L${xs[xs.length-1].toFixed(1)},${H-P.b} L${xs[0].toFixed(1)},${H-P.b} Z`;

  // gridlines (0,25,50,75,100)
  let grid = '';
  [0,25,50,75,100].forEach(v => {
    const y = P.t + (1 - v/100) * (H - P.t - P.b);
    grid += `<line x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}" stroke="#eef0f7" stroke-dasharray="3 4"/>`;
    grid += `<text x="${P.l-8}" y="${y+4}" text-anchor="end" font-size="10" fill="#94a3b8">${v}</text>`;
  });

  const dots = xs.map((x,i)=>`<circle data-i="${i}" cx="${x}" cy="${ys[i]}" r="5" fill="#fff" stroke="url(#g1)" stroke-width="2.5" style="cursor:pointer"/>`).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stop-color="#4f46e5"/>
          <stop offset="1" stop-color="#7c6cff"/>
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#7c6cff" stop-opacity=".25"/>
          <stop offset="1" stop-color="#7c6cff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${grid}
      <path d="${area}" fill="url(#g2)"/>
      <path d="${path}" fill="none" stroke="url(#g1)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
    </svg>`;

  const svg = wrap.querySelector('svg');
  svg.querySelectorAll('circle').forEach(c => {
    c.addEventListener('mouseenter', e => {
      const i = +c.dataset.i, d = data[i];
      const rect = wrap.getBoundingClientRect();
      const cx = c.getBoundingClientRect().left - rect.left + 6;
      const cy = c.getBoundingClientRect().top  - rect.top + 6;
      tooltip.style.left = cx + 'px';
      tooltip.style.top  = cy + 'px';
      tooltip.textContent = `${d.domain} · ${d.accuracy}% · ${fmtDate(d.date)}`;
      tooltip.classList.add('show');
      c.setAttribute('r','7');
    });
    c.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
      c.setAttribute('r','5');
    });
  });
}

/* ---------- Weak areas ---------- */
function renderWeak(history) {
  // Collect topics across attempts
  const topics = {};
  history.forEach(h => {
    if (!h.topics) return;
    Object.entries(h.topics).forEach(([name, pct]) => {
      (topics[name] ||= { name, sum:0, n:0, domain:h.domain }).sum += pct;
      topics[name].n += 1;
    });
  });
  const arr = Object.values(topics).map(t => ({ ...t, avg: Math.round(t.sum/t.n) }))
    .filter(t => t.avg < 75)
    .sort((a,b)=>a.avg-b.avg)
    .slice(0,6);

  if (!arr.length) {
    document.getElementById('weakGrid').innerHTML =
      '<div class="weak-card" style="border-left-color:#10b981;"><div class="top"><div class="name">All strong 🎉</div><div class="pct" style="color:#10b981;">—</div></div><div class="meta">No weak topics detected yet. Keep practicing!</div></div>';
    return;
  }
  document.getElementById('weakGrid').innerHTML = arr.map(t => {
    const cls = t.avg < 50 ? 'low' : 'med';
    return `
      <div class="weak-card ${cls}">
        <div class="top">
          <div class="name">${t.name}</div>
          <div class="pct">${t.avg}%</div>
        </div>
        <div class="meta">${t.domain} · ${t.n} attempt${t.n>1?'s':''}</div>
        <div class="tip">💡 Practice ${t.name.toLowerCase()} problems to lift this score.</div>
      </div>`;
  }).join('');
}

/* ---------- Page entry ---------- */
function renderAll(history) {
  const hasData = history.length > 0;

  const emptyState = document.getElementById('emptyState');
  const analytics = document.getElementById('analytics');

  if (emptyState) {
    emptyState.style.display = hasData ? 'none' : 'block';
  }

  if (analytics) {
    analytics.style.display = hasData ? 'block' : 'none';
  }

  // Reset all UI when no history exists
  if (!hasData) {
    const ids = [
      'sumTotal',
      'sumAvg',
      'sumBest',
      'sumDomain',
      'sumDomainHint',
      'perfList',
      'attemptsBody',
      'trendWrap',
      'weakGrid'
    ];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      if (id === 'sumTotal') el.textContent = '0';
      else if (id === 'sumAvg') el.textContent = '0%';
      else if (id === 'sumBest') el.textContent = '0%';
      else if (id === 'sumDomain') el.textContent = '—';
      else if (id === 'sumDomainHint') el.textContent = '';
      else el.innerHTML = '';
    });

    return;
  }

  renderSummary(history);
  renderPerformance(history);
  renderAttempts(history);
  renderTrend(history);
  renderWeak(history);
}

document.addEventListener('DOMContentLoaded', () => {
  mountNavbar({ active: 'history' });

  let history = loadHistory();
  renderAll(history);

  document.getElementById('btnDemo')?.addEventListener('click', () => {
    history = seedDemoHistory();
    renderAll(history);
  });
  document.getElementById('btnClear')?.addEventListener('click', () => {
    if (!confirm('Clear all quiz history? This cannot be undone.')) return;
    localStorage.removeItem(HISTORY_KEY);
    history = [];
    renderAll(history);
  });

  window.addEventListener('resize', () => {
    if (history.length) renderTrend(history);
  });
});
