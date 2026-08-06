import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, GraduationCap, MessageCircle } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Scroll helper if on landing page, otherwise navigate to '/' with section hash
  const handleNavClick = (sectionId: string, path: string) => {
    if (sectionId === 'articles') {
      navigate('/articles');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  // Determine active tab for styling
  const isActive = (tabKey: string) => {
    if (tabKey === 'articles' && location.pathname.startsWith('/articles')) return true;
    if (tabKey === 'home' && location.pathname === '/' && !location.hash) return true;
    return false;
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-xl px-3 py-2 flex justify-around items-center transition-colors duration-300 pb-safe ${
        theme === 'day' 
          ? 'bg-white/95 text-slate-800 border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.08)]' 
          : 'bg-[#0a192f]/95 text-slate-100 border-t border-white/10 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* 1. الرئيسية */}
      <button 
        onClick={() => handleNavClick('hero', '/')} 
        className={`flex flex-col items-center gap-1 text-xs transition-transform active:scale-95 ${
          isActive('home') 
            ? 'text-[#d4a045] font-bold' 
            : theme === 'day' ? 'text-slate-600 hover:text-[#d4a045]' : 'opacity-80 hover:opacity-100 hover:text-[#d4a045]'
        }`}
      >
        <Home size={20} />
        <span>الرئيسية</span>
      </button>

      {/* 2. المبادرات */}
      <button 
        onClick={() => handleNavClick('initiatives', '/')} 
        className={`flex flex-col items-center gap-1 text-xs transition-transform active:scale-95 ${
          theme === 'day' ? 'text-slate-600 hover:text-[#d4a045]' : 'opacity-80 hover:opacity-100 hover:text-[#d4a045]'
        }`}
      >
        <Compass size={20} />
        <span>المبادرات</span>
      </button>

      {/* 3. المقالات */}
      <button 
        onClick={() => handleNavClick('articles', '/articles')} 
        className={`flex flex-col items-center gap-1 text-xs transition-transform active:scale-95 ${
          isActive('articles') 
            ? 'text-[#d4a045] font-bold' 
            : theme === 'day' ? 'text-slate-600 hover:text-[#d4a045]' : 'opacity-80 hover:opacity-100 hover:text-[#d4a045]'
        }`}
      >
        <BookOpen size={20} />
        <span>المقالات</span>
      </button>

      {/* 4. المصطبة (دخول منصة المصطبة) */}
      <button 
        onClick={() => {
          navigate('/login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
        className={`flex flex-col items-center gap-1 text-xs transition-transform active:scale-95 ${
          location.pathname === '/login'
            ? 'text-[#d4a045] font-bold'
            : theme === 'day' ? 'text-slate-600 hover:text-[#d4a045]' : 'opacity-80 hover:opacity-100 hover:text-[#d4a045]'
        }`}
      >
        <GraduationCap size={20} />
        <span>المصطبة</span>
      </button>

      {/* 5. تواصل معنا (Standard Clean Tab - No fake pressed down box) */}
      <button 
        onClick={() => handleNavClick('contact', '/')} 
        className={`flex flex-col items-center gap-1 text-xs transition-transform active:scale-95 ${
          theme === 'day' ? 'text-slate-600 hover:text-[#d4a045]' : 'opacity-80 hover:opacity-100 hover:text-[#d4a045]'
        }`}
      >
        <MessageCircle size={20} />
        <span>تواصل معنا</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
