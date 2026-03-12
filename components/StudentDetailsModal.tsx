import React, { useState, useEffect } from 'react';
import { X, Mail, BookOpen, Award, Activity, Calendar, MapPin, Phone, UserCheck, History, ListFilter } from 'lucide-react';
import { User, Course, Certificate } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface StudentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string | null;
    onMessage?: (studentId: string) => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ isOpen, onClose, studentId, onMessage }) => {
    const { user } = useAuth();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState<'recent' | 'progress_desc' | 'progress_asc' | 'deadline'>('recent');

    const sortedEnrollments = React.useMemo(() => {
        if (!details?.enrollments) return [];
        return [...details.enrollments].sort((a, b) => {
            if (sortBy === 'progress_desc') return b.progress - a.progress;
            if (sortBy === 'progress_asc') return a.progress - b.progress;
            if (sortBy === 'deadline') {
                const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
                const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
                return dateA - dateB;
            }
            // default 'recent'
            const dateA = a.last_accessed || a.enrolled_at || '';
            const dateB = b.last_accessed || b.enrolled_at || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [details?.enrollments, sortBy]);

    useEffect(() => {
        if (isOpen && studentId) {
            loadDetails();
        }
    }, [isOpen, studentId]);

    const loadDetails = async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const data = await api.getUserDetails(studentId);
            setDetails(data);
        } catch (error) {
            console.error('Failed to load details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockCourse = async (courseId: string) => {
        if (!studentId) return;
        try {
            const res = await api.supervisors.unlockCourse(studentId, courseId, 2);
            if (res.success) {
                alert('تم فتح المساق وتمديد الفترة الزمنية لمدة يومين بنجاح');
                loadDetails();
            }
        } catch (e: any) {
            alert(e.message || 'فشل في فتح المساق');
        }
    };

    if (!isOpen || !studentId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="glass-panel w-full max-w-4xl p-0 relative animate-fade-in rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
                    <div className="flex items-center gap-4">
                        {details?.user?.avatar && (
                            <img
                                src={details.user.avatar}
                                alt={details.user.name}
                                className="w-16 h-16 rounded-2xl border-2 border-emerald-500/50"
                            />
                        )}
                        <div>
                            <h3 className="text-2xl font-bold text-white">{details?.user?.name}</h3>
                            <p className="text-gray-400">{details?.user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${details?.user?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {details?.user?.status === 'active' ? 'نشط' : 'غير نشط'}
                                </span>
                                <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-gray-300">
                                    المستوى {details?.user?.level}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {user?.role === 'supervisor' && onMessage && (
                            <button
                                onClick={() => onMessage(studentId)}
                                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                                title="إرسال رسالة"
                            >
                                <Mail className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400">جاري التحميل...</div>
                ) : (
                    <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                        {/* Personal Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-xs">الموقع</span>
                                </div>
                                <p className="text-white">{details?.user?.country || 'غير محدد'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs">واتساب</span>
                                </div>
                                <p className="text-white" dir="ltr">{details?.user?.whatsapp || '-'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs">تاريخ الانضمام</span>
                                </div>
                                <p className="text-white">{details?.user?.joinDate?.split('T')[0]}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <UserCheck className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs">المشرف المسؤول</span>
                                </div>
                                <p className="text-white">{details?.user?.supervisorName || 'لا يوجد'}</p>
                            </div>
                        </div>

                        {/* Supervisor Info */}
                        {details?.user?.role === 'supervisor' && (
                            <div>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                    بيانات المشرف
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 border-l-4 border-l-purple-500">
                                        <p className="text-gray-400 text-xs mb-1">الطلاب الحاليين</p>
                                        <p className="text-2xl font-bold text-white">{details.user.studentCount || 0}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 border-l-4 border-l-blue-500">
                                        <p className="text-gray-400 text-xs mb-1">السعة القصوى</p>
                                        <p className="text-2xl font-bold text-white">{details.user.supervisorCapacity || 0}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 border-l-4 border-l-emerald-500">
                                        <p className="text-gray-400 text-xs mb-1">الأولوية</p>
                                        <p className="text-2xl font-bold text-white">{details.user.supervisorPriority || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Academic Data (Shown for Students only) */}
                        {details?.user?.role === 'student' && (
                            <>
                                {/* Enrollments */}
                                <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h4 className="flex items-center gap-2 text-lg font-bold text-white">
                                    <BookOpen className="w-5 h-5 text-emerald-400" />
                                    الدورات المسجلة
                                </h4>
                                {details?.enrollments?.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <ListFilter className="w-4 h-4 text-gray-400" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        >
                                            <option value="recent">الأحدث دخولاً</option>
                                            <option value="progress_desc">الأعلى إنجازاً</option>
                                            <option value="progress_asc">الأقل إنجازاً</option>
                                            <option value="deadline">حسب الموعد النهائي</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                {sortedEnrollments.length > 0 ? (
                                    sortedEnrollments.map((course: any, idx: number) => {
                                        const isLocked = !!course.is_locked;
                                        const deadline = course.deadline ? new Date(course.deadline) : null;
                                        const isExpired = deadline ? deadline.getTime() < Date.now() : false;
                                        const diffDays = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 3600 * 24)) : null;
                                        const isExemptUser = details?.user?.role === 'admin' || details?.user?.role === 'supervisor';

                                        return (
                                            <div key={idx} className={`bg-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border ${isLocked && !isExemptUser ? 'border-red-500/50' : 'border-transparent'}`}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-medium ${isLocked && !isExemptUser ? 'text-red-400' : 'text-white'}`}>{course.courseTitle}</p>
                                                        {isLocked && !isExemptUser && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">مغلق (لانتهاء الوقت)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <p className="text-xs text-gray-400">آخر دخول: {course.last_accessed ? new Date(course.last_accessed).toLocaleDateString('ar-EG') : (course.progress > 0 && course.enrolled_at ? new Date(course.enrolled_at).toLocaleDateString('ar-EG') : 'لم يبدأ التعلم بعد')}</p>
                                                        {!isExemptUser && (course.lessons_count || 0) > 0 && (
                                                            <p className="text-xs text-blue-400 font-bold">الدروس المنجزة: {course.completed_lessons || 0} من {course.lessons_count}</p>
                                                        )}
                                                        {!isExemptUser && deadline && (
                                                            <p className={`text-xs font-bold ${isExpired || isLocked ? 'text-red-400' : diffDays && diffDays <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                                المهلة: {deadline.toLocaleDateString('ar-EG')}
                                                                {!isExpired && diffDays !== null && ` (متبقي ${diffDays} يوم)`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-3 min-w-[120px]">
                                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${isLocked && !isExemptUser ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${course.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-sm font-bold ${isLocked && !isExemptUser ? 'text-red-400' : 'text-emerald-400'}`}>{course.progress}%</span>
                                                    </div>
                                                    {isLocked && (user?.role === 'supervisor' || user?.role === 'admin') && (
                                                        <button
                                                            onClick={() => handleUnlockCourse(course.course_id)}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            تمديد (يومين)
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">لا توجد دورات مسجلة</p>
                                )}
                            </div>
                        </div>

                        {/* Extension Archive */}
                        <div>
                            <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                <History className="w-5 h-5 text-blue-400" />
                                أرشيف التمديدات ({details?.extensions?.length || 0})
                            </h4>
                            <div className="space-y-3">
                                {details?.extensions?.length > 0 ? (
                                    details.extensions.map((ext: any) => (
                                        <div key={ext.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-blue-500/20">
                                            <div>
                                                <p className="font-medium text-white text-sm">{ext.courseTitle}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    تم التمديد بواسطة: <span className="text-blue-400">{ext.extendedBy}</span>
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-blue-400">+{ext.days_added} أيام</p>
                                                <p className="text-[10px] text-gray-500 mt-1">
                                                    {new Date(ext.extended_at).toLocaleString('ar-EG')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">لا يوجد تمديدات سابقة لهذا الطالب</p>
                                )}
                            </div>
                        </div>

                        {/* Certificates */}
                        <div>
                            <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                <Award className="w-5 h-5 text-amber-400" />
                                الشهادات
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {details?.certificates?.length > 0 ? (
                                    details.certificates.map((cert: Certificate) => (
                                        <div key={cert.id} className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                                                <Award className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-amber-100 font-bold line-clamp-1">{cert.courseTitle}</p>
                                                <p className="text-amber-500/60 text-xs">{cert.issueDate}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="col-span-2 text-gray-500 text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">لا توجد شهادات مكتسبة</p>
                                )}
                            </div>
                        </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDetailsModal;
