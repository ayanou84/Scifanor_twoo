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

        // Fetch plant basic data first
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

        // Load creator info
        if (plant.created_by) {
            const { data: creator } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, avatar_url, instagram_url')
                .eq('id', plant.created_by)
                .single();

            plant.creator = creator;
        }

        // Load collaborators
        const { data: collabData } = await window.supabaseClient
            .from('plant_collaborators')
            .select('user_id')
            .eq('plant_id', plantId);

        if (collabData && collabData.length > 0) {
            const userIds = collabData.map(c => c.user_id);
            const { data: profilesData } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, avatar_url, instagram_url')
                .in('id', userIds);

            // Map profiles back to collaborators
            plant.plant_collaborators = collabData.map(collab => ({
                user_id: collab.user_id,
                profiles: profilesData?.find(p => p.id === collab.user_id) || null
            }));
        } else {
            plant.plant_collaborators = [];
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

    // Additional info - store full text and show preview
    const habitatEl = document.getElementById('plantHabitat');
    const ciriEl = document.getElementById('plantCiri');
    const manfaatEl = document.getElementById('plantManfaat');

    const habitatText = plant.habitat || 'Informasi habitat belum tersedia';
    const ciriText = plant.ciri_khas || 'Informasi ciri khas belum tersedia';
    const manfaatText = plant.manfaat || 'Informasi manfaat belum tersedia';

    // Store full text in data attribute
    habitatEl.setAttribute('data-full-text', habitatText);
    ciriEl.setAttribute('data-full-text', ciriText);
    manfaatEl.setAttribute('data-full-text', manfaatText);

    // Show preview initially
    habitatEl.textContent = truncateToPreview(habitatText);
    ciriEl.textContent = truncateToPreview(ciriText);
    manfaatEl.textContent = truncateToPreview(manfaatText);

    // Render collaborators
    renderCollaborators(plant);

    // Load and render history
    loadActivityHistory(plant.id);

    // Show content
    showContent();
}

// Load Activity History
async function loadActivityHistory(plantId) {
    const historySection = document.getElementById('historySection');
    const timelineEl = document.getElementById('activityTimeline');

    if (!window.ActivityLogger) return;

    try {
        const activities = await window.ActivityLogger.getActivities(plantId);

        if (activities && activities.length > 0) {
            historySection.style.display = 'block';
            timelineEl.innerHTML = '';

            activities.forEach(activity => {
                const item = document.createElement('div');
                item.className = 'activity-item';

                const user = activity.profiles || { full_name: 'Unknown User' };
                const timeAgo = window.ActivityLogger.timeAgo(activity.created_at);

                // Format action text
                let actionText = activity.details || activity.action_type;

                item.innerHTML = `
                    <div class="activity-header">
                        <span class="activity-user">${user.full_name}</span>
                        <span class="activity-time">• ${timeAgo}</span>
                    </div>
                    <div class="activity-details">
                        ${actionText}
                    </div>
                `;

                timelineEl.appendChild(item);
            });
        }

    } catch (error) {
        console.error('Error loading history:', error);
    }
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

            // Add class if has description
            if (description) {
                card.classList.add('has-description');
            }

            card.innerHTML = `
                <div class="taxonomy-icon">${level.icon}</div>
                <div class="taxonomy-level">${level.label}</div>
                <div class="${valueClass}">${value}</div>
                ${description ? `<div class="taxonomy-description">${description}</div>` : ''}
            `;

            // Add click handler if has description
            if (description) {
                card.addEventListener('click', function () {
                    this.classList.toggle('expanded');
                });
            }

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

// Render Collaborators Section
function renderCollaborators(plant) {
    const collaboratorsSection = document.getElementById('collaboratorsSection');
    const creatorInfoEl = document.getElementById('creatorInfo');
    const collaboratorsGridEl = document.getElementById('collaboratorsGrid');

    const creator = plant.creator;
    const collaborators = plant.plant_collaborators || [];

    // Always show section if there's a creator or collaborators
    if (creator || collaborators.length > 0) {
        collaboratorsSection.style.display = 'block';
    }

    // Render creator
    if (creator) {
        const creatorAvatar = window.renderAvatar ? window.renderAvatar(creator, 64) : '';
        const instagramLink = creator.instagram_url
            ? `<a href="${creator.instagram_url}" target="_blank" onclick="event.stopPropagation();">📷 Instagram</a>`
            : '';
        const profileUrl = `profile.html?id=${creator.id}`;

        creatorInfoEl.innerHTML = `
            <a href="${profileUrl}" class="creator-card creator-card-link">
                ${creatorAvatar.outerHTML || ''}
                <div class="creator-card-info">
                    <h4>
                        ${creator.full_name}
                        <span class="badge">👑 Pembuat</span>
                    </h4>
                    ${instagramLink}
                </div>
            </a>
        `;
    }

    // Render collaborators
    collaboratorsGridEl.innerHTML = '';
    if (collaborators.length > 0) {
        collaborators.forEach(collab => {
            const profile = collab.profiles;
            if (!profile) return;

            const avatar = window.renderAvatar ? window.renderAvatar(profile, 72) : '';
            const instagramLink = profile.instagram_url
                ? `<a href="${profile.instagram_url}" target="_blank" onclick="event.stopPropagation();">📷 @${profile.instagram_url.split('/').pop()}</a>`
                : '';
            const profileUrl = `profile.html?id=${profile.id}`;

            const card = document.createElement('a');
            card.href = profileUrl;
            card.className = 'collaborator-card collaborator-card-link';
            card.innerHTML = `
                ${avatar.outerHTML || ''}
                <h4>${profile.full_name}</h4>
                ${instagramLink}
            `;
            collaboratorsGridEl.appendChild(card);
        });
    } else if (!creator) {
        collaboratorsGridEl.innerHTML = '<div class="empty-state-collaborators"><p>Belum ada kolaborator</p></div>';
    }
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

// Toggle Section (Collapsible)
window.toggleSection = function (contentId) {
    const content = document.getElementById(contentId);
    const toggleBtn = document.getElementById(contentId.replace('Content', 'Toggle'));

    if (content && toggleBtn) {
        content.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
    }
};

// Toggle Info Card (Habitat, Ciri, Manfaat)
window.toggleInfoCard = function (headerElement) {
    const card = headerElement.closest('.collapsible-card');
    const toggle = headerElement.querySelector('.info-toggle');
    const content = card.querySelector('.info-content p');

    const isExpanded = card.classList.contains('expanded');
    const fullText = content.getAttribute('data-full-text');

    if (isExpanded) {
        // Collapse - show preview
        content.textContent = truncateToPreview(fullText);
        card.classList.remove('expanded');
    } else {
        // Expand - show full text
        content.textContent = fullText;
        card.classList.add('expanded');
    }

    toggle.classList.toggle('rotated');
};

// Truncate text to first paragraph for preview
function truncateToPreview(text, maxLength = 150) {
    if (!text || text === '-') return text;

    // Split by line breaks or periods to get first sentence/paragraph
    const firstParagraph = text.split(/\n\n|\. /)[0];

    if (firstParagraph.length > maxLength) {
        return firstParagraph.substring(0, maxLength) + '...';
    }

    return firstParagraph + (text.length > firstParagraph.length ? '...' : '');
}
