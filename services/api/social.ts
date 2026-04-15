/**
 * Social Service (Community & Messaging)
 */
import type { User } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export const socialApi = {

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
        if (response.status === 401) throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً');
        if (!response.ok) throw new Error('فشل إرسال الرسالة');
        return await response.json();
    },

    markMessagesAsRead: async (senderId: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/messages/read'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ senderId })
        });
        if (!response.ok) throw new Error('فشل تحديث حالة القراءة');
        return await response.json();
    },

    sendBroadcastMessage: async (content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string): Promise<any> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/social/broadcast'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, attachmentUrl, attachmentType, attachmentName })
        });
        if (response.status === 401) throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً');
        if (!response.ok) throw new Error('فشل إرسال التعميم');
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
                receiverId: 'admin_manager', // manager@mastaba.com — exclusive support account
                content,
                isComplaint: true
            })
        });
        if (response.status === 401) throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً');
        if (!response.ok) throw new Error('فشل إرسال الشكوى');
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
    },

    sendPublicMessage: async (content: string, guestName: string, guestId?: string | null, attachmentUrl?: string | null, attachmentType?: string | null, attachmentName?: string | null): Promise<any> => {
        const response = await fetch(getApiUrl('/social/public/messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, guestName, guestId, attachmentUrl, attachmentType, attachmentName })
        });
        if (!response.ok) throw new Error('فشل إرسال الرسالة');
        return await response.json();
    },

    getPublicMessages: async (guestId: string): Promise<any[]> => {
        const response = await fetch(getApiUrl(`/social/public/messages/${guestId}`));
        return response.ok ? await response.json() : [];
    },

    deleteMessage: async (messageId: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/social/messages/${messageId}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete message');
    },

    deleteConversation: async (userId: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/social/messages/conversation/${userId}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete conversation');
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
