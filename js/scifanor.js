/**
 * Scifanor Page Logic
 * Fetches all student profiles and renders them in a grid
 */

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    animateOnScroll();
});

// Load all students
async function loadStudents() {
    const gridEl = document.getElementById('studentsGrid');
    const loadingEl = document.getElementById('loadingStudents');

    try {
        const { data: students, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;

        loadingEl.style.display = 'none';

        if (!students || students.length === 0) {
            gridEl.innerHTML = '<p class="text-center" style="grid-column: 1/-1">Belum ada data siswa.</p>';
            return;
        }

        renderStudentsGrid(students);

    } catch (error) {
        console.error('Error loading students:', error);
        loadingEl.style.display = 'none';
        gridEl.innerHTML = '<p class="text-center error-msg" style="grid-column: 1/-1">Gagal memuat data siswa.</p>';
        if (window.showToast) window.showToast('Gagal memuat data siswa', 'error');
    }
}

// Render Grid
function renderStudentsGrid(students) {
    const gridEl = document.getElementById('studentsGrid');
    gridEl.innerHTML = '';

    students.forEach((student, index) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.05}s`;

        // On click -> Go to profile
        card.onclick = () => {
            window.location.href = `profile.html?id=${student.id}`;
        };

        // Determine avatar
        let avatarHTML;
        if (student.avatar_url) {
            avatarHTML = `<img src="${student.avatar_url}" alt="${student.full_name}" class="student-avatar" loading="lazy">`;
        } else {
            const initial = student.full_name.charAt(0).toUpperCase();
            const color = getAvatarColor(initial); // Helper function
            avatarHTML = `<div class="student-initial" style="background-color: ${color}">${initial}</div>`;
        }

        card.innerHTML = `
            ${avatarHTML}
            <h3 class="student-name">${student.full_name}</h3>
            ${student.is_admin ? '<span class="student-role">👑 Admin</span>' : '<span class="student-role">Siswa</span>'}
        `;

        gridEl.appendChild(card);
    });
}

// Helper: Get Color for Avatar (Copied logic for consistency)
function getAvatarColor(initial) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#FAD7A0',
        '#AED6F1', '#D7BDE2', '#A9DFBF', '#F9E79F', '#FADBD8',
        '#D5DBDB', '#85929E', '#5DADE2', '#48C9B0', '#F4D03F'
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
}

// Simple Scroll Animation Observer
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.timeline-content, .gallery-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // Add visible class to css to trigger fill mode forwards or simpler class toggle
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}
