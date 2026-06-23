// js/register.js
document.addEventListener('DOMContentLoaded', async () => {

  /* ── PASSWORD VISIBILITY ── */
  setupToggle('togglePassword', 'passwordInput', 'eyeIconPassword');
  setupToggle('toggleConfirmPassword', 'confirmPasswordInput', 'eyeIconConfirm');

  /* ── REGISTER ── */
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName        = document.getElementById('fullNameInput').value.trim();
    const email           = document.getElementById('emailInput').value.trim();
    const password        = document.getElementById('passwordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    /* ── VALIDATION ── */
    if (!fullName || !email || !password || !confirmPassword) {
      showMessage('registerMessage', 'Please fill in all fields.', true);
      return;
    }

    if (password.length < 6) {
      showMessage('registerMessage', 'Password must be at least 6 characters.', true);
      return;
    }

    if (password !== confirmPassword) {
      showMessage('registerMessage', 'Passwords do not match.', true);
      return;
    }

    try {
      // Mengirimkan data registrasi ke Supabase Cloud
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName // Menyimpan nama lengkap ke dalam user metadata
          }
        }
      });

      if (error) throw error;

      showMessage(
        'registerMessage',
        'Account created successfully! Please check your email for verification link.',
        false
      );

      document.getElementById('registerForm').reset();

    } catch (err) {
      showMessage('registerMessage', err.message || 'Registration failed. Please try again.', true);
    }
  });

});

/* ── HELPER FUNCTIONS ── */
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
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
    }
  });
}