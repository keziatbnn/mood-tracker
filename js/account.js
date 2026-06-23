// js/account.js
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Ambil data user aktif langsung dari sesi Supabase Cloud
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  
  if (error || !user) {
    window.location.href = 'login.html'; // Proteksi halaman: tendang ke login jika belum auth
    return;
  }
  
  currentUser = user;
  loadAccount();
});

function loadAccount() {
  const fullName = currentUser.user_metadata?.full_name || '';
  const email = currentUser.email;
  const joinDate = new Date(currentUser.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  // Tampilkan data ke komponen teks header profil
  document.getElementById('accountName').textContent = fullName || email.split('@')[0];
  document.getElementById('accountEmail').textContent = email;
  document.getElementById('accountSince').textContent = `Member since ${joinDate}`;
  
  // Mengisi avatar lingkaran besar dengan inisial nama huruf kapital
  const avatarEl = document.getElementById('accountAvatar');
  if (avatarEl) {
    avatarEl.textContent = (fullName || email).charAt(0).toUpperCase();
    avatarEl.className = "w-28 h-28 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0";
  }

  // Isi default value pada form input edit profile
  document.getElementById('fullNameInput').value = fullName;
  document.getElementById('emailInput').value = email;
}

function resetProfileForm() {
  document.getElementById('fullNameInput').value = currentUser.user_metadata?.full_name || '';
  document.getElementById('profileMessage').classList.add('hidden');
}

/* ── UPDATE PROFILE VIA SUPABASE ── */
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newName = document.getElementById('fullNameInput').value.trim();

  if (!newName) {
    showMessage('profileMessage', 'Name cannot be empty.', true);
    return;
  }

  try {
    // Memperbarui meta_data full_name di server cloud
    const { error } = await supabaseClient.auth.updateUser({
      data: { full_name: newName }
    });
    if (error) throw error;

    showMessage('profileMessage', 'Profile updated successfully.', false);
    document.getElementById('accountName').textContent = newName;
    
    // Perbarui state lokal agar data sinkron jika tombol 'cancel' diklik kemudian
    currentUser.user_metadata.full_name = newName;
    
    // Sinkronisasi instan tampilan avatar dan nama di komponen navbar saat ini
    const avatarEl = document.getElementById('accountAvatar');
    if (avatarEl) avatarEl.textContent = newName.charAt(0).toUpperCase();
    const navUsername = document.getElementById('nav-username');
    if (navUsername) navUsername.textContent = newName;
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) navAvatar.textContent = newName.charAt(0).toUpperCase();

  } catch (err) {
    showMessage('profileMessage', err.message || 'Failed to update profile.', true);
  }
});

/* ── UPDATE PASSWORD VIA SUPABASE ── */
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

/* ── DELETE ACCOUNT MOOD HISTORY ── */
function confirmDeleteAccount() {
  const sure = confirm('Are you sure? This will permanently delete your account and all mood entries. This cannot be undone.');
  if (sure) deleteAccount();
}

async function deleteAccount() {
  try {
    // Hapus semua baris data di tabel cloud milik user aktif
    const { error } = await supabaseClient.from('mood_entries').delete().eq('user_id', currentUser.id);
    if (error) throw error;
    
    alert('Your mood data has been deleted safely from cloud.');
    await logout();
  } catch (err) {
    alert('Failed to delete data: ' + err.message);
  }
}

/* ── LOG OUT FUNCTION ── */
async function logout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = 'login.html'; // Arahkan kembali ke login setelah session dihancurkan
  } catch (err) {
    alert('Logout failed: ' + err.message);
  }
}

/* ── UI ALERTS HELPER ── */
function showMessage(elId, msg, isError) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = `text-sm rounded-xl px-4 py-3 mb-4 ${
    isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
  }`;
  el.classList.remove('hidden');
}