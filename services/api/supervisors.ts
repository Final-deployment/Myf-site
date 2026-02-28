/**
 * Supervisor Management API Service
 */
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

async function apiFetch(url: string, options: any = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    const response = await fetch(getApiUrl(url), { ...options, headers });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'API request failed');
    }
    return response.json();
}

export const supervisorApi = {
    list: () => apiFetch('/api/supervisors'),
    promote: (userId: string, capacity: number, priority: number) =>
        apiFetch('/api/supervisors/promote', { method: 'POST', body: JSON.stringify({ userId, capacity, priority }) }),
    updateSettings: (supervisorId: string, capacity: number, priority: number) =>
        apiFetch('/api/supervisors/settings', { method: 'POST', body: JSON.stringify({ supervisorId, capacity, priority }) }),
    assignStudent: (studentId: string, supervisorId: string | null) =>
        apiFetch('/api/supervisors/assign', { method: 'POST', body: JSON.stringify({ studentId, supervisorId }) }),
    demote: (supervisorId: string, targetSupervisorId: string | null = null) =>
        apiFetch('/api/supervisors/demote', { method: 'POST', body: JSON.stringify({ supervisorId, targetSupervisorId }) }),
    getMyStudents: () => apiFetch('/api/supervisors/my-students'),
    getStudentsProgress: (supervisorId?: string) =>
        apiFetch(`/api/supervisors/students-progress${supervisorId ? `?supervisorId=${supervisorId}` : ''}`),
    unlockCourse: (userId: string, courseId: string, extraDays: number = 7) =>
        apiFetch(`/api/supervisors/students/${userId}/courses/${courseId}/unlock`, { method: 'POST', body: JSON.stringify({ extraDays }) })
};
