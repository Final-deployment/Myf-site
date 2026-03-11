import React, { useState } from 'react';
import { Bell, BookOpen, Award, Users, MessageSquare, Calendar, Check, X, Settings, Trash2, Filter } from 'lucide-react';

const Notifications: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [showSettings, setShowSettings] = useState(false);

    // Notifications State
    const [notificationList, setNotificationList] = useState([
        { id: 1, type: 'course', title: 'دورة جديدة متاحة', message: 'تم إضافة دورة "شرح كتاب التوحيد" للمنصة', time: 'منذ 5 دقائق', read: false, icon: BookOpen },
        { id: 2, type: 'achievement', title: 'إنجاز جديد! 🎉', message: 'لقد أكملت 100 ساعة من التعلم', time: 'منذ ساعة', read: false, icon: Award },
        { id: 3, type: 'community', title: 'رد جديد على تعليقك', message: 'رد الشيخ أحمد على سؤالك في المجتمع', time: 'منذ 3 ساعات', read: false, icon: MessageSquare },
        { id: 4, type: 'reminder', title: 'تذكير: وقت الورد اليومي', message: 'لا تنس قراءة وردك اليومي من القرآن', time: 'منذ 5 ساعات', read: true, icon: Calendar },
        { id: 5, type: 'course', title: 'تم تحديث الدورة', message: 'تمت إضافة حلقات جديدة لدورة "تفسير جزء عم"', time: 'منذ يوم', read: true, icon: BookOpen },
        { id: 6, type: 'community', title: 'متابع جديد', message: 'بدأ أحمد محمد بمتابعتك', time: 'منذ يومين', read: true, icon: Users },
        { id: 7, type: 'achievement', title: 'شهادة جاهزة للتحميل', message: 'شهادة إتمام دورة "فقه الصلاة" جاهزة', time: 'منذ 3 أيام', read: true, icon: Award },
    ]);

    const typeColors: Record<string, { bg: string; text: string; iconBg: string }> = {
        course: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'from-emerald-500 to-teal-600' },
        achievement: { bg: 'bg-amber-500/10', text: 'text-amber-400', iconBg: 'from-amber-500 to-orange-600' },
        community: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'from-blue-500 to-cyan-600' },
        reminder: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'from-purple-500 to-pink-600' },
    };

    const handleRead = (id: number) => {
        setNotificationList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        const notification = notificationList.find(n => n.id === id);
        if (notification) alert(`فتح الإشعار: ${notification.title}\n${notification.message}`);
    };

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('حذف هذا الإشعار؟')) {
            setNotificationList(prev => prev.filter(n => n.id !== id));
        }
    };

    const markAllRead = () => {
        setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
    };

    const filteredNotifications = filter === 'all'
        ? notificationList
        : filter === 'unread'
            ? notificationList.filter(n => !n.read)
            : notificationList.filter(n => n.type === filter);

    const unreadCount = notificationList.filter(n => !n.read).length;

    return (
        <div className="animate-fade-in space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">الإشعارات</h2>
                    <p className="text-gray-300">
                        لديك <span className="text-emerald-400 font-bold">{unreadCount}</span> إشعارات غير مقروءة
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllRead}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        <span>قراءة الكل</span>
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`px-4 py-2 border rounded-xl transition-colors flex items-center gap-2 ${showSettings ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                    >
                        <Settings className="w-4 h-4" />
                        <span>الإعدادات</span>
                    </button>
                </div>
            </div>

            {/* Notification Settings Modal Mock */}
            {showSettings && (
                <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 mb-4 animate-scale-in">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-400" />
                        إعدادات الإشعارات
                    </h3>
                    <div className="space-y-3">
                        {['إشعارات الدورات الجديدة', 'إشعارات المجتمع والردود', 'التذكيرات اليومية', 'تحديثات المنصة'].map((setting, idx) => (
                            <label key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer">
                                <span className="text-gray-300">{setting}</span>
                                <input type="checkbox" defaultChecked className="accent-emerald-500 w-5 h-5" />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'الكل' },
                    { id: 'unread', label: 'غير مقروءة' },
                    { id: 'course', label: 'الدورات' },
                    { id: 'achievement', label: 'الإنجازات' },
                    { id: 'community', label: 'المجتمع' },
                    { id: 'reminder', label: 'التذكيرات' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.id
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                    const colors = typeColors[notification.type];
                    return (
                        <div
                            key={notification.id}
                            onClick={() => handleRead(notification.id)}
                            className={`glass-panel p-5 rounded-2xl flex items-start gap-4 transition-all cursor-pointer hover:border-emerald-500/30 ${!notification.read ? 'border-r-4 border-emerald-500 bg-emerald-500/5' : ''
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                                <notification.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className={`font-bold ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.read && (
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                                )}
                                <button
                                    onClick={(e) => handleDelete(notification.id, e)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredNotifications.length === 0 && (
                <div className="glass-panel p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد إشعارات</h3>
                    <p className="text-gray-400">ستظهر إشعاراتك هنا</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;
