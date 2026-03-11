import React from 'react';
import { TrendingUp, Clock, BookOpen, Award, Target, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const PersonalProgress: React.FC = () => {
    const weeklyData = [
        { day: 'أحد', hours: 1.5 },
        { day: 'اثنين', hours: 2.0 },
        { day: 'ثلاثاء', hours: 1.0 },
        { day: 'أربعاء', hours: 2.5 },
        { day: 'خميس', hours: 1.8 },
        { day: 'جمعة', hours: 3.0 },
        { day: 'سبت', hours: 2.2 },
    ];

    const skillsData = [
        { subject: 'التفسير', A: 85 },
        { subject: 'الحديث', A: 70 },
        { subject: 'الفقه', A: 90 },
        { subject: 'العقيدة', A: 75 },
        { subject: 'السيرة', A: 80 },
        { subject: 'التجويد', A: 65 },
    ];

    const stats = [
        { label: 'إجمالي الساعات', value: '156', change: '+12%', icon: Clock },
        { label: 'الدورات المكتملة', value: '12', change: '+3', icon: BookOpen },
        { label: 'الشهادات', value: '8', change: '+2', icon: Award },
        { label: 'معدل الإنجاز', value: '87%', change: '+5%', icon: Target },
    ];

    const achievements = [
        { title: 'أكملت دورة تفسير سورة البقرة', date: 'اليوم', points: '+50' },
        { title: 'سلسلة 7 أيام متتالية', date: 'أمس', points: '+25' },
        { title: 'حفظت 3 أحاديث جديدة', date: 'منذ 3 أيام', points: '+15' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">التقدم الشخصي</h2>
                <p className="text-gray-300">تتبع مسيرتك التعليمية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                                <ArrowUpRight className="w-4 h-4" />
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">نشاط هذا الأسبوع</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="day" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} name="ساعات" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">مستوى المهارات</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={skillsData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                                <Radar dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6">الإنجازات الأخيرة</h3>
                <div className="space-y-4">
                    {achievements.map((a, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-2xl">🏆</div>
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{a.title}</h4>
                                <p className="text-gray-400 text-sm">{a.date}</p>
                            </div>
                            <span className="text-emerald-400 font-bold">{a.points}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalProgress;
