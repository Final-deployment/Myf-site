import React, { useState } from 'react';
import { Calendar, CheckCircle, Circle, BookOpen, Clock, Target, Flame, Plus, X } from 'lucide-react';

const DailyTracking: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const dailyTasks = [
        { id: 1, title: 'قراءة الورد اليومي', category: 'قرآن', completed: true, time: '30 دقيقة' },
        { id: 2, title: 'أذكار الصباح', category: 'أذكار', completed: true, time: '10 دقائق' },
        { id: 3, title: 'حفظ سورة الملك', category: 'حفظ', completed: false, time: '45 دقيقة' },
        { id: 4, title: 'مراجعة جزء عم', category: 'مراجعة', completed: false, time: '20 دقيقة' },
        { id: 5, title: 'أذكار المساء', category: 'أذكار', completed: false, time: '10 دقائق' },
        { id: 6, title: 'درس فقه الصلاة', category: 'دورات', completed: true, time: '15 دقيقة' },
    ];

    const weekDays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    const getWeekDates = () => {
        const dates = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const stats = [
        { label: 'سلسلة الأيام', value: '15', icon: Flame, color: 'from-orange-500 to-red-600', suffix: 'يوم' },
        { label: 'مهام اليوم', value: '6', icon: Target, color: 'from-emerald-500 to-teal-600', suffix: 'مهام' },
        { label: 'المكتملة', value: '3', icon: CheckCircle, color: 'from-blue-500 to-cyan-600', suffix: 'مهام' },
        { label: 'الوقت المستغرق', value: '55', icon: Clock, color: 'from-purple-500 to-pink-600', suffix: 'دقيقة' },
    ];

    const categoryColors: Record<string, string> = {
        'قرآن': 'bg-emerald-500/20 text-emerald-400',
        'أذكار': 'bg-blue-500/20 text-blue-400',
        'حفظ': 'bg-purple-500/20 text-purple-400',
        'مراجعة': 'bg-amber-500/20 text-amber-400',
        'دورات': 'bg-pink-500/20 text-pink-400',
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">جدول المتابعة اليومي</h2>
                    <p className="text-gray-300">تتبع وردك اليومي وأنشطتك</p>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>إضافة مهمة</span>
                </button>
            </div>

            {/* Week Calendar */}
            <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">هذا الأسبوع</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span>{selectedDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {getWeekDates().map((date, idx) => {
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(date)}
                                className={`p-4 rounded-xl text-center transition-all ${isSelected
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                                        : isToday
                                            ? 'bg-white/10 text-white border border-emerald-500/50'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <p className="text-xs mb-1">{weekDays[idx]}</p>
                                <p className="text-lg font-bold">{date.getDate()}</p>
                                {isToday && !isSelected && (
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mx-auto mt-1" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value} <span className="text-sm text-gray-400">{stat.suffix}</span></p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Tasks */}
            <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">مهام اليوم</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-medium">3/6</span>
                        <span className="text-gray-400">مكتملة</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: '50%' }} />
                </div>

                <div className="space-y-3">
                    {dailyTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${task.completed ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <button className="flex-shrink-0">
                                {task.completed ? (
                                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                                ) : (
                                    <Circle className="w-6 h-6 text-gray-400 hover:text-emerald-400" />
                                )}
                            </button>
                            <div className="flex-1">
                                <h4 className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                    {task.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[task.category]}`}>
                                        {task.category}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {task.time}
                                    </span>
                                </div>
                            </div>
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DailyTracking;
