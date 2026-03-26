import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { getApiUrl } from '../services/api/config';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errorAr || data.error || 'Failed');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] text-center animate-fade-in border border-white/20 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {language === 'ar' ? 'تم إرسال كلمة المرور الجديدة!' : 'New Password Sent!'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            {language === 'ar' 
              ? 'تم إرسال كلمة مرور جديدة إلى بريدك الإلكتروني'
              : 'A new password has been sent to your email'}
          </p>
          <p className="text-emerald-400 font-medium text-sm mb-6">{email}</p>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                {language === 'ar' 
                  ? 'ننصحك بتغيير كلمة المرور من الإعدادات بعد الدخول'
                  : 'We recommend changing your password from Settings after login'}
              </span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-all hover:scale-[1.01]"
          >
            {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Your Password?'}
          </h2>
          <p className="text-gray-400 text-sm">
            {language === 'ar'
              ? 'أدخل بريدك الإلكتروني وسنرسل لك كلمة مرور جديدة'
              : 'Enter your email and we\'ll send you a new password'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 mr-2">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="name@example.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
              <Mail className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 mt-4 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
              </>
            ) : (
              <span>{language === 'ar' ? 'إرسال كلمة المرور' : 'Send Password'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {language === 'ar' ? 'تذكرت كلمة المرور؟' : 'Remember your password?'}
            <button
              onClick={onBack}
              className="text-emerald-400 hover:text-emerald-300 font-bold mr-2 underline decoration-emerald-500/30 underline-offset-4"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
