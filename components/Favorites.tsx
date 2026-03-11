import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Mic2, FileText, Play, Trash2, FolderOpen, Grid, List, Search } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from './LoadingSpinner';

import { api } from '../services/api';

const Favorites: React.FC = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [allContent, setAllContent] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch favorites
                const favs = await api.users.getFavorites(user.id);

                // For a complete implementation, we'd fetch the source items (courses, etc.)
                // But for now, let's create a display-ready object by mapping or fetching more
                // Metadata from current DB in frontend (Courses, resources)
                const courses = await api.courses.getCourses();
                const resources = await api.content.getResources(); // Assuming this returns documents and audios

                const merged = favs.map((f: any) => {
                    let sourceItem: any = null;
                    if (f.type === 'course') {
                        sourceItem = courses.find((c: any) => String(c.id) === String(f.targetId));
                    } else {
                        // For audio/document we'd look in resources
                        sourceItem = resources.find((r: any) => String(r.id) === String(f.targetId));
                    }

                    if (sourceItem) {
                        return {
                            ...sourceItem,
                            id: f.id, // DB Favorite ID
                            targetId: f.targetId, // Item ID (Course ID etc)
                            type: f.type,
                            title: sourceItem.title || sourceItem.label,
                            instructor: sourceItem.instructor || sourceItem.author,
                            image: sourceItem.image || sourceItem.thumbnail
                        };
                    }
                    return null;
                }).filter(Boolean);

                setFavorites(merged);
            } catch (error) {
                console.error("Failed to load favorites", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user, api]);

    const handleUnfavorite = async (targetId: string, type: string) => {
        if (!user) return;
        if (confirm('إزالة من المفضلة؟')) {
            try {
                const res = await api.toggleFavorite(user.id, targetId, type);
                if (res?.action === 'removed') {
                    setFavorites(prev => prev.filter(item => !(item.targetId === String(targetId) && item.type === type)));
                }
            } catch (error) {
                console.error("Error toggling favorite", error);
            }
        }
    };

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    const categories = [
        { id: 'all', label: 'الكل', icon: FolderOpen, count: favorites.length },
        { id: 'course', label: 'الدورات', icon: BookOpen, count: favorites.filter(f => f.type === 'course').length },
        { id: 'audio', label: 'المقاطع الصوتية', icon: Mic2, count: favorites.filter(f => f.type === 'audio').length },
        { id: 'document', label: 'المستندات', icon: FileText, count: favorites.filter(f => f.type === 'document').length },
    ];

    const filteredFavorites = activeCategory === 'all'
        ? favorites
        : favorites.filter(f => f.type === activeCategory);

    const typeIcons: Record<string, React.ElementType> = {
        course: BookOpen,
        audio: Mic2,
        document: FileText,
    };

    const typeColors: Record<string, string> = {
        course: 'from-emerald-500 to-teal-600',
        audio: 'from-violet-500 to-purple-600',
        document: 'from-amber-500 to-orange-600',
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">المفضلة</h2>
                    <p className="text-gray-300">محتواك المحفوظ للرجوع إليه لاحقاً</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث..."
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-48"
                        />
                    </div>
                    <div className="flex bg-white/5 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`glass-panel p-4 rounded-2xl flex items-center gap-4 transition-all ${activeCategory === cat.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'hover:bg-white/5'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeCategory === cat.id ? 'bg-emerald-500' : 'bg-white/10'
                            }`}>
                            <cat.icon className={`w-5 h-5 ${activeCategory === cat.id ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-right">
                            <p className={`font-medium ${activeCategory === cat.id ? 'text-white' : 'text-gray-300'}`}>{cat.label}</p>
                            <p className="text-sm text-gray-400">{cat.count} عنصر</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Favorites Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFavorites.map((item) => {
                        const Icon = typeIcons[item.type];
                        return (
                            <div key={item.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-all">
                                <div className="relative h-40">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute top-3 right-3">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[item.type]} flex items-center justify-center`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnfavorite(item.targetId, item.type)}
                                        className="absolute top-3 left-3 p-2 rounded-lg bg-black/50 text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                                    >
                                        <Heart className="w-4 h-4 fill-current" />
                                    </button>
                                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-full py-2 bg-emerald-500 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2">
                                            <Play className="w-4 h-4" /> متابعة
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-400">{item.instructor || item.author}</p>
                                    {item.progress !== undefined && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>التقدم</span>
                                                <span>{item.progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredFavorites.map((item) => {
                        const Icon = typeIcons[item.type];
                        return (
                            <div key={item.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/50 transition-all">
                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${typeColors[item.type]} flex items-center justify-center`}>
                                            <Icon className="w-3 h-3 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white">{item.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-400">{item.instructor || item.author}</p>
                                    {item.progress !== undefined && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-emerald-400">{item.progress}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors">
                                        <Play className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleUnfavorite(item.targetId, item.type)}
                                        className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Favorites;
