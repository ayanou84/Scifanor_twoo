// Biology Page - Plants Loading and Display
// Biology Page - Plants Loading and Display
// Using window.supabaseClient directly

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyStateEl = document.getElementById('emptyState');
const plantsGridEl = document.getElementById('plantsGrid');

// Load plants on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Biology page loaded');
    loadPlants();
});

// Main function to load plants from Supabase
async function loadPlants() {
    try {
        // Show loading state
        showLoading();

        console.log('Fetching plants from Supabase...');

        // Fetch plants from Supabase
        const { data: plants, error } = await window.supabaseClient
            .from('plants')
            .select('*')
            .order('nama_indonesia', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            showError();
            return;
        }

        console.log(`✅ Loaded ${plants.length} plants`);

        // Check if plants exist
        if (!plants || plants.length === 0) {
            showEmptyState();
            return;
        }

        // Render plants
        renderPlants(plants);

    } catch (err) {
        console.error('Error loading plants:', err);
        showError();
    }
}

// Render plants grid
function renderPlants(plants) {
    // Hide loading/error/empty states
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    emptyStateEl.style.display = 'none';

    // Clear existing content
    plantsGridEl.innerHTML = '';

    // Create plant cards
    plants.forEach((plant, index) => {
        const card = createPlantCard(plant, index);
        plantsGridEl.appendChild(card);
    });

    // Add entrance animations
    animateCards();
}

// Create individual plant card
function createPlantCard(plant, index) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.style.opacity = '0';
    card.style.animationDelay = `${index * 0.1}s`;

    // Image or placeholder
    const imageHTML = plant.image_url
        ? `<img src="${plant.image_url}" alt="${plant.nama_indonesia}" class="plant-image">`
        : `<div class="plant-image-placeholder">🌿</div>`;

    card.innerHTML = `
    <div class="plant-image-container">
      ${imageHTML}
      <button class="plant-card-share" onclick="event.stopPropagation(); sharePlant('${plant.id}', '${plant.nama_indonesia.replace(/'/g, "\\'")}')">
        <span>🔗</span>
        <span>Share</span>
      </button>
    </div>
    <div class="plant-info">
      <h3 class="plant-name">${plant.nama_indonesia}</h3>
      <p class="plant-latin">${plant.nama_latin || 'Nama latin tidak tersedia'}</p>
      ${plant.famili ? `<span class="plant-family">${plant.famili}</span>` : ''}
    </div>
  `;

    // Handle click to detail page (exclude share button)
    card.addEventListener('click', () => {
        window.location.href = `plant-detail.html?id=${plant.id}`;
    });

    return card;
}

// Animate cards entrance
function animateCards() {
    const cards = document.querySelectorAll('.plant-card');
    cards.forEach(card => {
        card.classList.add('fade-in');
    });
}

// UI State Functions
function showLoading() {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    emptyStateEl.style.display = 'none';
    plantsGridEl.innerHTML = '';
}

function showError() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    emptyStateEl.style.display = 'none';
    plantsGridEl.innerHTML = '';
}

function showEmptyState() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    emptyStateEl.style.display = 'block';
    plantsGridEl.innerHTML = '';
}

// Refresh function (exposed globally)
window.loadPlants = loadPlants;
