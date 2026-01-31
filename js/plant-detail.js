// Plant Detail Page - Load and Display Individual Plant
const supabase = window.supabaseClient;

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('plantContent');

// Get plant ID from URL
const urlParams = new URLSearchParams(window.location.search);
const plantId = urlParams.get('id');

// Taxonomy levels configuration
const taxonomyLevels = [
    { key: 'kingdom', label: 'Kingdom (Kerajaan)', description: 'Tingkatan tertinggi dalam klasifikasi' },
    { key: 'divisi', label: 'Divisi', description: 'Pembagian berdasarkan karakteristik anatomi' },
    { key: 'class', label: 'Class (Kelas)', description: 'Pembagian berdasarkan struktur biji dan pembuluh' },
    { key: 'ordo', label: 'Ordo (Bangsa)', description: 'Kumpulan famili dengan kemiripan morfologi' },
    { key: 'famili', label: 'Famili (Suku)', description: 'Kelompok genus yang berkerabat dekat' },
    { key: 'genus', label: 'Genus (Marga)', description: 'Kelompok spesies dengan karakteristik sangat mirip' },
    { key: 'spesies', label: 'Spesies', description: 'Unit dasar klasifikasi (nama ilmiah lengkap)', isItalic: true }
];

// Load plant on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌿 Plant detail page loaded');
    console.log('Plant ID:', plantId);

    if (!plantId) {
        showError();
        return;
    }

    loadPlantDetail();
});

// Main function to load plant detail
async function loadPlantDetail() {
    try {
        showLoading();

        console.log(`Fetching plant with ID: ${plantId}`);

        // Fetch plant from Supabase
        const { data: plant, error } = await supabase
            .from('plants')
            .select('*')
            .eq('id', plantId)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            showError();
            return;
        }

        if (!plant) {
            console.error('Plant not found');
            showError();
            return;
        }

        console.log('✅ Plant loaded:', plant);

        // Render plant detail
        renderPlantDetail(plant);

    } catch (err) {
        console.error('Error loading plant:', err);
        showError();
    }
}

// Render plant detail
function renderPlantDetail(plant) {
    // Update page title
    document.title = `${plant.nama_indonesia} - SciFanor`;

    // Hero section
    const heroImageEl = document.getElementById('heroImage');
    if (plant.image_url) {
        heroImageEl.innerHTML = `<img src="${plant.image_url}" alt="${plant.nama_indonesia}" class="plant-hero-image">`;
    } else {
        heroImageEl.innerHTML = '<div class="plant-hero-placeholder">🌿</div>';
    }

    document.getElementById('plantName').textContent = plant.nama_indonesia;
    document.getElementById('plantLatin').textContent = plant.nama_latin || 'Nama latin tidak tersedia';

    // Taxonomy section
    renderTaxonomy(plant);

    // Additional info
    document.getElementById('plantHabitat').textContent = plant.habitat || 'Informasi habitat belum tersedia';
    document.getElementById('plantCiri').textContent = plant.ciri_khas || 'Informasi ciri khas belum tersedia';
    document.getElementById('plantManfaat').textContent = plant.manfaat || 'Informasi manfaat belum tersedia';

    // Show content
    showContent();
}

// Render taxonomy cards
function renderTaxonomy(plant) {
    const taxonomyGridEl = document.getElementById('taxonomyGrid');
    taxonomyGridEl.innerHTML = '';

    taxonomyLevels.forEach((level, index) => {
        const value = plant[level.key];

        if (value) {
            const card = document.createElement('div');
            card.className = 'taxonomy-card';
            card.style.opacity = '0';
            card.style.animationDelay = `${index * 0.1}s`;

            const valueClass = level.isItalic ? 'taxonomy-value italic' : 'taxonomy-value';

            card.innerHTML = `
        <div class="taxonomy-level">${level.label}</div>
        <div class="${valueClass}">${value}</div>
      `;

            taxonomyGridEl.appendChild(card);

            // Trigger animation
            setTimeout(() => {
                card.classList.add('fade-in');
            }, 50 + (index * 100));
        }
    });
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
