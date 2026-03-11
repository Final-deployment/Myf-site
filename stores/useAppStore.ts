/**
 * App UI Store
 * 
 * Manages global UI state like sidebar, active tab, and modals.
 * Uses Zustand for simple and performant state management.
 * 
 * @module stores/useAppStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface AppState {
    /** Currently active navigation tab */
    activeTab: string;
    /** Whether sidebar is collapsed (mobile) */
    isSidebarCollapsed: boolean;
    /** Whether a modal is currently open */
    isModalOpen: boolean;
    /** Current modal content identifier */
    currentModal: string | null;
    /** Search query */
    searchQuery: string;

    // Actions
    setActiveTab: (tab: string) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
    setSearchQuery: (query: string) => void;
    reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
    activeTab: 'dashboard',
    isSidebarCollapsed: false,
    isModalOpen: false,
    currentModal: null,
    searchQuery: '',
};

// ============================================================================
// Store
// ============================================================================

/**
 * Global app UI store
 * 
 * @example
 * const { activeTab, setActiveTab } = useAppStore();
 * setActiveTab('courses');
 */
export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            ...initialState,

            setActiveTab: (tab) => set({ activeTab: tab }),

            toggleSidebar: () => set((state) => ({
                isSidebarCollapsed: !state.isSidebarCollapsed
            })),

            setSidebarCollapsed: (collapsed) => set({
                isSidebarCollapsed: collapsed
            }),

            openModal: (modalId) => set({
                isModalOpen: true,
                currentModal: modalId
            }),

            closeModal: () => set({
                isModalOpen: false,
                currentModal: null
            }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            reset: () => set(initialState),
        }),
        {
            name: 'mastaba-app-store',
            partialize: (state) => ({
                activeTab: state.activeTab,
                isSidebarCollapsed: state.isSidebarCollapsed
            }),
        }
    )
);

export default useAppStore;
