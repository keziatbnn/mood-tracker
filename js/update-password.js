document.addEventListener('DOMContentLoaded', async () => {

  /* ── PASSWORD VISIBILITY ── */
  setupToggle('toggleNewPassword', 'newPassword', 'eyeIconNew');
  setupToggle('toggleConfirmPassword', 'confirmPassword', 'eyeIconConfirm');

  /* ── TANGKAP TOKEN DARI URL HASH ── */
  const hash        = window.location.hash;
  const params      = new URLSearchParams(hash.replace('#', ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') || '';
  const type        = params.get('type');

  console.log('Hash:', hash);
  console.log('Type:', type);
  console.log('Access token ada:', !!accessToken);

  if (!accessToken || type !== 'recovery') {
    showMessage('updateMessage', 'The reset link is invalid or has expired. Please request a new link.', true);
    document.getElementById('saveBtn').disabled = true;
    return;
  }

  // Set session pakai token dari URL
  const { error: sessionError } = await supabaseClient.auth.setSession({
    access_token:  accessToken,
    refresh_token: refreshToken
  });

  if (sessionError) {
    console.error('Session error:', sessionError);
    showMessage('updateMessage', 'The reset link is invalid or has expired. Please request a new link.', true);
    document.getElementById('saveBtn').disabled = true;
    return;
  }

  showMessage('updateMessage', 'Link valid! Please enter your new password.', false);

  /* ── UPDATE PASSWORD ── */
  document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword     = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const saveBtn         = document.getElementById('saveBtn');

    if (!newPassword || !confirmPassword) {
      showMessage('updateMessage', 'Please fill in all fields.', true);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('updateMessage', 'Password must be at least 6 characters long.', true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('updateMessage', 'Passwords do not match.', true);
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showMessage('updateMessage', 'Password successfully updated! Redirecting to login page...', false);

      await supabaseClient.auth.signOut();

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (err) {
      console.error('Update error:', err);
      showMessage('updateMessage', err.message || 'Failed to update password. Please try again.', true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE NEW PASSWORD';
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
        ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>`
        : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>`;
    }
  });
}