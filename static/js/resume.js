// Resume Analyzer — front-end only mock analysis
mountNavbar({ active: 'resume' });

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const filePill = document.getElementById('filePill');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileIco = document.getElementById('fileIco');
const removeFile = document.getElementById('removeFile');
const analyzeBtn = document.getElementById('analyzeBtn');
const demoBtn = document.getElementById('demoBtn');
const analyzing = document.getElementById('analyzing');
const results = document.getElementById('results');
const reanalyzeBtn = document.getElementById('reanalyzeBtn');

let currentFile = null;

const ALLOWED = ['pdf', 'doc', 'docx', 'txt'];
const MAX_SIZE = 5 * 1024 * 1024;

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

function setFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED.includes(ext)) { alert('Please upload a PDF, DOCX, or TXT file.'); return; }
  if (file.size > MAX_SIZE) { alert('File too large. Max 5MB.'); return; }
  currentFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = fmtSize(file.size) + ' • ' + ext.toUpperCase();
  fileIco.textContent = ext.toUpperCase().slice(0, 3);
  const grad = ext === 'pdf' ? 'linear-gradient(135deg,#ef4444,#fb7185)'
             : ext === 'txt' ? 'linear-gradient(135deg,#10b981,#34d399)'
             : 'linear-gradient(135deg,#0ea5e9,#22d3ee)';
  fileIco.style.background = grad;
  filePill.classList.add('show');
  analyzeBtn.disabled = false;
}

function clearFile() {
  currentFile = null;
  fileInput.value = '';
  filePill.classList.remove('show');
  analyzeBtn.disabled = true;
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) setFile(e.target.files[0]); });

['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag');
}));
dropzone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); });

removeFile.addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

analyzeBtn.addEventListener("click", async () => {

  if (!currentFile) return;

  analyzing.classList.add("show");

  const formData = new FormData();
  formData.append("resume", currentFile);

  try {

    const response = await fetch("/analyze_resume", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    analyzing.classList.remove("show");

    if (!data.success) {
      alert(data.message);
      return;
    }

    renderResults(data);
    results.classList.add("show");

    results.scrollIntoView({
      behavior: "smooth"
    });

  } catch (err) {

    analyzing.classList.remove("show");
    alert("Error analyzing resume");

    console.error(err);
  }
});
demoBtn.addEventListener('click', () => runAnalysis('demo_resume.pdf', true));
reanalyzeBtn.addEventListener('click', () => {
  results.classList.remove('show');
  clearFile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function runAnalysis(name, isDemo) {
  analyzing.classList.add('show');
  results.classList.remove('show');
  setTimeout(() => {
    analyzing.classList.remove('show');
    renderResults(generateMockResults(name, isDemo));
    results.classList.add('show');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1400);
}

function generateMockResults(name, isDemo) {
  const score = isDemo ? 82 : 60 + Math.floor(Math.random() * 30);
  const allSkills = ['Python','JavaScript','React','Node.js','SQL','Git','Docker','AWS','TypeScript','REST APIs','MongoDB','CI/CD','Agile','Linux','Kubernetes','GraphQL','Redis','Java','C++','System Design'];
  const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
  const found = shuffled.slice(0, 9);
  const missing = shuffled.slice(9, 15);

  return {
    score,
    role: 'Software Engineer',
    skillsFound: found,
    skillsMissing: missing,
    recommendations: [
      { title: 'Quantify your impact', body: 'Add metrics to your bullet points (e.g., "reduced load time by 40%", "served 1M+ requests/day"). Numbers make recruiters stop scrolling.' },
      { title: 'Add missing keywords', body: 'Include "Docker", "CI/CD", and "Kubernetes" in your projects or skills section to improve ATS keyword matching.' },
      { title: 'Strengthen your summary', body: 'Lead with a 2–3 sentence summary highlighting years of experience, core stack, and what role you target.' },
      { title: 'Use action verbs', body: 'Replace passive phrases ("was responsible for…") with verbs like Built, Shipped, Led, Optimized, Architected.' },
      { title: 'Tighten formatting', body: 'Stick to a single-column layout, standard fonts, and avoid tables/images that confuse ATS parsers.' },
    ],
    sections: [
      { name: 'Contact Info', ok: true },
      { name: 'Professional Summary', ok: true },
      { name: 'Work Experience', ok: true },
      { name: 'Education', ok: true },
      { name: 'Technical Skills', ok: true },
      { name: 'Projects', ok: Math.random() > 0.4 },
      { name: 'Certifications', ok: Math.random() > 0.6 },
      { name: 'LinkedIn / Portfolio', ok: Math.random() > 0.3 },
    ],
  };
}

function renderResults(d) {
  // Score ring
  const ring = document.getElementById('ringFill');
  const C = 2 * Math.PI * 84;
  ring.setAttribute('stroke-dasharray', C);
  ring.setAttribute('stroke-dashoffset', C);
  document.getElementById('atsScore').textContent = '0%';
  requestAnimationFrame(() => {
    ring.setAttribute('stroke-dashoffset', C * (1 - d.score / 100));
    animateNumber('atsScore', 0, d.score, 1100, v => v + '%');
  });

  // Title / verdict
  const t = document.getElementById('scoreTitle');
  const v = document.getElementById('scoreVerdict');
  if (d.score >= 85) { t.textContent = 'Outstanding!'; v.textContent = 'Your resume scores in the top tier for ATS and recruiter readability.'; }
  else if (d.score >= 70) { t.textContent = 'Great start!'; v.textContent = 'Your resume passes most ATS checks. A few tweaks will push it into the top tier.'; }
  else if (d.score >= 55) { t.textContent = 'Needs polish'; v.textContent = 'You\'re on the right track. Address the missing keywords and structure to improve outcomes.'; }
  else { t.textContent = 'Lots of room to grow'; v.textContent = 'Apply the recommendations below to significantly boost your ATS score.'; }

  document.getElementById('pillStrengths').textContent = d.skillsFound.length + ' skills matched';
  document.getElementById('pillImprove').textContent = d.skillsMissing.length + ' to improve';
  document.getElementById('pillRole').textContent = 'Detected: ' + d.role;

  // Chips
  const fc = document.getElementById('skillsFound');
  fc.innerHTML = d.skillsFound.map(s => `<span class="chip found">✓ ${s}</span>`).join('');
  const mc = document.getElementById('skillsMissing');
  mc.innerHTML = d.skillsMissing.map(s => `<span class="chip missing">+ ${s}</span>`).join('');

  // Recommendations
  const rl = document.getElementById('recoList');
  rl.innerHTML = d.recommendations.map((r, i) => `
    <div class="reco-item">
      <div class="num">${i + 1}</div>
      <div class="body"><strong>${r.title}</strong><small>${r.body}</small></div>
    </div>`).join('');

  // Sections
  const sg = document.getElementById('sectionsGrid');
  sg.innerHTML = d.sections.map(s => `
    <div class="sec-row ${s.ok ? 'ok' : 'miss'}">
      <span>${s.ok ? '✓' : '✕'} ${s.name}</span>
      <span class="stat">${s.ok ? 'Detected' : 'Missing'}</span>
    </div>`).join('');
}

function animateNumber(id, from, to, dur, fmt) {
  const el = document.getElementById(id);
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = fmt ? fmt(val) : val;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
