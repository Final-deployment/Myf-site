import React, { useState, memo } from 'react';
import { Star, X, CheckCircle2, MessageSquare, Send, Globe } from 'lucide-react';
import { ratingsApi } from '../services/api/social';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const toast = useToast();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('يرجى اختيار التقييم بالنجوم أولاً');
            return;
        }

        setIsSubmitting(true);
        try {
            await ratingsApi.submitRating(rating, comment);
            toast.success('شكراً لك على تقييمك! سيظهر رأيك في الواجهة الرئيسية.');
            onClose();
        } catch (error) {
            toast.error('حدث خطأ أثناء إرسال التقييم');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose} />

            <div className="relative w-full max-w-lg glass-panel bg-[#0a1815] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in">
                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 md:p-12 relative z-10 text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <Star className="w-10 h-10 text-emerald-400 fill-emerald-400" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-white mb-2 font-serif tracking-tight">ما هو تقييمك لمصطبتنا؟</h2>
                    <p className="text-gray-400 mb-10 text-lg">رأيك يهمنا جداً في تطوير المحتوى وتجربة التعلم</p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-3 mb-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className="transform hover:scale-125 transition-all duration-300 outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                aria-label={`Rate ${star} stars`}
                            >
                                <Star
                                    className={`w-12 h-12 ${(hoverRating || rating) >= star
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-white/10'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute top-4 right-4 text-emerald-500">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="اكتب رأيك في المادة التعليمية والمنصة بشكل عام..."
                                className="w-full h-32 bg-black/40 border border-white/10 rounded-[1.5rem] pr-12 pl-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none text-right font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-2 justify-center text-xs text-gray-500 mb-2">
                            <Globe className="w-3 h-3" />
                            <span>سيظهر اسمك ({user?.name}) وبلدك مع تعليقك للجميع.</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                            className={`
                                w-full py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 transition-all transform shadow-xl
                                ${isSubmitting || rating === 0
                                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:scale-[1.02] active:scale-95'}
                            `}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>إرسال التقييم</span>
                                    <Send className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    <p className="mt-8 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        Muslim Youth Forum Feedback System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default memo(RatingModal);
