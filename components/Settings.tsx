/**
 * @fileoverview Settings component for user preferences and configuration
 * @module components/Settings
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { User, Bell, Lock, Globe, Moon, Save, Database, Award, Clock } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useToast } from './Toast';
import { sanitizeHTML, sanitizeEmail } from '../utils/sanitize';
import { getAuthToken } from '../services/api/auth';

import AdminBackupSettings from './AdminBackupSettings';
import PushNotificationManager from './PushNotificationManager';

/**
 * Settings nav item interface
 */
interface SettingsNavItem {
   id: string;
   label: string;
   icon: React.ComponentType<{ className?: string }>;
}

/**
 * Settings navigation item component
 */
const SettingsNavItem = memo<{
   item: SettingsNavItem;
   isActive: boolean;
   onClick: () => void;
}>(({ item, isActive, onClick }) => {
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
         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
            ? 'bg-emerald-500/10 text-emerald-400 font-medium border-r-2 border-emerald-500'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
         role="tab"
         aria-selected={isActive}
         tabIndex={0}
      >
         <item.icon className="w-5 h-5" aria-hidden="true" />
         {item.label}
      </button>
   );
});
SettingsNavItem.displayName = 'SettingsNavItem';

/**
 * Preference row component
 */
const PreferenceRow = memo<{
   icon: React.ComponentType<{ className?: string }>;
   iconBgColor: string;
   iconColor: string;
   title: string;
   subtitle: string;
   onClick?: () => void;
   rightElement?: React.ReactNode;
}>(({ icon: Icon, iconBgColor, iconColor, title, subtitle, onClick, rightElement }) => {
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
         e.preventDefault();
         onClick();
      }
   }, [onClick]);

   return (
      <div
         className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
         onClick={onClick}
         onKeyDown={handleKeyDown}
         role={onClick ? "button" : "presentation"}
         tabIndex={onClick ? 0 : -1}
         aria-label={`${title}: ${subtitle}`}
      >
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
               <Icon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
               <h5 className="font-bold text-white text-sm">{title}</h5>
               <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
         </div>
         {rightElement}
      </div>
   );
});
PreferenceRow.displayName = 'PreferenceRow';

/**
 * Toggle switch component
 */
const ToggleSwitch = memo<{
   isOn: boolean;
   isRtl: boolean;
   onToggle?: () => void;
}>(({ isOn, isRtl, onToggle }) => (
   <div
      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${isOn ? 'bg-emerald-600' : 'bg-gray-600'}`}
      role="switch"
      onClick={onToggle}
      aria-checked={isOn}
   >
      <div
         className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isOn
            ? (isRtl ? 'left-1' : 'right-1')
            : (isRtl ? 'right-1' : 'left-1')
            }`}
         aria-hidden="true"
      ></div>
   </div>
));
ToggleSwitch.displayName = 'ToggleSwitch';

/**
 * Settings component - User preferences and account configuration
 * 
 * Features:
 * - Profile information editing
 * - Language preference toggle
 * - Theme preference toggle
 * - ARIA accessibility
 * - Input sanitization
 * 
 * @returns Settings component
 */
const Settings: React.FC = memo(() => {
   const { t, language, setLanguage } = useLanguage();
   const { user, updateUser } = useAuth();
   const { theme, toggleTheme } = useTheme();
   const toast = useToast();

   const isDark = useMemo(() => theme === 'night', [theme]);
   const isRtl = useMemo(() => language === 'ar', [language]);

   // Local state for form fields
   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');
   const [email, setEmail] = useState('');
   const [activeSection, setActiveSection] = useState('profile');

   // Privacy state
   const [lastSeen, setLastSeen] = useState(true);
   const [pointsPublic, setPointsPublic] = useState(true);

   // Sync state with user data when it becomes available
   useEffect(() => {
      if (user) {
         const nameParts = user.name?.split(' ') || [];
         setFirstName(nameParts[0] || '');
         setLastName(nameParts.slice(1).join(' ') || '');
         setEmail(user.email || '');
      }
   }, [user]);

   /** Navigation items */
   const navItems: SettingsNavItem[] = useMemo(() => {
      const base = [
         { id: 'profile', label: t('settings.profile'), icon: User },
         { id: 'notifications', label: 'الإشعارات (Push)', icon: Bell },
         { id: 'privacy', label: t('settings.privacy'), icon: Lock },
      ];
      if (user?.role === 'admin') {
         base.push({ id: 'backup', label: 'النسخ الاحتياطي', icon: Database as any });
      }
      return base;
   }, [t, user?.role]);

   const handleSave = useCallback(async () => {
      // Sanitize inputs before saving
      const sanitizedFirstName = sanitizeHTML(firstName);
      const sanitizedLastName = sanitizeHTML(lastName);

      const fullName = `${sanitizedFirstName} ${sanitizedLastName}`.trim();
      
      try {
         await updateUser({ name: fullName });
         toast.success('تم حفظ الإعدادات بنجاح! ✅');
      } catch (err) {
         toast.error('حدث خطأ أثناء حفظ الإعدادات');
      }
   }, [firstName, lastName, updateUser, toast]);

   /** Handle language toggle */
   const handleLanguageToggle = useCallback(() => {
      setLanguage(language === 'ar' ? 'en' : 'ar');
   }, [language, setLanguage]);

   /** Handle theme toggle */
   const handleThemeToggle = useCallback(() => {
      toggleTheme();
   }, [toggleTheme]);

   /** Handle cancel */
   const handleCancel = useCallback(() => {
      // Reset to original values
      if (user) {
         setFirstName(user.name?.split(' ')[0] || '');
         setLastName(user.name?.split(' ')[1] || '');
         setEmail(user.email || '');
      }
   }, [user]);

   /** Handle nav item click */
   const handleNavClick = useCallback((sectionId: string) => {
      setActiveSection(sectionId);
   }, []);

   // Password Change State
   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [passwordLoading, setPasswordLoading] = useState(false);

   const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
         toast.error('كلمات المرور غير متطابقة');
         return;
      }
      if (newPassword.length < 8) {
         toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
         return;
      }

      setPasswordLoading(true);
      try {
         const token = getAuthToken();
         const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
         });

         const data = await response.json();

         if (response.ok) {
            toast.success('تم تغيير كلمة المرور بنجاح');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
         } else {
            toast.error(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
         }
      } catch (error) {
         toast.error('حدث خطأ في الاتصال');
      } finally {
         setPasswordLoading(false);
      }
   };

   return (
      <div
         className="animate-fade-in max-w-4xl mx-auto pb-10 relative"
         role="main"
         aria-label={t('settings.title')}
      >
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">{t('settings.title')}</h2>
            {activeSection !== 'backup' && (
               <div className="flex gap-4">
                  <button
                     onClick={handleCancel}
                     className="px-6 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                     {t('settings.cancel')}
                  </button>
                  <button
                     onClick={handleSave}
                     className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-xl flex items-center gap-2"
                  >
                     <Save className="w-4 h-4" />
                     {t('settings.saveChanges')}
                  </button>
               </div>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <nav
               className="glass-panel p-4 rounded-2xl h-fit sticky top-0"
               role="tablist"
               aria-label="Settings sections"
            >
               <div className="space-y-1">
                  {navItems.map((item) => (
                     <SettingsNavItem
                        key={item.id}
                        item={item}
                        isActive={activeSection === item.id}
                        onClick={() => handleNavClick(item.id)}
                     />
                  ))}
               </div>
            </nav>

            {/* Main Settings Form */}
            <div className="md:col-span-2 space-y-6" role="tabpanel">
               {activeSection === 'profile' && (
                  <>
                     {/* Profile Section */}
                     <section className="glass-panel p-8 rounded-3xl" aria-label={t('settings.personalInfo')}>
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                           {t('settings.personalInfo')}
                        </h3>

                        <div className="flex items-center gap-6 mb-8">
                           <div className="w-20 h-20 rounded-full bg-gray-700 relative overflow-hidden">
                              <img
                                 src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=064e3b&color=fff&size=100"}
                                 alt="Profile"
                                 className="w-full h-full object-cover"
                                 loading="lazy"
                              />
                              <div
                                 className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                 role="button"
                                 tabIndex={0}
                                 aria-label={t('settings.changePhoto')}
                              >
                                 <span className="text-[10px] text-white">{t('settings.changePhoto')}</span>
                              </div>
                           </div>
                           <div>
                              <h4 className="text-lg font-bold text-white">{firstName} {lastName}</h4>
                              <p className="text-sm text-gray-400">{t('settings.studentAdvanced')}</p>
                           </div>
                        </div>

                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" onSubmit={(e) => e.preventDefault()}>
                           <div className="space-y-2">
                              <label htmlFor="firstName" className="text-sm text-gray-400">
                                 {t('settings.firstName')}
                              </label>
                              <input
                                 id="firstName"
                                 type="text"
                                 value={firstName}
                                 onChange={(e) => setFirstName(e.target.value)}
                                 className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                 aria-label={t('settings.firstName')}
                              />
                           </div>
                           <div className="space-y-2">
                              <label htmlFor="lastName" className="text-sm text-gray-400">
                                 {t('settings.lastName')}
                              </label>
                              <input
                                 id="lastName"
                                 type="text"
                                 value={lastName}
                                 onChange={(e) => setLastName(e.target.value)}
                                 className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                 aria-label={t('settings.lastName')}
                              />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <label htmlFor="email" className="text-sm text-gray-400">
                                 {t('settings.email')} <span className="text-xs text-gray-500">(غير قابل للتعديل)</span>
                              </label>
                              <div className="relative">
                                 <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                                    aria-label={t('settings.email')}
                                 />
                                 <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                              </div>
                           </div>
                        </form>
                     </section>

                     {/* Preferences */}
                     <section className="glass-panel p-8 rounded-3xl" aria-label={t('settings.appPreferences')}>
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                           {t('settings.appPreferences')}
                        </h3>

                        <div className="space-y-4">
                           <PreferenceRow
                              icon={Globe}
                              iconBgColor="bg-blue-500/10"
                              iconColor="text-blue-400"
                              title={t('settings.language')}
                              subtitle={language === 'ar' ? 'العربية' : 'English'}
                              onClick={handleLanguageToggle}
                              rightElement={
                                 <span className="text-sm text-emerald-400">تغيير</span>
                              }
                           />

                           <PreferenceRow
                              icon={Moon}
                              iconBgColor="bg-purple-500/10"
                              iconColor="text-purple-400"
                              title={t('settings.theme')}
                              subtitle={isDark ? 'الوضع الليلي' : 'الوضع النهاري'}
                              onClick={handleThemeToggle}
                              rightElement={<ToggleSwitch isOn={isDark} isRtl={isRtl} onToggle={handleThemeToggle} />}
                           />
                        </div>
                     </section>
                  </>
               )}

               {activeSection === 'notifications' && (
                  <section className="glass-panel p-8 rounded-3xl animate-slide-up" aria-label="الإشعارات (Push)">
                     <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                        إعدادات الإشعارات
                     </h3>
                     <PushNotificationManager />
                  </section>
               )}

               {activeSection === 'privacy' && (
                  <section className="glass-panel p-8 rounded-3xl animate-slide-up">
                     <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">الخصوصية والأمان</h3>
                     <div className="space-y-4">
                        <PreferenceRow
                           icon={Lock} iconBgColor="bg-red-500/10" iconColor="text-red-400"
                           title="تغيير كلمة المرور" subtitle="تغيير كلمة المرور الخاصة بحسابك"
                           onClick={() => setShowPasswordModal(true)}
                           rightElement={<span className="text-xs text-emerald-400">تعديل</span>}
                        />
                        <PreferenceRow
                           icon={User} iconBgColor="bg-indigo-500/10" iconColor="text-indigo-400"
                           title="ظهور النشاط" subtitle="إظهار حالة التواجد للآخرين"
                           rightElement={<ToggleSwitch isOn={lastSeen} isRtl={isRtl} onToggle={() => setLastSeen(!lastSeen)} />}
                        />
                        <PreferenceRow
                           icon={Award} iconBgColor="bg-gold-500/10" iconColor="text-gold-400"
                           title="ملف النقاط العام" subtitle="إظهار نقاطك في لوحة المتصدرين"
                           rightElement={<ToggleSwitch isOn={pointsPublic} isRtl={isRtl} onToggle={() => setPointsPublic(!pointsPublic)} />}
                        />
                     </div>
                  </section>
               )}

               {activeSection === 'backup' && user?.role === 'admin' && (
                  <div className="animate-slide-up">
                     <AdminBackupSettings />
                  </div>
               )}
            </div>
         </div>

         {/* Password Modal */}
         {showPasswordModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
               <div className="glass-panel p-8 rounded-2xl w-full max-w-md relative">
                  <h3 className="text-xl font-bold text-white mb-6">تغيير كلمة المرور</h3>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">كلمة المرور الحالية</label>
                        <input
                           type="password"
                           value={currentPassword}
                           onChange={(e) => setCurrentPassword(e.target.value)}
                           className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                           required
                        />
                     </div>

                     <div>
                        <label className="block text-sm text-gray-400 mb-1">كلمة المرور الجديدة</label>
                        <input
                           type="password"
                           value={newPassword}
                           onChange={(e) => setNewPassword(e.target.value)}
                           className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                           required
                           minLength={8}
                        />
                     </div>

                     <div>
                        <label className="block text-sm text-gray-400 mb-1">تأكيد كلمة المرور الجديدة</label>
                        <input
                           type="password"
                           value={confirmPassword}
                           onChange={(e) => setConfirmPassword(e.target.value)}
                           className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                           required
                           minLength={8}
                        />
                     </div>

                     <div className="flex gap-3 mt-6">
                        <button
                           type="button"
                           onClick={() => setShowPasswordModal(false)}
                           className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                           إلغاء
                        </button>
                        <button
                           type="submit"
                           disabled={passwordLoading}
                           className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50"
                        >
                           {passwordLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
});

Settings.displayName = 'Settings';

export default Settings;
