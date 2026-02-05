// Profile Editor Logic
// Handle profile editing, avatar upload, Instagram URL

// Fallback for showToast to prevent crashes if utilities.js fails to load
if (typeof window.showToast !== 'function') {
    window.showToast = function (message, type = 'info', title = '') {
        console.warn('Using fallback showToast:', message);
        const container = document.querySelector('.toast-container') || (() => {
            const c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
            return c;
        })();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="background: #333; color: #fff; padding: 16px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${type === 'error' ? '#ef4444' : '#10b981'}">
                <strong>${title || (type === 'error' ? 'Error' : 'Info')}</strong><br>
                ${message}
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    };
}

// DOM Elements
const profileForm = document.getElementById('profileForm');
const fullNameInput = document.getElementById('fullName');
const avatarFileInput = document.getElementById('avatarFile');
const instagramUsernameInput = document.getElementById('instagramUsername');
const bioInput = document.getElementById('bio');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');
const submitBtnText = document.getElementById('submitBtnText');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');

// Preview elements
const avatarDisplay = document.getElementById('avatarDisplay');
const previewName = document.getElementById('previewName');
const previewEmail = document.getElementById('previewEmail');
const adminBadge = document.getElementById('adminBadge');

// State
let currentUser = null;
let currentProfile = null;
let uploadedAvatarUrl = null;

// Load profile when user is authenticated
window.loadProfileEditor = async function () {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();

        if (!user) {
            window.location.href = 'dashboard.html';
            return;
        }

        currentUser = user;

        // Fetch profile
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);

            // If no profile exists, create one
            if (error.code === 'PGRST116') {
                await createDefaultProfile(user);
                return;
            }

            throw error;
        }

        currentProfile = profile;
        populateForm(profile, user);

    } catch (error) {
        console.error('Error loading profile:', error);
        window.showToast('Gagal memuat profil', 'error');
    }
};

// Create default profile if not exists
async function createDefaultProfile(user) {
    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .insert({
                id: user.id,
                full_name: user.email.split('@')[0],
                is_admin: false
            });

        if (error) throw error;

        // Reload
        window.loadProfileEditor();

    } catch (error) {
        console.error('Error creating default profile:', error);
        window.showToast('Gagal membuat profil default', 'error');
    }
}

// Populate form with current data
function populateForm(profile, user) {
    fullNameInput.value = profile.full_name || '';
    bioInput.value = profile.bio || '';

    // Instagram username (extract from URL if full URL saved)
    if (profile.instagram_url) {
        const username = extractInstagramUsername(profile.instagram_url);
        instagramUsernameInput.value = username;
    }

    uploadedAvatarUrl = profile.avatar_url;

    // Preview
    previewName.textContent = profile.full_name || 'Nama Kamu';
    previewEmail.textContent = user.email;
    renderAvatar(profile);

    // Show admin badge if admin
    if (profile.is_admin) {
        adminBadge.style.display = 'block';
    }
}

// Extract username from Instagram URL
function extractInstagramUsername(url) {
    if (!url) return '';

    // Handle different formats
    // https://instagram.com/username
    // https://www.instagram.com/username
    // instagram.com/username
    // @username
    // username

    const match = url.match(/(?:instagram\.com\/)?@?(.+)/);
    return match ? match[1] : url;
}

// Render avatar (image or initial badge)
function renderAvatar(profile) {
    avatarDisplay.innerHTML = '';

    if (profile.avatar_url) {
        // Show image
        const img = document.createElement('img');
        img.src = profile.avatar_url;
        img.alt = profile.full_name;
        img.className = 'avatar-image';
        avatarDisplay.appendChild(img);
        removeAvatarBtn.style.display = 'inline-block';
    } else {
        // Show initial badge
        const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?';
        const color = getAvatarColorForInitial(initial);

        const badge = document.createElement('div');
        badge.className = 'avatar-initial';
        badge.style.backgroundColor = color;
        badge.textContent = initial;
        avatarDisplay.appendChild(badge);
        removeAvatarBtn.style.display = 'none';
    }
}

// Get color for initial (consistent with seed script)
function getAvatarColorForInitial(initial) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#FAD7A0',
        '#AED6F1', '#D7BDE2', '#A9DFBF', '#F9E79F', '#FADBD8',
        '#D5DBDB', '#85929E', '#5DADE2', '#48C9B0', '#F4D03F',
        '#EB984E', '#DC7633', '#A569BD', '#5499C7', '#52BE80',
        '#F8C471'
    ];

    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
}

// Handle avatar upload
avatarFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
        window.showModal('Maaf, ukuran foto terlalu besar (maks 1MB). Silakan kompres foto kamu di <a href="https://www.iloveimg.com/id/kompres-gambar" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: 700;">iloveimg.com</a> lalu coba lagi.', 'Ukuran Foto Terlalu Besar', '🖼️');
        e.target.value = '';
        return;
    }

    try {
        window.showToast('Mengupload foto...', 'info');

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${currentUser.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('plant-images') // Reuse existing bucket or create 'avatars' bucket
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('plant-images')
            .getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl;

        // Update preview
        currentProfile.avatar_url = publicUrl;
        renderAvatar(currentProfile);

        window.showToast('Foto berhasil diupload!', 'success');

    } catch (error) {
        console.error('Error uploading avatar:', error);
        window.showToast('Gagal upload foto: ' + error.message, 'error');
    }
});

// Remove avatar
removeAvatarBtn.addEventListener('click', () => {
    uploadedAvatarUrl = null;
    currentProfile.avatar_url = null;
    renderAvatar(currentProfile);
    avatarFileInput.value = '';
    window.showToast('Foto profil dihapus. Klik Simpan untuk menyimpan perubahan.', 'info');
});

// Submit form
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = profileForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtnText.textContent;

    try {
        submitBtn.disabled = true;
        submitBtnText.textContent = '💾 Menyimpan...';
        formError.style.display = 'none';
        formSuccess.style.display = 'none';

        // Build Instagram URL
        const username = instagramUsernameInput.value.trim();
        const instagramUrl = username ? `https://instagram.com/${username}` : null;

        // Update profile
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({
                full_name: fullNameInput.value.trim(),
                avatar_url: uploadedAvatarUrl,
                instagram_url: instagramUrl,
                bio: bioInput.value.trim() || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Success
        formSuccess.textContent = '✅ Profil berhasil disimpan!';
        formSuccess.style.display = 'block';
        window.showToast('Profil berhasil diupdate!', 'success');

        // Reload to show changes
        setTimeout(() => {
            window.loadProfileEditor();
        }, 1500);

    } catch (error) {
        console.error('Error saving profile:', error);
        formError.textContent = 'Gagal menyimpan: ' + error.message;
        formError.style.display = 'block';
        window.showToast('Gagal menyimpan profil', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = originalBtnText;
    }
});

// Update preview as user types
fullNameInput.addEventListener('input', () => {
    previewName.textContent = fullNameInput.value || 'Nama Kamu';
    if (!uploadedAvatarUrl && currentProfile) {
        currentProfile.full_name = fullNameInput.value;
        renderAvatar(currentProfile);
    }
});
