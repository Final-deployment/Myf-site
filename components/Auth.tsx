import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';

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

  // Old login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldLogin, setShowOldLogin] = useState(false);

  // ─── Handle Google OAuth2 redirect callback ───
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check for id_token in URL hash (implicit flow redirect from Google)
      const hash = window.location.hash;
      if (!hash || !hash.includes('id_token=')) return;

      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (!idToken) return;

      // Clean the URL immediately to prevent re-processing
      window.history.replaceState({}, '', '/login');

      setIsLoading(true);
      setError('');

      try {
        // Use AuthContext's loginWithGoogle to properly set user state
        const result = await loginWithGoogle(idToken);
        
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
        setError('حدث خطأ أثناء تسجيل الدخول');
      } finally {
        setIsLoading(false);
      }
    };

    handleOAuthCallback();
  }, []);

  // ─── Google Sign-In via OAuth2 Redirect (NO popup) ───
  const handleGoogleLogin = () => {
    const redirectUri = window.location.origin + '/login';
    const scope = 'openid email profile';
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${encodeURIComponent(scope)}&nonce=${nonce}&prompt=select_account`;
    
    // Full page redirect — no popup at all
    window.location.href = authUrl;
  };

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

            {/* ══════ Google Sign-In Button (Redirect — No Popup) ══════ */}
            <p className="text-gray-400 text-xs">سجّل دخولك بنقرة واحدة</p>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full bg-white hover:bg-gray-100 text-gray-800 font-medium shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span>الدخول بحساب Google</span>
            </button>

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
