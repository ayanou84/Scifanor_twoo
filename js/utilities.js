/**
 * Utility Functions
 * Toast notifications, lightbox, and helper functions
 */

// ==================== Toast Notifications ====================

class Toast {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', title = '', duration = 3000) {
        const toast = this.createToast(message, type, title);
        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    }

    createToast(message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const titles = {
            success: title || 'Berhasil',
            error: title || 'Error',
            warning: title || 'Peringatan',
            info: title || 'Info'
        };

        toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <p class="toast-title">${titles[type]}</p>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
      <div class="toast-progress"></div>
    `;

        // Click to dismiss
        toast.addEventListener('click', () => this.remove(toast));

        return toast;
    }

    remove(toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    success(message, title = '') {
        return this.show(message, 'success', title);
    }

    error(message, title = '') {
        return this.show(message, 'error', title);
    }

    warning(message, title = '') {
        return this.show(message, 'warning', title);
    }

    info(message, title = '') {
        return this.show(message, 'info', title);
    }
}

// Global toast instance
const toast = new Toast();

// ==================== Image Lightbox ====================

class Lightbox {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'lightbox';
        this.modal.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close">×</button>
        <img class="lightbox-image" src="" alt="">
        <p class="lightbox-caption"></p>
        <button class="lightbox-nav prev">‹</button>
        <button class="lightbox-nav next">›</button>
      </div>
    `;
        document.body.appendChild(this.modal);
    }

    attachEventListeners() {
        // Close button
        this.modal.querySelector('.lightbox-close').addEventListener('click', () => this.close());

        // Navigation
        this.modal.querySelector('.lightbox-nav.prev').addEventListener('click', () => this.prev());
        this.modal.querySelector('.lightbox-nav.next').addEventListener('click', () => this.next());

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;

            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    }

    open(images, index = 0) {
        this.images = Array.isArray(images) ? images : [images];
        this.currentIndex = index;
        this.updateImage();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    updateImage() {
        const img = this.modal.querySelector('.lightbox-image');
        const caption = this.modal.querySelector('.lightbox-caption');
        const current = this.images[this.currentIndex];

        if (typeof current === 'string') {
            img.src = current;
            caption.textContent = '';
        } else {
            img.src = current.src || current.url;
            caption.textContent = current.caption || current.alt || '';
        }

        // Show/hide navigation buttons
        const prevBtn = this.modal.querySelector('.lightbox-nav.prev');
        const nextBtn = this.modal.querySelector('.lightbox-nav.next');

        prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage();
    }
}

// Global lightbox instance
const lightbox = new Lightbox();

// ==================== Share Functionality ====================

async function shareUrl(url, title = 'SciFanor - Tumbuhan') {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + '/' + url;

    // Try Web Share API first (mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                url: fullUrl
            });
            toast.success('Berhasil membagikan link!');
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    }

    // Fallback: Copy to clipboard
    try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success('Link berhasil disalin ke clipboard!', 'Tersalin');
        return true;
    } catch (err) {
        console.error('Copy failed:', err);
        toast.error('Gagal menyalin link', 'Error');
        return false;
    }
}

// Share plant detail page
function sharePlant(plantId, plantName) {
    const url = `plant-detail.html?id=${plantId}`;
    shareUrl(url, `${plantName} - SciFanor`);
}

// ==================== Helper Functions ====================

// Smooth scroll to element
function scrollToElement(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (!element) return;

    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
        top: top,
        behavior: 'smooth'
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy load images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Add ripple effect to buttons
function addRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// Initialize ripple effect on all buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn, .share-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            addRippleEffect(this, e);
        });
    });

    // Initialize lazy loading
    lazyLoadImages();
});

// Format date to Indonesian
function formatDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    if (!url) return false;
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
    return pattern.test(url);
}

// Extract YouTube video ID
function getYouTubeVideoId(url) {
    if (!url) return null;

    // Robust regex to handle youtu.be, youtube.com/watch, embed, v, etc.
    // Handles parameters like ?si=..., &feature=... correctly
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
}

// Create YouTube embed URL
function getYouTubeEmbedUrl(url) {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : null;
}

// Wrapper function for easier use
function showToast(message, type = 'info', title = '') {
    return toast.show(message, type, title);
}

// Export utilities
window.toast = toast;
window.showToast = showToast; // Add wrapper
window.lightbox = lightbox;
window.shareUrl = shareUrl;
window.sharePlant = sharePlant;
window.scrollToElement = scrollToElement;
window.debounce = debounce;
window.lazyLoadImages = lazyLoadImages;
window.formatDate = formatDate;
window.isValidYouTubeUrl = isValidYouTubeUrl;
window.getYouTubeVideoId = getYouTubeVideoId;
window.getYouTubeEmbedUrl = getYouTubeEmbedUrl;
