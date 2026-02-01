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
          <!-- Flower/Fruit -->
          ${this.images.fruit ? `
            <g class="plant-part" data-part="fruit" style="cursor: pointer;">
              <circle cx="150" cy="40" r="20" fill="#ec4899" opacity="0.8"/>
              <circle cx="140" cy="35" r="12" fill="#f9a8d4" opacity="0.9"/>
              <circle cx="160" cy="35" r="12" fill="#f9a8d4" opacity="0.9"/>
              <circle cx="150" cy="48" r="12" fill="#f9a8d4" opacity="0.9"/>
              <text x="150" y="25" text-anchor="middle" font-size="20">🌸</text>
            </g>
          ` : ''}
          
          <!-- Leaves -->
          ${this.images.leaf ? `
            <g class="plant-part" data-part="leaf" style="cursor: pointer;">
              <!-- Left leaves -->
              <ellipse cx="100" cy="120" rx="35" ry="15" fill="#10b981" opacity="0.7" transform="rotate(-30 100 120)"/>
              <ellipse cx="90" cy="160" rx="30" ry="12" fill="#059669" opacity="0.7" transform="rotate(-25 90 160)"/>
              <ellipse cx="95" cy="200" rx="32" ry="14" fill="#10b981" opacity="0.7" transform="rotate(-20 95 200)"/>
              
              <!-- Right leaves -->
              <ellipse cx="200" cy="120" rx="35" ry="15" fill="#10b981" opacity="0.7" transform="rotate(30 200 120)"/>
              <ellipse cx="210" cy="160" rx="30" ry="12" fill="#059669" opacity="0.7" transform="rotate(25 210 160)"/>
              <ellipse cx="205" cy="200" rx="32" ry="14" fill="#10b981" opacity="0.7" transform="rotate(20 205 200)"/>
              
              <text x="150" y="165" text-anchor="middle" font-size="24">🍃</text>
            </g>
          ` : ''}
          
          <!-- Stem -->
          ${this.images.stem ? `
            <g class="plant-part" data-part="stem" style="cursor: pointer;">
              <rect x="145" y="60" width="10" height="180" fill="#047857" opacity="0.8" rx="5"/>
              <rect x="140" y="100" width="5" height="60" fill="#065f46" opacity="0.6" rx="2"/>
              <rect x="155" y="120" width="5" height="80" fill="#065f46" opacity="0.6" rx="2"/>
            </g>
          ` : ''}
          
          <!-- Roots -->
          ${this.images.root ? `
            <g class="plant-part" data-part="root" style="cursor: pointer;">
              <!-- Main root -->
              <path d="M 150 240 Q 150 280, 150 320" stroke="#78350f" stroke-width="8" fill="none" opacity="0.7"/>
              
              <!-- Side roots -->
              <path d="M 150 260 Q 120 275, 90 290" stroke="#78350f" stroke-width="4" fill="none" opacity="0.6"/>
              <path d="M 150 260 Q 180 275, 210 290" stroke="#78350f" stroke-width="4" fill="none" opacity="0.6"/>
              <path d="M 150 280 Q 110 300, 80 320" stroke="#78350f" stroke-width="3" fill="none" opacity="0.5"/>
              <path d="M 150 280 Q 190 300, 220 320" stroke="#78350f" stroke-width="3" fill="none" opacity="0.5"/>
              
              <!-- Root hairs -->
              <path d="M 150 300 Q 125 320, 100 340" stroke="#92400e" stroke-width="2" fill="none" opacity="0.4"/>
              <path d="M 150 300 Q 175 320, 200 340" stroke="#92400e" stroke-width="2" fill="none" opacity="0.4"/>
              <path d="M 150 310 Q 135 335, 120 360" stroke="#92400e" stroke-width="2" fill="none" opacity="0.4"/>
              <path d="M 150 310 Q 165 335, 180 360" stroke="#92400e" stroke-width="2" fill="none" opacity="0.4"/>
            </g>
          ` : ''}
          
          <!-- Central highlight path for full plant -->
          ${this.images.full_plant ? `
            <circle cx="150" cy="200" r="120" fill="transparent" stroke="#10b981" stroke-width="2" stroke-dasharray="5,5" opacity="0.3" class="plant-part" data-part="full_plant" style="cursor: pointer;"/>
          ` : ''}
        </svg>
        
        <div class="anatomy-legend">
          <h4>Klik bagian tumbuhan untuk melihat foto detail</h4>
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
            fruit: { icon: '🌸', label: 'Bunga/Buah' }
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
            fruit: 'Bunga/Buah'
        };
        return labels[part] || part;
    }
}

// Export for use in plant-detail.js
window.PlantAnatomy = PlantAnatomy;
