import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Globe, Calendar, GraduationCap, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';

interface RegistrationFormProps {
    onBack: () => void;
    onSuccess: (email: string) => void;
}

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

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack, onSuccess }) => {
    const { language, t } = useLanguage();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        nameEn: '',
        email: '',
        password: '',
        confirmPassword: '',
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
        if (!formData.name.trim()) {
            setError(language === 'ar' ? 'يرجى إدخال الاسم' : 'Please enter your name');
            return false;
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
            return false;
        }
        if (!formData.whatsapp.trim()) {
            setError(language === 'ar' ? 'يرجى إدخال رقم الواتساب' : 'Please enter your WhatsApp number');
            return false;
        }
        if (!formData.country) {
            setError(language === 'ar' ? 'يرجى اختيار الدولة' : 'Please select your country');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.age || parseInt(formData.age) < 5 || parseInt(formData.age) > 100) {
            setError(language === 'ar' ? 'يرجى إدخال عمر صحيح' : 'Please enter a valid age');
            return false;
        }
        if (!formData.gender) {
            setError(language === 'ar' ? 'يرجى اختيار الجنس' : 'Please select your gender');
            return false;
        }
        if (!formData.educationLevel) {
            setError(language === 'ar' ? 'يرجى اختيار المستوى التعليمي' : 'Please select education level');
            return false;
        }
        if (!formData.password || formData.password.length < 6) {
            setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setIsLoading(true);
        setError('');

        try {
            const { user, error: regError } = await api.register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                nameEn: formData.nameEn || formData.name,
                whatsapp: formData.whatsapp,
                country: formData.country,
                age: parseInt(formData.age),
                gender: formData.gender,
                educationLevel: formData.educationLevel,
            });

            if (regError) {
                throw new Error(language === 'ar' ? regError.message || 'فشل التسجيل' : regError.message || 'Registration failed');
            }

            // Store email for verification step
            localStorage.setItem('pendingVerificationEmail', formData.email);
            onSuccess(formData.email);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                >
                    {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    <span>{language === 'ar' ? 'العودة' : 'Back'}</span>
                </button>

                {/* Header */}
                <div className="text-center mb-6 mt-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {language === 'ar' ? 'سجل اهتمامك' : 'Register Your Interest'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {language === 'ar'
                            ? 'انضم إلى المصطبة العلمية وابدأ رحلة التعلم'
                            : 'Join Scientific Bench and start your learning journey'}
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        1
                    </div>
                    <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-700'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        2
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 && (
                        <>
                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        placeholder={language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohamed'}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <User className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <Mail className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={formData.whatsapp}
                                        onChange={(e) => updateField('whatsapp', e.target.value)}
                                        placeholder="+966 5XX XXX XXXX"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <Phone className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Country */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'الدولة' : 'Country'}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.country}
                                        onChange={(e) => updateField('country', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                    >
                                        <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                                        {COUNTRIES.map((c, i) => (
                                            <option key={i} value={language === 'ar' ? c.ar : c.en}>
                                                {language === 'ar' ? c.ar : c.en}
                                            </option>
                                        ))}
                                    </select>
                                    <Globe className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Next Button */}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg mt-4 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                            >
                                <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                                {language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* Age */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'العمر' : 'Age'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="5"
                                        max="100"
                                        value={formData.age}
                                        onChange={(e) => updateField('age', e.target.value)}
                                        placeholder={language === 'ar' ? '25' : '25'}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <Calendar className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'الجنس' : 'Gender'}
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-colors ${formData.gender === 'male' ? 'bg-emerald-600/30 border-emerald-500' : 'bg-black/30 border-white/10 hover:border-white/30'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={(e) => updateField('gender', e.target.value)}
                                            className="hidden"
                                        />
                                        <span className="text-white">{language === 'ar' ? 'ذكر' : 'Male'}</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-colors ${formData.gender === 'female' ? 'bg-emerald-600/30 border-emerald-500' : 'bg-black/30 border-white/10 hover:border-white/30'}`}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={(e) => updateField('gender', e.target.value)}
                                            className="hidden"
                                        />
                                        <span className="text-white">{language === 'ar' ? 'أنثى' : 'Female'}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Education Level */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'المستوى التعليمي' : 'Education Level'}
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.educationLevel}
                                        onChange={(e) => updateField('educationLevel', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                    >
                                        <option value="">{language === 'ar' ? 'اختر المستوى' : 'Select Level'}</option>
                                        {EDUCATION_LEVELS.map((l, i) => (
                                            <option key={i} value={language === 'ar' ? l.ar : l.en}>
                                                {language === 'ar' ? l.ar : l.en}
                                            </option>
                                        ))}
                                    </select>
                                    <GraduationCap className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <Lock className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 mr-2">
                                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                    <Lock className="absolute right-4 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    {language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                                    <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>{language === 'ar' ? 'تسجيل' : 'Register'}</span>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default RegistrationForm;
