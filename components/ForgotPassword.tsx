import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertTriangle, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.forgotPassword(email);
      if (!response.success) {
        throw new Error(response.error || 'Failed to send OTP');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء الاتصال' : 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(language === 'ar' ? 'يجب تعبئة جميع الحقول' : 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.resetPassword(email, otp, newPassword);
      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء إجراء التغيير' : 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] text-center animate-fade-in border border-white/20 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {language === 'ar' ? 'تم تعيين كلمة المرور بنجاح!' : 'Password Reset Successful!'}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {language === 'ar' 
              ? 'لقد تم تغيير كلمة المرور الخاصة بك بنجاح، يمكنك الآن تسجيل الدخول.'
              : 'Your password has been changed successfully. You can now login.'}
          </p>
          
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
          onClick={() => step === 2 ? setStep(1) : onBack()}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{language === 'ar' ? 'العودة' : 'Back'}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 1 ? <Mail className="w-8 h-8 text-gold-400" /> : <KeyRound className="w-8 h-8 text-gold-400" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 
              ? (language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Your Password?')
              : (language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password')
            }
          </h2>
          <p className="text-gray-400 text-sm px-4">
            {step === 1
              ? (language === 'ar'
                ? 'أدخل بريدك الإلكتروني لكي نرسل لك رمزاً لاستعادة الوصول لحسابك'
                : 'Enter your email to receive a password reset code')
              : (language === 'ar'
                ? 'أدخل الرمز الذي أرسلناه إلى بريدك الإلكتروني وقم بتعيين كلمة المرور الجديدة'
                : 'Enter the code sent to your email and set your new password')
            }
          </p>
          {step === 2 && (
             <p className="text-emerald-400 font-medium text-sm mt-2">{email}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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
                <span>{language === 'ar' ? 'إرسال الرمز' : 'Send Code'}</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* OTP Field */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 mr-2">
                {language === 'ar' ? 'رمز التحقق (OTP)' : 'Verification Code'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  placeholder="123456"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-4 pl-4 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 mr-2">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Lock className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-3.5 text-gray-400 hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400 mr-2">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <Lock className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 mt-6 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <span>{language === 'ar' ? 'تعيين كلمة المرور' : 'Set Password'}</span>
              )}
            </button>
          </form>
        )}

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
