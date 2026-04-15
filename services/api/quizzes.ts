/**
 * Quiz Service — Server-side scored quizzes
 */
import type { Quiz, QuizResult } from '../../types';
import { getAuthToken } from './auth';
import { getApiUrl } from './config';

export interface QuizSubmitResult {
    success: boolean;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    corrections: Array<{
        questionIndex: number;
        questionText: string;
        userAnswerText: string;
        correctAnswerText: string;
    }>;
}

export const quizzesApi = {
    getQuizzes: async (): Promise<Quiz[]> => {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(getApiUrl('/quizzes'), { headers });
        return response.ok ? await response.json() : [];
    },

    addQuiz: async (quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl('/quizzes'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل إنشاء الاختبار' }));
            throw new Error(err.error || 'فشل إنشاء الاختبار');
        }
    },

    updateQuiz: async (id: string, quiz: Partial<Quiz>): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/quizzes/${id}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(quiz)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل تحديث الاختبار' }));
            throw new Error(err.error || 'فشل تحديث الاختبار');
        }
    },

    deleteQuiz: async (id: string): Promise<void> => {
        const token = getAuthToken();
        const response = await fetch(getApiUrl(`/quizzes/${id}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'فشل حذف الاختبار' }));
            throw new Error(err.error || 'فشل حذف الاختبار');
        }
    },

    quizResults: {
        /** S2: Send answers array — server calculates the score */
        save: async (quizId: string, answers: number[]): Promise<QuizSubmitResult> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/quizzes/results'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quizId, answers })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'فشل حفظ النتيجة' }));
                throw new Error(err.error || 'فشل حفظ النتيجة');
            }
            return await response.json();
        },
        get: async (): Promise<QuizResult[]> => {
            const token = getAuthToken();
            const response = await fetch(getApiUrl('/quizzes/results'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : [];
        }
    }
};
