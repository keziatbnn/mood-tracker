document.addEventListener('DOMContentLoaded', async () => {

  /* ── TANGKAP TOKEN DARI URL HASH ── */
  // Supabase kirim token via URL hash: #access_token=xxx&type=recovery
  const hash        = window.location.hash;
  const params      = new URLSearchParams(hash.replace('#', ''));
  const accessToken = params.get('access_token');
  const type        = params.get('type');

  if (!accessToken || type !== 'recovery') {
    alert('Reset link is invalid or has expired. Please request a new one.');
    window.location.href = 'login.html';
    return;
  }

  // Set session pakai token dari URL
  const { error: sessionError } = await supabaseClient.auth.setSession({
    access_token:  accessToken,
    refresh_token: params.get('refresh_token') || ''
  });

  if (sessionError) {
    alert('Reset link is invalid or has expired. Please request a new one.');
    window.location.href = 'login.html';
    return;
  }

  /* ── UPDATE PASSWORD ── */
  document.getElementById('updatePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;

    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    // Sign out dulu biar user login ulang dengan password baru
    await supabaseClient.auth.signOut();

    alert('Password berhasil diubah!');
    window.location.href = 'login.html';
  });

});