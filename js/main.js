// Main Landing Page JavaScript
console.log('SciFanor - Science for IPS Students 🎓');

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add entrance animations on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe section cards
document.querySelectorAll('.section-card').forEach((card, index) => {
  card.style.opacity = '0';
  card.style.animationDelay = `${index * 0.1}s`;
  observer.observe(card);
});

// Prevent click on coming soon cards
document.querySelectorAll('.coming-soon').forEach(card => {
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    showComingSoonMessage();
  });
});

function showComingSoonMessage() {
  // Simple alert for now - could be replaced with a modal
  const message = '🚧 Project ini masih dalam pengembangan.\n\nStay tuned untuk update selanjutnya! 🎉';
  alert(message);
}

// Add subtle parallax effect to hero
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const hero = document.querySelector('.hero');
  
  if (hero && scrollY < hero.offsetHeight) {
    hero.style.transform = `translateY(${scrollY * 0.5}px)`;
    hero.style.opacity = 1 - (scrollY / hero.offsetHeight);
  }
  
  lastScrollY = scrollY;
}, { passive: true });

// Log for debugging
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ SciFanor loaded successfully');
  console.log('📚 Available sections:', document.querySelectorAll('.section-card').length);
});
