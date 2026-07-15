/* ==========================================================
   Admin Dashboard — vanilla JS (UI only, placeholder data)
   ========================================================== */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Sidebar & drawer ---------- */
  const shell = $('#admin-shell');
  $('#sideCollapseBtn')?.addEventListener('click', () => {
    if (window.innerWidth <= 900) shell.classList.remove('drawer-open');
    else shell.classList.toggle('collapsed');
  });
  $('#menuBtn')?.addEventListener('click', () => shell.classList.add('drawer-open'));
  $('#scrim')?.addEventListener('click', () => shell.classList.remove('drawer-open'));

  $$('.side-link').forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    $$('.side-link').forEach(x => x.classList.remove('active'));
    l.classList.add('active');
    if (window.innerWidth <= 900) shell.classList.remove('drawer-open');
  }));

  /* ---------- Theme toggle ---------- */
  const themeBtn = $('#themeBtn');
  const saved = localStorage.getItem('admin-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  themeBtn?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('admin-theme', cur);
  });

  /* ---------- Notifications dropdown ---------- */
  const notifBtn = $('#notifBtn'), notifPanel = $('#notifPanel');
  notifBtn?.addEventListener('click', e => { e.stopPropagation(); notifPanel.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!notifPanel.contains(e.target) && e.target !== notifBtn) notifPanel.classList.remove('open');
  });

  /* ---------- Demo toggle ---------- */
  const demoToggle = $('#demoToggle');
  const demoModeState = { enabled: false };
  const serverChartHtml = {};

  const chartHosts = ['lineChart', 'barChart', 'pieChart', 'areaChart'];
  chartHosts.forEach(id => {
    const host = $('#' + id);
    if (host && host.dataset.serverChart === 'true') {
      serverChartHtml[id] = host.innerHTML;
    }
  });

  const restoreServerCharts = () => {
    chartHosts.forEach(id => {
      const host = $('#' + id);
      if (host && serverChartHtml[id]) {
        host.innerHTML = serverChartHtml[id];
        host.dataset.serverChart = 'true';
      }
    });
  };

  const applyDemoMode = (enabled) => {
    demoModeState.enabled = enabled;
    demoToggle?.classList.toggle('is-active', enabled);
    demoToggle?.setAttribute('aria-pressed', String(enabled));
    demoToggle?.querySelector('svg')?.setAttribute('stroke', enabled ? '#fff' : 'currentColor');

    const statValues = $$('.stat-value');
    const demoCounts = [12480, 8210, 34592, 5320, 6741, 24];
    const realCounts = [
      +statValues[0]?.dataset.count || 0,
      +statValues[1]?.dataset.count || 0,
      +statValues[2]?.dataset.count || 0,
      +statValues[3]?.dataset.count || 0,
      +statValues[4]?.dataset.count || 0,
      +statValues[5]?.dataset.count || 0,
    ];

    statValues.forEach((el, idx) => {
      const target = enabled ? demoCounts[idx] : realCounts[idx];
      el.dataset.count = target;
      el.textContent = '0';
      animateCount(el, target);
    });

    if (enabled) {
      const demoChartData = {
        line: { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], values: [420, 560, 610, 720, 690, 880, 920, 1050, 990, 1180, 1320, 1480] },
        bar: { labels: ['Python','Java','SQL','ML','DSA','MERN'], values: [92, 78, 66, 58, 51, 44] },
        pie: { labels: ['Quizzes','AI Interviews','Resume'], values: [4600, 2800, 1500], colors: [COLORS.primary, COLORS.purple, COLORS.amber] },
        area: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values: [320, 410, 380, 520, 610, 470, 540] },
      };
      renderChartSection($('#lineChart'), demoChartData.line, renderLineChart);
      renderChartSection($('#barChart'), demoChartData.bar, renderBarChart);
      renderChartSection($('#pieChart'), demoChartData.pie, renderPieChart);
      renderChartSection($('#areaChart'), demoChartData.area, renderAreaChart);
    } else {
      restoreServerCharts();
    }
  };

  const renderChartSection = (host, data, renderer) => {
    if (!host) return;
    host.innerHTML = '';
    renderer(host, data);
  };

  demoToggle?.addEventListener('click', () => {
    applyDemoMode(!demoModeState.enabled);
  });

  const animateCount = (el, target) => {
    const dur = 1200, start = performance.now();
    const step = t => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$('.stat-value').forEach(el => animateCount(el, +el.dataset.count || 0));

  /* ---------- Chart utilities (pure SVG) ---------- */
  const COLORS = {
    primary: '#6366f1', primaryGlow: '#8b5cf6',
    blue: '#3b82f6', green: '#10b981', amber: '#f59e0b',
    pink: '#ec4899', purple: '#8b5cf6',
  };

  function renderLineChart(host, data) {
    const w = host.clientWidth, h = host.clientHeight;
    const pad = { l: 34, r: 14, t: 14, b: 26 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const max = Math.max(...data.values) * 1.15;
    const step = iw / (data.values.length - 1);
    const pts = data.values.map((v, i) => [pad.l + i * step, pad.t + ih - (v / max) * ih]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = path + ` L${pts[pts.length-1][0]},${pad.t+ih} L${pts[0][0]},${pad.t+ih} Z`;
    const grid = [0, .25, .5, .75, 1].map(g => {
      const y = pad.t + ih * g;
      return `<line x1="${pad.l}" x2="${w-pad.r}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 4"/>`;
    }).join('');
    const labels = data.labels.map((lbl, i) =>
      `<text x="${pad.l + i * step}" y="${h - 6}" text-anchor="middle" fill="var(--muted)" font-size="10">${lbl}</text>`
    ).join('');
    host.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${COLORS.primary}" stop-opacity=".35"/>
            <stop offset="100%" stop-color="${COLORS.primary}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#lineArea)"/>
        <path d="${path}" fill="none" stroke="${COLORS.primary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="1200" stroke-dashoffset="1200">
          <animate attributeName="stroke-dashoffset" from="1200" to="0" dur="1.1s" fill="freeze"/>
        </path>
        ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${COLORS.primary}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="1s" dur=".3s" fill="freeze"/></circle>`).join('')}
        ${labels}
      </svg>`;
  }

  function renderBarChart(host, data) {
    const w = host.clientWidth, h = host.clientHeight;
    const pad = { l: 34, r: 10, t: 12, b: 30 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const max = Math.max(...data.values) * 1.1;
    const bw = iw / data.values.length * 0.62, gap = iw / data.values.length;
    const bars = data.values.map((v, i) => {
      const bh = (v / max) * ih;
      const x = pad.l + i * gap + (gap - bw) / 2;
      const y = pad.t + ih - bh;
      return `
        <rect x="${x}" y="${pad.t+ih}" width="${bw}" height="0" rx="6" fill="url(#barGrad)">
          <animate attributeName="y" from="${pad.t+ih}" to="${y}" dur=".8s" fill="freeze" begin="${i*0.06}s" calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
          <animate attributeName="height" from="0" to="${bh}" dur=".8s" fill="freeze" begin="${i*0.06}s" calcMode="spline" keySplines="0.22 0.61 0.36 1"/>
        </rect>
        <text x="${x + bw/2}" y="${h - 8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${data.labels[i]}</text>`;
    }).join('');
    host.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${COLORS.primary}"/>
            <stop offset="100%" stop-color="${COLORS.primaryGlow}"/>
          </linearGradient>
        </defs>
        ${bars}
      </svg>`;
  }

  function renderPieChart(host, data) {
    const size = Math.min(host.clientWidth, host.clientHeight);
    const cx = host.clientWidth / 2, cy = size / 2, r = size / 2 - 20, ir = r * 0.6;
    const total = data.values.reduce((a, b) => a + b, 0);
    let acc = 0;
    const arcs = data.values.map((v, i) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += v;
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + Math.cos(start) * r, y1 = cy + Math.sin(start) * r;
      const x2 = cx + Math.cos(end) * r,   y2 = cy + Math.sin(end) * r;
      const x3 = cx + Math.cos(end) * ir,  y3 = cy + Math.sin(end) * ir;
      const x4 = cx + Math.cos(start) * ir, y4 = cy + Math.sin(start) * ir;
      return `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 ${large} 0 ${x4},${y4} Z"
                fill="${data.colors[i]}" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur=".5s" begin="${i*0.15}s" fill="freeze"/>
              </path>`;
    }).join('');
    const legend = data.labels.map((l, i) =>
      `<g transform="translate(${host.clientWidth - 130}, ${20 + i * 22})">
        <rect width="12" height="12" rx="3" fill="${data.colors[i]}"/>
        <text x="20" y="10" font-size="11.5" fill="var(--fg-soft)">${l} · ${Math.round(data.values[i]/total*100)}%</text>
      </g>`).join('');
    host.innerHTML = `
      <svg viewBox="0 0 ${host.clientWidth} ${size}" width="100%" height="100%">
        ${arcs}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--fg)" font-family="Space Grotesk">${total.toLocaleString()}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10.5" fill="var(--muted)">Total sessions</text>
        ${legend}
      </svg>`;
  }

  function renderAreaChart(host, data) {
    const w = host.clientWidth, h = host.clientHeight;
    const pad = { l: 30, r: 12, t: 14, b: 26 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const max = Math.max(...data.values) * 1.2;
    const step = iw / (data.values.length - 1);
    const pts = data.values.map((v, i) => [pad.l + i * step, pad.t + ih - (v / max) * ih]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = path + ` L${pts[pts.length-1][0]},${pad.t+ih} L${pts[0][0]},${pad.t+ih} Z`;
    const labels = data.labels.map((lbl, i) =>
      `<text x="${pad.l + i * step}" y="${h - 6}" text-anchor="middle" fill="var(--muted)" font-size="10">${lbl}</text>`
    ).join('');
    host.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${COLORS.purple}" stop-opacity=".55"/>
            <stop offset="100%" stop-color="${COLORS.purple}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#areaGrad)" opacity="0"><animate attributeName="opacity" from="0" to="1" dur=".8s" fill="freeze"/></path>
        <path d="${path}" fill="none" stroke="${COLORS.purple}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="1200" stroke-dashoffset="1200">
          <animate attributeName="stroke-dashoffset" from="1200" to="0" dur="1.1s" fill="freeze"/>
        </path>
        ${labels}
      </svg>`;
  }

  /* ---------- Data ---------- */
  const chartData = {
    line: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      values: [420, 560, 610, 720, 690, 880, 920, 1050, 990, 1180, 1320, 1480],
    },
    bar: {
      labels: ['Python','Java','SQL','ML','DSA','MERN'],
      values: [92, 78, 66, 58, 51, 44],
    },
    pie: {
      labels: ['Quizzes','AI Interviews','Resume'],
      values: [4600, 2800, 1500],
      colors: [COLORS.primary, COLORS.purple, COLORS.amber],
    },
    area: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      values: [320, 410, 380, 520, 610, 470, 540],
    },
  };

  const initCharts = () => {
    setTimeout(() => {
      if (demoModeState.enabled) return;
      const line = $('#lineChart');
      const bar = $('#barChart');
      const pie = $('#pieChart');
      const area = $('#areaChart');
      if (!line || !bar || !pie || !area) return;

      if (line.dataset.serverChart === 'true') {
        line.innerHTML = serverChartHtml.line || line.innerHTML;
      } else {
        renderChartSection(line, chartData.line, renderLineChart);
      }

      if (bar.dataset.serverChart === 'true') {
        bar.innerHTML = serverChartHtml.bar || bar.innerHTML;
      } else {
        renderChartSection(bar, chartData.bar, renderBarChart);
      }

      if (pie.dataset.serverChart === 'true') {
        pie.innerHTML = serverChartHtml.pie || pie.innerHTML;
      } else {
        renderChartSection(pie, chartData.pie, renderPieChart);
      }

      if (area.dataset.serverChart === 'true') {
        area.innerHTML = serverChartHtml.area || area.innerHTML;
      } else {
        renderChartSection(area, chartData.area, renderAreaChart);
      }
    }, 650); // simulated loading skeleton
  };
  window.addEventListener('load', initCharts);
  window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(initCharts, 150); });

  /* ---------- Timeline ---------- */
  const activities = [
    { who: 'John Carter',  init: 'JC', act: 'registered a new account',      time: '2 min ago', badge: ['blue','New'], color: '#3b82f6,#60a5fa' },
    { who: 'Sarah Lee',    init: 'SL', act: 'completed the Python Quiz',     time: '18 min ago', badge: ['green','Passed'], color: '#10b981,#34d399' },
    { who: 'Rahul Sharma', init: 'RS', act: 'uploaded a resume for review',  time: '42 min ago', badge: ['amber','Processing'], color: '#f59e0b,#fbbf24' },
    { who: 'Sneha Patel',  init: 'SP', act: 'updated her Career Profile',    time: '1 h ago',    badge: ['purple','Updated'], color: '#8b5cf6,#a78bfa' },
    { who: 'Aman Gupta',   init: 'AG', act: 'started an AI Interview',       time: '2 h ago',    badge: ['blue','Live'], color: '#6366f1,#818cf8' },
  ];
  $('#timeline').innerHTML = activities.map(a => `
    <li>
      <div class="avatar" style="background:linear-gradient(135deg,${a.color})">${a.init}</div>
      <div class="tl-body"><b>${a.who}</b><small>${a.act} · ${a.time}</small></div>
      <span class="pill ${a.badge[0]}">${a.badge[1]}</span>
    </li>`).join('');

  /* ---------- Users table ---------- */
  const users = [
    { name:'Aarav Mehta',   email:'aarav@ipractice.io',  role:'User',      status:'Active',  joined:'Jul 12, 2026', last:'2 min ago',  init:'AM', color:'#3b82f6,#60a5fa', statusPill:'green' },
    { name:'Priya Shah',    email:'priya@ipractice.io',  role:'Pro',       status:'Active',  joined:'Jul 10, 2026', last:'14 min ago', init:'PS', color:'#8b5cf6,#a78bfa', statusPill:'green' },
    { name:'Rahul Kapoor',  email:'rahul.k@ipractice.io',role:'User',      status:'Inactive',joined:'Jul 08, 2026', last:'3 days ago', init:'RK', color:'#f59e0b,#fbbf24', statusPill:'gray' },
    { name:'Sneha Iyer',    email:'sneha@ipractice.io',  role:'Moderator', status:'Active',  joined:'Jul 06, 2026', last:'1 h ago',    init:'SI', color:'#10b981,#34d399', statusPill:'green' },
    { name:'Aman Verma',    email:'aman@ipractice.io',   role:'Pro',       status:'Pending', joined:'Jul 03, 2026', last:'—',          init:'AV', color:'#ec4899,#f472b6', statusPill:'amber' },
  ];
  const rolePill = r => r === 'Moderator' ? 'purple' : r === 'Pro' ? 'blue' : 'gray';
  $('#usersBody').innerHTML = users.map(u => `
    <tr>
      <td>
        <div class="u-cell">
          <div class="avatar" style="background:linear-gradient(135deg,${u.color})">${u.init}</div>
          <div><b>${u.name}</b></div>
        </div>
      </td>
      <td>${u.email}</td>
      <td><span class="pill ${rolePill(u.role)}">${u.role}</span></td>
      <td><span class="pill ${u.statusPill}">${u.status}</span></td>
      <td>${u.joined}</td>
      <td>${u.last}</td>
      <td>
        <div class="row-actions">
          <button title="View"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button title="Edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></button>
          <button title="Delete" class="danger"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>
        </div>
      </td>
    </tr>`).join('');

  /* ---------- Domain usage bars ---------- */
  const usage = [
    { name:'Python', pct: 85 },
    { name:'Java', pct: 70 },
    { name:'SQL', pct: 63 },
    { name:'Machine Learning', pct: 54 },
    { name:'DSA', pct: 46 },
  ];
  $('#usageList').innerHTML = usage.map(u => `
    <li>
      <div class="usage-top"><b>${u.name}</b><span>${u.pct}%</span></div>
      <div class="usage-bar"><div class="usage-fill" data-pct="${u.pct}"></div></div>
    </li>`).join('');
  setTimeout(() => {
    $$('.usage-fill').forEach(el => { el.style.width = el.dataset.pct + '%'; });
  }, 300);

})();
