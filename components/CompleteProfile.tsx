import React, { useState } from 'react';
import { User, Phone, Globe, Calendar, GraduationCap, ChevronLeft, ChevronRight, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

// Country list
const COUNTRIES = [
    { ar: 'مصر', en: 'Egypt' },
    { ar: 'السعودية', en: 'Saudi Arabia' },
    { ar: 'الإمارات', en: 'UAE' },
    { ar: 'الكويت', en: 'Kuwait' },
    { ar: 'قطر', en: 'Qatar' },
    { ar: 'البحرين', en: 'Bahrain' },
    { ar: 'عمان', en: 'Oman' },
    { ar: 'الأردن', en: 'Jordan' },
    { ar: 'لبنان', en: 'Lebanon' },
    { ar: 'سوريا', en: 'Syria' },
    { ar: 'العراق', en: 'Iraq' },
    { ar: 'فلسطين', en: 'Palestine' },
    { ar: 'اليمن', en: 'Yemen' },
    { ar: 'ليبيا', en: 'Libya' },
    { ar: 'تونس', en: 'Tunisia' },
    { ar: 'الجزائر', en: 'Algeria' },
    { ar: 'المغرب', en: 'Morocco' },
    { ar: 'السودان', en: 'Sudan' },
    { ar: 'الصومال', en: 'Somalia' },
    { ar: 'تركيا', en: 'Turkey' },
    { ar: 'ماليزيا', en: 'Malaysia' },
    { ar: 'إندونيسيا', en: 'Indonesia' },
    { ar: 'باكستان', en: 'Pakistan' },
    { ar: 'الهند', en: 'India' },
    { ar: 'بريطانيا', en: 'United Kingdom' },
    { ar: 'أمريكا', en: 'United States' },
    { ar: 'كندا', en: 'Canada' },
    { ar: 'أستراليا', en: 'Australia' },
    { ar: 'ألمانيا', en: 'Germany' },
    { ar: 'فرنسا', en: 'France' },
    { ar: 'أخرى', en: 'Other' },
];

const EDUCATION_LEVELS = [
    { ar: 'ابتدائي', en: 'Primary' },
    { ar: 'متوسط', en: 'Middle School' },
    { ar: 'ثانوي', en: 'High School' },
    { ar: 'جامعي', en: 'University' },
    { ar: 'دراسات عليا', en: 'Postgraduate' },
    { ar: 'أخرى', en: 'Other' },
];

const CompleteProfile: React.FC = () => {
    const { user, completeUserProfile, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        nameEn: user?.nameEn || '',
        whatsapp: '',
        country: '',
        age: '',
        gender: '',
        educationLevel: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep1 = () => {
        if (!formData.name.trim()) { setError('يرجى إدخال الاسم'); return false; }
        if (!formData.whatsapp.trim()) { setError('يرجى إدخال رقم الواتساب'); return false; }
        if (!formData.country) { setError('يرجى اختيار الدولة'); return false; }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.age || parseInt(formData.age) < 5 || parseInt(formData.age) > 100) { setError('يرجى إدخال عمر صحيح'); return false; }
        if (!formData.gender) { setError('يرجى اختيار الجنس'); return false; }
        if (!formData.educationLevel) { setError('يرجى اختيار المستوى التعليمي'); return false; }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;
        setIsLoading(true);
        setError('');

        try {
            const success = await completeUserProfile(formData);
            if (success) {
                toast.success('تم حفظ بياناتك بنجاح! مرحباً بك في المصطبة العلمية');
                navigate('/dashboard');
            } else {
                setError('فشل حفظ البيانات. يرجى المحاولة مرة أخرى.');
            }
        } catch {
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors";
    const selectClass = "w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-6 mt-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">أكمل بياناتك الشخصية</h2>
                    <p className="text-gray-400 text-sm">هذه الخطوة مطلوبة مرة واحدة فقط للانضمام للمصطبة العلمية</p>

                    {/* User email from Google */}
                    {user?.email && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-xs">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{user.email}</span>
                        </div>
                    )}
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>1</div>
                    <div className={`w-12 h-0.5 transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>2</div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-center">
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* ======= Step 1: Basic Info ======= */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Name (Arabic) */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">الاسم الكامل (عربي)</label>
                                <div className="relative">
                                    <input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder="أدخل اسمك الكامل" className={inputClass} />
                                    <User className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Name (English) */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">الاسم (إنجليزي) - اختياري</label>
                                <div className="relative">
                                    <input type="text" dir="ltr" value={formData.nameEn} onChange={e => updateField('nameEn', e.target.value)} placeholder="Full Name (English)" className={inputClass} />
                                    <User className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">رقم الواتساب</label>
                                <div className="relative">
                                    <input type="tel" dir="ltr" value={formData.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} placeholder="+970 5XX XXX XXX" className={inputClass} />
                                    <Phone className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Country */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">الدولة</label>
                                <div className="relative">
                                    <select value={formData.country} onChange={e => updateField('country', e.target.value)} className={selectClass}>
                                        <option value="">اختر الدولة</option>
                                        {COUNTRIES.map(c => (
                                            <option key={c.en} value={c.ar}>{c.ar}</option>
                                        ))}
                                    </select>
                                    <Globe className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Next Button */}
                            <button type="button" onClick={handleNext}
                                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 mt-2 transition-all hover:scale-[1.01] flex items-center justify-center gap-2">
                                <span>التالي</span>
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* ======= Step 2: Additional Info ======= */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Age */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">العمر</label>
                                <div className="relative">
                                    <input type="number" min="5" max="100" value={formData.age} onChange={e => updateField('age', e.target.value)} placeholder="مثال: 25" className={inputClass} />
                                    <Calendar className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">الجنس</label>
                                <div className="flex gap-3">
                                    {[{ value: 'male', label: 'ذكر' }, { value: 'female', label: 'أنثى' }].map(g => (
                                        <button key={g.value} type="button"
                                            onClick={() => updateField('gender', g.value)}
                                            className={`flex-1 py-3.5 rounded-xl border text-sm font-medium transition-all ${formData.gender === g.value ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Education Level */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">المستوى التعليمي</label>
                                <div className="relative">
                                    <select value={formData.educationLevel} onChange={e => updateField('educationLevel', e.target.value)} className={selectClass}>
                                        <option value="">اختر المستوى</option>
                                        {EDUCATION_LEVELS.map(l => (
                                            <option key={l.en} value={l.ar}>{l.ar}</option>
                                        ))}
                                    </select>
                                    <GraduationCap className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={() => setStep(1)}
                                    className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all flex items-center justify-center gap-2">
                                    <ChevronRight className="w-5 h-5" />
                                    <span>السابق</span>
                                </button>
                                <button type="submit" disabled={isLoading}
                                    className="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>حفظ والدخول</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* Back to Landing */}
                <div className="mt-6 text-center">
                    <button
                        onClick={async () => {
                            await logout();
                            navigate('/');
                        }}
                        className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span>العودة للصفحة الرئيسية</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
