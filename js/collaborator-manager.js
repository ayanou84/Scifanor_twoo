/**
 * Collaborator Management Module
 * Handle adding/removing collaborators to plants
 */

// Get avatar color for initial badge (consistent with profile-editor.js)
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

// Render avatar (image or initial badge)
function renderAvatar(profile, size = 64) {
    const container = document.createElement('div');
    container.className = 'collaborator-avatar';
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;

    if (profile.avatar_url) {
        const img = document.createElement('img');
        img.src = profile.avatar_url;
        img.alt = profile.full_name;
        container.appendChild(img);
    } else {
        const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?';
        const color = getAvatarColorForInitial(initial);

        const badge = document.createElement('div');
        badge.className = 'avatar-initial';
        badge.style.backgroundColor = color;
        badge.style.fontSize = `${size / 2.5}px`;
        badge.textContent = initial;
        container.appendChild(badge);
    }

    return container;
}

// Show Add Collaborator Modal
window.showAddCollaboratorModal = async function (plantId) {
    // Check if modal already exists
    let modal = document.getElementById('addCollaboratorModal');

    if (!modal) {
        modal = createCollaboratorModal();
        document.body.appendChild(modal);
    }

    // Load current collaborators and plant info
    await loadCollaboratorsForModal(plantId);

    modal.style.display = 'flex';
};

// Create modal structure
function createCollaboratorModal() {
    const modal = document.createElement('div');
    modal.id = 'addCollaboratorModal';
    modal.className = 'add-collaborator-modal';
    modal.innerHTML = `
        <div class="add-collaborator-modal-content">
            <div class="modal-header">
                <h3>👥 Kelola Kolaborator</h3>
                <button class="modal-close" onclick="closeCollaboratorModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="collaborator-search">
                    <input type="text" id="userSearchInput" placeholder="🔍 Cari nama siswa...">
                </div>
                <div id="searchResults" class="search-results"></div>
                <div class="current-collaborators">
                    <h4>Kolaborator Saat Ini</h4>
                    <div id="currentCollaborators"></div>
                </div>
            </div>
        </div>
    `;

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeCollaboratorModal();
        }
    });

    // Setup search
    modal.querySelector('#userSearchInput').addEventListener('input', debounce(searchUsers, 300));

    return modal;
}

// Close modal
window.closeCollaboratorModal = function () {
    const modal = document.getElementById('addCollaboratorModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Load collaborators for the modal
async function loadCollaboratorsForModal(plantId) {
    window.currentPlantId = plantId; // Store for later use

    try {
        // Fetch current collaborators user IDs first
        const { data: collabData, error } = await window.supabaseClient
            .from('plant_collaborators')
            .select('user_id')
            .eq('plant_id', plantId);

        if (error) throw error;

        let collaborators = [];
        if (collabData && collabData.length > 0) {
            // Then fetch profile data for those user IDs
            const userIds = collabData.map(c => c.user_id);
            const { data: profilesData } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, avatar_url, instagram_url')
                .in('id', userIds);

            // Map profiles back to collaborators structure
            collaborators = collabData.map(collab => ({
                user_id: collab.user_id,
                profiles: profilesData?.find(p => p.id === collab.user_id) || null
            }));
        }

        renderCurrentCollaborators(collaborators);

    } catch (error) {
        console.error('Error loading collaborators:', error);
        window.showToast('Gagal memuat kolaborator', 'error');
    }
}

// Render current collaborators in modal
function renderCurrentCollaborators(collaborators) {
    const container = document.getElementById('currentCollaborators');
    container.innerHTML = '';

    if (collaborators.length === 0) {
        container.innerHTML = '<div class="empty-state-collaborators"><p>Belum ada kolaborator</p></div>';
        return;
    }

    collaborators.forEach(collab => {
        const profile = collab.profiles;
        const item = document.createElement('div');
        item.className = 'current-collaborator-item';

        const avatar = renderAvatar(profile, 40);

        const info = document.createElement('div');
        info.className = 'current-collaborator-info';
        info.innerHTML = `<h5>${profile.full_name}</h5>`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove-collaborator';
        removeBtn.textContent = '✕ Hapus';
        removeBtn.onclick = () => removeCollaborator(window.currentPlantId, profile.id);

        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(removeBtn);
        container.appendChild(item);
    });
}

// Search users
async function searchUsers(e) {
    const query = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }

    try {
        const { data: users, error } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, avatar_url, instagram_url')
            .ilike('full_name', `%${query}%`)
            .limit(10);

        if (error) throw error;

        renderSearchResults(users || []);

    } catch (error) {
        console.error('Error searching users:', error);
        window.showToast('Gagal mencari user', 'error');
    }
}

// Render search results
function renderSearchResults(users) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<div class="empty-state-collaborators"><p>Tidak ada hasil</p></div>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-search-item';

        const avatar = renderAvatar(user, 48);

        const info = document.createElement('div');
        info.className = 'user-search-info';
        info.innerHTML = `
            <h5>${user.full_name}</h5>
            <p>${user.instagram_url ? '@' + user.instagram_url.split('/').pop() : 'No Instagram'}</p>
        `;

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-collaborator';
        addBtn.textContent = '+ Tambah';
        addBtn.onclick = () => addCollaborator(window.currentPlantId, user.id);

        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(addBtn);
        container.appendChild(item);
    });
}

// Add collaborator
async function addCollaborator(plantId, userId) {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();

        const { error } = await window.supabaseClient
            .from('plant_collaborators')
            .insert({
                plant_id: plantId,
                user_id: userId,
                added_by: user.id
            });

        if (error) {
            // Check for duplicate
            if (error.code === '23505') {
                window.showToast('User sudah menjadi kolaborator', 'info');
                return;
            }
            throw error;
        }

        // Log activity
        await logActivity('add_collaborator', plantId, { collaborator_id: userId });

        window.showToast('Kolaborator berhasil ditambahkan!', 'success');

        // Reload collaborators
        await loadCollaboratorsForModal(plantId);

        // Clear search
        document.getElementById('userSearchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';

    } catch (error) {
        console.error('Error adding collaborator:', error);
        window.showToast('Gagal menambahkan kolaborator', 'error');
    }
}

// Remove collaborator
async function removeCollaborator(plantId, userId) {
    if (!confirm('Apakah yakin ingin menghapus kolaborator ini?')) {
        return;
    }

    try {
        const { error } = await window.supabaseClient
            .from('plant_collaborators')
            .delete()
            .eq('plant_id', plantId)
            .eq('user_id', userId);

        if (error) throw error;

        // Log activity
        await logActivity('remove_collaborator', plantId, { collaborator_id: userId });

        window.showToast('Kolaborator berhasil dihapus', 'success');

        // Reload collaborators
        await loadCollaboratorsForModal(plantId);

    } catch (error) {
        console.error('Error removing collaborator:', error);
        window.showToast('Gagal menghapus kolaborator', 'error');
    }
}

// Log activity
async function logActivity(action, plantId, details = {}) {
    if (window.ActivityLogger) {
        // Map details to string description
        let desc = 'Mengubah data kolaborator';
        if (action === 'add_collaborator') desc = 'Menambahkan kolaborator baru';
        if (action === 'remove_collaborator') desc = 'Menghapus kolaborator';

        await window.ActivityLogger.log(plantId, action, desc);
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions
window.renderAvatar = renderAvatar;
window.getAvatarColorForInitial = getAvatarColorForInitial;
