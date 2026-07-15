// Shared auth helpers for login & register
const AUTH_KEY = 'iph_users';
const SESSION_KEY = 'iph_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(AUTH_KEY, JSON.stringify(users)); }
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: user.email, name: user.name, at: Date.now()
  }));
}

function showToast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.className = 'toast ' + type, 2600);
}

function togglePassword(inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  const isPw = el.type === 'password';
  el.type = isPw ? 'text' : 'password';
  btn.textContent = isPw ? 'Hide' : 'Show';
}

function setFieldError(fieldId, msg) {
  const wrap = document.getElementById(fieldId);
  if (!wrap) return;
  wrap.classList.toggle('error', !!msg);
  const errEl = wrap.querySelector('.field-error');
  if (errEl && msg) errEl.textContent = msg;
}

function scorePassword(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  let ok = true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('field-email', 'Enter a valid email'); ok = false; } else setFieldError('field-email', '');
  if (password.length < 6) { setFieldError('field-password', 'Password must be at least 6 characters'); ok = false; } else setFieldError('field-password', '');
  if (!ok) return;

  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    showToast('Invalid email or password', 'error');
    return;
  }
  setSession(user);
  showToast('Welcome back, ' + user.name + '!', 'success');
  setTimeout(() => window.location.href = 'index.html', 700);
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  const agree = document.getElementById('agree').checked;

  let ok = true;
  if (name.length < 2) { setFieldError('field-name', 'Enter your full name'); ok = false; } else setFieldError('field-name', '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('field-email', 'Enter a valid email'); ok = false; } else setFieldError('field-email', '');
  if (password.length < 6) { setFieldError('field-password', 'At least 6 characters'); ok = false; } else setFieldError('field-password', '');
  if (confirm !== password) { setFieldError('field-confirm', 'Passwords do not match'); ok = false; } else setFieldError('field-confirm', '');
  if (!agree) { showToast('Please accept the terms to continue', 'error'); ok = false; }
  if (!ok) return;

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    setFieldError('field-email', 'An account with this email already exists');
    return;
  }
  const user = { name, email, password, createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  setSession(user);
  showToast('Account created — welcome!', 'success');
  setTimeout(() => window.location.href = 'index.html', 800);
}

function bindStrengthMeter() {
  const pw = document.getElementById('password');
  const meter = document.getElementById('strength');
  if (!pw || !meter) return;
  pw.addEventListener('input', () => {
    meter.setAttribute('data-level', String(scorePassword(pw.value)));
  });
}
