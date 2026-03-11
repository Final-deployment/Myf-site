import React, { useState, useEffect, memo, useCallback } from 'react';
import { Activity, User, BookOpen, LogIn, LogOut, Edit, Filter, Download } from 'lucide-react';
import { api } from '../services/api';
import { SystemActivityLog } from '../types';

const AdminActivityLog: React.FC = memo(() => {
    const [logs, setLogs] = useState<SystemActivityLog[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await api.getLogs();
                setLogs(data);
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };
        fetchLogs();
    }, []);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const typeIcons: Record<string, React.ElementType> = {
        login: LogIn, logout: LogOut, course: BookOpen, download: Download, edit: Edit, quiz: Activity, register: User, complete: BookOpen,
        system: Activity // Default or fallback
    };

    const typeColors: Record<string, string> = {
        login: 'from-emerald-500 to-teal-600', logout: 'from-gray-500 to-gray-600', course: 'from-blue-500 to-cyan-600',
        download: 'from-violet-500 to-purple-600', edit: 'from-amber-500 to-orange-600', quiz: 'from-pink-500 to-rose-600',
        register: 'from-emerald-500 to-teal-600', complete: 'from-gold-500 to-amber-600',
        system: 'from-slate-500 to-slate-600'
    };

    const stats = [
        { label: 'النشاطات اليوم', value: logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length.toString(), color: 'from-emerald-500 to-teal-600' },
        { label: 'تسجيلات الدخول', value: logs.filter(l => l.action.toLowerCase().includes('login')).length.toString(), color: 'from-violet-500 to-purple-600' },
        { label: 'إجراءات النظام', value: logs.filter(l => l.action.toLowerCase().includes('backup') || l.action.toLowerCase().includes('restore')).length.toString(), color: 'from-amber-500 to-orange-600' },
        // Mocking "active users" as unique users in logs for simplicity
        { label: 'المستخدمين النشطين', value: new Set(logs.map(l => l.userId)).size.toString(), color: 'from-blue-500 to-cyan-600' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">سجل النشاط</h2>
                    <p className="text-gray-300">تتبع نشاط المستخدمين على المنصة</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 flex items-center gap-2 hover:bg-white/10">
                        <Filter className="w-4 h-4" /><span>تصفية</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 flex items-center gap-2 hover:bg-white/10"
                    >
                        <Download className="w-4 h-4" /><span>تصدير</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">آخر النشاطات</h3>
                    <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                        <option>آخر 24 ساعة</option>
                        <option>آخر أسبوع</option>
                        <option>آخر شهر</option>
                    </select>
                </div>
                <div className="divide-y divide-white/5">
                    {logs.length > 0 ? (
                        [...logs].reverse().map((activity) => {
                            // Heuristic to pick icon/color based on action text if type isn't explicit
                            let type = 'system';
                            if (activity.action.includes('login')) type = 'login';
                            else if (activity.action.includes('quiz')) type = 'quiz';
                            else if (activity.action.includes('course')) type = 'course';

                            const Icon = typeIcons[type] || Activity;
                            return (
                                <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-white/5">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[type] || 'from-gray-500 to-gray-600'} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{activity.userId}</span>
                                            <span className="text-gray-400">-</span>
                                            <span className="text-emerald-400">{activity.action}</span>
                                        </div>
                                        {activity.details && <p className="text-gray-400 text-sm">{activity.details}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-sm">{activity.date}</p>
                                        <p className="text-gray-500 text-xs">{new Date(parseInt(activity.timestamp)).toLocaleTimeString('ar-SA')}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-400">لا توجد نشاطات مسجلة بعد</div>
                    )}
                </div>
            </div>
        </div>
    );
});

AdminActivityLog.displayName = 'AdminActivityLog';

export default AdminActivityLog;
