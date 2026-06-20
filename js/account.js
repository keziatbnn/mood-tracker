let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await requireAuth();
  if (currentUser) loadAccount();
});

function loadAccount() {
  const fullName = currentUser.user_metadata?.full_name || '';
  const email = currentUser.email;
  const joinDate = new Date(currentUser.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  document.getElementById('accountName').textContent = fullName || email.split('@')[0];
  document.getElementById('accountEmail').textContent = email;
  document.getElementById('accountSince').textContent = `Member since ${joinDate}`;
  document.getElementById('accountAvatar').textContent = '';

  document.getElementById('fullNameInput').value = fullName;
  document.getElementById('emailInput').value = email;
}

function resetProfileForm() {
  document.getElementById('fullNameInput').value = currentUser.user_metadata?.full_name || '';
  document.getElementById('profileMessage').classList.add('hidden');
}

/* ── UPDATE PROFILE ── */
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = document.getElementById('fullNameInput').value.trim();

  if (!newName) {
    showMessage('profileMessage', 'Name cannot be empty.', true);
    return;
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({
      data: { full_name: newName }
    });
    if (error) throw error;

    showMessage('profileMessage', 'Profile updated successfully.', false);
    document.getElementById('accountName').textContent = newName;
  } catch (err) {
    showMessage('profileMessage', err.message || 'Failed to update profile.', true);
  }
});

/* ── UPDATE PASSWORD ── */
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword.length < 6) {
    showMessage('passwordMessage', 'Password must be at least 6 characters.', true);
    return;
  }
  if (newPassword !== confirmPassword) {
    showMessage('passwordMessage', 'Passwords do not match.', true);
    return;
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;

    showMessage('passwordMessage', 'Password updated successfully.', false);
    document.getElementById('passwordForm').reset();
  } catch (err) {
    showMessage('passwordMessage', err.message || 'Failed to update password.', true);
  }
});

/* ── DELETE ACCOUNT ── */
function confirmDeleteAccount() {
  const sure = confirm('Are you sure? This will permanently delete your account and all mood entries. This cannot be undone.');
  if (sure) deleteAccount();
}

async function deleteAccount() {
  // Catatan: hapus user dari auth.users butuh service_role key,
  // yang TIDAK BOLEH dipakai di frontend. Idealnya ini lewat
  // Supabase Edge Function. Untuk sementara, hapus data mood dulu
  // lalu logout — proses hapus akun penuh perlu backend terpisah.

  try {
    await supabaseClient.from('mood_entries').delete().eq('user_id', currentUser.id);
    alert('Your mood data has been deleted. Contact admin to fully remove your account, or implement an Edge Function for full deletion.');
    await signOut();
  } catch (err) {
    alert('Failed to delete data: ' + err.message);
  }
}

/* ── HELPER ── */
function showMessage(elId, msg, isError) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `text-sm rounded-xl px-4 py-3 mb-4 ${
    isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
  }`;
  el.classList.remove('hidden');
}