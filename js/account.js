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
  initPhotoPicker();
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

  // Isi default value pada form input edit profile
  document.getElementById('fullNameInput').value = fullName;
  document.getElementById('emailInput').value = email;

  renderAvatar(currentUser.user_metadata?.avatar_url || null, fullName || email);
}

function renderAvatar(avatarUrl, displayName) {
  const initialsEl = document.getElementById('accountAvatar');
  const imgEl      = document.getElementById('accountAvatarImg');
  const removeBtn  = document.getElementById('removePhotoBtn');

  if (avatarUrl) {
    imgEl.src = avatarUrl;
    imgEl.classList.remove('hidden');
    initialsEl.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  } else {
    imgEl.src = '';
    imgEl.classList.add('hidden');
    initialsEl.classList.remove('hidden');
    initialsEl.textContent = (displayName).charAt(0).toUpperCase();
    initialsEl.className   =
      'w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold';
    removeBtn.classList.add('hidden');
  }
}

function syncNavbar(avatarUrl, displayName) {
  // navSetUser is defined in navbar.js — safe to call after navbar renders
  if (typeof navSetUser === 'function') {
    navSetUser(displayName, avatarUrl);
  }
}

function setAvatarLoading(on) {
  const overlay   = document.getElementById('avatarLoadingOverlay');
  const changeBtn = document.getElementById('changePhotoBtn');
  const removeBtn = document.getElementById('removePhotoBtn');
  if (on) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    changeBtn.disabled = true;
    removeBtn.disabled = true;
    changeBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    changeBtn.disabled = false;
    removeBtn.disabled = false;
    changeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}


function initPhotoPicker() {
  document.getElementById('photoFileInput').addEventListener('change', handleFileChosen);
}

function triggerPhotoPicker() {
  document.getElementById('photoFileInput').click();
}

function handleFileChosen(e) {
  const file = e.target.files[0];
  resetFileInput();
  if (!file) return;

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showMessage('photoMessage', 'Invalid file type. Use JPG, JPEG, PNG, or WEBP.', true);
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showMessage('photoMessage', 'File is too large. Maximum size is 2 MB.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => openCropModal(ev.target.result);
  reader.readAsDataURL(file);
}

function resetFileInput() {
  document.getElementById('photoFileInput').value = '';
}


let cropperInstance = null;

function openCropModal(imageSrc) {
  const modal = document.getElementById('cropModal');
  const imgEl = document.getElementById('cropImageEl');

  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }

  imgEl.src = imageSrc;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  imgEl.onload = () => {
    cropperInstance = new Cropper(imgEl, {
      aspectRatio: 1,          
      viewMode: 1,              
      dragMode: 'move',
      autoCropArea: 0.85,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      preview: '#cropPreviewCircle',
    });
  };
}

function closeCropModal() {
  const modal = document.getElementById('cropModal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  document.getElementById('cropImageEl').src = '';
}

function resetCrop() {
  if (cropperInstance) cropperInstance.reset();
}

async function saveCrop() {
  if (!cropperInstance) return;

  const saveBtn = document.getElementById('saveCropBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    Saving…`;

  try {
    const croppedCanvas = cropperInstance.getCroppedCanvas({
      width: 512,
      height: 512,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillColor: '#fff',
    });

    const blob = await new Promise((resolve) =>
      croppedCanvas.toBlob(resolve, 'image/jpeg', 0.9)
    );

    closeCropModal();
    await uploadCroppedPhoto(blob);

  } catch (err) {
    console.error('Crop save error:', err);
    showMessage('photoMessage', 'Failed to process image.', true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Save Photo`;
  }
}

/*  UPLOAD TO SUPABASE STORAGE*/

async function uploadCroppedPhoto(blob) {
  setAvatarLoading(true);
  showMessage('photoMessage', 'Uploading photo…', false);

  try {
    // Delete old photo from storage
    const oldUrl = currentUser.user_metadata?.avatar_url || null;
    if (oldUrl) await deletePhotoFromStorage(oldUrl);

    // Unique filename
    const fileName = `${currentUser.id}_${Date.now()}.jpg`;

    // Upload
    const { error: uploadError } = await supabaseClient.storage
      .from('profile-pictures')
      .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Save to user_metadata
    const { error: updateError } = await supabaseClient.auth.updateUser({
      data: { avatar_url: publicUrl }
    });
    if (updateError) throw updateError;

    // Update local state
    currentUser.user_metadata.avatar_url = publicUrl;

    // Render
    const displayName = currentUser.user_metadata?.full_name || currentUser.email;
    renderAvatar(publicUrl, displayName);
    syncNavbar(publicUrl, displayName);

    showMessage('photoMessage', 'Profile photo updated!', false);

  } catch (err) {
    console.error('Upload error:', err);
    const prevUrl     = currentUser.user_metadata?.avatar_url || null;
    const displayName = currentUser.user_metadata?.full_name || currentUser.email;
    renderAvatar(prevUrl, displayName);
    showMessage('photoMessage', err.message || 'Failed to upload photo.', true);
  } finally {
    setAvatarLoading(false);
  }
}

/* Remove profile photo */
function confirmRemovePhoto() {
  const sure = confirm('Remove your profile photo? Your initials will be shown instead.');
  if (sure) removeProfilePhoto();
}

async function removeProfilePhoto() {
  setAvatarLoading(true);
  showMessage('photoMessage', 'Removing photo…', false);

  try {
    const oldUrl = currentUser.user_metadata?.avatar_url || null;
    if (oldUrl) await deletePhotoFromStorage(oldUrl);

    const { error } = await supabaseClient.auth.updateUser({ data: { avatar_url: null } });
    if (error) throw error;

    currentUser.user_metadata.avatar_url = null;

    const displayName = currentUser.user_metadata?.full_name || currentUser.email;
    renderAvatar(null, displayName);
    syncNavbar(null, displayName);

    showMessage('photoMessage', 'Profile photo removed.', false);

  } catch (err) {
    console.error('Remove error:', err);
    showMessage('photoMessage', err.message || 'Failed to remove photo.', true);
  } finally {
    setAvatarLoading(false);
  }
}

/* ── Delete file from Storage by its public URL ── */
async function deletePhotoFromStorage(publicUrl) {
  try {
    const bucketName = 'profile-pictures';
    const marker     = `/object/public/${bucketName}/`;
    const idx        = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const filePath = decodeURIComponent(publicUrl.substring(idx + marker.length));
    await supabaseClient.storage.from(bucketName).remove([filePath]);
  } catch (err) {
    console.warn('Could not delete old photo:', err.message);
  }
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