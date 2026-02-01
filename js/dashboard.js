// Dashboard CRUD Logic - Enhanced with Multiple Images, Taxonomy Descriptions, YouTube
// Using window.supabaseClient directly

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
let uploadedImages = {
    full_plant: null,
    root: null,
    stem: null,
    leaf: null,
    fruit: null
};

// Initial Load - Called from auth.js when user is logged in
window.loadDashboardPlants = async function () {
    await fetchPlants();
    setupRealtimeSubscription();
    setupImageUploadHandlers();
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

        // Use new images structure or fallback to old image_url
        const mainImage = plant.images?.full_plant || plant.image_url;
        const imageHTML = mainImage
            ? `<img src="${mainImage}" alt="${plant.nama_indonesia}" class="plant-item-image">`
            : `<div class="plant-item-placeholder">🌿</div>`;

        item.innerHTML = `
      ${imageHTML}
      <div class="plant-item-info">
        <h3>${plant.nama_indonesia}</h3>
        <p class="plant-item-latin">${plant.nama_latin}</p>
        <span class="plant-item-family">${plant.famili || '-'}</span>
      </div>
      <div class="plant-item-actions">
        <button onclick="editPlant('${plant.id}')" class="btn-icon btn-edit">Edit</button>
        <button onclick="deletePlant('${plant.id}')" class="btn-icon btn-delete">Hapus</button>
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

    // Reset uploaded images state
    uploadedImages = {
        full_plant: null,
        root: null,
        stem: null,
        leaf: null,
        fruit: null
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

        plantFormContainer.style.display = 'block';
        plantFormContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error loading plant for edit:', error);
        window.showToast('Gagal memuat data untuk diedit', 'error');
    }
};

// Setup Image Upload Handlers
function setupImageUploadHandlers() {
    const imageParts = ['full_plant', 'root', 'stem', 'leaf', 'fruit'];

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

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        window.showToast('Ukuran file maksimal 2MB', 'error');
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
            fruit: '🌸 Bunga/Buah'
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
    const parts = ['full_plant', 'root', 'stem', 'leaf', 'fruit'];
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
        } else {
            const { error: insertError } = await window.supabaseClient
                .from('plants')
                .insert([plantData]);
            error = insertError;
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
