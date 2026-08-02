import { getAuthToken } from './auth';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
    const token = getAuthToken();
    const response = await fetch(`/api/in-app-notifications?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  getUnreadCount: async (): Promise<number> => {
    const token = getAuthToken();
    const response = await fetch('/api/in-app-notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    const token = getAuthToken();
    await fetch(`/api/in-app-notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  markAllAsRead: async (): Promise<void> => {
    const token = getAuthToken();
    await fetch('/api/in-app-notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  deleteNotification: async (id: string): Promise<void> => {
    const token = getAuthToken();
    await fetch(`/api/in-app-notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};
