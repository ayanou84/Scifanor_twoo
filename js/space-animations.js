/**
 * Space Animations JavaScript
 * Creates dynamic space background with stars, particles, and planets
 */

class SpaceAnimation {
    constructor() {
        this.starfield = null;
        this.stars = [];
        this.particles = [];
        this.init();
    }

    init() {
        this.createStarfield();
        this.createStars(150);
        this.createParticles(8);
        this.createPlanets(3);
        this.startParallax();
    }

    createStarfield() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        this.starfield = document.createElement('div');
        this.starfield.className = 'starfield';
        hero.insertBefore(this.starfield, hero.firstChild);
    }

    createStars(count) {
        if (!this.starfield) return;

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = `star ${this.getRandomStarSize()}`;

            // Random position
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;

            // Random animation duration and delay
            star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
            star.style.animationDelay = `${Math.random() * 3}s`;

            this.starfield.appendChild(star);
            this.stars.push(star);
        }
    }

    getRandomStarSize() {
        const rand = Math.random();
        if (rand < 0.7) return 'small';
        if (rand < 0.9) return 'medium';
        return 'large';
    }

    createParticles(count) {
        if (!this.starfield) return;

        const colors = ['blue', 'cyan', 'purple'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${colors[i % colors.length]}`;

            // Random position
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            particle.style.left = `${startX}%`;
            particle.style.top = `${startY}%`;

            // Random movement
            const endX = (Math.random() - 0.5) * 200;
            const endY = (Math.random() - 0.5) * 200;
            particle.style.setProperty('--tx', `${endX}px`);
            particle.style.setProperty('--ty', `${endY}px`);

            // Random duration and delay
            particle.style.setProperty('--duration', `${15 + Math.random() * 20}s`);
            particle.style.animationDelay = `${Math.random() * 10}s`;

            this.starfield.appendChild(particle);
            this.particles.push(particle);
        }
    }

    createPlanets(count) {
        if (!this.starfield) return;

        const sizes = ['small', 'medium', 'large'];

        for (let i = 0; i < count; i++) {
            const planet = document.createElement('div');
            planet.className = `planet ${sizes[i % sizes.length]}`;

            // Position planets in different areas
            const positions = [
                { left: '10%', top: '20%' },
                { right: '15%', top: '10%' },
                { left: '5%', bottom: '25%' }
            ];

            const pos = positions[i] || { left: '50%', top: '50%' };
            Object.assign(planet.style, pos);

            this.starfield.appendChild(planet);
        }
    }

    startParallax() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    updateParallax() {
        const scrolled = window.pageYOffset;

        if (this.starfield) {
            this.starfield.style.transform = `translateY(${scrolled * 0.5}px)`;
        }

        // Parallax for particles (different speeds)
        this.particles.forEach((particle, index) => {
            const speed = 0.3 + (index % 3) * 0.1;
            particle.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }

    createMeteor() {
        if (!this.starfield) return;

        const meteor = document.createElement('div');
        meteor.className = 'meteor';

        // Random starting position at top
        meteor.style.left = `${Math.random() * 100}%`;
        meteor.style.top = `-10px`;

        this.starfield.appendChild(meteor);

        // Remove after animation
        setTimeout(() => {
            meteor.remove();
        }, 3000);
    }

    // Trigger meteors randomly
    startMeteorShower() {
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.createMeteor();
            }
        }, 5000);
    }
}

// Initialize space animation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.hero')) {
            const spaceAnim = new SpaceAnimation();
            // Optional: Start meteor shower
            // spaceAnim.startMeteorShower();
        }
    });
} else {
    if (document.querySelector('.hero')) {
        const spaceAnim = new SpaceAnimation();
    }
}

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpaceAnimation;
}
