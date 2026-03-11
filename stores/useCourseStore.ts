/**
 * Course Store
 * 
 * Manages course-related state and operations.
 * 
 * @module stores/useCourseStore
 */

import { create } from 'zustand';
import { Course } from '../types';
import { api } from '../services/api';

// ============================================================================
// Types
// ============================================================================

interface CourseState {
    /** List of all courses */
    courses: Course[];
    /** Currently selected course */
    selectedCourse: Course | null;
    /** Favorite course IDs */
    favorites: string[];
    /** Loading state */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;

    // Actions
    fetchCourses: () => Promise<void>;
    selectCourse: (course: Course | null) => void;
    updateCourseProgress: (courseId: string, progress: number) => void;
    toggleFavorite: (courseId: string) => void;
    isFavorite: (courseId: string) => boolean;
    getCourseById: (id: string) => Course | undefined;
}

// ============================================================================
// Store
// ============================================================================

/**
 * Course management store
 * 
 * @example
 * const { courses, fetchCourses } = useCourseStore();
 * useEffect(() => { fetchCourses(); }, []);
 */
export const useCourseStore = create<CourseState>((set, get) => ({
    courses: [],
    selectedCourse: null,
    favorites: [], // Initialize empty, will be loaded asynchronously
    isLoading: false,
    error: null,

    fetchCourses: async () => {
        set({ isLoading: true, error: null });
        try {
            const courses = await api.getCourses();
            set({ courses, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch courses',
                isLoading: false
            });
        }
    },

    selectCourse: (course) => set({ selectedCourse: course }),

    updateCourseProgress: (courseId, progress) => {
        api.updateCourseProgress(courseId, progress);
        set((state) => ({
            courses: state.courses.map((c) =>
                c.id === courseId ? { ...c, progress } : c
            ),
        }));
    },

    toggleFavorite: (courseId) => {
        const isFav = api.toggleFavorite(courseId);
        set((state) => ({
            favorites: isFav
                ? [...state.favorites, courseId]
                : state.favorites.filter((id) => id !== courseId),
        }));
    },

    isFavorite: (courseId) => get().favorites.includes(courseId),

    getCourseById: (id) => get().courses.find((c) => c.id === id),
}));

export default useCourseStore;
