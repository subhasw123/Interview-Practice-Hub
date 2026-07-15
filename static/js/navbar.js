function renderNavbar(opts = {}) {
    const { inQuiz = false, active = '', username = null } = opts;
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
      <div style="display: flex; align-items: center; gap: 15px;">
        ${inQuiz
            ? `<button class="quit-btn" onclick="openQuitModal()">⏻ Quit Assessment</button>`
            : (username 
                ? `
                <div class="user-dropdown">
                    <button class="nav-action dropdown-toggle" onclick="toggleUserMenu()">${username} ▼</button>
                    <div class="dropdown-menu" id="userMenu">
                        <a href="/dashboard">Dashboard</a>
                        <a href="/profile">Profile</a>
                        <a href="/logout">Logout</a>
                    </div>
                </div>
                `
                : `
                <a href="/login" class="nav-action">Login</a>
                <a href="/register" class="nav-action nav-action-primary">Register</a>
                `)}
      </div>
    </div>
  </header>`;
}

function toggleUserMenu() {
    const menu = document.getElementById("userMenu");
    if (menu) {
        menu.classList.toggle("show");
    }
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropdown-toggle')) {
    var dropdowns = document.getElementsByClassName("dropdown-menu");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.classList.toggle("show");
}

async function mountNavbar(opts) {
    const el = document.getElementById('navbar');
    if (!el) return;
    
    el.innerHTML = renderNavbar(opts);

    try {
        const res = await fetch('/api/user');
        if (res.ok) {
            const data = await res.json();
            if (data.username) {
                opts.username = data.username;
                el.innerHTML = renderNavbar(opts);
            }
        }
    } catch (e) {
        console.error('Error fetching user info for navbar', e);
    }
}
