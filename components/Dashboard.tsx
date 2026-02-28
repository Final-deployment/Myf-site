/**
 * @fileoverview Dashboard component displaying user's learning progress and course overview
 * @module components/Dashboard
 */

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Play, Zap, Bell, X, Folder, Clock, ArrowRight, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BADGES } from '../constants';
import { Course } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import { socialApi } from '../services/api/social';
import { useLanguage } from './LanguageContext';
import RatingBox from './RatingBox';
import { notificationManager } from '../utils/notificationManager';
import { Announcement } from '../types';

/**
 * Dashboard component props
 */
interface DashboardProps {
   /** Callback when user clicks to play a course */
   onPlayCourse: (course: Course) => void;
   /** Optional callback to change the active tab */
   setActiveTab?: (tab: string) => void;
   /** Optional unread message count */
   unreadCount?: number;
}

/**
 * Badge item component for displaying achievement badges
 */
const BadgeItem = memo<{ badge: typeof BADGES[0] }>(({ badge }) => (
   <div
      className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${badge.isUnlocked ? 'bg-gradient-to-b from-white/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50' : 'bg-white/5 opacity-40 grayscale'}`}
      role="listitem"
      aria-label={`${badge.title} - ${badge.isUnlocked ? 'Unlocked' : 'Locked'}`}
   >
      <div className="w-8 h-8 relative flex items-center justify-center mb-2">
         <badge.icon className={`w-5 h-5 ${badge.isUnlocked ? 'text-emerald-400' : 'text-gray-400'}`} aria-hidden="true" />
         {badge.isUnlocked && <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full"></div>}
      </div>
      <h4 className="font-bold text-[9px] text-center text-gray-300 truncate w-full">{badge.title}</h4>
   </div>
));
BadgeItem.displayName = 'BadgeItem';

/**
 * Course card component for displaying individual courses
 */
const CourseCard = memo<{ course: Course; language: string; onPlay: (course: Course) => void }>(({ course, language, onPlay }) => {
   const handleClick = useCallback(() => onPlay(course), [course, onPlay]);
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onPlay(course);
      }
   }, [course, onPlay]);

   return (
      <div
         className="glass-panel p-3 rounded-xl flex gap-3 items-center group cursor-pointer glass-card-hover relative overflow-hidden bg-[#0a1f1c] hover:bg-[#0f2e29] border border-white/5"
         onClick={handleClick}
         onKeyDown={handleKeyDown}
         role="button"
         tabIndex={0}
         aria-label={`${language === 'ar' ? course.title : course.titleEn} - ${course.progress}% complete`}
      >
         {/* Progress Bar Background */}
         <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/20 w-full" aria-hidden="true">
            <div className="h-full bg-emerald-500" style={{ width: `${course.progress}%` }}></div>
         </div>

         <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-md">
            <img
               src={course.thumbnail}
               alt=""
               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Play className="w-6 h-6 text-white fill-current opacity-80" aria-hidden="true" />
            </div>
         </div>

         <div className="flex-1 min-w-0 py-0.5">
            <span className="text-[9px] font-bold text-emerald-400 mb-0.5 block">
               {language === 'ar' ? course.category : course.categoryEn}
            </span>
            <h4 className="font-bold text-white text-sm truncate leading-tight mb-1 group-hover:text-emerald-300 transition-colors">
               {language === 'ar' ? course.title : course.titleEn}
            </h4>
            <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
               {language === 'ar' ? course.instructor : course.instructorEn}
            </p>
         </div>

         <div className="flex flex-col items-end justify-center pl-2 border-l border-white/5 h-full">
            <span className="text-[10px] font-bold text-white">{course.progress}%</span>
         </div>
      </div>
   );
});
CourseCard.displayName = 'CourseCard';

/**
 * Dashboard component - Main student dashboard showing progress and courses
 * 
 * @param props - Dashboard props
 * @returns Dashboard component
 */
const Dashboard: React.FC<DashboardProps> = memo(({ onPlayCourse, setActiveTab, unreadCount }) => {
   const { t, language } = useLanguage();
   const { user } = useAuth();
   const [courses, setCourses] = useState<Course[]>([]);
   const [folders, setFolders] = useState<any[]>([]);
   const [complaint, setComplaint] = useState('');
   const [sendingComplaint, setSendingComplaint] = useState(false);
   const [isExpanded, setIsExpanded] = useState(false);
   const toast = useToast();

   useEffect(() => {
      const loadData = async () => {
         try {
            const [coursesData, foldersData] = await Promise.all([
               api.getCourses(),
               api.getFolders()
            ]);
            setCourses(Array.isArray(coursesData) ? coursesData : []);
            setFolders(Array.isArray(foldersData) ? foldersData : []);
         } catch {
            setCourses([]);
            setFolders([]);
         }
      };

      // Polling for announcements
      const checkAnnouncements = async () => {
         try {
            const data = await api.getAnnouncements();
            const latest = data[0];
            if (latest) {
               const lastSeenId = localStorage.getItem('lastSeenAnnouncementId');
               if (lastSeenId !== latest.id) {
                  // New Announcement found!
                  localStorage.setItem('lastSeenAnnouncementId', latest.id);
                  notificationManager.show(
                     'تعميم إداري جديد',
                     latest.title,
                     '/icons/icon-192x192.png'
                  );
               }
            }
         } catch (e) {
            // silent
         }
      };

      loadData();
      checkAnnouncements(); // Check once on mount

      const interval = setInterval(checkAnnouncements, 60000); // Check every minute
      return () => clearInterval(interval);
   }, []);

   const handleSendComplaint = useCallback(async () => {
      if (!complaint.trim()) return;
      setSendingComplaint(true);
      try {
         await socialApi.sendComplaint(complaint);
         toast.success(t('dashboard.complaintSuccess'));
         setComplaint('');
      } catch (e) {
         toast.error(t('dashboard.complaintError'));
      } finally {
         setSendingComplaint(false);
      }
   }, [complaint, t, toast]);

   const toggleExpand = () => setIsExpanded(!isExpanded);

   /** Navigate to a specific tab */
   const handleNavigate = useCallback((tab: string) => {
      setActiveTab?.(tab);
   }, [setActiveTab]);

   /** Handle keyboard navigation for clickable cards */
   const handleCardKeyDown = useCallback((tab: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         handleNavigate(tab);
      }
   }, [handleNavigate]);

   /** Calculate actual progress from enrolled courses */
   const enrolledCourses = useMemo(() => courses.filter(c => (c as any).isEnrolled), [courses]);

   const approachingDeadlines = useMemo(() => {
      if (!Array.isArray(enrolledCourses)) return [];
      return enrolledCourses.filter(c => {
         if (!(c as any).deadline || (c as any).isLockedByDeadline) return false;
         const diff = new Date((c as any).deadline).getTime() - Date.now();
         const daysRemaining = diff / (1000 * 3600 * 24);
         // Show warning if 3 days or less remaining and course is not 100% complete
         return daysRemaining > 0 && daysRemaining <= 3 && (c.progress || 0) < 100;
      });
   }, [enrolledCourses]);

   const courseProgress = useMemo(() => {
      if (!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) return 0;
      const totalProgress = enrolledCourses.reduce((sum, c) => {
         const prog = (c && typeof c.progress === 'number') ? c.progress : 0;
         return sum + prog;
      }, 0);
      return Math.round(totalProgress / enrolledCourses.length);
   }, [enrolledCourses]);

   /** Chart data for progress pie chart */
   const chartData = useMemo(() => [
      { name: 'Completed', value: courseProgress },
      { name: 'Remaining', value: 100 - courseProgress },
   ], [courseProgress]);

   const COLORS = useMemo(() => ['#10b981', 'rgba(255,255,255,0.1)'], []);

   /** Get displayed courses (first 4 enrolled) */
   const displayedCourses = useMemo(() => {
      return [...enrolledCourses]
         .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
         .slice(0, 4);
   }, [enrolledCourses]);

   /** User statistics from context with safe fallbacks */
   const userPoints = (user && typeof user.points === 'number') ? user.points : 0;
   const userStreak = (user && typeof user.streak === 'number') ? user.streak : 0;
   const userLevel = (user && typeof user.level === 'number') ? user.level : 1;

   return (
      <div className="space-y-6 animate-fade-in pb-20 lg:pb-10 relative" role="main" aria-label={t('dashboard.title') || 'Dashboard'}>

         {/* Warning Banners for Approaching Deadlines */}
         {approachingDeadlines.length > 0 && (
            <div className="space-y-3 mb-6">
               {approachingDeadlines.map(course => {
                  const daysRemaining = Math.max(1, Math.ceil((new Date((course as any).deadline).getTime() - Date.now()) / (1000 * 3600 * 24)));
                  return (
                     <div key={`warning-${course.id}`} className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between shadow-xl shadow-red-500/5 animate-[pulse_3s_ease-in-out_infinite]">
                        <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                           <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30 shrink-0">
                              <Clock className="w-6 h-6 text-red-400" />
                           </div>
                           <div>
                              <h4 className="text-red-400 font-bold text-lg flex items-center gap-2">
                                 تنبيه هام: اقتراب موعد إغلاق مساق!
                              </h4>
                              <p className="text-red-200 text-sm mt-1">
                                 المساق <span className="font-bold text-white">"{language === 'ar' ? course.title : course.titleEn}"</span> سيُغلق خلال <span className="font-bold text-white bg-red-500/30 px-2 py-0.5 rounded">{daysRemaining}</span> أيام. بادر بالانتهاء منه وتقديم الامتحانات.
                              </p>
                           </div>
                        </div>
                        <button
                           onClick={() => onPlayCourse(course)}
                           className="md:mt-0 mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 min-w-[140px]"
                        >
                           انتقال للمساق <ArrowRight className="w-4 h-4 rtl:-rotate-180" />
                        </button>
                     </div>
                  );
               })}
            </div>
         )}

         {/* Main Content Split */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content: Available Courses Catalog */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between px-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                     <div className="p-1 rounded bg-violet-500/20 border border-violet-500/30">
                        <Folder className="w-3 h-3 text-violet-400 fill-current" />
                     </div>
                     {t('dashboard.availableCourses') || 'الدورات المتاحة'}
                  </h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...courses].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((course, index) => {
                     const folder = folders.find(f => f.id === course.folderId);

                     // Prerequisite Logic:
                     // 1. First course is always unlocked
                     // 2. Subsequent courses require previous course to be completed (100% progress)
                     const previousCourse = index > 0 ? courses[index - 1] : null;
                     const isLocked = previousCourse ? (previousCourse.progress || 0) < 100 : false;

                     return (
                        <div key={course.id} className={`glass-panel p-0 rounded-xl overflow-hidden group hover:border-violet-500/50 transition-all relative flex flex-col bg-[#0a1815]`}>
                           {/* Thumbnail */}
                           <div className="h-32 w-full relative overflow-hidden">
                              <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                              {folder && (
                                 <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-gray-300 border border-white/10 flex items-center gap-1 z-10">
                                    <Folder className="w-3 h-3 text-violet-400" />
                                    <span className="truncate max-w-[100px]">{folder.name}</span>
                                 </div>
                              )}

                              {/* Lock Overlay */}
                              {isLocked && (
                                 <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-20">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 border border-white/20">
                                       <Lock className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300 px-3 py-1 bg-black/50 rounded-full border border-white/10">
                                       أكمل الدورة السابقة لفتح هذه الدورة
                                    </span>
                                 </div>
                              )}
                           </div>

                           {/* Content */}
                           <div className="p-4 flex-1 flex flex-col">
                              <h4 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-violet-300 transition-colors">
                                 {language === 'ar' ? course.title : course.titleEn}
                              </h4>
                              <div className="text-[10px] text-gray-400 mb-4 flex items-center gap-3">
                                 <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {course.duration}
                                 </span>
                                 <span className="flex items-center gap-1">
                                    <Play className="w-3 h-3" />
                                    {course.lessonsCount || 0} درس
                                 </span>
                              </div>

                              <button
                                 onClick={() => !isLocked && onPlayCourse(course)}
                                 disabled={isLocked}
                                 className={`mt-auto w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn
                                    ${isLocked
                                       ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                       : 'bg-white/5 hover:bg-violet-600 hover:text-white text-gray-300'}`}
                              >
                                 {isLocked ? (
                                    <>
                                       <span>مغلق مؤقتاً</span>
                                       <Lock className="w-3 h-3" />
                                    </>
                                 ) : (
                                    <>
                                       <span>انتقال للدورة</span>
                                       <ArrowRight className="w-3 h-3 group-hover/btn:-translate-x-1 transition-transform rtl:rotate-180" />
                                    </>
                                 )}
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Sidebar Widgets (Stacked) */}
            <div className="space-y-4" role="complementary">

               {/* New Message Banner (Moved to Sidebar) */}
               {unreadCount !== undefined && unreadCount > 0 ? (
                  <div
                     onClick={() => setActiveTab?.('messages')}
                     className="bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-transparent border border-violet-500/40 p-4 rounded-xl flex items-center justify-between cursor-pointer group hover:border-violet-400/60 transition-all backdrop-blur-xl relative z-30 shadow-xl shadow-violet-900/10 overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-center gap-3 relative z-10 w-full">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative flex-shrink-0">
                           <Bell className="w-5 h-5 text-white" />
                           <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a1f1c] animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-white font-bold text-xs leading-tight group-hover:text-violet-200 transition-colors mb-0.5">رسائل جديدة!</h4>
                           <p className="text-violet-200/80 text-[10px] font-medium truncate"> لديك <span className="text-white font-bold">{unreadCount}</span> رسائل غير مقروءة</p>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/30 group-hover:bg-violet-500/50 transition-all border border-violet-400/30 flex-shrink-0">
                           <Play className="w-3 h-3 rotate-180 fill-current text-white" />
                        </div>
                     </div>
                  </div>
               ) : null}

               {/* 1. Complaints Box */}
               <div
                  className={`glass-panel p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl group hover:border-violet-500/30 transition-all duration-500 shadow-2xl overflow-hidden cursor-pointer ${isExpanded ? 'ring-2 ring-violet-500/20' : ''}`}
                  onClick={!isExpanded ? toggleExpand : undefined}
               >
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-600/20 transition-all duration-700"></div>

                  <div className="flex items-center justify-between relative z-10 h-full">
                     <div className={`flex items-center gap-3 ${isExpanded ? 'w-full mb-4' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-110 transition-transform duration-500">
                           <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                           <h3 className="text-sm font-bold text-white tracking-tight leading-tight">{t('dashboard.complaintsBox')}</h3>
                           {!isExpanded && <p className="text-[9px] text-violet-400 font-medium">شاركنا رأيك</p>}
                        </div>
                        {isExpanded && (
                           <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                           >
                              <X className="w-4 h-4" />
                           </button>
                        )}
                     </div>
                  </div>

                  {isExpanded && (
                     <div className="mt-2 space-y-3 relative z-10 animate-in fade-in slide-in-from-top-2 duration-400" onClick={(e) => e.stopPropagation()}>
                        <textarea
                           value={complaint}
                           onChange={(e) => setComplaint(e.target.value)}
                           placeholder={t('dashboard.complaintsPlaceholder')}
                           className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all placeholder:text-gray-600 resize-none custom-scrollbar"
                        />
                        <button
                           onClick={handleSendComplaint}
                           disabled={!complaint.trim() || sendingComplaint}
                           className={`
                              w-full px-4 py-2 rounded-full font-bold text-[10px] transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn
                              ${!complaint.trim() || sendingComplaint
                                 ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                                 : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'}
                           `}
                        >
                           {sendingComplaint ? (
                              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                           ) : (
                              <>
                                 <span>{t('dashboard.sendComplaint')}</span>
                                 <Zap className="w-3 h-3 fill-current" />
                              </>
                           )}
                        </button>
                     </div>
                  )}
               </div>



               {/* 3. Chart Widget */}
               <div
                  onClick={() => handleNavigate('progress')}
                  onKeyDown={handleCardKeyDown('progress')}
                  className="glass-panel rounded-2xl p-4 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-[#064e3b] to-[#022c22] cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('dashboard.courseProgress')} - ${courseProgress}% ${t('dashboard.completed')}`}
               >
                  <div>
                     <h3 className="text-xs font-bold text-gray-300 mb-1 group-hover:text-emerald-300 transition-colors">{t('dashboard.courseProgress')}</h3>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">{courseProgress}%</span>
                        <span className="text-[10px] text-emerald-400">{t('dashboard.completed')}</span>
                     </div>
                  </div>
                  <div className="w-16 h-16 relative" aria-hidden="true">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={chartData}
                              innerRadius={20}
                              outerRadius={30}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              stroke="none"
                           >
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                              ))}
                           </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* 4. Rating Section */}
               <RatingBox />
            </div>
         </div>
      </div>
   );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
