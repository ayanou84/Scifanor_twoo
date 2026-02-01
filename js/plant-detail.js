// Plant Detail Page - Enhanced with Multiple Images, Anatomy, YouTube
// Using window.supabaseClient directly

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('plantContent');

// Get plant ID from URL
const urlParams = new URLSearchParams(window.location.search);
const plantId = urlParams.get('id');

// Taxonomy levels configuration
const taxonomyLevels = [
    { key: 'kingdom', label: 'Kingdom (Kerajaan)', icon: '👑' },
    { key: 'divisi', label: 'Divisi', icon: '🌿' },
    { key: 'class', label: 'Class (Kelas)', icon: '📚' },
    { key: 'ordo', label: 'Ordo (Bangsa)', icon: '🔬' },
    { key: 'famili', label: 'Famili (Suku)', icon: '🌳' },
    { key: 'genus', label: 'Genus (Marga)', icon: '🍃' },
    { key: 'spesies', label: 'Spesies', icon: '🌱', isItalic: true }
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
        const { data: plant, error } = await window.supabaseClient
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

        // Parse JSONB fields if they exist
        if (typeof plant.images === 'string') {
            plant.images = JSON.parse(plant.images);
        }
        if (typeof plant.taxonomy_descriptions === 'string') {
            plant.taxonomy_descriptions = JSON.parse(plant.taxonomy_descriptions);
        }

        // Fallback for old format
        if (!plant.images && plant.image_url) {
            plant.images = { full_plant: plant.image_url };
        }

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
    const mainImage = plant.images?.full_plant || plant.image_url;

    if (mainImage) {
        heroImageEl.innerHTML = `
            <img src="${mainImage}" alt="${plant.nama_indonesia}" class="plant-hero-image" onclick="window.lightbox.open(['${mainImage}'])">
            <button class="hero-share-btn" onclick="sharePlant('${plant.id}', '${plant.nama_indonesia.replace(/'/g, "\\'")}')">
                🔗 Bagikan Tumbuhan Ini
            </button>
        `;
    } else {
        heroImageEl.innerHTML = '<div class="plant-hero-placeholder">🌿</div>';
    }

    document.getElementById('plantName').textContent = plant.nama_indonesia;
    document.getElementById('plantLatin').textContent = plant.nama_latin || 'Nama latin tidak tersedia';

    // Render plant anatomy if images exist
    if (plant.images && Object.keys(plant.images).length > 1) {
        renderPlantAnatomy(plant);
    }

    // Taxonomy section
    renderTaxonomy(plant);

    // YouTube section
    if (plant.youtube_url) {
        renderYouTubeEmbed(plant.youtube_url);
    }

    // Additional info
    document.getElementById('plantHabitat').textContent = plant.habitat || 'Informasi habitat belum tersedia';
    document.getElementById('plantCiri').textContent = plant.ciri_khas || 'Informasi ciri khas belum tersedia';
    document.getElementById('plantManfaat').textContent = plant.manfaat || 'Informasi manfaat belum tersedia';

    // Show content
    showContent();
}

// Render Plant Anatomy Visualization
function renderPlantAnatomy(plant) {
    const anatomyContainer = document.getElementById('anatomySection');
    if (!anatomyContainer) return;

    anatomyContainer.style.display = 'block';

    if (window.PlantAnatomy) {
        const anatomy = new PlantAnatomy(plant);
        anatomy.render('anatomyVisualization');
    }
}

// Render taxonomy cards with descriptions
function renderTaxonomy(plant) {
    const taxonomyGridEl = document.getElementById('taxonomyGrid');
    taxonomyGridEl.innerHTML = '';

    const descriptions = plant.taxonomy_descriptions || {};

    taxonomyLevels.forEach((level, index) => {
        const value = plant[level.key];

        if (value) {
            const card = document.createElement('div');
            card.className = 'taxonomy-card';
            card.style.opacity = '0';
            card.style.animationDelay = `${index * 0.1}s`;

            const valueClass = level.isItalic ? 'taxonomy-value italic' : 'taxonomy-value';
            const description = descriptions[level.key];

            card.innerHTML = `
                <div class="taxonomy-icon">${level.icon}</div>
                <div class="taxonomy-level">${level.label}</div>
                <div class="${valueClass}">${value}</div>
                ${description ? `<div class="taxonomy-description">${description}</div>` : ''}
            `;

            taxonomyGridEl.appendChild(card);

            // Trigger animation
            setTimeout(() => {
                card.classList.add('fade-in');
            }, 50 + (index * 100));
        }
    });
}

// Render YouTube Embed
function renderYouTubeEmbed(url) {
    const youtubeContainer = document.getElementById('youtubeSection');
    if (!youtubeContainer) return;

    const embedUrl = window.getYouTubeEmbedUrl(url);
    if (!embedUrl) return;

    youtubeContainer.style.display = 'block';
    youtubeContainer.innerHTML = `
        <div class="youtube-embed-container">
            <h3>📺 Video Pembelajaran</h3>
            <div class="youtube-embed">
                <iframe 
                    src="${embedUrl}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    loading="lazy">
                </iframe>
            </div>
        </div>
    `;
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
