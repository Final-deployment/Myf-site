/**
 * API Service for Al-Mastaba Platform
 * 
 * Aggregates all specialized API services.
 * 
 * @module services/api
 */

import { authApi, getAuthToken } from './api/auth';
import { usersApi } from './api/users';
import { coursesApi } from './api/courses';
import { quizzesApi } from './api/quizzes';
import { contentApi } from './api/content';
import { socialApi } from './api/social';
import { adminApi } from './api/admin';
import { supervisorApi } from './api/supervisors';
import { foldersApi } from './api/folders';

export { getAuthToken };

export const api = {
    // Auth & Users
    ...authApi,
    ...usersApi,

    // Courses
    ...coursesApi,
    ...foldersApi,

    // content (Library & Announcements)
    ...contentApi,

    // Social (Community & Messaging)
    ...socialApi,

    // Quizzes
    ...quizzesApi,

    // Admin (Logs, Certificates, R2)
    ...adminApi,

    // Supervisors
    supervisors: supervisorApi,

    // Search (Maintained here for now as it aggregates from multiple services)
    search: async (query: string) => {
        const courses = await coursesApi.getCourses();
        return courses.filter(c => c.title.includes(query)).map(c => ({
            id: c.id,
            type: 'course',
            title: c.title,
            desc: c.description || '',
            thumbnail: c.thumbnail
        }));
    }
};

export default api;
