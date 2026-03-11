import React, { useState, useEffect, useCallback, memo } from 'react';
import { Star, MessageSquare, Trash2, Send, CornerDownLeft, Globe, User } from 'lucide-react';
import { ratingsApi } from '../services/api/social';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

const RatingBox: React.FC = () => {
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const { user } = useAuth();
    const toast = useToast();

    const loadRatings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ratingsApi.getRatings();
            setRatings(data);
        } catch (error) {
            console.error('Failed to load ratings', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRatings();
    }, [loadRatings]);

    const handleReply = async (ratingId: string) => {
        if (!replyContent.trim()) return;
        try {
            await ratingsApi.replyToRating(ratingId, replyContent);
            toast.success('تم إضافة الرد بنجاح');
            setReplyContent('');
            setReplyingTo(null);
            loadRatings();
        } catch (error) {
            toast.error('فشل في إضافة الرد');
        }
    };

    const handleDeleteRating = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
        try {
            await ratingsApi.deleteRating(id);
            toast.success('تم حذف التقييم');
            loadRatings();
        } catch (error) {
            toast.error('فشل في الحذف');
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الرد؟')) return;
        try {
            await ratingsApi.deleteReply(replyId);
            toast.success('تم حذف الرد');
            loadRatings();
        } catch (error) {
            toast.error('فشل في الحذف');
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span>آراء وتقييمات الطلاب</span>
                </h3>
            </div>

            <div className="grid gap-6">
                {ratings.length === 0 ? (
                    <div className="glass-panel p-8 text-center rounded-2xl bg-white/5">
                        <p className="text-gray-400">لا توجد تقييمات حالياً</p>
                    </div>
                ) : (
                    ratings.map((rating) => (
                        <div key={rating.id} className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 overflow-hidden">
                                        {rating.userAvatar ? (
                                            <img src={rating.userAvatar} alt={rating.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{rating.userName}</h4>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < rating.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                                                ))}
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Globe className="w-3 h-3 text-emerald-400" />
                                                <span>{rating.userCountry || 'المنصة'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {(user?.role === 'admin' || user?.role === 'supervisor') && (
                                    <button
                                        onClick={() => handleDeleteRating(rating.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                        title="حذف التقييم"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <p className="text-gray-200 text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 italic">
                                "{rating.comment}"
                            </p>

                            {/* Replies */}
                            <div className="space-y-3 mr-4 border-r-2 border-white/5 pr-4">
                                {rating.replies?.map((reply: any) => (
                                    <div key={reply.id} className="bg-white/5 p-4 rounded-xl relative group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <CornerDownLeft className="w-3 h-3 text-emerald-400" />
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${reply.role === 'admin' ? 'text-amber-400' : reply.role === 'supervisor' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                    {reply.role === 'admin' ? 'الإدارة' : reply.role === 'supervisor' ? 'المشرف' : 'طالب'}
                                                </span>
                                                <span className="text-white text-xs font-bold">{reply.userName}</span>
                                            </div>
                                            {(user?.role === 'admin' || user?.role === 'supervisor') && (
                                                <button
                                                    onClick={() => handleDeleteReply(reply.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-xs">{reply.content}</p>
                                    </div>
                                ))}

                                {/* Reply Input */}
                                {replyingTo === rating.id ? (
                                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="اكتب ردك هنا..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                            onKeyDown={(e) => e.key === 'Enter' && handleReply(rating.id)}
                                        />
                                        <button
                                            onClick={() => handleReply(rating.id)}
                                            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                            className="px-3 text-xs text-gray-400 hover:text-white"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setReplyingTo(rating.id)}
                                        className="text-[11px] text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1.5 transition-colors px-1"
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                        <span>إضافة رد</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default memo(RatingBox);
