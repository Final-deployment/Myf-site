/**
 * Social Service (Community & Messaging)
 */
import type { Post, User } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const socialApi = {
    getCommunityPosts: async (): Promise<Post[]> => {
        const response = await fetch(getApiUrl('/community/posts'));
        return response.ok ? await response.json() : [];
    },

    getMessages: async (): Promise<any[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/messages'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    getContacts: async (): Promise<User[]> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/contacts'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    },

    sendMessage: async (receiverId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string, isComplaint?: boolean): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/messages'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ receiverId, content, attachmentUrl, attachmentType, attachmentName, isComplaint })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    },

    sendComplaint: async (content: string): Promise<any> => {
        const token = getAuthToken();
        // Complaints always go to the system admin. We need to find the admin id or use a special keyword if backend supports it.
        // For now, assume we need a receiverId. Usually '2' or 'admin@example.com' ID. 
        // Let's check how admin is seeded in database.cjs. ID is "2".
        const response = await fetch(getApiUrl('/social/messages'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receiverId: 'admin_main', // Actual Admin ID in production
                content,
                isComplaint: true
            })
        });
        if (!response.ok) throw new Error('Failed to send complaint');
        return await response.json();
    },

    markMessageRead: async (id: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl(`/social/messages/${id}/read`), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    markConversationAsRead: async (userId: string): Promise<void> => {
        const token = getAuthToken();
        await fetch(getApiUrl(`/social/messages/conversation/${userId}/read`), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    getUnreadCount: async (): Promise<number> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/messages/unread'), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            return data.count;
        }
        return 0;
    }
};

export const ratingsApi = {
    getRatings: async (): Promise<any[]> => {
        const response = await fetch(getApiUrl('/ratings'));
        return response.ok ? await response.json() : [];
    },

    submitRating: async (rating: number, comment: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/ratings'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment })
        });
        if (!response.ok) throw new Error('Failed to submit rating');
        return await response.json();
    },

    replyToRating: async (ratingId: string, content: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/ratings/${ratingId}/reply`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to post reply');
        return await response.json();
    },

    deleteRating: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/ratings/${id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete rating');
    },

    deleteReply: async (replyId: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/ratings/reply/${replyId}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete reply');
    }
};
