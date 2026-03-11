/**
 * useCourses Hook
 * 
 * Custom hook for course-related operations.
 * Wraps the course store with additional utilities.
 * 
 * @module hooks/useCourses
 */

import { useEffect, useMemo } from 'react';
import { useCourseStore } from '../stores';
import { Course } from '../types';

interface UseCoursesReturn {
    /** All courses */
    courses: Course[];
    /** Completed courses */
    completedCourses: Course[];
    /** In-progress courses */
    inProgressCourses: Course[];
    /** Not started courses */
    notStartedCourses: Course[];
    /** Favorite courses */
    favoriteCourses: Course[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
    /** Currently selected course */
    selectedCourse: Course | null;
    /** Total progress percentage */
    totalProgress: number;
    /** Select a course */
    selectCourse: (course: Course | null) => void;
    /** Update course progress */
    updateProgress: (courseId: string, progress: number) => void;
    /** Toggle course favorite */
    toggleFavorite: (courseId: string) => void;
    /** Check if course is favorite */
    isFavorite: (courseId: string) => boolean;
    /** Get course by ID */
    getCourse: (id: string) => Course | undefined;
    /** Refresh courses */
    refresh: () => Promise<void>;
}

/**
 * Hook for managing courses
 * 
 * @param autoFetch - Whether to fetch courses on mount (default: true)
 * @returns Course state and actions
 * 
 * @example
 * const { courses, completedCourses, updateProgress } = useCourses();
 */
export function useCourses(autoFetch: boolean = true): UseCoursesReturn {
    const store = useCourseStore();

    // Fetch courses on mount
    useEffect(() => {
        if (autoFetch && store.courses.length === 0) {
            store.fetchCourses();
        }
    }, [autoFetch]);

    // Memoized computed values
    const completedCourses = useMemo(
        () => store.courses.filter((c) => c.progress === 100),
        [store.courses]
    );

    const inProgressCourses = useMemo(
        () => store.courses.filter((c) => c.progress > 0 && c.progress < 100),
        [store.courses]
    );

    const notStartedCourses = useMemo(
        () => store.courses.filter((c) => c.progress === 0),
        [store.courses]
    );

    const favoriteCourses = useMemo(
        () => store.courses.filter((c) => store.favorites.includes(c.id)),
        [store.courses, store.favorites]
    );

    const totalProgress = useMemo(() => {
        if (store.courses.length === 0) return 0;
        const total = store.courses.reduce((sum, c) => sum + c.progress, 0);
        return Math.round(total / store.courses.length);
    }, [store.courses]);

    return {
        courses: store.courses,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        favoriteCourses,
        isLoading: store.isLoading,
        error: store.error,
        selectedCourse: store.selectedCourse,
        totalProgress,
        selectCourse: store.selectCourse,
        updateProgress: store.updateCourseProgress,
        toggleFavorite: store.toggleFavorite,
        isFavorite: store.isFavorite,
        getCourse: store.getCourseById,
        refresh: store.fetchCourses,
    };
}

export default useCourses;
