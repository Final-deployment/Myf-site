import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Users, Search, Filter, Mail, Calendar, UserCheck, Eye, MessageSquare, BookOpen, GraduationCap, Shield, Activity, Star } from 'lucide-react';
import RatingBox from './RatingBox';
import { api } from '../services/api';
import { User } from '../types';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import StudentDetailsModal from './StudentDetailsModal';

interface SupervisorDashboardProps {
    onOpenChat?: (userId: string) => void;
}

/**
 * Stat item interface
 */
interface StatItem {
    label: string;
    value: string | number;
    icon: any;
    color: string;
}

const StatCard = memo<{ stat: StatItem }>(({ stat: { label, value, icon: Icon, color } }) => (
    <article className="glass-panel p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </article>
));

const StudentRow = memo<{
    student: User & { completedLessons?: number; activeCourses?: string };
    onView: (id: string) => void;
    onMessage: (studentId: string) => void;
}>(({ student, onView, onMessage }) => (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
        <td className="py-4 px-6">
            <div className="flex items-center gap-3">
                <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full bg-white/5"
                />
                <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-gray-400 text-sm">{student.email}</p>
                </div>
            </div>
        </td>
        <td className="py-4 px-6">
            <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>{student.joinDate?.split('T')[0]}</span>
            </div>
        </td>
        <td className="py-4 px-6 text-white">المستوى {student.level}</td>
        <td className="py-4 px-6">
            <div className="flex flex-col gap-1 max-w-[200px]">
                <span className="text-white text-sm line-clamp-1">
                    {student.activeCourses || 'لا يوجد'}
                </span>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min((student.completedLessons || 0) * 5, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-gray-400">{student.completedLessons || 0} درس</span>
                </div>
            </div>
        </td>
        <td className="py-4 px-6">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {student.status === 'active' ? 'نشط' : 'غير نشط'}
            </span>
        </td>
        <td className="py-4 px-6">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onView(student.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 transition-colors"
                    title="عرض التفاصيل"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onMessage(student.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="مراسلة الطالب"
                >
                    <MessageSquare className="w-4 h-4" />
                </button>
            </div>
        </td>
    </tr>
));

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ onOpenChat }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const debouncedSearch = useDebounce(searchTerm, 300);

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.supervisors.getMyStudents();
            setStudents(data || []);
        } catch (error) {
            console.error("Failed to load students", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const filteredStudents = useMemo<User[]>(() => {
        const term = debouncedSearch.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term)
        );
    }, [students, debouncedSearch]);

    const { paginatedItems, currentPage, totalPages, nextPage, prevPage } = usePagination<User>(filteredStudents, { itemsPerPage: 10 });

    const stats = useMemo(() => {
        const active = students.filter(s => s.status === 'active').length;
        const totalPoints = students.reduce((acc, s) => acc + (s.points || 0), 0);
        const avgLevel = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.level || 1), 0) / students.length) : 1;

        return [
            { label: 'طلابي', value: students.length, icon: Users, color: 'from-emerald-500 to-teal-600' },
            { label: 'النشطين', value: active, icon: UserCheck, color: 'from-blue-500 to-cyan-600' },
            { label: 'نقاط المجموعة', value: totalPoints, icon: Star, color: 'from-amber-500 to-orange-600' },
            { label: 'متوسط المستوى', value: avgLevel, icon: TrendingUp, color: 'from-purple-500 to-pink-600' },
        ];
    }, [students]);

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-serif">لوحة تحكم المشرف</h2>
                    <p className="text-gray-400">إدارة ومتابعة الطلاب المسندين إليك</p>
                </div>
                <button
                    onClick={() => {
                        const event = new CustomEvent('setActiveTab', { detail: 'students' });
                        window.dispatchEvent(event);
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-bold shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                    <Users className="w-5 h-5" />
                    <span>عرض كافة الطلاب</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} stat={stat as any} />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="glass-panel rounded-3xl overflow-hidden bg-white/5 border border-white/10">
                {/* Search & Filter Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث عن طالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-gray-400 text-sm">
                            <tr>
                                <th className="py-4 px-6 font-bold">الطالب</th>
                                <th className="py-4 px-6 font-bold">الانضمام</th>
                                <th className="py-4 px-6 font-bold">المستوى</th>
                                <th className="py-4 px-6 font-bold">التقدم</th>
                                <th className="py-4 px-6 font-bold">الحالة</th>
                                <th className="py-4 px-6 font-bold">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.map((student) => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    onView={(id) => { setSelectedStudentId(id); setDetailsModalOpen(true); }}
                                    onMessage={(id) => onOpenChat?.(id)}
                                />
                            ))}
                            {paginatedItems.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        لم يتم العثور على طلاب مطابقين للبحث أو لم يتم إسناد طلاب إليك بعد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-white/10 flex items-center justify-between">
                        <p className="text-gray-400 text-sm">صفحة {currentPage} من {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-50 transition-colors"
                            >
                                السابق
                            </button>
                            <button
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-50 transition-colors"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <StudentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                studentId={selectedStudentId}
                onMessage={(id) => {
                    onOpenChat?.(id);
                    setDetailsModalOpen(false);
                }}
            />

            {/* Rating Section */}
            <div className="mt-8">
                <RatingBox />
            </div>
        </div>
    );
};

export default SupervisorDashboard;
const TrendingUp: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
