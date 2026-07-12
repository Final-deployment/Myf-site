import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthProps {
  onLoginSuccess: () => void;
  onProfileRequired?: () => void;
}

const GOOGLE_CLIENT_ID = '443270122580-d70le861ut6n6p64mka528tsfj20jadu.apps.googleusercontent.com';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onProfileRequired }) => {
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gisReady, setGisReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef<((response: any) => void) | null>(null);

  // Old login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldLogin, setShowOldLogin] = useState(false);

  // Store callback in ref so GIS doesn't capture stale closure
  callbackRef.current = async (response: any) => {
    if (!response.credential) {
      setError('لم يتم الحصول على بيانات من جوجل');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(response.credential);
      if (result.success) {
        if (result.profileCompleted) {
          onLoginSuccess();
        } else {
          onProfileRequired ? onProfileRequired() : navigate('/complete-profile');
        }
      } else {
        setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } catch {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') return;

    const initGIS = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGIS, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp: any) => callbackRef.current?.(resp),
        auto_select: false,
        itp_support: true,
        use_fedcm_for_prompt: true,
      });

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: 350,
          locale: 'ar',
        });
      }
      setGisReady(true);
    };

    initGIS();
  }, []);

  // ─── Old Email/Password Login Handler ───
  const handleOldLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const success = await login(email, password, true);
      if (success) {
        onLoginSuccess();
      } else {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors";
  const hasClientId = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">

        {/* Logo & Welcome */}
        <div className="text-center mb-8 mt-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-5 shadow-lg shadow-emerald-900/30">
            <span className="text-3xl font-bold text-white">م</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">المصطبة العلمية</h2>
          <p className="text-gray-400 text-sm">ابدأ رحلتك المعرفية</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-gray-400 text-sm">جارٍ تسجيل الدخول...</p>
          </div>
        )}

        {!isLoading && (
          <div className="flex flex-col items-center gap-5">

            {/* ══════ Google One Tap Button (Real GIS) ══════ */}
            {hasClientId ? (
              <>
                <p className="text-gray-400 text-xs">سجّل دخولك بنقرة واحدة</p>
                <div
                  ref={googleButtonRef}
                  className="flex justify-center"
                  style={{ minHeight: 44 }}
                />
                {!gisReady && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ تحميل خدمة جوجل...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                <p className="text-yellow-300 text-xs">
                  تسجيل الدخول بجوجل غير مُفعّل — يرجى تعيين GOOGLE_CLIENT_ID في ملف .env
                </p>
              </div>
            )}

            {/* ══════ Divider ══════ */}
            <div className="w-full flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-gray-500 text-xs">أو</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* ══════ Old Login Toggle ══════ */}
            {!showOldLogin ? (
              <button
                onClick={() => setShowOldLogin(true)}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>الدخول بالبريد وكلمة المرور (للمسجلين سابقاً)</span>
              </button>
            ) : (
              <form onSubmit={handleOldLogin} className="w-full space-y-4 animate-fade-in">
                <p className="text-gray-400 text-xs text-center">للمسجلين سابقاً فقط</p>

                <div className="relative">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="البريد الإلكتروني"
                    className={inputClass}
                    autoComplete="email"
                  />
                  <Mail className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="كلمة المرور"
                    className={inputClass}
                    autoComplete="current-password"
                  />
                  <Lock className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-3.5 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.01]"
                >
                  تسجيل الدخول
                </button>

                <button
                  type="button"
                  onClick={() => { setShowOldLogin(false); setError(''); }}
                  className="w-full text-gray-500 hover:text-gray-400 text-xs transition-colors"
                >
                  العودة لتسجيل الدخول بجوجل
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 mb-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-gray-500 text-xs">منصة آمنة للتعلم الشرعي</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للصفحة الرئيسية</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Auth;
