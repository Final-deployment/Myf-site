/**
 * Header Component
 * 
 * Top navigation bar containing:
 * - User greeting and journey message
 * - Search bar
 * - Notification bell
 * - Theme toggle
 * - Language switcher
 * - User profile preview
 * 
 * @module components/Header
 */

import React, { memo, useCallback } from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

// ============================================================================
// Types
// ============================================================================

interface HeaderProps {
  /** Callback to change the active tab */
  setActiveTab?: (tab: string) => void;
}

// ============================================================================
// Header Component
// ============================================================================

/**
 * Main header component with navigation and user controls
 * 
 * @param setActiveTab - Optional callback for tab navigation
 */
const Header: React.FC<HeaderProps> = memo(({ setActiveTab }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  /**
   * Handles search input enter key
   */
  const handleSearch = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchValue = e.currentTarget.value.trim();
      if (searchValue) {
        // Navigate to search page with query
        setActiveTab?.('search');
      }
    }
  }, [setActiveTab]);

  /**
   * Handles notification button click
   */
  const handleNotificationClick = useCallback(() => {
    setActiveTab?.('notifications');
  }, [setActiveTab]);

  // Get user's first name for greeting
  const firstName = (user && typeof user.name === 'string' && user.name.trim())
    ? user.name.split(' ')[0]
    : (t('sidebar.student') || 'User');

  return (
    <header className="flex items-center justify-between px-6 lg:px-10 py-6 mb-2 relative z-20">
      {/* Greeting Section */}
      <div className="flex flex-col">
        <h2 className="text-xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
          {t('header.greeting')}{' '}
          <span className="text-emerald-400 text-glow truncate max-w-[100px] md:max-w-none">{firstName}</span>
          <span className="text-xl md:text-2xl" role="img" aria-label="wave">👋</span>
        </h2>
        <p className="text-sm text-gray-400">{t('header.continueJourney')}</p>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-5">
        {/* Search Bar */}
        <div className="relative hidden xl:block group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-gold-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              onKeyDown={handleSearch}
              className="w-96 bg-[#0a1815]/80 border border-white/10 rounded-full py-3 pr-12 pl-6 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all backdrop-blur-md shadow-lg"
              aria-label={t('header.searchPlaceholder')}
            />
            <Search
              className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} text-gray-400 w-5 h-5 group-hover:text-emerald-400 transition-colors`}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" aria-hidden="true" />

        {/* Notification Button */}
        <button
          onClick={handleNotificationClick}
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all relative group border border-white/10 hover:border-emerald-500/30"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          <span className="absolute top-3 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a1815]" aria-label="New notifications" />
          <span className="absolute inset-0 rounded-full border border-emerald-500/0 group-hover:border-emerald-500/20 transition-all duration-500 scale-110" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all relative group border border-white/10 hover:border-emerald-500/30"
          aria-label={theme === 'day' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'day' ? (
            <Moon className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
          ) : (
            <Sun className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
          )}
        </button>

        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" aria-hidden="true" />

        {/* Language Switcher */}
        <div
          className="flex items-center bg-[#0a1815]/60 rounded-full p-1.5 border border-white/10 backdrop-blur-md"
          role="group"
          aria-label="Language selection"
        >
          <button
            onClick={() => setLanguage('ar')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${language === 'ar'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50 font-bold'
              : 'text-gray-400 hover:text-white'
              }`}
            aria-pressed={language === 'ar'}
          >
            عربي
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${language === 'en'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50 font-bold'
              : 'text-gray-400 hover:text-white'
              }`}
            aria-pressed={language === 'en'}
          >
            EN
          </button>
        </div>

        {/* User Profile */}
        <div
          className="flex items-center gap-2 md:gap-3 pl-2 cursor-pointer group"
          onClick={() => setActiveTab?.('profile')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab?.('profile')}
          role="button"
          tabIndex={0}
          aria-label={t('sidebar.profile')}
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-gold-400 uppercase tracking-wider font-semibold">
              {user?.role === 'admin' ? t('admin.adminPanel') : t('header.studentRole')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-emerald-500 to-gold-500 relative">
            <img
              src={user?.avatar || "https://ui-avatars.com/api/?name=User+N&background=064e3b&color=fff&size=100"}
              alt={user?.name || 'User profile'}
              className="w-full h-full rounded-full object-cover border-2 border-[#0a1815]"
              loading="lazy"
            />
            <div
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a1815] rounded-full"
              aria-label="Online status"
            />
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
