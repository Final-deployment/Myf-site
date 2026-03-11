import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Users, Search, Mail, Calendar, UserCheck, Eye, MessageSquare, BookOpen, GraduationCap, Shield, Activity, Star, Info } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import StudentDetailsModal from './StudentDetailsModal';
import { useAuth } from './AuthContext';

interface SupervisorStudentsProps {
    onOpenChat?: (userId: string) => void;
}

const StatCard = memo<{ label: string; value: string | number; icon: any; color: string }>(({ label, value, icon: Icon, color }) => (
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

const StudentCard = memo<{
    student: User & { completedLessons?: number; activeCourses?: string };
    onView: (id: string) => void;
    onMessage: (studentId: string) => void;
}>(({ student, onView, onMessage }) => (
    <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-14 h-14 rounded-full bg-white/5 object-cover border-2 border-white/10 group-hover:border-emerald-500/50 transition-colors"
                    />
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0a1815] ${student.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div>
                    <h4 className="text-white font-bold text-lg">{student.name}</h4>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {student.email}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => onView(student.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 transition-colors"
                    title="عرض التفاصيل"
                >
                    <Eye className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onMessage(student.id)}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                    title="مراسلة الطالب"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">المستوى</p>
                <p className="text-white font-bold">{student.level}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">تاريخ الانضمام</p>
                <p className="text-white font-bold text-sm">{student.joinDate?.split('T')[0]}</p>
            </div>
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">التقدم الدراسي</span>
                <span className="text-emerald-400 font-bold">{student.completedLessons || 0} درس</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((student.completedLessons || 0) * 5, 100)}%` }}
                />
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-1 italic">
                {student.activeCourses ? `يدرس حالياً: ${student.activeCourses}` : 'لا توجد دورات نشطة'}
            </p>
        </div>
    </div>
));

const SupervisorStudents: React.FC<SupervisorStudentsProps> = ({ onOpenChat }) => {
    const { user } = useAuth();
    const [students, setStudents] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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

    const filteredStudents = useMemo(() => {
        const term = debouncedSearch.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term)
        );
    }, [students, debouncedSearch]);

    const stats = useMemo(() => {
        const activeCount = students.filter(s => s.status === 'active').length;
        const capacity = user?.supervisorCapacity || 0;

        return [
            {
                label: 'طلابي الحاليين',
                value: `${students.length} / ${capacity}`,
                icon: Users,
                color: 'from-emerald-500 to-teal-600'
            },
            {
                label: 'الطلاب النشطين',
                value: activeCount,
                icon: UserCheck,
                color: 'from-blue-500 to-cyan-600'
            },
            {
                label: 'المساحة المتبقية',
                value: Math.max(0, capacity - students.length),
                icon: Info,
                color: 'from-amber-500 to-orange-600'
            }
        ];
    }, [students, user?.supervisorCapacity]);

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-serif">قسم الطلاب</h2>
                    <p className="text-gray-400">متابعة دقيقة لمستوى وتقدم الطلاب المسجلين تحت إشرافك</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث عن طالب بكافة التفاصيل..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            {/* Students Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 glass-panel rounded-2xl animate-pulse bg-white/5" />
                    ))}
                </div>
            ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            onView={(id) => { setSelectedStudentId(id); setDetailsModalOpen(true); }}
                            onMessage={(id) => onOpenChat?.(id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-12 text-center rounded-3xl bg-white/5 border border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">لا يوجد طلاب</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                        {searchTerm ? 'لم يتم العثور على نتائج تطابق بحثك.' : 'لم يتم إسناد طلاب إليك بعد.'}
                    </p>
                </div>
            )}

            {/* Details Modal */}
            <StudentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                studentId={selectedStudentId}
                onMessage={(id) => {
                    onOpenChat?.(id);
                    setDetailsModalOpen(false);
                }}
            />
        </div>
    );
};

export default SupervisorStudents;
