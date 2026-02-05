// Biology Page - Plants Loading and Display
// Biology Page - Plants Loading and Display
// Using window.supabaseClient directly

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const emptyStateEl = document.getElementById('emptyState');
const plantsGridEl = document.getElementById('plantsGrid');

// Render collaborators badge for plant card
function renderCollaboratorsBadge(collaborators, creator) {
    const allContributors = [];

    // Add creator first if exists
    if (creator) {
        allContributors.push({
            profile: creator,
            isCreator: true
        });
    }

    // Add collaborators
    if (collaborators && collaborators.length > 0) {
        collaborators.forEach(collab => {
            if (collab.profiles) {
                allContributors.push({
                    profile: collab.profiles,
                    isCreator: false
                });
            }
        });
    }

    if (allContributors.length === 0) {
        return '';
    }

    const maxVisible = 3;
    const visibleContributors = allContributors.slice(0, maxVisible);
    const remaining = allContributors.length - maxVisible;

    let avatarsHTML = visibleContributors.map(contributor => {
        const profile = contributor.profile;
        const profileUrl = `profile.html?id=${profile.id}`;
        const badge = contributor.isCreator ? '👑' : '';

        if (profile.avatar_url) {
            return `<a href="${profileUrl}" class="collaborator-avatar" onclick="event.stopPropagation();" title="${profile.full_name}${badge}">
                <img src="${profile.avatar_url}" alt="${profile.full_name}">
                ${badge ? `<span class="creator-badge">${badge}</span>` : ''}
            </a>`;
        } else {
            const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?';
            const color = window.getAvatarColorForInitial ? window.getAvatarColorForInitial(initial) : '#667eea';
            return `<a href="${profileUrl}" class="collaborator-avatar" onclick="event.stopPropagation();" title="${profile.full_name}${badge}">
                <div class="avatar-initial" style="background-color: ${color};">${initial}</div>
                ${badge ? `<span class="creator-badge">${badge}</span>` : ''}
            </a>`;
        }
    }).join('');

    const countHTML = remaining > 0 ? `<span class="collaborators-count">+${remaining}</span>` : '';

    return `
        <div class="plant-card-collaborators">
            <div class="plant-card-collaborators-avatars">
                ${avatarsHTML}
            </div>
            ${countHTML}
        </div>
    `;
}

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

        // First, fetch plants without joins to ensure it works
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

        // Load collaborators for each plant
        for (const plant of plants) {
            // First get collaborator user IDs
            const { data: collabData } = await window.supabaseClient
                .from('plant_collaborators')
                .select('user_id')
                .eq('plant_id', plant.id);

            // Then fetch profile data for each collaborator
            if (collabData && collabData.length > 0) {
                const userIds = collabData.map(c => c.user_id);
                const { data: profilesData } = await window.supabaseClient
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', userIds);

                // Map profiles back to collaborators
                plant.plant_collaborators = collabData.map(collab => ({
                    user_id: collab.user_id,
                    profiles: profilesData?.find(p => p.id === collab.user_id) || null
                }));
            } else {
                plant.plant_collaborators = [];
            }
        }

        console.log('✅ Loaded collaborators for all plants');

        // Render plants
        renderPlants(plants);

    } catch (err) {
        console.error('Error loading plants:', err);
        showError();
    }
}

// Render plants grid
async function renderPlants(plants) {
    // Hide loading/error/empty states
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    emptyStateEl.style.display = 'none';

    // Clear existing content
    plantsGridEl.innerHTML = '';

    // Create plant cards (wait for all to complete)
    const cardPromises = plants.map((plant, index) => createPlantCard(plant, index));
    const cards = await Promise.all(cardPromises);

    cards.forEach(card => {
        plantsGridEl.appendChild(card);
    });

    // Add entrance animations
    animateCards();
}

// Create individual plant card
async function createPlantCard(plant, index) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.style.opacity = '0';
    card.style.animationDelay = `${index * 0.1}s`;

    // Image or placeholder
    const imageHTML = plant.image_url
        ? `<img src="${plant.image_url}" alt="${plant.nama_indonesia}" class="plant-image">`
        : `<div class="plant-image-placeholder">🌿</div>`;

    // Load creator info if exists
    let creator = null;
    if (plant.created_by) {
        const { data } = await window.supabaseClient
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', plant.created_by)
            .single();
        creator = data;
    }

    // Prepare collaborators HTML (now includes creator with crown badge)
    const collaborators = plant.plant_collaborators || [];
    const collaboratorsHTML = renderCollaboratorsBadge(collaborators, creator);

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
      ${collaboratorsHTML}

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

// ==================== Search, Filter & Sort Logic ====================

let allPlantsData = []; // Store all plants for filtering
let uniqueFamili = new Set();
let totalContributorsSet = new Set();
let totalCollaborationsCount = 0;

// DOM Elements for search/filter
const searchInput = document.getElementById('searchInput');
const filterFamiliSelect = document.getElementById('filterFamili');
const sortBySelect = document.getElementById('sortBy');
const clearFiltersBtn = document.getElementById('clearFilters');
const resultsCountEl = document.getElementById('resultsCount');

// Setup search/filter listeners
document.addEventListener('DOMContentLoaded', () => {
    if (searchInput) {
        searchInput.addEventListener('input', window.debounce(applyFilters, 300));
    }
    if (filterFamiliSelect) {
        filterFamiliSelect.addEventListener('change', applyFilters);
    }
    if (sortBySelect) {
        sortBySelect.addEventListener('change', applyFilters);
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
});

// Enhanced renderPlants to store data for filtering
const originalRenderPlants = renderPlants;
renderPlants = async function (plants) {
    allPlantsData = plants;

    // Extract unique families for filter
    uniqueFamili.clear();
    plants.forEach(plant => {
        if (plant.famili) uniqueFamili.add(plant.famili);
    });

    // Populate famili filter
    if (filterFamiliSelect) {
        filterFamiliSelect.innerHTML = '<option value="">Semua Famili</option>';
        Array.from(uniqueFamili).sort().forEach(famili => {
            const option = document.createElement('option');
            option.value = famili;
            option.textContent = famili;
            filterFamiliSelect.appendChild(option);
        });
    }

    // Calculate stats
    calculateStats(plants);

    // Apply filters if any active
    if (searchInput && searchInput.value) {
        applyFilters();
    } else {
        await originalRenderPlants(plants);
        updateResultsCount(plants.length, plants.length);
    }
};

// Apply filters function
async function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterFamili = filterFamiliSelect ? filterFamiliSelect.value : '';
    const sortBy = sortBySelect ? sortBySelect.value : 'name-asc';

    let filtered = [...allPlantsData];

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(plant => {
            const matchName = plant.nama_indonesia?.toLowerCase().includes(searchTerm);
            const matchLatin = plant.nama_latin?.toLowerCase().includes(searchTerm);
            const matchFamili = plant.famili?.toLowerCase().includes(searchTerm);
            return matchName || matchLatin || matchFamili;
        });
    }

    // Filter by famili
    if (filterFamili) {
        filtered = filtered.filter(plant => plant.famili === filterFamili);
    }

    // Sort
    filtered = sortPlants(filtered, sortBy);

    // Render filtered results
    await originalRenderPlants(filtered);
    updateResultsCount(filtered.length, allPlantsData.length);

    // Show empty state if no results
    if (filtered.length === 0 && (searchTerm || filterFamili)) {
        showSearchEmptyState();
    }
}

// Sort plants
function sortPlants(plants, sortBy) {
    const sorted = [...plants];

    switch (sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) =>
                (a.nama_indonesia || '').localeCompare(b.nama_indonesia || '')
            );
        case 'name-desc':
            return sorted.sort((a, b) =>
                (b.nama_indonesia || '').localeCompare(a.nama_indonesia || '')
            );
        case 'date-new':
            return sorted.sort((a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );
        case 'date-old':
            return sorted.sort((a, b) =>
                new Date(a.created_at || 0) - new Date(b.created_at || 0)
            );
        default:
            return sorted;
    }
}

// Update results count
function updateResultsCount(showing, total) {
    if (resultsCountEl) {
        if (showing === total) {
            resultsCountEl.textContent = `Menampilkan ${total} tumbuhan`;
        } else {
            resultsCountEl.textContent = `Menampilkan ${showing} dari ${total} tumbuhan`;
        }
    }
}

// Clear all filters
function clearAllFilters() {
    if (searchInput) searchInput.value = '';
    if (filterFamiliSelect) filterFamiliSelect.value = '';
    if (sortBySelect) sortBySelect.value = 'name-asc';
    applyFilters();
}

// Show empty search state
function showSearchEmptyState() {
    plantsGridEl.innerHTML = `
        <div class="search-empty-state" style="grid-column: 1 / -1;">
            <h3>🔍 Tidak ada hasil</h3>
            <p>Coba kata kunci lain atau clear filter</p>
        </div>
    `;
}

// Calculate and animate stats
function calculateStats(plants) {
    totalContributorsSet.clear();
    totalCollaborationsCount = 0;

    plants.forEach(plant => {
        // Count unique contributors (creators)
        if (plant.created_by) {
            totalContributorsSet.add(plant.created_by);
        }

        // Count collaborations
        if (plant.plant_collaborators && plant.plant_collaborators.length > 0) {
            totalCollaborationsCount += plant.plant_collaborators.length;

            // Add collaborators to contributors set
            plant.plant_collaborators.forEach(collab => {
                if (collab.user_id) {
                    totalContributorsSet.add(collab.user_id);
                }
            });
        }
    });

    // Animate counters
    animateCounter('totalPlants', plants.length);
    animateCounter('totalContributors', totalContributorsSet.size);
    animateCounter('totalCollaborations', totalCollaborationsCount);
}

// Animate counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000; // 1 second
    const steps = 50;
    const increment = targetValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current = Math.min(current + increment, targetValue);
        element.textContent = Math.floor(current);

        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
        }
    }, duration / steps);
}
