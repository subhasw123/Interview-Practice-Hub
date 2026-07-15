function renderResult() {
    const slug = qs('slug');
    const root = document.getElementById('resultRoot');
    let data;
    try { data = JSON.parse(sessionStorage.getItem(`quiz-result:${slug}`) || 'null'); } catch (_) { }
    if (!data) {
        root.innerHTML = `<div class="card card-pad"><h2>No result found</h2>
      <p class="text-muted">Start an assessment first.</p>
      <a href="index.html" class="btn btn-primary mt-12">Browse domains</a></div>`;
        return;
    }
    const d = getDomain(slug);
    const total = data.questions.length;
    let correct = 0, attempted = 0;
    const reviewItems = [];
    data.questions.forEach(q => {
        const ans = data.answers[q.id];
        const has = ans && String(ans).trim().length;
        if (has) attempted++;
        const isRight = q.type === 'mcq' && ans === q.correct;
        if (isRight) correct++;
        reviewItems.push({ q, ans, isRight, has });
    });
    const accuracy = total ? Math.round((correct / total) * 100) : 0;

    const history = JSON.parse(
    localStorage.getItem("quiz_history") || "[]"
    );

    history.push({
        domain: slug,
        score: correct,
        total: total,
        accuracy: accuracy,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(
        "quiz_history",
        JSON.stringify(history)
    );

    // Score ring SVG
    const R = 80; const C = 2 * Math.PI * R;
    const dash = (accuracy / 100) * C;

    root.innerHTML = `
    <div class="result-hero">
      <div class="text-muted" style="font-size:13px;">${d ? d.icon + ' ' + d.name : slug} Assessment</div>
      <h1 style="font-family:var(--font-display); margin:8px 0 24px; font-size:36px;">Your Results</h1>
      <div class="score-ring">
        <svg width="200" height="200">
          <circle cx="100" cy="100" r="${R}" stroke="var(--secondary)" stroke-width="14" fill="none"/>
          <circle cx="100" cy="100" r="${R}" stroke="url(#g)" stroke-width="14" fill="none"
            stroke-linecap="round" stroke-dasharray="${dash} ${C}" />
          <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#7c6cff"/></linearGradient></defs>
        </svg>
        <div class="score-ring-text">
          <div>
            <div class="score-pct">${accuracy}%</div>
            <div class="score-label">Accuracy</div>
          </div>
        </div>
      </div>
    </div>

    <div class="result-grid">
      <div class="card metric"><div class="metric-label">Correct</div><div class="metric-value" style="color:var(--success)">${correct} / ${total}</div></div>
      <div class="card metric"><div class="metric-label">Attempted</div><div class="metric-value">${attempted}</div></div>
      <div class="card metric"><div class="metric-label">Skipped</div><div class="metric-value" style="color:var(--destructive)">${total - attempted}</div></div>
      <div class="card metric"><div class="metric-label">Performance</div><div class="metric-value">${perfLabel(accuracy)}</div></div>
    </div>

    <div class="mt-24">
      <h2 style="font-family:var(--font-display); margin:0 0 14px;">Answer review</h2>
      ${reviewItems.map((r, i) => `
        <div class="card review-card ${r.q.type === 'mcq' ? (r.isRight ? 'right' : 'wrong') : ''}">
          <div class="q-badges">
            <span class="badge ${r.q.difficulty.toLowerCase()}">${r.q.difficulty}</span>
            <span class="badge">${r.q.topic}</span>
          </div>
          <div class="review-q">Q${i + 1}. ${r.q.text}</div>
          ${r.has
            ? `<div class="review-ans ${r.q.type === 'mcq' ? (r.isRight ? 'correct' : 'user') : ''}"><b>Your answer:</b> ${escapeHtml(String(r.ans))}</div>`
            : `<div class="review-ans user"><b>Your answer:</b> <i>Not answered</i></div>`}
          <div class="review-ans correct"><b>Correct answer:</b> ${escapeHtml(r.q.correct)}</div>
          <div class="review-explain">${r.q.explanation}</div>
        </div>
      `).join('')}
    </div>

    <div class="mt-24" style="display:flex; gap:10px;">
      <a href="index.html" class="btn btn-outline">← Back home</a>
      <a href="quiz.html?slug=${slug}" class="btn btn-primary">Retake assessment</a>
    </div>
  `;
}

function perfLabel(pct) {
    if (pct >= 85) return 'Excellent';
    if (pct >= 70) return 'Good';
    if (pct >= 50) return 'Average';
    return 'Needs work';
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
