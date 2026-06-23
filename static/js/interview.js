/* AI Interview — frontend logic (mock AI, ready to swap for /api/interview) */

const STATE = {
  domain: null,
  level: 'Entry',
  questions: [],
  current: 0,
  answers: [],
  scores: { technical: 0, communication: 0, confidence: 0 },
};

/* ---------- Setup ---------- */
function renderDomainPicker() {
  const grid = document.getElementById('domain-pick-grid');
  grid.innerHTML = DOMAINS.map(d => `
    <button class="domain-pick" data-slug="${d.slug}">
      <div class="ic">${d.icon}</div>
      <div class="nm">${d.name}</div>
      <div class="ds">${d.desc}</div>
    </button>
  `).join('');
  grid.querySelectorAll('.domain-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.domain-pick').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.domain = getDomain(btn.dataset.slug);
    });
  });
  // default select first
  grid.querySelector('.domain-pick').classList.add('active');
  STATE.domain = DOMAINS[0];
}

function initLevels() {
  document.querySelectorAll('#level-row .level-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('#level-row .level-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      STATE.level = c.dataset.level;
    });
  });
}

/* ---------- Chat ---------- */
async function startInterview() {

  if (!STATE.domain) return;

  const response = await fetch("/api/interview/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      domain: STATE.domain.slug
    })
  });

  const data = await response.json();

  if (!data.success) {
    alert("Unable to load interview questions");
    return;
  }

  STATE.questions = data.questions;
  STATE.current = 0;
  STATE.answers = [];

  document.getElementById('setup-section').classList.add('hidden');
  document.getElementById('interview-section').classList.remove('hidden');

  document.getElementById('chat-domain-name').textContent =
      `${STATE.domain.icon} ${STATE.domain.name} Interviewer`;

  updateProgress();

  pushAI(
    `Hi! I'm your AI interviewer for ${STATE.domain.name}. We'll go through 5 questions.`
  );

  setTimeout(() => askNext(), 1000);
}

function updateProgress() {
  const n = STATE.current + 1;
  document.getElementById('q-progress-text').textContent = `Question ${Math.min(n, 5)} of 5`;
  document.getElementById('q-progress-fill').style.width = `${(Math.min(n, 5) / 5) * 100}%`;
}

function pushAI(text) {
  const body = document.getElementById('chat-body');
  body.insertAdjacentHTML('beforeend', `
    <div class="bubble-row ai">
      <div class="avatar ai">AI</div>
      <div class="bubble">${text}<div class="meta">Interviewer</div></div>
    </div>
  `);
  body.scrollTop = body.scrollHeight;
}

function pushTyping() {
  const body = document.getElementById('chat-body');
  body.insertAdjacentHTML('beforeend', `
    <div class="bubble-row ai" id="typing-row">
      <div class="avatar ai">AI</div>
      <div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>
    </div>
  `);
  body.scrollTop = body.scrollHeight;
}
function removeTyping() {
  const t = document.getElementById('typing-row');
  if (t) t.remove();
}

function pushUser(text) {
  const body = document.getElementById('chat-body');
  body.insertAdjacentHTML('beforeend', `
    <div class="bubble-row user">
      <div class="avatar user">YO</div>
      <div class="bubble">${escapeHtml(text)}<div class="meta">You</div></div>
    </div>
  `);
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function askNext() {
  if (STATE.current >= STATE.questions.length) {
    finishInterview();
    return;
  }
  pushTyping();
  setTimeout(() => {
    removeTyping();
    const q = STATE.questions[STATE.current];

pushAI(
  `<strong>${q.type.toUpperCase()}</strong><br><br>${q.question}`
);
  }, 1100);
}

async function handleSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  pushUser(text);
  STATE.answers.push({
   q: STATE.questions[STATE.current].question,
   type: STATE.questions[STATE.current].type,
   a: text
});
  input.value = '';
  input.style.height = 'auto';

  const result = await evaluateAnswer(
    STATE.questions[STATE.current].question,
    text
);

STATE.scores.technical = result.technical;
STATE.scores.communication = result.communication;
STATE.scores.confidence = result.confidence;

updateScoreUI();

    pushAI(
    "Feedback: " + result.feedback
);

  STATE.current++;
  updateProgress();

  if (STATE.current >= STATE.questions.length) {
    pushTyping();
    setTimeout(() => {
      removeTyping();
      pushAI('Thanks — that was the last question. Generating your performance report...');
      setTimeout(finishInterview, 1400);
    }, 1000);
  } else {
    setTimeout(() => {
      pushTyping();
      setTimeout(() => {
        removeTyping();
        pushAI(randomFollowup());
        setTimeout(askNext, 600);
      }, 900);
    }, 500);
  }
}

function randomFollowup() {
  const ops = [
    'Good — appreciate the detail.',
    'Interesting approach. Let\'s move on.',
    'Solid answer. Next one:',
    'Got it. Here\'s the next question.',
  ];
  return ops[Math.floor(Math.random() * ops.length)];
}

function scoreAnswer(text) {
  const words = text.trim().split(/\s+/).length;
  const techKeywords = ['algorithm','design','pattern','complexity','tradeoff','architecture','optimize','test','scalable','database','api'];
  const techHits = techKeywords.filter(k => text.toLowerCase().includes(k)).length;

  const technical = Math.min(100, 40 + techHits * 12 + Math.min(words, 80) / 3);
  const communication = Math.min(100, 50 + Math.min(words, 120) / 2.5);
  const confidence = Math.min(100, 45 + (text.match(/[.!]/g)?.length || 0) * 6 + Math.min(words, 60) / 3);

  // running average
  const n = STATE.current + 1;
  STATE.scores.technical = Math.round(((STATE.scores.technical * STATE.current) + technical) / n);
  STATE.scores.communication = Math.round(((STATE.scores.communication * STATE.current) + communication) / n);
  STATE.scores.confidence = Math.round(((STATE.scores.confidence * STATE.current) + confidence) / n);

  updateScoreUI();
}

function updateScoreUI() {
  const { technical, communication, confidence } = STATE.scores;
  document.getElementById('score-tech').style.width = technical + '%';
  document.getElementById('score-tech-val').textContent = technical + '%';
  document.getElementById('score-comm').style.width = communication + '%';
  document.getElementById('score-comm-val').textContent = communication + '%';
  document.getElementById('score-conf').style.width = confidence + '%';
  document.getElementById('score-conf-val').textContent = confidence + '%';
}

/* ---------- Final report ---------- */
function finishInterview() {
  document.getElementById('interview-section').classList.add('hidden');
  document.getElementById('report-section').classList.remove('hidden');

  const { technical, communication, confidence } = STATE.scores;
  const overall = Math.round((technical + communication + confidence) / 3);

  // Ring animation
  const ring = document.getElementById('report-ring');
  const circ = 2 * Math.PI * 78;
  ring.setAttribute('stroke-dasharray', circ);
  setTimeout(() => {
    ring.style.transition = 'stroke-dashoffset 1.2s ease';
    ring.setAttribute('stroke-dashoffset', circ - (circ * overall / 100));
  }, 100);

  let n = 0;
  const tick = setInterval(() => {
    n += 2;
    if (n >= overall) { n = overall; clearInterval(tick); }
    document.getElementById('report-pct').textContent = n + '%';
  }, 25);

  document.getElementById('r-tech').textContent = technical + '%';
  document.getElementById('r-comm').textContent = communication + '%';
  document.getElementById('r-conf').textContent = confidence + '%';
  setTimeout(() => {
    document.getElementById('r-tech-bar').style.width = technical + '%';
    document.getElementById('r-comm-bar').style.width = communication + '%';
    document.getElementById('r-conf-bar').style.width = confidence + '%';
  }, 200);

  let verdict = 'Solid performance — keep practicing to push toward expert level.';
  if (overall >= 85) verdict = 'Exceptional — you are interview-ready for senior roles.';
  else if (overall >= 70) verdict = 'Strong showing — refine depth on weaker areas.';
  else if (overall < 55) verdict = 'Good start — focus on structure and concrete examples.';
  document.getElementById('report-verdict').textContent = verdict;

  const review = document.getElementById('qa-review');
  review.innerHTML = `<h3>Question Review</h3>` + STATE.answers.map((qa, i) => `
    <div class="qa-item">
      <div class="q">Q${i+1}. ${escapeHtml(qa.q)}</div>
      <div class="a">${escapeHtml(qa.a)}</div>
    </div>
  `).join('');
}

async function evaluateAnswer(question, answer) {

    const response = await fetch(
        "/api/interview/evaluate",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                answer,
                domain: STATE.domain.slug
            })
        }
    );

    return await response.json();
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderDomainPicker();
  initLevels();
  document.getElementById('start-btn').addEventListener('click', startInterview);

  const input = document.getElementById('chat-input');
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  document.getElementById('send-btn').addEventListener('click', handleSend);
});


