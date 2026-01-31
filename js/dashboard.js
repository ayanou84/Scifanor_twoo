// Dashboard CRUD Logic
// Dashboard CRUD Logic
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
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');

// State
let isEditing = false;
let editingId = null;

// Initial Load
// Called from auth.js when user is logged in
window.loadDashboardPlants = async function () {
    await fetchPlants();
    setupRealtimeSubscription();
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
        alert('Gagal memuat data tumbuhan.');
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
    plantsListEl.style.display = 'grid'; // Grid layout instead of block for better spacing if needed, or keep as is from CSS

    plants.forEach(plant => {
        const item = document.createElement('div');
        item.className = 'plant-item';

        const imageHTML = plant.image_url
            ? `<img src="${plant.image_url}" alt="${plant.nama_indonesia}" class="plant-item-image">`
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
    imagePreview.style.display = 'none'; // Hide preview
    formErrorEl.style.display = 'none';

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

        // Populate form
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

        // Show current image
        if (plant.image_url) {
            previewImg.src = plant.image_url;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }

        plantFormContainer.style.display = 'block';
        plantFormContainer.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error loading plant for edit:', error);
        alert('Gagal memuat data untuk diedit.');
    }
};

// Submit Form
plantForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = plantForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtnText.textContent;

    try {
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Menyimpan...';
        formErrorEl.style.display = 'none';

        // 1. Handle Image Upload
        let imageUrl = null;
        const imageFile = document.getElementById('imageFile').files[0];

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await window.supabaseClient.storage
                .from('plant-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = window.supabaseClient.storage
                .from('plant-images')
                .getPublicUrl(filePath);

            imageUrl = publicUrl;
        } else if (isEditing && previewImg.src) {
            // Keep existing image if editing and no new file selected
            imageUrl = previewImg.src;
        }

        // 2. Prepare Data
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
            image_url: imageUrl
        };

        // 3. Insert or Update
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
        alert(isEditing ? 'Tumbuhan berhasil diupdate!' : 'Tumbuhan berhasil ditambahkan!');
        hideForm();
        fetchPlants(); // Refresh list

    } catch (error) {
        console.error('Error saving plant:', error);
        formErrorEl.textContent = 'Gagal menyimpan: ' + error.message;
        formErrorEl.style.display = 'block';
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

        fetchPlants(); // Refresh list

    } catch (error) {
        console.error('Error deleting plant:', error);
        alert('Gagal menghapus data.');
    }
};

// Real-time Subscription (Optional but cool)
function setupRealtimeSubscription() {
    window.supabaseClient
        .channel('public:plants')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plants' }, (payload) => {
            console.log('Change received!', payload);
            fetchPlants();
        })
        .subscribe();
}

// Image Preview Handler
document.getElementById('imageFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});
