
/**
 * Global Navigation Logic
 * Handles mobile menu toggling and active state
 */

document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');

    if (mobileToggle && navbarMenu) {
        mobileToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');

            // Optional: Animate hamburger icon
            const icon = mobileToggle.textContent;
            mobileToggle.textContent = icon === '☰' ? '✕' : '☰';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navbarMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navbarMenu.classList.remove('active');
                mobileToggle.textContent = '☰';
            }
        });
    }

    // Highlight active link based on current URL
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });
});
