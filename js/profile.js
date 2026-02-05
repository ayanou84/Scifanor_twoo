// Profile Page - Display user information and contributions
// Using window.supabaseClient directly

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('profileContent');

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

// Load profile on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌿 Profile page loaded');
    console.log('User ID:', userId);

    if (!userId) {
        showError();
        return;
    }

    loadProfile();
});

// Main function to load profile
async function loadProfile() {
    try {
        showLoading();

        console.log(`Fetching profile for user ID: ${userId}`);

        // Fetch user profile
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            showError();
            return;
        }

        if (!profile) {
            console.error('Profile not found');
            showError();
            return;
        }

        console.log('✅ Profile loaded:', profile);

        // Fetch plants created by user
        const { data: createdPlants } = await window.supabaseClient
            .from('plants')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        // Fetch plants where user is collaborator
        const { data: collabData } = await window.supabaseClient
            .from('plant_collaborators')
            .select('plant_id')
            .eq('user_id', userId);

        let collabPlants = [];
        if (collabData && collabData.length > 0) {
            const plantIds = collabData.map(c => c.plant_id);
            const { data } = await window.supabaseClient
                .from('plants')
                .select('*')
                .in('id', plantIds)
                .order('created_at', { ascending: false });
            collabPlants = data || [];
        }

        console.log(`✅ Created: ${createdPlants?.length || 0}, Collaborated: ${collabPlants.length}`);

        // Render profile
        renderProfile(profile, createdPlants || [], collabPlants);

    } catch (err) {
        console.error('Error loading profile:', err);
        showError();
    }
}

// Render profile
function renderProfile(profile, createdPlants, collabPlants) {
    // Update page title
    document.title = `${profile.full_name} - SciFanor`;

    // Profile Header
    renderProfileHeader(profile, createdPlants.length, collabPlants.length);

    // Created Plants
    renderPlantSection('created', createdPlants);

    // Collaborated Plants
    renderPlantSection('collab', collabPlants);

    // Show content
    showContent();
}

// Render profile header
function renderProfileHeader(profile, createdCount, collabCount) {
    // Avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (profile.avatar_url) {
        avatarEl.innerHTML = `<img src="${profile.avatar_url}" alt="${profile.full_name}">`;
    } else {
        const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?';
        const color = window.getAvatarColorForInitial ? window.getAvatarColorForInitial(initial) : '#667eea';
        avatarEl.innerHTML = `<div class="avatar-initial-large" style="background-color: ${color};">${initial}</div>`;
    }

    // Name & Role
    document.getElementById('profileName').textContent = profile.full_name;
    const roleText = profile.is_admin ? 'Admin • Siswa 12 IPS 2' : 'Siswa 12 IPS 2';
    document.getElementById('profileRole').textContent = roleText;

    // Social
    const socialEl = document.getElementById('profileSocial');
    if (profile.instagram_url) {
        const instagramHandle = profile.instagram_url.split('/').pop();
        socialEl.innerHTML = `
            <a href="${profile.instagram_url}" target="_blank" class="social-link-profile">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.232-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                </svg>
                @${instagramHandle}
            </a>
        `;
    }

    // Stats
    const statsEl = document.getElementById('profileStats');
    const totalContributions = createdCount + collabCount;
    statsEl.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${totalContributions}</div>
            <div class="stat-label">Total Kontribusi</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${createdCount}</div>
            <div class="stat-label">Dibuat</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${collabCount}</div>
            <div class="stat-label">Kolaborasi</div>
        </div>
    `;
}

// Render plant section
function renderPlantSection(type, plants) {
    const gridId = type === 'created' ? 'createdPlants' : 'collabPlants';
    const emptyId = type === 'created' ? 'createdEmpty' : 'collabEmpty';
    const countId = type === 'created' ? 'createdCount' : 'collabCount';

    const gridEl = document.getElementById(gridId);
    const emptyEl = document.getElementById(emptyId);
    const countEl = document.getElementById(countId);

    countEl.textContent = plants.length;

    if (plants.length === 0) {
        gridEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    gridEl.style.display = 'grid';
    gridEl.innerHTML = '';

    plants.forEach((plant, index) => {
        const card = createPlantCard(plant, index);
        gridEl.appendChild(card);
    });
}

// Create plant card
function createPlantCard(plant, index) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.style.opacity = '0';
    card.style.animationDelay = `${index * 0.05}s`;

    const imageHTML = plant.image_url
        ? `<img src="${plant.image_url}" alt="${plant.nama_indonesia}" class="plant-image">`
        : `<div class="plant-image-placeholder">🌿</div>`;

    card.innerHTML = `
        <div class="plant-image-container">
            ${imageHTML}
        </div>
        <div class="plant-info">
            <h3 class="plant-name">${plant.nama_indonesia}</h3>
            <p class="plant-latin">${plant.nama_latin || 'Nama latin tidak tersedia'}</p>
            ${plant.famili ? `<span class="plant-family">${plant.famili}</span>` : ''}
        </div>
    `;

    // Click to detail
    card.addEventListener('click', () => {
        window.location.href = `plant-detail.html?id=${plant.id}`;
    });

    // Trigger animation
    setTimeout(() => {
        card.classList.add('fade-in');
    }, 50 + (index * 50));

    return card;
}

// UI State Functions
function showLoading() {
    loadingEl.style.display = 'flex';
    errorEl.style.display = 'none';
    contentEl.style.display = 'none';
}

function showError() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'flex';
    contentEl.style.display = 'none';
}

function showContent() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    contentEl.style.display = 'block';
}

// Helper function for avatar colors (if not loaded from collaborator-manager.js)
if (!window.getAvatarColorForInitial) {
    window.getAvatarColorForInitial = function (initial) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#FAD7A0'
        ];
        const charCode = initial.charCodeAt(0);
        return colors[charCode % colors.length];
    };
}
