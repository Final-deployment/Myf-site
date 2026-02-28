import React from 'react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="font-sans text-white min-h-screen w-full relative flex flex-col">

      {/* BEGIN: Top Bar */}
      <header className="relative z-10 flex justify-between items-center px-6 py-4 md:px-12 md:py-6 w-full">
        {/* Right: Brand Name (First in RTL) */}
        <div className="flex items-center gap-3 text-white">
          <img
            src="https://github.com/NinjaWorld1234/Files/blob/main/myf%20LOGO.jpg?raw=true"
            alt="Muslim Youth Forum Logo"
            className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md object-cover"
          />
          <span className="text-xl font-bold tracking-wide">{t('landing.brandName')}</span>
        </div>

        {/* Left: Actions (Theme + Language) */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 text-white/70 hover:text-yellow-400"
            title={theme === 'day' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            {theme === 'day' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Language Switcher */}
          <div className="glass-panel rounded-full px-1 py-1 flex items-center gap-1">
            <button
              onClick={() => setLanguage('en')}
              className={`text-sm font-medium px-3 py-1.5 transition ${language === 'en' ? 'bg-accent-gold text-black font-bold rounded-full shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`text-sm font-medium px-3 py-1.5 transition ${language === 'ar' ? 'bg-accent-gold text-black font-bold rounded-full shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              عربي
            </button>
          </div>
        </div>
      </header>
      {/* END: Top Bar */}

      {/* BEGIN: Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-grow w-full px-4 py-6 md:py-12 overflow-y-auto">
        {/* Glassmorphism Card */}
        <div className="glass-panel-heavy rounded-3xl p-5 md:p-12 w-full max-w-3xl flex flex-col items-center text-center shadow-2xl border-t border-white/30" data-purpose="main-card">
          {/* Card Language Toggle (Responsive positioning) */}
          <div className="absolute -top-4 right-4 md:-top-5 md:right-8 glass-panel rounded-full px-1 py-1 flex items-center gap-1 border border-white/30 bg-[#4a7266]">
            <button
              onClick={() => setLanguage('ar')}
              className={`px-3 text-sm font-medium transition ${language === 'ar' ? 'text-white' : 'text-white/60'}`}
            >
              عربي
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`text-sm font-bold px-3 py-1 rounded-full transition ${language === 'en' ? 'bg-[#d4a045] text-white' : 'text-white/60'}`}
            >
              EN
            </button>
          </div>
          {/* Logo Container */}
          <div className="logo-box overflow-hidden bg-[#033a2c] relative rounded-full">
            <img
              src="https://github.com/NinjaWorld1234/Files/blob/main/myf%20LOGO.jpg?raw=true"
              alt="Muslim Youth Forum Logo"
              className="w-full h-full object-cover transform scale-110"
            />
          </div>
          {/* Text Content */}
          <h1 className="font-bold text-white mb-1 text-[1.4rem] md:text-[1.8rem]">{t('landing.brandName')}</h1>
          <h2 className="text-white/70 font-medium mb-4 md:mb-6 text-sm md:text-[1.1rem]">{t('landing.subtitle')}</h2>
          <div className="mb-4 md:mb-6">
            <h3 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gradient-gold mb-2 leading-tight font-cairo py-2">{t('landing.comingSoon')}</h3>
          </div>
          <p className="text-[#e0e0e0] text-sm md:text-lg leading-relaxed max-w-lg mb-10 text-center">
            {t('landing.description')}
          </p>
          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center justify-center">
            {/* Register Interest Button (Right in RTL - Gold) */}
            <button
              onClick={onSignupClick}
              className="bg-gradient-to-r from-[#d4a045] to-[#b8860b] hover:brightness-110 text-black font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-3 transition-transform transform hover:scale-105 active:scale-95 w-full md:w-auto justify-center group"
            >
              <span>{t('landing.registerInterest')}</span>
              <i className={`fas ${language === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} group-hover:${language === 'ar' ? '-translate-x-1' : 'translate-x-1'} transition-transform`}></i>
            </button>
            {/* Member Login Button (Left in RTL - Dark Green) */}
            <button
              onClick={onLoginClick}
              className="bg-[#0b3b32] hover:bg-[#14463a] border border-white/10 text-white font-medium py-3 px-8 rounded-full shadow-lg flex items-center gap-3 transition-all w-full md:w-auto justify-center backdrop-blur-sm"
            >
              <span>{t('landing.memberLogin')}</span>
              <i className="fas fa-sign-in-alt"></i>
            </button>
          </div>
        </div>

        {/* Small hint text below card */}
      </main>
      {/* END: Main Content */}

      {/* BEGIN: Footer */}
      <footer className="relative w-full z-10 mt-auto">
        {/* SVG Curved Notch */}
        <svg
          className="absolute bottom-full left-0 w-full h-12 md:h-16"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Deep organic curve with smooth wave */}
          <path
            d="M0,60 L0,35 C40,35 80,35 120,35 C150,35 165,45 185,55 Q200,62 215,55 C235,45 250,35 280,35 C320,35 360,35 400,35 L400,60 Z"
            fill="rgba(255, 255, 255, 0.02)"
            className="backdrop-blur-sm"
          />
          {/* Subtle highlight on the curve edge */}
          <path
            d="M120,35 C150,35 165,45 185,55 Q200,62 215,55 C235,45 250,35 280,35"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        </svg>
        {/* Footer Content */}
        <div className="relative bg-white/[0.03] backdrop-blur-md px-6 py-4 border-t border-white/10">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 w-full text-xs text-white/60">
            {/* Right side (Start in RTL): Copyright */}
            <div>Muslim Youth Forum © 2024</div>
            {/* Left side (End in RTL): Social Icons */}
            <div className="flex items-center gap-3">
              <a className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition text-white" href="#">
                <i className="fab fa-youtube"></i>
              </a>
              <a className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition text-white" href="#">
                <i className="fas fa-camera"></i>
              </a>
              <a className="bg-white/10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition text-white" href="#">
                <i className="fas fa-globe"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* END: Footer */}
    </div>
  );
};

export default LandingPage;