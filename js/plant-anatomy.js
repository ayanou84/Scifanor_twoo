/**
 * Plant Anatomy Interactive Visualization
 * Clickable plant parts with image gallery
 */

class PlantAnatomy {
  constructor(plantData) {
    this.plant = plantData;
    this.images = plantData.images || {};
    this.currentPart = null;
    this.container = null;
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.container.innerHTML = this.createHTML();
    this.attachEventListeners();
  }

  createHTML() {
    const hasImages = Object.values(this.images).some(img => img);

    if (!hasImages) {
      return '<p style="text-align: center; color: var(--life-text-muted);">Gambar detail bagian tumbuhan belum tersedia</p>';
    }

    return `
      <div class="anatomy-container">
        <div class="anatomy-illustration">
          ${this.createIllustration()}
        </div>
        <div class="anatomy-gallery">
          ${this.createGallery()}
        </div>
      </div>
    `;
  }

  createIllustration() {
    return `
      <div class="plant-illustration">
        <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" class="plant-svg">
          <!-- 1. Full Plant Highlight (Background Layer - Fixed Click Issue) -->
          ${this.images.full_plant ? `
            <circle cx="150" cy="200" r="140" 
              fill="#ecfdf5" 
              stroke="#10b981" 
              stroke-width="2" 
              stroke-dasharray="8,8" 
              opacity="0.5" 
              class="plant-part" 
              data-part="full_plant" 
              style="cursor: pointer; transition: all 0.3s ease;"
            />
          ` : ''}

          <!-- 2. Root System (Organic Paths) -->
          ${this.images.root ? `
            <g class="plant-part" data-part="root" style="cursor: pointer;">
              <!-- Main Tap Root -->
              <path d="M 150 320 Q 155 360, 150 390" stroke="#8D6E63" stroke-width="8" fill="none" stroke-linecap="round" />
              <!-- Side Roots -->
              <path d="M 150 330 Q 120 350, 100 380" stroke="#8D6E63" stroke-width="5" fill="none" stroke-linecap="round" />
              <path d="M 150 330 Q 180 350, 200 380" stroke="#8D6E63" stroke-width="5" fill="none" stroke-linecap="round" />
              <path d="M 150 350 Q 130 370, 120 390" stroke="#8D6E63" stroke-width="3" fill="none" stroke-linecap="round" />
              <path d="M 150 350 Q 170 370, 180 390" stroke="#8D6E63" stroke-width="3" fill="none" stroke-linecap="round" />
              <!-- Ground Line Hint -->
              <path d="M 80 320 Q 150 325, 220 320" stroke="#5D4037" stroke-width="2" opacity="0.3" fill="none" />
            </g>
          ` : ''}

          <!-- 3. Stem (Organic Tapered Path) -->
          ${this.images.stem ? `
            <g class="plant-part" data-part="stem" style="cursor: pointer;">
              <!-- Main Stem -->
              <path d="M 150 320 Q 145 200, 150 80" stroke="#4a7c59" stroke-width="12" fill="none" stroke-linecap="round" />
              <!-- Branches -->
              <path d="M 150 240 Q 120 220, 90 200" stroke="#4a7c59" stroke-width="6" fill="none" stroke-linecap="round" />
              <path d="M 150 180 Q 180 160, 210 140" stroke="#4a7c59" stroke-width="6" fill="none" stroke-linecap="round" />
              <path d="M 150 140 Q 110 120, 80 100" stroke="#4a7c59" stroke-width="4" fill="none" stroke-linecap="round" />
            </g>
          ` : ''}

          <!-- 4. Leaves (Organic Leaf Shapes) -->
          ${this.images.leaf ? `
            <g class="plant-part" data-part="leaf" style="cursor: pointer;">
              <!-- Leaf Shape Definition -->
              <defs>
                <path id="leafShapeRight" d="M 0 0 Q 30 -15, 60 0 Q 30 15, 0 0 Z" fill="#4ade80" stroke="#15803d" stroke-width="1" />
                <path id="leafShapeLeft" d="M 0 0 Q -30 -15, -60 0 Q -30 15, 0 0 Z" fill="#22c55e" stroke="#15803d" stroke-width="1" />
              </defs>

              <!-- Leaves on Branches -->
              <use href="#leafShapeLeft" x="90" y="200" transform="rotate(-10 90 200)" />
              <use href="#leafShapeLeft" x="110" y="210" transform="rotate(-5 110 210) scale(0.8)" />
              
              <use href="#leafShapeRight" x="210" y="140" transform="rotate(10 210 140)" />
              <use href="#leafShapeRight" x="180" y="150" transform="rotate(5 180 150) scale(0.8)" />
              
              <use href="#leafShapeLeft" x="80" y="100" transform="rotate(-15 80 100) scale(0.9)" />
              
              <!-- Top Leaves -->
              <use href="#leafShapeRight" x="150" y="80" transform="rotate(-45 150 80) scale(1.2)" />
              <use href="#leafShapeLeft" x="150" y="80" transform="rotate(225 150 80) scale(1.2)" />
            </g>
          ` : ''}

          <!-- 5. Fruit (Dynamic & Hanging) -->
          ${this.images.fruit ? `
            <g class="plant-part" data-part="fruit" style="cursor: pointer;">
              <!-- Hanging Fruits -->
              <circle cx="90" cy="210" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="1">
                <animate attributeName="r" values="12;13;12" dur="3s" repeatCount="indefinite" />
              </circle>
              <line x1="90" y1="200" x2="90" y2="200" stroke="#4a7c59" stroke-width="2" />

              <circle cx="210" cy="150" r="14" fill="#f59e0b" stroke="#b45309" stroke-width="1">
                 <animate attributeName="cy" values="150;152;150" dur="4s" repeatCount="indefinite" />
              </circle>
            </g>
          ` : ''}

          <!-- 6. Flower (Blooming) -->
          ${this.images.flower ? `
            <g class="plant-part" data-part="flower" style="cursor: pointer;">
              <!-- Flower Top -->
               <circle cx="150" cy="60" r="18" fill="#ec4899" stroke="#be185d" stroke-width="1" opacity="0.9" />
               <path d="M 150 60 L 140 40 M 150 60 L 160 40 M 150 60 L 130 60 M 150 60 L 170 60 M 150 60 L 140 80 M 150 60 L 160 80" stroke="#fbcfe8" stroke-width="2" />
               <circle cx="150" cy="60" r="6" fill="#fef08a" />
            </g>
          ` : ''}

        </svg>
        
        <div class="anatomy-legend">
          <h4>👇 Klik bagian tumbuhan untuk detail</h4>
        </div>
      </div>
    `;
  }

  createGallery() {
    const parts = {
      full_plant: { icon: '🌳', label: 'Tumbuhan Utuh' },
      root: { icon: '🌱', label: 'Akar' },
      stem: { icon: '🎋', label: 'Batang' },
      leaf: { icon: '🍃', label: 'Daun' },
      fruit: { icon: '🍎', label: 'Buah' },
      flower: { icon: '🌻', label: 'Bunga' }
    };

    let galleryHTML = '<div class="anatomy-gallery-grid">';

    for (const [part, data] of Object.entries(parts)) {
      if (this.images[part]) {
        galleryHTML += `
          <div class="anatomy-gallery-item" onclick="window.lightbox.open(['${this.images[part]}'])">
            <img src="${this.images[part]}" alt="${data.label}" class="gallery-thumbnail" loading="lazy">
            <div class="gallery-label">
              <span class="gallery-icon">${data.icon}</span>
              <span class="gallery-text">${data.label}</span>
            </div>
          </div>
        `;
      }
    }

    galleryHTML += '</div>';
    return galleryHTML;
  }

  attachEventListeners() {
    const parts = this.container.querySelectorAll('.plant-part');

    parts.forEach(part => {
      const partName = part.getAttribute('data-part');

      part.addEventListener('mouseenter', () => {
        part.style.filter = 'brightness(1.2)';
        part.style.transform = 'scale(1.05)';
      });

      part.addEventListener('mouseleave', () => {
        part.style.filter = 'brightness(1)';
        part.style.transform = 'scale(1)';
      });

      part.addEventListener('click', () => {
        if (this.images[partName]) {
          window.lightbox.open([{
            src: this.images[partName],
            caption: this.getPartLabel(partName)
          }]);
        }
      });
    });
  }

  getPartLabel(part) {
    const labels = {
      full_plant: 'Tumbuhan Utuh',
      root: 'Akar',
      stem: 'Batang',
      leaf: 'Daun',
      fruit: 'Buah',
      flower: 'Bunga'
    };
    return labels[part] || part;
  }
}

// Export for use in plant-detail.js
window.PlantAnatomy = PlantAnatomy;
