import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
  onLoginSuccess: () => void;
  onVerificationRequired?: (email: string) => void;
  onForgotPassword?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onVerificationRequired, onForgotPassword }) => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password, rememberMe);

      if (success) {
        onLoginSuccess();
      } else {
        setIsLoading(false);
        toast.error('بيانات الدخول غير صحيحة');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const error = err as { needsVerification?: boolean; pendingApproval?: boolean; email?: string; messageAr?: string };

      if (error.needsVerification && onVerificationRequired) {
        onVerificationRequired(error.email || email);
      } else if (error.pendingApproval) {
        setShowPendingApproval(true);
      } else {
        toast.error(error.messageAr || 'حدث خطأ أثناء تسجيل الدخول');
      }
    }
  };

  // ====== Pending Approval Screen ======
  if (showPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            حسابك بانتظار الموافقة
          </h2>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3 text-right">
              <ShieldCheck className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-200 text-sm leading-relaxed">
                  تم إرسال طلب انتسابك وهو الآن قيد المراجعة من قبل المسؤولين.
                </p>
                <p className="text-amber-200/70 text-sm mt-2 leading-relaxed">
                  سيتم إبلاغك عبر البريد الإلكتروني فور الموافقة على طلبك.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-6">
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </div>

          <button
            onClick={() => {
              setShowPendingApproval(false);
              navigate('/');
            }}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة الدخول</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">

        <div className="text-center mb-8 mt-4">
          <h2 className="text-3xl font-bold text-white mb-2">أهلاً بعودتك</h2>
          <p className="text-gray-400 text-sm">استكمل رحلتك المعرفية في المصطبة العلمية</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 mr-2">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                autoComplete="email"
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
                autoComplete="current-password"
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300">
              <div className="w-4 h-4 rounded border border-gray-600 flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500">
                <input 
                  type="checkbox" 
                  className="hidden cursor-pointer" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {rememberMe && <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>}
              </div>
              <span>تذكرني</span>
            </label>
            <button 
              type="button"
              onClick={onForgotPassword}
              className="text-gold-500 hover:text-gold-400"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 mt-4 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            ليس لديك حساب؟
            <button
              onClick={() => navigate('/signup')}
              className="text-emerald-400 hover:text-emerald-300 font-bold mr-2 underline decoration-emerald-500/30 underline-offset-4"
            >
              سجل الآن
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;
