// Dashboard CRUD Logic - Enhanced with Multiple Images, Taxonomy Descriptions, YouTube
// Using window.supabaseClient directly

// Fallback for showToast to prevent crashes if utilities.js fails to load
if (typeof window.showToast !== 'function') {
    window.showToast = function (message, type = 'info') {
        console.warn('Using fallback showToast:', message);

        // Try to create valid toast UI
        const container = document.querySelector('.toast-container') || (() => {
            const c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
            return c;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;
        toast.style.cssText = 'background: #333; color: #fff; padding: 12px 24px; margin-top: 10px; border-radius: 4px; animation: fadeIn 0.3s;';
        if (type === 'error') toast.style.background = '#ef4444';
        if (type === 'success') toast.style.background = '#10b981';

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
}


// DOM Elements
const plantsListEl = document.getElementById('plantsList');
const plantsLoadingEl = document.getElementById('plantsLoading');
const plantsEmptyEl = document.getElementById('plantsEmpty');
const plantFormContainer = document.getElementById('plantFormContainer');
const plantForm = document.getElementById('plantForm');
const formTitle = document.getElementById('formTitle');
const submitBtnText = document.getElementById('submitBtnText');
const formErrorEl = document.getElementById('formError');

// State
let isEditing = false;
let editingId = null;
let currentUserId = null;
let isAdmin = false; // Admin state
let originalPlantData = null; // Store original state for diffing
let myCollabPlantIds = new Set();
let uploadedImages = {
    full_plant: null,
    root: null,
    stem: null,
    leaf: null,
    fruit: null,
    flower: null
};

// Initial Load - Called from auth.js when user is logged in
window.loadDashboardPlants = async function () {
    // Get current user
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    currentUserId = user?.id;

    if (currentUserId) {
        // Fetch profile to check admin status
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUserId)
            .single();

        isAdmin = profile?.is_admin || false;

        // Fetch my collaborations
        const { data: collabs } = await window.supabaseClient
            .from('plant_collaborators')
            .select('plant_id')
            .eq('user_id', currentUserId);

        if (collabs) {
            myCollabPlantIds = new Set(collabs.map(c => c.plant_id));
        }
    }

    await fetchPlants();
    setupRealtimeSubscription();
    setupImageUploadHandlers();
    setupYouTubePreview();
};

// Fetch Plants
async function fetchPlants() {
    try {
        plantsLoadingEl.style.display = 'block';

        const { data: plants, error } = await window.supabaseClient
            .from('plants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderPlantsList(plants);

    } catch (error) {
        console.error('Error fetching plants:', error);
        window.showToast('Gagal memuat data tumbuhan', 'error');
    } finally {
        plantsLoadingEl.style.display = 'none';
    }
}

// Render List
function renderPlantsList(plants) {
    plantsListEl.innerHTML = '';

    if (!plants || plants.length === 0) {
        plantsListEl.style.display = 'none';
        plantsEmptyEl.style.display = 'block';
        return;
    }

    plantsEmptyEl.style.display = 'none';
    plantsListEl.style.display = 'grid';

    plants.forEach(plant => {
        const item = document.createElement('div');
        item.className = 'plant-item';

        // Check permissions
        const isOwner = plant.created_by === currentUserId;
        const isCollaborator = myCollabPlantIds.has(plant.id);
        const canEdit = isOwner || isCollaborator || isAdmin;
        const canDelete = isOwner || isAdmin;
        const canManageCollab = isOwner || isAdmin;

        // Use new images structure or fallback to old image_url
        const mainImage = plant.images?.full_plant || plant.image_url;
        const imageHTML = mainImage
            ? `<img src="${mainImage}" alt="${plant.nama_indonesia}" class="plant-item-image">`
            : `<div class="plant-item-placeholder">🌿</div>`;

        // Buttons HTML
        let buttonsHTML = '';

        if (canEdit) {
            buttonsHTML += `<button onclick="editPlant('${plant.id}')" class="btn-icon btn-edit">Edit</button>`;
        }

        if (canDelete) {
            // Only show Manage Collab if has permission
            if (canManageCollab) {
                buttonsHTML += `<button onclick="showAddCollaboratorModal('${plant.id}')" class="btn-icon btn-collab" title="Kelola Kolaborator">👥</button>`;
            }
            buttonsHTML += `<button onclick="deletePlant('${plant.id}')" class="btn-icon btn-delete">Hapus</button>`;
        }

        // If no actions allowed, show View button (optional/placeholder)
        // or nothing (just viewable in biology page)

        item.innerHTML = `
      ${imageHTML}
      <div class="plant-item-info">
        <h3>${plant.nama_indonesia}</h3>
        <p class="plant-item-latin">${plant.nama_latin}</p>
        <span class="plant-item-family">${plant.famili || '-'}</span>
      </div>
      <div class="plant-item-actions">
        ${buttonsHTML}
      </div>
    `;

        plantsListEl.appendChild(item);
    });
}

// Form Handling
window.showAddPlantForm = function () {
    isEditing = false;
    editingId = null;

    formTitle.textContent = 'Tambah Tumbuhan Baru';
    submitBtnText.textContent = 'Simpan';
    plantForm.reset();
    clearImagePreviews();
    formErrorEl.style.display = 'none';

    const btnManageCollab = document.getElementById('btnManageCollabForm');
    if (btnManageCollab) btnManageCollab.style.display = 'none';

    const collabPlaceholder = document.getElementById('collabPlaceholder');
    if (collabPlaceholder) collabPlaceholder.style.display = 'inline-block';

    // Reset uploaded images state
    uploadedImages = {
        full_plant: null,
        root: null,
        stem: null,
        leaf: null,
        fruit: null,
        flower: null
    };

    plantFormContainer.style.display = 'block';
    plantFormContainer.scrollIntoView({ behavior: 'smooth' });
};

window.hideForm = function () {
    plantFormContainer.style.display = 'none';
};

// Edit Plant
window.editPlant = async function (id) {
    try {
        const { data: plant, error } = await window.supabaseClient
            .from('plants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        isEditing = true;
        editingId = id;

        formTitle.textContent = 'Edit Tumbuhan';
        submitBtnText.textContent = 'Update';

        // Populate basic fields
        document.getElementById('namaIndonesia').value = plant.nama_indonesia;
        document.getElementById('namaLatin').value = plant.nama_latin;
        document.getElementById('kingdom').value = plant.kingdom || 'Plantae';
        document.getElementById('divisi').value = plant.divisi || '';
        document.getElementById('class').value = plant.class || '';
        document.getElementById('ordo').value = plant.ordo || '';
        document.getElementById('famili').value = plant.famili || '';
        document.getElementById('genus').value = plant.genus || '';
        document.getElementById('spesies').value = plant.spesies || '';
        document.getElementById('habitat').value = plant.habitat || '';
        document.getElementById('ciriKhas').value = plant.ciri_khas || '';
        document.getElementById('manfaat').value = plant.manfaat || '';

        // Populate YouTube URL
        document.getElementById('youtubeUrl').value = plant.youtube_url || '';

        // Populate images
        const images = plant.images || {};
        if (plant.image_url && !images.full_plant) {
            images.full_plant = plant.image_url; // Backward compatibility
        }

        uploadedImages = { ...images };
        displayExistingImages(images);

        // Populate taxonomy descriptions
        const descriptions = plant.taxonomy_descriptions || {};
        document.getElementById('descKingdom').value = descriptions.kingdom || '';
        document.getElementById('descDivisi').value = descriptions.divisi || '';
        document.getElementById('descClass').value = descriptions.class || '';
        document.getElementById('descOrdo').value = descriptions.ordo || '';
        document.getElementById('descFamili').value = descriptions.famili || '';
        document.getElementById('descGenus').value = descriptions.genus || '';
        document.getElementById('descSpesies').value = descriptions.spesies || '';

        // Capture original state for logging
        originalPlantData = JSON.parse(JSON.stringify(plant));

        // Show Manage Collaborators button if owner or admin
        const btnManageCollab = document.getElementById('btnManageCollabForm');
        const collabPlaceholder = document.getElementById('collabPlaceholder');

        if (collabPlaceholder) collabPlaceholder.style.display = 'none';

        if (btnManageCollab) {
            if (plant.created_by === currentUserId || isAdmin) {
                btnManageCollab.style.display = 'inline-flex';
                btnManageCollab.onclick = () => window.showAddCollaboratorModal(id);
            } else {
                btnManageCollab.style.display = 'none';
            }
        }

        plantFormContainer.style.display = 'block';
        plantFormContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error loading plant for edit:', error);
        window.showToast('Gagal memuat data untuk diedit', 'error');
    }
};

// Setup YouTube Preview
function setupYouTubePreview() {
    const urlInput = document.getElementById('youtubeUrl');
    const previewContainer = document.createElement('div');
    previewContainer.id = 'youtubePreview';
    previewContainer.style.marginTop = '10px';
    previewContainer.style.display = 'none';

    // Insert preview container after input
    urlInput.parentNode.appendChild(previewContainer);

    // Listen for changes
    urlInput.addEventListener('input', window.debounce(async () => {
        const url = urlInput.value.trim();
        previewContainer.innerHTML = '';

        if (!url) {
            previewContainer.style.display = 'none';
            return;
        }

        const videoId = window.getYouTubeVideoId(url);

        if (videoId) {
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = `
                <div style="background: #1a1a1a; padding: 10px; border-radius: 8px;">
                    <p style="margin-bottom: 5px; font-size: 0.9rem; color: #aaa;">Preview Video:</p>
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 6px;">
                        <iframe 
                            src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0" 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                            frameborder="0" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <p style="margin-top: 5px; color: #4ade80; font-size: 0.8rem;">✓ Link valid</p>
                </div>
            `;
        } else {
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = `<p style="color: #ef4444; font-size: 0.9rem;">✕ Link tidak valid (Pastikan link YouTube benar)</p>`;
        }
    }, 500));
}

// Setup Image Upload Handlers
function setupImageUploadHandlers() {
    const imageParts = ['full_plant', 'root', 'stem', 'leaf', 'fruit', 'flower'];

    imageParts.forEach(part => {
        const inputId = part === 'full_plant' ? 'imageFullPlant' : `image${part.charAt(0).toUpperCase() + part.slice(1)}`;
        const input = document.getElementById(inputId);

        if (input) {
            input.addEventListener('change', async (e) => {
                await handleImageUpload(e, part);
            });
        }
    });
}

// Handle Individual Image Upload
async function handleImageUpload(event, part) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (3MB max)
    if (file.size > 3 * 1024 * 1024) {
        window.showModal('Maaf, ukuran foto terlalu besar (maks 3MB). Silakan kompres foto kamu di <a href="https://www.iloveimg.com/id/kompres-gambar" target="_blank" style="color: #10b981; text-decoration: underline; font-weight: 700;">iloveimg.com</a> lalu coba lagi.', 'Ukuran Tumbuhan Terlalu Besar', '🌿');
        event.target.value = '';
        return;
    }

    const previewArea = document.getElementById(`preview-${part}`);
    if (!previewArea) return;

    try {
        // Show loading
        previewArea.classList.add('uploading');
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'image-loading';
        previewArea.appendChild(loadingSpinner);

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${part}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('plant-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('plant-images')
            .getPublicUrl(filePath);

        // Save URL to state
        uploadedImages[part] = publicUrl;

        // Show preview
        displayImagePreview(part, publicUrl);

        // Success feedback
        previewArea.classList.add('image-upload-success');
        setTimeout(() => previewArea.classList.remove('image-upload-success'), 500);

        window.showToast('Gambar berhasil diupload!', 'success');

    } catch (error) {
        console.error('Error uploading image:', error);
        previewArea.classList.add('image-upload-error');
        window.showToast('Gagal upload gambar: ' + error.message, 'error');

        setTimeout(() => previewArea.classList.remove('image-upload-error'), 3000);
    } finally {
        previewArea.classList.remove('uploading');
        const spinner = previewArea.querySelector('.image-loading');
        if (spinner) spinner.remove();
    }
}

// Display Image Preview
function displayImagePreview(part, url) {
    const previewArea = document.getElementById(`preview-${part}`);
    if (!previewArea) return;

    previewArea.classList.add('has-image');
    previewArea.innerHTML = `
        <img src="${url}" class="image-upload-preview" alt="${part}">
        <button type="button" class="image-remove-btn" onclick="removeImage('${part}')">×</button>
    `;
}

// Remove Image
window.removeImage = function (part) {
    uploadedImages[part] = null;
    const previewArea = document.getElementById(`preview-${part}`);
    const inputId = part === 'full_plant' ? 'imageFullPlant' : `image${part.charAt(0).toUpperCase() + part.slice(1)}`;
    const input = document.getElementById(inputId);

    if (previewArea) {
        previewArea.classList.remove('has-image');
        const partLabels = {
            full_plant: '🌳 Tumbuhan Utuh',
            root: '🌱 Akar',
            stem: '🎋 Batang',
            leaf: '🍃 Daun',
            fruit: '🍎 Buah',
            flower: '🌻 Bunga'
        };
        const [icon, ...textParts] = partLabels[part].split(' ');
        previewArea.innerHTML = `
            <span class="upload-icon">${icon}</span>
            <span class="upload-text">${textParts.join(' ')}</span>
        `;
    }

    if (input) {
        input.value = '';
    }

    window.showToast('Gambar dihapus', 'info');
};

// Display Existing Images (for edit mode)
function displayExistingImages(images) {
    Object.entries(images).forEach(([part, url]) => {
        if (url) {
            displayImagePreview(part, url);
        }
    });
}

// Clear Image Previews
function clearImagePreviews() {
    const parts = ['full_plant', 'root', 'stem', 'leaf', 'fruit', 'flower'];
    parts.forEach(part => {
        const previewArea = document.getElementById(`preview-${part}`);
        if (previewArea && previewArea.classList.contains('has-image')) {
            window.removeImage(part);
        }
    });
}

// Submit Form
plantForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = plantForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtnText.textContent;

    try {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Menyimpan...';
        formErrorEl.style.display = 'none';

        // Prepare images JSONB
        const imagesData = { ...uploadedImages };

        // Keep old image_url for backward compatibility
        const legacyImageUrl = imagesData.full_plant;

        // Prepare taxonomy descriptions JSONB
        const taxonomyDescriptions = {
            kingdom: document.getElementById('descKingdom').value.trim(),
            divisi: document.getElementById('descDivisi').value.trim(),
            class: document.getElementById('descClass').value.trim(),
            ordo: document.getElementById('descOrdo').value.trim(),
            famili: document.getElementById('descFamili').value.trim(),
            genus: document.getElementById('descGenus').value.trim(),
            spesies: document.getElementById('descSpesies').value.trim()
        };

        // Prepare plant data
        const plantData = {
            nama_indonesia: document.getElementById('namaIndonesia').value,
            nama_latin: document.getElementById('namaLatin').value,
            kingdom: document.getElementById('kingdom').value,
            divisi: document.getElementById('divisi').value,
            class: document.getElementById('class').value,
            ordo: document.getElementById('ordo').value,
            famili: document.getElementById('famili').value,
            genus: document.getElementById('genus').value,
            spesies: document.getElementById('spesies').value,
            habitat: document.getElementById('habitat').value,
            ciri_khas: document.getElementById('ciriKhas').value,
            manfaat: document.getElementById('manfaat').value,
            image_url: legacyImageUrl, // Backward compatibility
            images: imagesData,
            taxonomy_descriptions: taxonomyDescriptions,
            youtube_url: document.getElementById('youtubeUrl').value.trim() || null
        };

        // Insert or Update
        let error;

        if (isEditing) {
            const { error: updateError } = await window.supabaseClient
                .from('plants')
                .update(plantData)
                .eq('id', editingId);
            error = updateError;

            // Log Activity
            if (!error && window.ActivityLogger && originalPlantData) {
                const details = window.ActivityLogger.generateUpdateDetails(originalPlantData, plantData);
                if (details) {
                    await window.ActivityLogger.log(editingId, 'update', details);
                }
            }

        } else {
            // Set creator explicitly
            plantData.created_by = currentUserId;

            const { data, error: insertError } = await window.supabaseClient
                .from('plants')
                .insert([plantData])
                .select(); // Select to get ID

            error = insertError;

            // Log Activity (Create)
            if (!error && data && data.length > 0 && window.ActivityLogger) {
                const newId = data[0].id; // Get generated ID
                await window.ActivityLogger.log(newId, 'create', 'Membuat tumbuhan baru');
            }
        }

        if (error) throw error;

        // Success
        window.showToast(
            isEditing ? 'Tumbuhan berhasil diupdate!' : 'Tumbuhan berhasil ditambahkan!',
            'success'
        );
        hideForm();
        fetchPlants(); // Refresh list

    } catch (error) {
        console.error('Error saving plant:', error);
        formErrorEl.textContent = 'Gagal menyimpan: ' + error.message;
        formErrorEl.style.display = 'block';
        window.showToast('Gagal menyimpan data', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = originalBtnText;
    }
});

// Delete Plant
window.deletePlant = async function (id) {
    if (!confirm('Apakah anda yakin ingin menghapus data tumbuhan ini?')) return;

    try {
        const { error } = await window.supabaseClient
            .from('plants')
            .delete()
            .eq('id', id);

        if (error) throw error;

        window.showToast('Tumbuhan berhasil dihapus', 'success');
        fetchPlants(); // Refresh list

    } catch (error) {
        console.error('Error deleting plant:', error);
        window.showToast('Gagal menghapus data', 'error');
    }
};

// Real-time Subscription
function setupRealtimeSubscription() {
    window.supabaseClient
        .channel('public:plants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, (payload) => {
            console.log('Change received!', payload);
            fetchPlants();
        })
        .subscribe();
}
