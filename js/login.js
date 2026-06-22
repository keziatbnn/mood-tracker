document.addEventListener('DOMContentLoaded', () => {

  /* ── PASSWORD VISIBILITY ── */
  setupToggle('togglePassword', 'passwordInput', 'eyeIconPassword');

  /* ── LOGIN ── */
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    /* ── VALIDATION ── */
    if (!email || !password) {
      showMessage('loginMessage', 'Please fill in all fields.', true);
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to dashboard (sesuaikan path ke halaman utama kamu)
      window.location.href = 'index.html';

    } catch (err) {
      showMessage('loginMessage', err.message || 'Login failed. Please try again.', true);
    }
  });

});

/* ── HELPER ── */
function showMessage(elId, msg, isError) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `text-sm rounded-xl px-4 py-3 mb-4 ${
    isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
  }`;
  el.classList.remove('hidden');
}

function setupToggle(btnId, inputId, iconId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);

  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';

    const icon = document.getElementById(iconId);
    if (icon) {
      icon.innerHTML = isHidden
        ? /* eye-off */
          `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : /* eye */
          `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
    }
  });
}