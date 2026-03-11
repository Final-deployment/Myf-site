import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';

interface AuthProps {
  initialView: 'login' | 'signup';
  onLoginSuccess: () => void;
  onBack: () => void;
  onToggleView: (view: 'login' | 'signup') => void;
  onVerificationRequired?: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ initialView, onLoginSuccess, onBack, onToggleView, onVerificationRequired }) => {
  const { login } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Attempt Login
    if (initialView === 'login') {
      try {
        const success = await login(email, password);
        if (success) {
          onLoginSuccess();
        } else {
          // Fallback or error handling
          setIsLoading(false);
          toast.error('بيانات الدخول غير صحيحة');
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const error = err as { needsVerification?: boolean; email?: string; messageAr?: string };
        if (error.needsVerification && onVerificationRequired) {
          onVerificationRequired(error.email || email);
        } else {
          toast.error(error.messageAr || 'حدث خطأ أثناء تسجيل الدخول');
        }
      }
    } else {
      // Signup Simulation
      setTimeout(() => {
        setIsLoading(false);
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'student';
        // For signup we might want to auto-login too, but for now just callback
        onLoginSuccess();
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-3xl font-bold text-white mb-2">
            {initialView === 'login' ? 'أهلاً بعودتك' : 'انضم إلينا'}
          </h2>
          <p className="text-gray-400 text-sm">
            {initialView === 'login'
              ? 'استكمل رحلتك المعرفية في المصطبة العلمية'
              : 'ابدأ رحلة العلم والبناء المعرفي اليوم'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {initialView === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-400 mr-2">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="أحمد محمد"
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <User className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400 mr-2">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com (use 'admin' for admin view)"
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Mail className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 mr-2">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {initialView === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300">
                <div className="w-4 h-4 rounded border border-gray-600 flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500">
                  <input type="checkbox" className="hidden" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                </div>
                <span>تذكرني</span>
              </label>
              <a href="#" className="text-gold-500 hover:text-gold-400">نسيت كلمة المرور؟</a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 mt-4 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>{initialView === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            {initialView === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button
              onClick={() => onToggleView(initialView === 'login' ? 'signup' : 'login')}
              className="text-emerald-400 hover:text-emerald-300 font-bold mr-2 underline decoration-emerald-500/30 underline-offset-4"
            >
              {initialView === 'login' ? 'سجل الآن' : 'سجل دخولك'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;
