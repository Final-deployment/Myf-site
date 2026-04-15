import React, { useEffect, useState, useMemo } from 'react';
import { Clock, BookOpen, Target, ArrowUpRight, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Course } from '../types';

const PersonalProgress: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const data = await api.getCourses();
                if (Array.isArray(data)) {
                    setCourses(data);
                }
            } catch (error) {
                console.error("Failed to load personal progress", error);
            } finally {
                setLoading(false);
            }
        };
        loadProgress();
    }, []);

    const enrolledCourses = useMemo(() => courses.filter(c => (c as any).isEnrolled), [courses]);
    const completedCourses = useMemo(() => enrolledCourses.filter(c => c.progress === 100), [enrolledCourses]);

    const averageProgress = useMemo(() => {
        if (enrolledCourses.length === 0) return 0;
        const total = enrolledCourses.reduce((sum, c) => sum + (c.progress || 0), 0);
        return Math.round(total / enrolledCourses.length);
    }, [enrolledCourses]);

    const stats = [
        { label: 'الدورات المسجلة', value: enrolledCourses.length, icon: BookOpen },
        { label: 'الدورات المكتملة', value: completedCourses.length, icon: CheckCircle },
        { label: 'معدل الإنجاز', value: `${averageProgress}%`, icon: Target },
    ];

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">التقدم الشخصي</h2>
                <p className="text-gray-300">تتبع تقدمك في المساقات الحالية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6">المساقات المسجلة</h3>
                <div className="space-y-4">
                    {enrolledCourses.length === 0 ? (
                        <p className="text-gray-400 text-sm">لا يوجد مساقات مسجلة حتى الآن.</p>
                    ) : (
                        enrolledCourses.map((course, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-medium">{course.title}</h4>
                                    <p className="text-gray-400 text-sm">{course.category}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${course.progress || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm w-10 text-left">{course.progress || 0}%</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalProgress;
