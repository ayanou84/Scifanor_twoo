// Authentication Module
// Using window.supabaseClient directly to avoid variable name collisions

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Check authentication status
async function checkAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        // User is logged in
        showDashboard(session.user);
    } else {
        // User is not logged in
        showLoginScreen();
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

// Show dashboard
function showDashboard(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;

    // Load plants if dashboard is ready
    if (typeof loadDashboardPlants === 'function') {
        loadDashboardPlants();
    }
}

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Attempt login
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        console.log('✅ Login successful');
        showDashboard(data.user);

    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = '❌ ' + (error.message || 'Login gagal. Periksa email dan password.');
        errorEl.style.display = 'block';

        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
});

// Logout function
async function logout() {
    try {
        await window.supabaseClient.auth.signOut();
        console.log('✅ Logged out');
        showLoginScreen();

        // Clear forms
        document.getElementById('loginForm')?.reset();

    } catch (error) {
        console.error('Logout error:', error);
        alert('Gagal logout. Silakan coba lagi.');
    }
}

// Get current user (helper function)
async function getCurrentUser() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return session?.user || null;
}

// Export functions for use in dashboard.js
window.logout = logout;
window.getCurrentUser = getCurrentUser;
