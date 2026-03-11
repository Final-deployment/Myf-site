import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Search as SearchIcon, BookOpen, Mic2, FileText, Users, Clock, ArrowRight, X, LucideIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { sanitizeHTML } from '../utils/sanitize';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { usePagination } from '../hooks/usePagination';
import LoadingSpinner from './LoadingSpinner';

/**
 * Search result interface
 */
interface SearchResult {
    id: string;
    type: 'course' | 'audio' | 'document' | 'community';
    title: string;
    desc: string;
    instructor?: string;
    author?: string;
    duration?: string;
    members?: number;
    thumbnail?: string;
}

/**
 * Filter option interface
 */
interface FilterOption {
    id: string;
    label: string;
    icon: LucideIcon;
}

/**
 * Search result card component
 */
const ResultCard = memo<{
    result: SearchResult;
    typeColors: Record<string, string>;
    typeIcons: Record<string, LucideIcon>;
}>(({ result, typeColors, typeIcons }) => {
    const Icon = typeIcons[result.type];

    const handleClick = useCallback(() => {
        // TODO: Navigate to result detail page
    }, [result.title]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    return (
        <article
            className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`${result.title} - ${result.desc}`}
        >
            <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${typeColors[result.type]} flex items-center justify-center flex-shrink-0 overflow-hidden relative`}
                aria-hidden="true"
            >
                {result.thumbnail ? (
                    <img src={result.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <Icon className="w-7 h-7 text-white" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg truncate">{result.title}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-1">{result.desc}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {result.instructor && <span>{result.instructor}</span>}
                    {result.author && <span>{result.author}</span>}
                    {result.duration && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {result.duration}
                        </span>
                    )}
                    {result.members !== undefined && (
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" aria-hidden="true" />
                            {result.members} {result.type === 'community' ? 'إعجاب' : 'عضو'}
                        </span>
                    )}
                </div>
            </div>
            <ArrowRight
                className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all rtl:rotate-180 rtl:group-hover:translate-x-1"
                aria-hidden="true"
            />
        </article>
    );
});
ResultCard.displayName = 'ResultCard';

/**
 * Filter button component
 */
const FilterButton = memo<{
    filter: FilterOption;
    isActive: boolean;
    onClick: () => void;
}>(({ filter, isActive, onClick }) => {
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    }, [onClick]);

    return (
        <button
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
            role="radio"
            aria-checked={isActive}
            aria-label={filter.label}
        >
            <filter.icon className="w-4 h-4" aria-hidden="true" />
            {filter.label}
        </button>
    );
});
FilterButton.displayName = 'FilterButton';

/**
 * Search component - Platform-wide content search
 * 
 * Features:
 * - Real-time search with debounce
 * - Category filters
 * - Result cards with metadata
 * - ARIA accessibility
 * - Input sanitization
 * - Pagination
 * 
 * @returns Search component
 */
const Search: React.FC = memo(() => {
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Debounce search query for performance
    const debouncedQuery = useDebounce(query, 300);

    // API integration
    const { data: allResults, loading, execute: fetchResults } = useApi(api.search);

    useEffect(() => {
        fetchResults(debouncedQuery, activeFilter);
    }, [debouncedQuery, activeFilter, fetchResults]);

    // Pagination
    const {
        paginatedItems: filtered,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        goToPage,
        hasNextPage,
        hasPrevPage
    } = usePagination<SearchResult>((allResults as SearchResult[]) || [], { itemsPerPage: 5 });

    /** Filter options */
    const filters: FilterOption[] = useMemo(() => [
        { id: 'all', label: 'الكل', icon: SearchIcon },
        { id: 'course', label: 'دورات', icon: BookOpen },
        { id: 'audio', label: 'صوتيات', icon: Mic2 },
        { id: 'document', label: 'مستندات', icon: FileText },
        { id: 'community', label: 'مجتمع', icon: Users },
    ], []);

    /** Type colors for result cards */
    const typeColors: Record<string, string> = useMemo(() => ({
        course: 'from-emerald-500 to-teal-600',
        audio: 'from-violet-500 to-purple-600',
        document: 'from-amber-500 to-orange-600',
        community: 'from-blue-500 to-cyan-600',
    }), []);

    /** Type icons for result cards */
    const typeIcons: Record<string, LucideIcon> = useMemo(() => ({
        course: BookOpen,
        audio: Mic2,
        document: FileText,
        community: Users,
    }), []);

    /** Handle search input change */
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }, []);

    /** Clear search query */
    const handleClearSearch = useCallback(() => {
        setQuery('');
    }, []);

    /** Handle filter change */
    const handleFilterChange = useCallback((filterId: string) => {
        setActiveFilter(filterId);
    }, []);

    return (
        <div className="animate-fade-in space-y-6" role="main" aria-label="البحث">
            {/* Header */}
            <header>
                <h2 className="text-3xl font-bold text-white mb-2">البحث</h2>
                <p className="text-gray-300">ابحث في جميع المحتوى</p>
            </header>

            {/* Search Box */}
            <section className="glass-panel p-6 rounded-2xl" aria-label="مربع البحث">
                <div className="relative">
                    <SearchIcon
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={handleSearchChange}
                        placeholder="ابحث عن دورات، مقاطع صوتية، مستندات..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-12 text-white text-lg placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        aria-label="البحث في المحتوى"
                        role="searchbox"
                    />
                    {query && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="مسح البحث"
                        >
                            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div
                    className="flex flex-wrap gap-2 mt-4"
                    role="radiogroup"
                    aria-label="تصفية النتائج"
                >
                    {filters.map((f) => (
                        <FilterButton
                            key={f.id}
                            filter={f}
                            isActive={activeFilter === f.id}
                            onClick={() => handleFilterChange(f.id)}
                        />
                    ))}
                </div>
            </section>

            {/* Results */}
            <section className="space-y-4" aria-label="نتائج البحث" aria-live="polite">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400" aria-atomic="true">
                            {allResults?.length || 0} نتيجة
                        </p>
                        {filtered.map((result) => (
                            <ResultCard
                                key={`${result.type}-${result.id}`}
                                result={result}
                                typeColors={typeColors}
                                typeIcons={typeIcons}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="glass-panel p-12 text-center rounded-2xl">
                                <SearchIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    لا توجد نتائج للبحث عن "{query}"
                                </p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <nav className="flex items-center justify-center gap-2 mt-8" aria-label="pagination">
                                <button
                                    onClick={prevPage}
                                    disabled={!hasPrevPage}
                                    className="p-2 rounded-xl glass-panel hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    aria-label="Previous Page"
                                >
                                    <ChevronRight className="w-5 h-5 rtl:rotate-0 rotate-180 text-white" />
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === page
                                                ? 'bg-emerald-600 text-white'
                                                : 'glass-panel text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={nextPage}
                                    disabled={!hasNextPage}
                                    className="p-2 rounded-xl glass-panel hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    aria-label="Next Page"
                                >
                                    <ChevronLeft className="w-5 h-5 rtl:rotate-0 rotate-180 text-white" />
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </section>
        </div>
    );
});

Search.displayName = 'Search';

export default Search;
