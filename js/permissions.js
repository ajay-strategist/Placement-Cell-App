// permissions.js
// Defines the role-based capabilities matrix and helper checks

const Permissions = {
    matrix: {
        admin: {
            manage_users: true,
            edit_people: true,
            edit_teachers: true,
            bulk_upload: true,
            edit_training_drives: true,
            manage_sessions: true,
            update_phase_results: true,
            post_announcements: true,
            view_analytics: true,
            system_settings: true
        },
        teacherCoordinator: {
            manage_users: false,
            edit_people: true,
            edit_teachers: false,
            bulk_upload: true,
            edit_training_drives: true,
            manage_sessions: true,
            update_phase_results: true,
            post_announcements: true,
            view_analytics: true,
            system_settings: false
        },
        studentCoordinator: {
            manage_users: false,
            edit_people: false,
            bulk_upload: false,
            edit_training_drives: false,
            manage_sessions: true,
            update_phase_results: true,
            post_announcements: true,
            view_analytics: true,
            system_settings: false
        },
        student: {
            manage_users: false,
            edit_people: false,
            bulk_upload: false,
            edit_training_drives: false,
            manage_sessions: false,
            update_phase_results: false,
            post_announcements: false,
            view_analytics: false,
            system_settings: false
        }
    },

    can(role, capability) {
        if (!role || !this.matrix[role]) return false;
        return !!this.matrix[role][capability];
    }
};
