import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface AdminPortalAuthProps {
  onSuccess: () => void;
}

export const AdminPortalAuth: React.FC<AdminPortalAuthProps> = ({ onSuccess }) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Validate credentials
      if ((username.trim() === 'admin_myf' || username.trim() === 'admin') && (password === 'myf_forum_2026' || password === 'admin123')) {
        sessionStorage.setItem('myf_forum_admin_auth', 'authenticated_token_2026');
        onSuccess();
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${theme === 'day' ? 'bg-slate-100 text-slate-900' : 'bg-[#061325] text-white'} font-cairo`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-[#0a192f] border-slate-800'}`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4a045] to-amber-200 mx-auto flex items-center justify-center text-black mb-4 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold font-cairo text-gradient-gold">بوابة التحقق الإدارية</h2>
          <p className={`text-xs mt-2 ${theme === 'day' ? 'text-slate-600' : 'text-slate-400'}`}>
            لوحة التحكم المخصصة لملتقى الشباب المسلم (مسار إداري آمن)
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'day' ? 'text-slate-700' : 'text-slate-300'}`}>
              اسم المستخدم الإداري
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم..."
                className={`w-full px-4 py-3 pl-10 rounded-xl border text-sm transition-all outline-none ${
                  theme === 'day'
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#d4a045]'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-[#d4a045]'
                }`}
              />
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'day' ? 'text-slate-700' : 'text-slate-300'}`}>
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 pl-10 rounded-xl border text-sm transition-all outline-none ${
                  theme === 'day'
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#d4a045]'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-[#d4a045]'
                }`}
              />
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform transform active:scale-98"
          >
            <span>{loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-500/20 pt-4">
          <p className="text-[11px] text-gray-500">الموقع الرسمي: muslimyouth.ps | جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalAuth;
