/**
 * @fileoverview Sidebar navigation component with role-based menu items
 * @module components/Sidebar
 */

import React, { memo, useCallback, useMemo } from 'react';
import { LayoutDashboard, BookOpen, GraduationCap, Users, Settings, LogOut, Award, BarChart3, Mic2, User, Calendar, Bell, Heart, TrendingUp, Search, FolderOpen, Megaphone, ClipboardList, Activity, Database, MessageSquare, LucideIcon } from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from './LanguageContext';

/**
 * Sidebar component props
 */
interface SidebarProps {
  /** Currently active tab ID */
  activeTab: string;
  /** Callback to change the active tab */
  setActiveTab: (tab: string) => void;
  /** Callback to preload route code */
  onPreload?: (tabId: string) => void;
  /** Callback when user logs out */
  onLogout: () => void;
  /** User's role (student or admin) */
  role: UserRole;
  /** Number of unread messages */
  unreadMessagesCount?: number;
}

/**
 * Menu item interface
 */
interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label for the menu item */
  label: string;
  /** Optional badge count */
  badgeCount?: number;
}

/**
 * Navigation item component for sidebar menu
 */
const NavItem = memo<{
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
  onHover?: () => void;
  language: string;
}>(({ item, isActive, onClick, onHover, language }) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }, [onClick]);

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
        ? `bg-gradient-to-r ${language === 'ar' ? 'from-teal-800/90 to-transparent border-r-4' : 'from-transparent to-teal-800/90 border-l-4'} text-white border-gold-500 shadow-md`
        : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
        }`}
      role="menuitem"
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gold-500/10 mix-blend-overlay" aria-hidden="true"></div>
      )}
      <item.icon
        className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-gold-400' : 'text-emerald-200 group-hover:text-white'}`}
        aria-hidden="true"
      />
      <span className={`font-medium relative z-10 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
      {item.badgeCount && item.badgeCount > 0 && (
        <span className="absolute left-4 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
          {item.badgeCount}
        </span>
      )}
    </button>
  );
});
NavItem.displayName = 'NavItem';

/**
 * Sidebar component - Main navigation for the application
 * 
 * Features:
 * - Role-based menu items (student vs admin)
 * - RTL/LTR support
 * - Keyboard navigation
 * - ARIA accessibility attributes
 * 
 * @param props - Sidebar props
 * @returns Sidebar component
 */
const Sidebar: React.FC<SidebarProps> = memo(({ activeTab, setActiveTab, onPreload, onLogout, role, unreadMessagesCount = 0 }) => {
  const { t, language } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  /** Student navigation menu items */
  const studentItems: MenuItem[] = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { id: 'courses', icon: BookOpen, label: t('sidebar.myCourses') },
    { id: 'library', icon: GraduationCap, label: t('sidebar.library') },
    { id: 'certificates', icon: Award, label: t('sidebar.certificates') },
    { id: 'profile', icon: User, label: t('sidebar.profile') },
    { id: 'daily-tracking', icon: Calendar, label: t('sidebar.dailyTracking') },
    { id: 'notifications', icon: Bell, label: t('sidebar.notifications') },
    { id: 'favorites', icon: Heart, label: t('sidebar.favorites') },
    { id: 'progress', icon: TrendingUp, label: t('sidebar.progress') },
    { id: 'search', icon: Search, label: t('sidebar.search') },
    { id: 'messages', icon: MessageSquare, label: 'المراسلات', badgeCount: unreadMessagesCount },
  ], [t, unreadMessagesCount]);

  /** Admin navigation menu items */
  const adminItems: MenuItem[] = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: t('admin.dashboard') },
    { id: 'students', icon: Users, label: t('admin.students') },
    { id: 'audio-courses', icon: Mic2, label: t('admin.audioCourses') },
    { id: 'reports', icon: BarChart3, label: t('admin.reports') },
    { id: 'library', label: t('admin.library'), icon: BookOpen },
    { id: 'announcements', icon: Megaphone, label: t('admin.announcements') },
    { id: 'quizzes', icon: ClipboardList, label: t('admin.quizManagement') },
    { id: 'activity-log', icon: Activity, label: t('admin.activityLog') },
    { id: 'certificates', icon: Award, label: t('admin.certificatesAdmin') },
    { id: 'messages', icon: MessageSquare, label: 'المراسلات', badgeCount: unreadMessagesCount },
  ], [t, unreadMessagesCount]);

  /** Supervisor navigation menu items */
  const supervisorItems: MenuItem[] = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة المشرف' },
    { id: 'students', icon: Users, label: 'الطلاب' },
    { id: 'audio-courses', icon: Mic2, label: 'الدورات' },
    { id: 'messages', icon: MessageSquare, label: 'المراسلات', badgeCount: unreadMessagesCount },
    { id: 'profile', icon: User, label: t('sidebar.profile') },
    { id: 'notifications', icon: Bell, label: t('sidebar.notifications') },
  ], [t, unreadMessagesCount]);

  /** Get menu items based on user role */
  const menuItems = useMemo(() => {
    if (role === 'admin') return adminItems;
    if (role === 'supervisor') return supervisorItems;
    return studentItems;
  }, [role, adminItems, studentItems, supervisorItems]);

  /** Handle navigation item click */
  const handleNavClick = useCallback((id: string) => {
    setActiveTab(id);
  }, [setActiveTab]);

  /** Handle item hover for preloading */
  const handleNavHover = useCallback((id: string) => {
    if (onPreload) {
      onPreload(id);
    }
  }, [onPreload]);

  /** Handle settings click */
  const handleSettingsClick = useCallback(() => {
    setActiveTab('settings');
  }, [setActiveTab]);

  /** Handle logout click */
  const handleLogoutClick = useCallback(() => {
    onLogout();
  }, [onLogout]);

  /** Handle keyboard navigation for settings */
  const handleSettingsKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSettingsClick();
    }
  }, [handleSettingsClick]);

  /** Handle keyboard navigation for logout */
  const handleLogoutKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLogoutClick();
    }
  }, [handleLogoutClick]);

  return (
    <>
      {/* Desktop Sidebar (Existing) */}
      <aside
        className="hidden xl:flex flex-col w-72 h-full glass-panel border-l border-white/20 relative z-20 shadow-2xl overflow-hidden bg-black/30 backdrop-blur-md"
        role="navigation"
        aria-label={role === 'admin' ? t('admin.adminPanel') : t('sidebar.mastaba')}
      >
        {/* Pattern Overlay */}
        <div className="islamic-bg absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true"></div>

        {/* Top Ornament */}
        <div
          className="absolute top-0 inset-x-0 h-32 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 20 C100 20 130 50 130 100 H70 C70 50 100 20 100 20 Z' fill='%23fbbf24'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center top',
            backgroundSize: '150%'
          }}
          aria-hidden="true"
        ></div>

        {/* Decorative Header */}
        <header className="relative pt-10 pb-6 px-6 flex flex-col items-center justify-center border-b border-white/10 z-10">
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Logo Container */}
            <div className="relative w-36 h-36 mb-5 group cursor-pointer">
              {/* Outer Glow */}
              <div className="absolute -inset-4 bg-gold-500/10 blur-xl rounded-full group-hover:bg-gold-500/20 transition-all duration-500 opacity-60" aria-hidden="true"></div>

              {/* Main Square Frame */}
              <div className="relative w-full h-full bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#064e3b] border border-gold-500/30 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/5 group-hover:border-gold-500/60 transition-colors duration-500">
                {/* Inner Decorative Border */}
                <div className="absolute inset-1.5 border border-gold-500/20 rounded-xl pointer-events-none" aria-hidden="true"></div>

                {/* Corner Ornaments */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold-400 rounded-tl-lg z-20" aria-hidden="true"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold-400 rounded-tr-lg z-20" aria-hidden="true"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold-400 rounded-bl-lg z-20" aria-hidden="true"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold-400 rounded-br-lg z-20" aria-hidden="true"></div>

                {/* Mid-Point Accents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gold-500 rotate-45 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20" aria-hidden="true"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gold-500 rotate-45 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20" aria-hidden="true"></div>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gold-500 rotate-45 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20" aria-hidden="true"></div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gold-500 rotate-45 shadow-[0_0_10px_rgba(251,191,36,0.8)] z-20" aria-hidden="true"></div>

                {/* Background Pattern */}
                <div className="absolute inset-0 mashrabiya-pattern opacity-15" aria-hidden="true"></div>

                {/* Logo Image */}
                <img
                  src="https://github.com/NinjaWorld1234/Files/blob/main/Mastaba%20LOGO.png?raw=true"
                  alt={t('sidebar.mastaba')}
                  className="relative z-10 w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                  loading="lazy"
                />
              </div>
            </div>

            <h1 className="text-xl font-bold text-white tracking-wide text-center font-serif drop-shadow-md">
              {role === 'admin' ? t('admin.adminPanel') : t('sidebar.mastaba')}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold-500/50" aria-hidden="true"></div>
              <p className="text-[10px] text-gold-300 font-medium tracking-widest uppercase shadow-black drop-shadow-sm">
                {role === 'admin' ? t('admin.adminPanel') : t('sidebar.beacon')}
              </p>
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold-500/50" aria-hidden="true"></div>
            </div>
          </div>
        </header>

        {/* Navigation Menu */}
        <nav
          className="flex-1 py-8 px-4 space-y-2 overflow-y-auto relative z-10"
          role="menu"
          aria-label="Main navigation"
        >
          {menuItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => handleNavClick(item.id)}
              onHover={() => handleNavHover(item.id)}
              language={language}
            />
          ))}
        </nav>

        {/* Footer Actions */}
        <footer className="p-6 border-t border-white/10 relative z-10 bg-black/20 backdrop-blur-sm">
          <button
            onClick={handleSettingsClick}
            onKeyDown={handleSettingsKeyDown}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-2 ${activeTab === 'settings' ? 'text-white bg-white/10 border border-white/5' : 'text-emerald-200/80 hover:text-white hover:bg-white/10'}`}
            role="menuitem"
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            aria-label={t('sidebar.settings')}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span>{t('sidebar.settings')}</span>
          </button>
          <button
            onClick={handleLogoutClick}
            onKeyDown={handleLogoutKeyDown}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-100 hover:bg-red-900/20 rounded-xl transition-colors"
            role="menuitem"
            aria-label={t('sidebar.logout')}
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span>{t('sidebar.logout')}</span>
          </button>
        </footer>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-50 px-2 pb-safe">
        {menuItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${activeTab === item.id ? 'text-gold-400' : 'text-emerald-100/60'}`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'fill-gold-400/20' : ''}`} />
            <span className="text-[9px] font-medium mt-1">{item.label}</span>
            {item.badgeCount && item.badgeCount > 0 && (
              <span className="absolute top-2 ml-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all text-emerald-100/60`}
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-1">
            <div className="w-full h-0.5 bg-current rounded-full" />
            <div className="w-full h-0.5 bg-current rounded-full" />
            <div className="w-full h-0.5 bg-current rounded-full" />
          </div>
          <span className="text-[9px] font-medium mt-1">{t('sidebar.more') === 'sidebar.more' ? 'المزيد' : t('sidebar.more')}</span>
        </button>
      </div>

      {/* Mobile Menu Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full bg-[#0a1e16] border-t border-white/20 rounded-t-3xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 pb-20">
              <h3 className="text-white font-bold text-lg mb-4 px-2">{role === 'admin' ? t('admin.adminPanel') : t('sidebar.mastaba')}</h3>
              <div className="grid grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavClick(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${activeTab === item.id
                      ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      : 'bg-white/5 border-white/5 text-emerald-100/70 hover:bg-white/10'}`}
                  >
                    <item.icon className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                    {item.badgeCount && item.badgeCount > 0 && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                <button
                  onClick={() => {
                    handleSettingsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-emerald-200/80 hover:bg-white/5 border border-transparent hover:border-white/5"
                >
                  <Settings className="w-5 h-5" />
                  <span>{t('sidebar.settings')}</span>
                </button>
                <button
                  onClick={() => {
                    handleLogoutClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-300 hover:bg-red-900/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t('sidebar.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;