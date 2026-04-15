/**
 * Admin Service (Logs, Certificates, R2)
 */
import type { SystemActivityLog, Certificate } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export interface R2Item {
    id: string;
    name: string;
    fullName: string;
    size: number;
    lastModified: string;
    url: string;
}

export const adminApi = {
    getLogs: async (): Promise<SystemActivityLog[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/system-activity-logs'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    getDashboardStats: async (): Promise<{ totalStudents: number; activeCourses: number; completionRate: number } | null> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/stats/dashboard'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        return await response.json();
    },

    logAction: async (userId: string, userName: string, action: string, details: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl('/system-activity-logs'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, userName, action, details })
        });
    },

    getCertificates: async (): Promise<Certificate[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/certificates'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    getAllCertificates: async (): Promise<Certificate[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/certificates/all'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    issueCertificate: async (data: any): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/certificates/issue'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to issue certificate');
        return await response.json();
    },

    generateCertificate: async (courseId: string): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/certificates'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId })
        });
        if (!response.ok) throw new Error('Failed to generate certificate');
        return await response.json();
    },

    generateMasterCertificate: async (): Promise<Certificate> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/certificates/master'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to generate master certificate');
        return await response.json();
    },

    r2: {
        listFiles: async (prefix: string = ''): Promise<{ files: R2Item[]; folders: R2Item[]; prefix: string }> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl(`/r2/files?prefix=${encodeURIComponent(prefix)}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch R2 files');
            return await response.json();
        },

        getUploadUrl: async (fileName: string, fileType: string, folderPath?: string): Promise<{ uploadUrl: string, key: string, publicUrl: string }> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/r2/upload-url'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ fileName, fileType, folderPath })
            });
            if (!response.ok) throw new Error('Failed to get upload URL');
            return await response.json();
        },

        deleteFile: async (key: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/r2/file'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key })
            });
            if (!response.ok) throw new Error('Failed to delete file');
        },

        renameFile: async (oldKey: string, newKey: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/r2/rename'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldKey, newKey })
            });
            if (!response.ok) throw new Error('Failed to rename file');
        },

        createFolder: async (folderPath: string): Promise<void> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/r2/folder'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ folderPath })
            });
            if (!response.ok) throw new Error('Failed to create folder');
        }
    },

    downloadBackup: async (): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/backup/download'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to download backup');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-backup-${new Date().toISOString().split('T')[0]}.sqlite`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    },

    downloadLocalBackup: async (filename: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/admin/backup/download/${filename}`), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to download specific backup');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    },

    uploadCloudBackup: async (): Promise<{ url: string; key: string; size: number }> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/backup/cloud'), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to upload cloud backup');
        return await response.json();
    },

    restoreBackup: async (file: File): Promise<{success: boolean, message?: string}> => {
        const token = getAuthToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(getApiUrl('/admin/backup/restore'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to restore backup');
        return data;
    },

    getLocalBackups: async (): Promise<{ files: any[] }> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/backup/local'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch local backups');
        return await response.json();
    },

    getBackupSettings: async (): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/settings/backup'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch backup settings');
        return await response.json();
    },

    updateBackupSettings: async (settings: any): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/admin/settings/backup'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });
        if (!response.ok) throw new Error('Failed to update backup settings');
    }
};
