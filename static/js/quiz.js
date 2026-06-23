/* Quiz logic — loads real questions from Flask /api/questions */
let QUIZ = {
    domain: null,
    questions: [],
    answers: {},
    current: 0,
    secondsLeft: 60 * 60,
    timerId: null,
    submitted: false,
};

async function initQuiz() {
    const slug = qs('slug');
    const d = getDomain(slug);

    if (!d) {
        document.getElementById('quizRoot').innerHTML = '<h2>Domain not found</h2>';
        return;
    }

    QUIZ.domain = d;
    QUIZ.secondsLeft = d.duration * 60;
    document.title = `${d.name} — Assessment in progress`;

    const root = document.getElementById('quizRoot');
    root.innerHTML = '<h2>Loading questions...</h2>';

    try {
        QUIZ.questions = await loadQuestions(slug);

        if (!Array.isArray(QUIZ.questions) || QUIZ.questions.length === 0) {
            root.innerHTML = '<h2>No questions found for this domain.</h2>';
            return;
        }

        render();
        startTimer();
    } catch (error) {
        console.error(error);
        root.innerHTML = '<h2>Could not load questions. Please try again.</h2>';
    }
}
function saveProgress() {
    localStorage.setItem(
        "quiz-progress",
        JSON.stringify({
            domain: QUIZ.domain?.slug,
            questions: QUIZ.questions,
            answers: QUIZ.answers,
            current: QUIZ.current,
            secondsLeft: QUIZ.secondsLeft
        })
    );
}

function startTimer() {
    QUIZ.timerId = setInterval(() => {
        QUIZ.secondsLeft = Math.max(0, QUIZ.secondsLeft - 1);
        updateTimer();

        if (QUIZ.secondsLeft === 0 && !QUIZ.submitted) {
            submitQuiz();
        }
    }, 1000);
}

function fmtTime(s) {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${m}:${ss}`;
}

function updateTimer() {
    const t = document.getElementById('timer');

    if (!t) return;

    t.textContent = `⏱ ${fmtTime(QUIZ.secondsLeft)}`;
    t.classList.toggle('low', QUIZ.secondsLeft < 5 * 60);
}

function answeredCount() {
    return Object.values(QUIZ.answers).filter(v => v && String(v).trim().length).length;
}

function setAnswer(qid, val) {
    QUIZ.answers[qid] = val;
    saveProgress();
    render();
}

function go(i) {
    QUIZ.current = Math.max(
        0,
        Math.min(QUIZ.questions.length - 1, i)
    );

    saveProgress();
    render();
}

function openSubmit() {
    document.getElementById('sumTotal').textContent = QUIZ.questions.length;
    document.getElementById('sumAns').textContent = answeredCount();
    document.getElementById('sumUn').textContent = QUIZ.questions.length - answeredCount();
    document.getElementById('submitModal').classList.add('open');
}

function openQuitModal() {
    document.getElementById('quitModal').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function submitQuiz() {
    if (QUIZ.submitted) return;

    QUIZ.submitted = true;
    clearInterval(QUIZ.timerId);

    const payload = {
        slug: QUIZ.domain.slug,
        answers: QUIZ.answers,
        questions: QUIZ.questions,
        submittedAt: Date.now(),
    };

    let correct = 0;

QUIZ.questions.forEach(q => {
    const ans = QUIZ.answers[q.id];

    if (
        q.type === "mcq" &&
        ans === q.correct
    ) {
        correct++;
    }
});

const accuracy = Math.round(
    (correct / QUIZ.questions.length) * 100
);

const history =
    JSON.parse(localStorage.getItem("iph_history") || "[]");

history.push({
    slug: QUIZ.domain.slug,
    domain: QUIZ.domain.name,
    icon: QUIZ.domain.icon,
    score: correct,
    total: QUIZ.questions.length,
    accuracy: accuracy,
    date: Date.now()
});

localStorage.setItem(
    "iph_history",
    JSON.stringify(history)
);

    try {
        sessionStorage.setItem(`quiz-result:${QUIZ.domain.slug}`, JSON.stringify(payload));
    } catch (_) {}

    localStorage.removeItem("quiz-progress");
    location.replace(`result.html?slug=${QUIZ.domain.slug}`);
}

function render() {
    const q = QUIZ.questions[QUIZ.current];

    if (!q) {
        document.getElementById('quizRoot').innerHTML = '<h2>Question not found.</h2>';
        return;
    }

    const progress = ((QUIZ.current + 1) / QUIZ.questions.length) * 100;
    const root = document.getElementById('quizRoot');

    root.innerHTML = `
    <div class="quiz-header">
      <div>
        <div class="quiz-meta-label">${QUIZ.domain.icon} ${QUIZ.domain.name}</div>
        <div class="quiz-q-counter">Question ${QUIZ.current + 1} of ${QUIZ.questions.length}</div>
      </div>
      <div id="timer" class="timer">⏱ ${fmtTime(QUIZ.secondsLeft)}</div>
    </div>

    <div class="progress-row">
      <span>${Math.round(progress)}% completed</span>
      <span>${answeredCount()} answered · ${QUIZ.questions.length - answeredCount()} remaining</span>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" style="width:${progress}%"></div>
    </div>

    <div class="quiz-grid">
      <section class="card question-card">
        <div class="q-badges">
          <span class="badge ${String(q.difficulty || 'medium').toLowerCase()}">${q.difficulty || 'Medium'}</span>
          <span class="badge">${q.topic || 'General'}</span>
          <span class="badge accent">${q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</span>
        </div>

        <h2 class="q-text">${q.text || q.question}</h2>

        ${renderInput(q)}

        <div class="quiz-nav">
          <button class="btn btn-outline" ${QUIZ.current === 0 ? 'disabled' : ''} onclick="go(${QUIZ.current - 1})">
            ← Previous
          </button>

          <div class="quiz-nav-right">
            <button class="btn btn-success" onclick="openSubmit()">✓ Submit</button>
            <button class="btn btn-primary" ${QUIZ.current === QUIZ.questions.length - 1 ? 'disabled' : ''} onclick="go(${QUIZ.current + 1})">
              Next →
            </button>
          </div>
        </div>
      </section>

      <aside class="palette-sidebar">
        <div class="palette">
          <div class="palette-head">
            <h3>Question Navigator</h3>
            <span class="text-muted" style="font-size:12px;">${QUIZ.questions.length} total</span>
          </div>

          <div class="palette-grid">
            ${QUIZ.questions.map((qq, i) => {
                const ans = QUIZ.answers[q.id]?.trim() && String(QUIZ.answers[qq.id]).trim().length;
                const cls = i === QUIZ.current ? 'current' : (ans ? 'answered' : '');
                return `<button class="pal-btn ${cls}" onclick="go(${i})">${i + 1}</button>`;
            }).join('')}
          </div>

          <div class="legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:var(--primary);border-color:var(--primary);"></span>
              Current
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:rgba(16,185,129,.3);"></span>
              Answered
            </div>
            <div class="legend-item">
              <span class="legend-dot"></span>
              Unanswered
            </div>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderInput(q) {
    const qid = q.id;
    const val = QUIZ.answers[qid] ?? '';

    if (q.type === 'mcq') {
        return `
        <div class="options-list">
          ${(q.options || []).map((opt, i) => `
            <button
              type="button"
              class="option ${val === opt ? 'active' : ''}"
              data-qid="${String(qid)}"
              data-value="${String(opt).replace(/"/g, '&quot;')}"
            >
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
        `;
    }

    const safe = String(val).replace(/"/g, '&quot;');

    return `
    <textarea class="short-answer" placeholder="Type your answer here..."
      oninput="QUIZ.answers[${JSON.stringify(qid)}]=this.value; document.getElementById('charCount').textContent=this.value.length + ' / 1000'"
      maxlength="1000">${safe}</textarea>

    <div id="charCount" class="char-count">${String(val).length} / 1000</div>
  `;
}

document.addEventListener('click', function (event) {
    const option = event.target.closest('.option');

    if (!option) return;

    const qid = option.dataset.qid;
    const value = option.dataset.value;

    setAnswer(qid, value);
});

initQuiz();