/**
 * @fileoverview Admin Dashboard component for platform management overview
 * @module components/AdminDashboard
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Users, Mic2, TrendingUp, Download, Calendar, Activity, Bell, Play, LucideIcon } from 'lucide-react';
import { api } from '../services/api';
import RatingBox from './RatingBox';

/**
 * Admin Dashboard props
 */
interface AdminDashboardProps {
   /** Callback to change the active tab */
   setActiveTab?: (tab: string) => void;
   /** Optional unread message count */
   unreadCount?: number;
}

/**
 * Activity item interface
 */
interface ActivityItem {
   id: number;
   user: string;
   action: string;
   time: string;
   type: 'success' | 'warning' | 'info';
}

/**
 * Stat card props
 */
interface StatCardProps {
   label: string;
   value: string | number;
   icon: LucideIcon;
   color: string;
   trend?: string;
   trendText?: string;
   onClick: () => void;
}

/**
 * Stat card component for dashboard metrics
 */
const StatCard = memo<StatCardProps>(({ label, value, icon: Icon, color, trend, trendText, onClick }) => {
   const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onClick();
      }
   }, [onClick]);

   const colorClasses: Record<string, { border: string; bg: string; text: string; icon: string }> = {
      orange: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-300', icon: 'text-orange-500' },
      blue: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-300', icon: 'text-blue-500' },
      emerald: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: 'text-emerald-500' },
   };

   const classes = colorClasses[color] || colorClasses.emerald;

   return (
      <article
         onClick={onClick}
         onKeyDown={handleKeyDown}
         className="glass-panel p-1 rounded-3xl relative overflow-hidden group cursor-pointer"
         role="button"
         tabIndex={0}
         aria-label={`${label}: ${value}`}
      >
         <div className={`absolute inset-0 bg-gradient-to-b from-${color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden="true"></div>
         <div className={`bg-[#0a1815]/60 p-5 rounded-[1.3rem] h-full flex flex-col justify-between border-t ${classes.border} relative z-10`}>
            {color === 'orange' && (
               <div className="absolute right-0 top-0 opacity-10" aria-hidden="true">
                  <Activity className="w-20 h-20 text-orange-500" />
               </div>
            )}

            <div className="flex justify-between items-start relative z-10 w-full">
               <div>
                  <p className={`${classes.text} text-[10px] font-bold uppercase tracking-wider mb-1`}>{label}</p>
                  <h3 className="text-3xl font-extrabold text-white">{value}</h3>
               </div>
               <div className={`w-10 h-10 rounded-lg rotate-3 ${classes.bg} border border-${color}-500/20 flex items-center justify-center ${classes.icon} shadow-sm`} aria-hidden="true">
                  <Icon className="w-5 h-5 -rotate-3" />
               </div>
            </div>
         </div>
      </article>
   );
});
StatCard.displayName = 'StatCard';

/**
 * Activity item component
 */
const ActivityItemCard = memo<{ activity: ActivityItem; isLast: boolean }>(({ activity, isLast }) => {
   const typeColors: Record<string, string> = {
      success: 'bg-emerald-500',
      warning: 'bg-red-500',
      info: 'bg-blue-500',
   };

   return (
      <article
         className={`relative pl-5 pb-5 ${isLast ? 'pb-0' : ''} border-l ${isLast ? 'border-0' : 'border-white/10'} group`}
         aria-label={`${activity.user}: ${activity.action}`}
      >
         {/* Bullet */}
         <div className="absolute -left-[6px] top-0 w-3 h-3 flex items-center justify-center" aria-hidden="true">
            <div className={`w-2 h-2 rotate-45 ${typeColors[activity.type]}`}></div>
         </div>

         <div className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/5">
            <div className="flex justify-between items-start mb-1">
               <h4 className="text-[11px] font-bold text-white">{activity.user}</h4>
               <time className="text-[9px] text-gray-500">{activity.time}</time>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">{activity.action}</p>
         </div>
      </article>
   );
});
ActivityItemCard.displayName = 'ActivityItemCard';

/**
 * Admin Dashboard component - Overview and analytics for platform administrators
 * 
 * Features:
 * - Key metrics display
 * - Student engagement analytics chart
 * - Real-time activity feed
 * - Export functionality
 * - ARIA accessibility
 * 
 * @param props - AdminDashboard props
 * @returns AdminDashboard component
 */
const AdminDashboard: React.FC<AdminDashboardProps> = memo(({ setActiveTab, unreadCount }) => {
   /** Dynamic stats from API */
   const [stats, setStats] = React.useState({
      totalStudents: 0,
      activeCourses: 0,
      completionRate: 0,
      isLoading: true
   });

   /** Fetch real statistics on mount */
   React.useEffect(() => {
      const fetchStats = async () => {
         try {
            const apiStats = await api.getDashboardStats();
            if (apiStats) {
                setStats({
                   totalStudents: apiStats.totalStudents,
                   activeCourses: apiStats.activeCourses,
                   completionRate: apiStats.completionRate,
                   isLoading: false
                });
            } else {
                // Fallback stats if endpoint fails
                setStats(prev => ({ ...prev, isLoading: false }));
            }
         } catch (error) {
            console.error('Failed to fetch stats:', error);
            setStats(prev => ({ ...prev, isLoading: false }));
         }
      };

      fetchStats();
   }, []);

   // Removing fake chart data

   /** Handle navigation to different tabs */
   const handleNavigate = useCallback((tab: string) => {
      setActiveTab?.(tab);
   }, [setActiveTab]);

   /** Handle export summary click */
   const handleExportSummary = useCallback(async () => {
      try {
         const [users, courses] = await Promise.all([
            api.getUsers(),
            api.getCourses()
         ]);

         const summary = {
            generatedAt: new Date().toISOString(),
            usersCount: Array.isArray(users) ? users.length : 0,
            coursesCount: Array.isArray(courses) ? courses.length : 0,
            stats: {
               completionRate: `${stats.completionRate}%`,
               activeCourses: stats.activeCourses,
               totalStudents: stats.totalStudents
            }
         };

         const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `dashboard-summary-${new Date().toISOString().split('T')[0]}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
      } catch (error) {
         console.error("Failed to export summary", error);
      }
   }, [stats]);

   /** Tooltip style for chart */
   const tooltipStyle = useMemo(() => ({
      backgroundColor: '#0a1815',
      borderColor: 'rgba(255,255,255,0.1)',
      color: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontSize: '12px'
   }), []);

   return (
      <div className="space-y-6 animate-fade-in pb-10" role="main" aria-label="لوحة التحكم">

         {/* Header */}
         <header className="flex justify-between items-end mb-6 relative">
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true"></div>
            <div>
               <h2 className="text-2xl font-bold text-white mb-1 font-serif">لوحة التحكم</h2>
               <p className="text-gray-400 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rotate-45" aria-hidden="true"></span>
                  مرحباً بك في لوحة إدارة المنصة
               </p>
            </div>
            <div className="flex gap-2">
               <button
                  className="px-3 py-2 bg-[#0a1815] border border-white/10 hover:bg-white/5 rounded-lg text-xs text-gray-300 font-bold flex items-center gap-2 transition-colors"
                  aria-label="تحديد الفترة الزمنية"
               >
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  آخر 30 يوم
               </button>
               <button
                  onClick={handleExportSummary}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-colors border border-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="تصدير تقرير لوحة التحكم"
               >
                  <Download className="w-3 h-3" aria-hidden="true" />
                  تصدير التقرير
               </button>
            </div>
         </header>


         {/* Stats Cards */}
         <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="إحصائيات سريعة">
            <StatCard
               label="نسبة الإكمال"
               value={stats.isLoading ? '...' : `${stats.completionRate}%`}
               icon={TrendingUp}
               color="orange"
               onClick={() => handleNavigate('reports')}
            />
            <StatCard
               label="رسائل الدعم الجديدة"
               value={unreadCount !== undefined ? unreadCount : '...'}
               icon={Bell}
               color="emerald"
               trend={unreadCount && unreadCount > 0 ? 'مهم' : 'لا يوجد'}
               trendText="بانتظار الرد"
               onClick={() => handleNavigate('messages')}
            />
            <StatCard
               label="الدورات النشطة"
               value={stats.isLoading ? '...' : stats.activeCourses.toString()}
               icon={Mic2}
               color="blue"
               onClick={() => handleNavigate('audio-courses')}
            />
            <StatCard
               label="إجمالي الطلاب"
               value={stats.isLoading ? '...' : stats.totalStudents.toLocaleString()}
               icon={Users}
               color="blue"
               onClick={() => handleNavigate('students')}
            />
         </section>

         {/* Charts & Lists */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section
               onClick={() => handleNavigate('reports')}
               className="lg:col-span-2 glass-panel p-10 rounded-3xl relative border-t-2 border-emerald-500/10 flex items-center justify-center flex-col cursor-pointer group hover:bg-white/5 transition-colors"
               role="button"
               tabIndex={0}
               onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNavigate('reports')}
            >
                <div className="w-16 h-16 bg-white/5 flex items-center justify-center rounded-full mb-4 group-hover:bg-emerald-500/10 transition-colors">
                    <Activity className="w-8 h-8 text-gray-500 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-400 group-hover:text-white transition-colors">مساحة المخططات والتحليل البياني</h3>
                <p className="text-sm text-gray-500 mt-2 text-center max-w-sm">سيتم إضافة إحصاءات ومخططات قريباً تعتمد على تفاعل الطلاب وتقدمهم الفعلي.</p>
            </section>
            <section className="glass-panel p-6 rounded-3xl flex flex-col relative overflow-hidden" aria-label="النشاط المباشر">
               <div className="mashrabiya-pattern absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true"></div>

               <div className="flex justify-between items-center mb-5 relative z-10">
                  <h3 className="text-base font-bold text-white">النشاط المباشر</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-label="نشط الآن"></div>
               </div>
               <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10 flex flex-col items-center justify-center text-center opacity-50 py-10" role="feed" aria-label="قائمة الأنشطة الأخيرة">
                  <Activity className="w-8 h-8 text-gray-500 mb-2" />
                  <p className="text-sm">لا توجد أنشطة مسجلة حالياً</p>
               </div>
               <button
                  onClick={() => handleNavigate('activity-log')}
                  className="w-full mt-3 py-2.5 rounded-xl border border-white/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/10 transition-colors relative z-10 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label="عرض سجل النشاط الكامل"
               >
                  عرض السجل الكامل
               </button>
            </section>
         </div>

         {/* Push Notification Broadcast */}
         <section className="mt-8 glass-panel p-6 rounded-3xl" aria-label="إرسال إشعارات للطلاب">
            <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
               <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white">إرسال إشعارات (Push Broadcast)</h3>
                  <p className="text-sm text-gray-400">إرسال رسالة تنبيه لجميع المشتركين في خدمة الإشعارات</p>
               </div>
            </div>
            
            <form onSubmit={async (e) => {
               e.preventDefault();
               const form = e.target as HTMLFormElement;
               const title = (form.elements.namedItem('pushTitle') as HTMLInputElement).value;
               const body = (form.elements.namedItem('pushBody') as HTMLTextAreaElement).value;
               const submitBtn = document.getElementById('pushSubmitBtn') as HTMLButtonElement;
               
               if (!title || !body) return;
               
               const originalText = submitBtn.innerText;
               submitBtn.disabled = true;
               submitBtn.innerText = 'جاري الإرسال...';
               
               try {
                  const token = localStorage.getItem('authToken');
                  const res = await fetch('/api/notifications/send', {
                     method: 'POST',
                     headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                     },
                     body: JSON.stringify({ title, body, url: '/' })
                  });
                  const data = await res.json();
                  if (res.ok) {
                     alert(`تم الإرسال بنجاح لـ ${data.count || 0} مشترك!`);
                     form.reset();
                  } else {
                     alert('حدث خطأ: ' + (data.error || 'غير معروف'));
                  }
               } catch(err) {
                  alert('خطأ في الاتصال');
               } finally {
                  submitBtn.disabled = false;
                  submitBtn.innerText = originalText;
               }
            }} className="space-y-4 max-w-2xl">
               <div>
                  <label className="block text-sm text-gray-400 mb-1">عنوان الإشعار</label>
                  <input required name="pushTitle" type="text" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="مثال: دورة جديدة متاحة!" />
               </div>
               <div>
                  <label className="block text-sm text-gray-400 mb-1">نص الإشعار</label>
                  <textarea required name="pushBody" rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors custom-scrollbar" placeholder="اكتب تفاصيل الرسالة هنا..."></textarea>
               </div>
               <button id="pushSubmitBtn" type="submit" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">
                  إرسال للجميع
               </button>
            </form>
         </section>

         {/* Rating Section */}
         <div className="mt-8">
            <RatingBox />
         </div>
      </div>
   );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;
