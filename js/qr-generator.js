// QR Code Generator with Creative Designs
// Generate beautiful QR codes for each plant

// Color Schemes
const colorSchemes = {
    purple: {
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#2c3e50',
        bg: '#f8f9fa'
    },
    green: {
        primary: '#11998e',
        secondary: '#38ef7d',
        text: '#2c3e50',
        bg: '#e8f5e9'
    },
    blue: {
        primary: '#2193b0',
        secondary: '#6dd5ed',
        text: '#1a237e',
        bg: '#e3f2fd'
    },
    sunset: {
        primary: '#f12711',
        secondary: '#f5af19',
        text: '#ffffff',
        bg: '#fff3e0'
    },
    pink: {
        primary: '#ff6a88',
        secondary: '#ff99ac',
        text: '#880e4f',
        bg: '#fce4ec'
    },
    dark: {
        primary: '#232526',
        secondary: '#414345',
        text: '#ffffff',
        bg: '#121212'
    }
};

// State
let currentPlants = [];
let selectedPlant = null;
let currentStyle = 'modern';
let currentColorScheme = 'purple';

// DOM Elements
const plantSelect = document.getElementById('plantSelect');
const colorSchemeSelect = document.getElementById('colorScheme');
const generateBtn = document.getElementById('generateBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const downloadOptions = document.getElementById('downloadOptions');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadPdfBtn = document.getElementById('downloadPdf');
const includeLogo = document.getElementById('includeLogo');
const includeIcon = document.getElementById('includeIcon');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadPlants();
    setupEventListeners();
    checkIfAdmin();
});

// Load plants from Supabase
async function loadPlants() {
    try {
        const { data: plants, error } = await window.supabaseClient
            .from('plants')
            .select('id, nama_indonesia, nama_latin')
            .order('nama_indonesia');

        if (error) throw error;

        currentPlants = plants;
        populatePlantSelect(plants);

    } catch (error) {
        console.error('Error loading plants:', error);
        window.showToast('Gagal memuat data tumbuhan', 'error');
    }
}

// Populate plant dropdown
function populatePlantSelect(plants) {
    plantSelect.innerHTML = '<option value="">-- Pilih Tumbuhan --</option>';

    plants.forEach(plant => {
        const option = document.createElement('option');
        option.value = plant.id;
        option.textContent = `${plant.nama_indonesia} (${plant.nama_latin})`;
        plantSelect.appendChild(option);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Style buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
        });
    });

    // Color scheme
    colorSchemeSelect.addEventListener('change', () => {
        currentColorScheme = colorSchemeSelect.value;
    });

    // Plant selection
    plantSelect.addEventListener('change', () => {
        const plantId = plantSelect.value;
        selectedPlant = currentPlants.find(p => p.id === plantId);
    });

    // Generate button
    generateBtn.addEventListener('click', generateQRCode);

    // Download buttons
    downloadPngBtn.addEventListener('click', () => downloadQR('png'));
    downloadPdfBtn.addEventListener('click', () => downloadQR('pdf'));
}

// Check if current user is admin
async function checkIfAdmin() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();

        if (user) {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (profile?.is_admin) {
                document.getElementById('batchGeneration').style.display = 'block';
                setupBatchGeneration();
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Generate QR Code
async function generateQRCode() {
    if (!selectedPlant) {
        window.showToast('Pilih tumbuhan terlebih dahulu', 'error');
        return;
    }

    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined' || typeof window.QRCode === 'undefined') {
        console.error('QRCode library not loaded');
        window.showToast('QR Code library belum ter-load. Refresh halaman.', 'error');
        return;
    }

    try {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ Generating...';

        // Clear previous QR
        qrCodeContainer.innerHTML = '';

        // Create canvas for QR code
        const canvas = document.createElement('canvas');
        const qrUrl = `${window.location.origin}/plant-detail.html?id=${selectedPlant.id}`;

        // Generate QR code using the global QRCode object
        const QRCodeLib = window.QRCode || QRCode;
        await QRCodeLib.toCanvas(canvas, qrUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: colorSchemes[currentColorScheme].primary,
                light: '#ffffff'
            }
        });

        // Create design container
        const designContainer = createDesignContainer(canvas);
        qrCodeContainer.appendChild(designContainer);

        // Show download options
        downloadOptions.style.display = 'block';

        window.showToast('QR Code berhasil dibuat!', 'success');

    } catch (error) {
        console.error('Error generating QR code:', error);
        window.showToast('Gagal generate QR code', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '✨ Generate QR Code';
    }
}

// Create design container based on selected style
function createDesignContainer(qrCanvas) {
    const container = document.createElement('div');
    container.className = `qr-design qr-design-${currentStyle}`;
    container.id = 'finalQRDesign';

    const scheme = colorSchemes[currentColorScheme];

    // Apply background gradient
    container.style.background = `linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%)`;
    container.style.padding = '40px';
    container.style.borderRadius = '20px';
    container.style.textAlign = 'center';
    container.style.minWidth = '400px';
    container.style.boxShadow = '0 20px 60px rgba(0,0,0,0.2)';

    // Header with logo (if enabled)
    if (includeLogo.checked) {
        const header = document.createElement('div');
        header.className = 'qr-header';
        header.style.marginBottom = '20px';

        const logo = document.createElement('h2');
        logo.textContent = '🌿 SciFanor';
        logo.style.color = scheme.text === '#ffffff' ? '#ffffff' : '#2c3e50';
        logo.style.margin = '0';
        logo.style.fontSize = '32px';
        logo.style.fontWeight = '700';

        header.appendChild(logo);
        container.appendChild(header);
    }

    // QR Code wrapper
    const qrWrapper = document.createElement('div');
    qrWrapper.className = 'qr-wrapper';
    qrWrapper.style.background = 'white';
    qrWrapper.style.padding = '20px';
    qrWrapper.style.borderRadius = '16px';
    qrWrapper.style.display = 'inline-block';
    qrWrapper.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';

    qrWrapper.appendChild(qrCanvas);
    container.appendChild(qrWrapper);

    // Plant name
    const plantName = document.createElement('div');
    plantName.className = 'plant-name';
    plantName.style.marginTop = '24px';

    const nameIndo = document.createElement('h3');
    nameIndo.textContent = selectedPlant.nama_indonesia;
    nameIndo.style.margin = '0 0 8px';
    nameIndo.style.color = scheme.text === '#ffffff' ? '#ffffff' : '#2c3e50';
    nameIndo.style.fontSize = '28px';
    nameIndo.style.fontWeight = '700';

    const nameLatin = document.createElement('p');
    nameLatin.textContent = selectedPlant.nama_latin;
    nameLatin.style.margin = '0';
    nameLatin.style.color = scheme.text === '#ffffff' ? 'rgba(255,255,255,0.9)' : '#7f8c8d';
    nameLatin.style.fontSize = '18px';
    nameLatin.style.fontStyle = 'italic';

    plantName.appendChild(nameIndo);
    plantName.appendChild(nameLatin);
    container.appendChild(plantName);

    // Icon (if enabled)
    if (includeIcon.checked) {
        const icon = document.createElement('div');
        icon.textContent = '🌱';
        icon.style.fontSize = '48px';
        icon.style.marginTop = '16px';
        container.appendChild(icon);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'qr-footer';
    footer.style.marginTop = '20px';
    footer.style.fontSize = '14px';
    footer.style.color = scheme.text === '#ffffff' ? 'rgba(255,255,255,0.8)' : '#95a5a6';
    footer.textContent = '📍 Taman SMA Brigjend Katamso 2 Medan';

    container.appendChild(footer);

    return container;
}

// Download QR code
async function downloadQR(format) {
    const designEl = document.getElementById('finalQRDesign');

    if (!designEl) {
        window.showToast('Generate QR code terlebih dahulu', 'error');
        return;
    }

    try {
        if (format === 'png') {
            // Use html2canvas to capture the design
            const html2canvas = await loadHtml2Canvas();
            const canvas = await html2canvas(designEl, {
                backgroundColor: null,
                scale: 2
            });

            // Download as PNG
            const link = document.createElement('a');
            link.download = `QR_${selectedPlant.nama_indonesia.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            window.showToast('QR Code downloaded!', 'success');

        } else if (format === 'pdf') {
            window.showToast('PDF download akan segera tersedia', 'info');
            // TODO: Implement PDF generation using jsPDF
        }

    } catch (error) {
        console.error('Error downloading QR:', error);
        window.showToast('Gagal download', 'error');
    }
}

// Load html2canvas library
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (window.html2canvas) {
            resolve(window.html2canvas);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => resolve(window.html2canvas);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Batch generation for admin
function setupBatchGeneration() {
    const generateAllBtn = document.getElementById('generateAllBtn');

    generateAllBtn.addEventListener('click', async () => {
        if (!confirm(`Generate QR codes untuk ${currentPlants.length} tumbuhan?`)) {
            return;
        }

        try {
            generateAllBtn.disabled = true;
            generateAllBtn.textContent = '⏳ Generating all...';

            window.showToast('Batch generation dalam proses...', 'info');

            // Generate all QR codes
            // TODO: Implement batch generation with ZIP file

            window.showToast('Fitur batch download akan segera tersedia', 'info');

        } catch (error) {
            console.error('Error in batch generation:', error);
            window.showToast('Gagal batch generate', 'error');
        } finally {
            generateAllBtn.disabled = false;
            generateAllBtn.textContent = '🚀 Generate All QR Codes (ZIP)';
        }
    });
}
