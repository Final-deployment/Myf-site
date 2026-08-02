import React, { useState, useEffect } from 'react';
import { Bell, BookOpen, Award, Users, MessageSquare, Calendar, Check, X, Settings, Trash2, Filter, Info } from 'lucide-react';
import { notificationsApi, AppNotification } from '../services/api/notifications';

const Notifications: React.FC = () => {
    const [filter, setFilter] = useState('all');
    const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);

    // Notifications State
    const [notificationList, setNotificationList] = useState<AppNotification[]>([]);
    const [total, setTotal] = useState(0);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationsApi.getNotifications(1, 50);
            setNotificationList(data.notifications);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const typeColors: Record<string, { bg: string; text: string; iconBg: string; icon: React.ElementType }> = {
        course: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'from-emerald-500 to-teal-600', icon: BookOpen },
        achievement: { bg: 'bg-amber-500/10', text: 'text-amber-400', iconBg: 'from-amber-500 to-orange-600', icon: Award },
        reminder: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'from-purple-500 to-pink-600', icon: Calendar },
        inactivity_reminder: { bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'from-purple-500 to-pink-600', icon: Calendar },
        supervisor_inactive: { bg: 'bg-red-500/10', text: 'text-red-400', iconBg: 'from-red-500 to-orange-600', icon: Users },
        info: { bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'from-blue-500 to-cyan-600', icon: Info },
    };

    // Fallback style for unknown types
    const getStyleForType = (type: string) => {
        return typeColors[type] || { bg: 'bg-gray-500/10', text: 'text-gray-400', iconBg: 'from-gray-500 to-slate-600', icon: Bell };
    };

    const handleRead = async (id: string, is_read: boolean, link: string | null) => {
        if (!is_read) {
            setNotificationList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            try {
                await notificationsApi.markAsRead(id);
            } catch (e) {
                console.error('Failed to mark as read', e);
            }
        }
        if (link) {
            window.location.href = link; // Or use react-router navigate if available
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('حذف هذا الإشعار؟')) {
            setNotificationList(prev => prev.filter(n => n.id !== id));
            try {
                await notificationsApi.deleteNotification(id);
            } catch (e) {
                console.error('Failed to delete notification', e);
            }
        }
    };

    const markAllRead = async () => {
        setNotificationList(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await notificationsApi.markAllAsRead();
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const filteredNotifications = filter === 'all'
        ? notificationList
        : filter === 'unread'
            ? notificationList.filter(n => !n.is_read)
            : notificationList.filter(n => n.type === filter);

    const unreadCount = notificationList.filter(n => !n.is_read).length;

    // Helper to format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

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
                        {['إشعارات الدورات الجديدة', 'التذكيرات اليومية', 'تحديثات المنصة'].map((setting, idx) => (
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
                {loading ? (
                    <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">لا توجد إشعارات</div>
                ) : (
                    filteredNotifications.map((notification) => {
                        const style = getStyleForType(notification.type);
                        const Icon = style.icon;
                        return (
                            <div
                                key={notification.id}
                                onClick={() => handleRead(notification.id, notification.is_read, notification.link)}
                                className={`glass-panel p-5 rounded-2xl flex items-start gap-4 transition-all cursor-pointer hover:border-emerald-500/30 ${!notification.is_read ? 'border-r-4 border-emerald-500 bg-emerald-500/5' : ''
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className={`font-bold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                                                {notification.title}
                                            </h4>
                                            <p className="text-gray-400 text-sm mt-1">{notification.body}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(notification.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notification.is_read && (
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
