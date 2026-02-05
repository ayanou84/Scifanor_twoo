/**
 * Activity Logger Module
 * Handles recording and fetching activity history for plants
 */
const ActivityLogger = {
    /**
     * Log an activity
     * @param {string} plantId - The ID of the plant
     * @param {string} actionType - 'create', 'update', 'image_add', 'collab_add', etc.
     * @param {string} details - Human readable details
     */
    async log(plantId, actionType, details) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            const { error } = await window.supabaseClient
                .from('plant_activity_logs')
                .insert({
                    plant_id: plantId,
                    user_id: user.id,
                    action_type: actionType,
                    details: details
                });

            if (error) throw error;
            console.log(`📝 Activity logged: ${actionType} - ${details}`);
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't block UI if logging fails
        }
    },

    /**
     * Get activities for a plant
     * @param {string} plantId 
     * @returns {Promise<Array>} List of activities with user profiles
     */
    async getActivities(plantId) {
        const { data, error } = await window.supabaseClient
            .from('plant_activity_logs')
            .select(`
                *,
                profiles:user_id (full_name, avatar_url)
            `)
            .eq('plant_id', plantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching activities:', error);
            return [];
        }

        return data;
    },

    /**
     * Format time relative (e.g., "5 minutes ago")
     */
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'baru saja';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} menit yang lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam yang lalu`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} hari yang lalu`;

        return date.toLocaleDateString('id-ID');
    },

    /**
     * Compare objects to generate update details
     */
    generateUpdateDetails(oldData, newData) {
        const changes = [];
        // Define readable labels for fields
        const labels = {
            nama_indonesia: 'Nama Indonesia',
            nama_latin: 'Nama Latin',
            famili: 'Famili',
            genus: 'Genus',
            spesies: 'Spesies',
            kingdom: 'Kingdom',
            habitat: 'Habitat',
            desc_genus: 'Deskripsi Genus',
            // Add other fields as needed
        };

        // Basic fields
        ['nama_indonesia', 'nama_latin', 'famili', 'genus', 'spesies', 'habitat'].forEach(key => {
            if (oldData[key] !== newData[key]) {
                changes.push(`Mengubah ${labels[key] || key}`);
            }
        });

        // Taxonomy descriptions (nested)
        if (newData.taxonomy_descriptions) {
            // Simplified check
            const oldDesc = oldData.taxonomy_descriptions || {};
            const newDesc = newData.taxonomy_descriptions;

            if (oldDesc.genus !== newDesc.genus) changes.push('Mengupdate deskripsi Genus');
            if (oldDesc.spesies !== newDesc.spesies) changes.push('Mengupdate deskripsi Spesies');
            // ... add others if needed
        }

        // Image changes
        if (newData.images) {
            const oldImages = oldData.images || {};
            const newImages = newData.images;
            const imgLabels = {
                full_plant: 'Tumbuhan Utuh',
                root: 'Akar',
                stem: 'Batang',
                leaf: 'Daun',
                fruit: 'Buah',
                flower: 'Bunga'
            };

            Object.keys(newImages).forEach(key => {
                // If new image exists and is different from old
                if (newImages[key] && newImages[key] !== oldImages[key]) {
                    changes.push(`Menambahkan/Mengupdate foto ${imgLabels[key] || key}`);
                }
            });
        }

        if (changes.length === 0) return 'Melakukan update data';
        if (changes.length > 2) return `Mengupdate ${changes.length} data detail`;
        return changes.join(', ');
    }
};

// Expose globally
window.ActivityLogger = ActivityLogger;
