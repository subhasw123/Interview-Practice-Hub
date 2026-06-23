function renderNavbar(opts = {}) {
    const { inQuiz = false, active = '' } = opts;
    return `
  <header class="navbar">
    <div class="container nav-inner">
      <a href="index.html" class="brand">
        <div class="brand-logo">IP</div>
        <div>
          <div class="brand-title">Interview Practice Hub</div>
          <div class="brand-sub">Sharpen your interview edge</div>
        </div>
      </a>
      <button class="hamburger" onclick="toggleMenu()">
    ☰
</button>
      <nav class="nav-links" id="mobileMenu">
    <a href="/" class="${active === 'home' ? 'active' : ''}">Home</a>

    <a href="/history.html"
       class="${active === 'history' ? 'active' : ''}">
       History
    </a>

    <a href="/resume" class="${active === 'resume' ? 'active' : ''}">
    Resume Analyzer
</a>

    <a href="/interview"
       class="${active === 'interview' ? 'active' : ''}">
       AI Interview
    </a>


    <a href="/about.html"
       class="${active === 'about' ? 'active' : ''}">
       About
    </a>


</nav>
      <div>
        ${inQuiz
            ? `<button class="quit-btn" onclick="openQuitModal()">⏻ Quit Assessment</button>`
            : `<a href="index.html" class="nav-action">Browse domains</a>`}
      </div>
    </div>
  </header>`;
}

function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.classList.toggle("show");
}

function mountNavbar(opts) {
    const el = document.getElementById('navbar');
    if (el) el.innerHTML = renderNavbar(opts);
}
