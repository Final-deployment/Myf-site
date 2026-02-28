/**
 * @fileoverview Admin Students management component
 * @module components/AdminStudents
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Users, Search, Filter, Mail, Calendar, UserCheck, UserX, GraduationCap, X, Check, LucideIcon, Edit, Eye, MessageSquare, BookOpen, Book, Shield, ArrowRightLeft, Settings, Award, Save } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { sanitizeHTML, sanitizeEmail } from '../utils/sanitize';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import EditStudentModal from './EditStudentModal';
import StudentDetailsModal from './StudentDetailsModal';

interface AdminStudentsProps {
    setActiveTab?: (tab: string) => void;
    onOpenChat?: (userId: string) => void;
}

/**
 * New student form data interface
 */
interface NewStudentForm {
    name: string;
    email: string;
    password: string;
    role: 'student';
}

/**
 * Stat item interface
 */
interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
}

/**
 * Stat card component
 */
const StatCard = memo<{ stat: StatItem }>(({ stat }) => (
    <article className="glass-panel p-5 rounded-2xl" aria-label={`${stat.label}: ${stat.value}`}>
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`} aria-hidden="true">
                <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
        </div>
    </article>
));
StatCard.displayName = 'StatCard';

/**
 * Student row component
 */
const StudentRow = memo<{
    student: User & { completedLessons?: number; activeCourses?: string };
    supervisors: User[];
    onDelete: (id: string) => void;
    onEdit: (student: User) => void;
    onView: (id: string) => void;
    onPromote: (student: User) => void;
    onTransfer: (student: User) => void;
    onDemote: (id: string) => void;
}>(({ student, supervisors, onDelete, onEdit, onView, onPromote, onTransfer, onDemote }) => {
    const handleDelete = useCallback(() => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            onDelete(student.id);
        }
    }, [student.id, onDelete]);


    // Removed handleEmail as it's replaced by onMessage

    const statusLabel = useMemo(() => {
        switch (student.status) {
            case 'active': return 'نشط';
            case 'inactive': return 'غير نشط';
            default: return 'معلق';
        }
    }, [student.status]);

    const statusClass = useMemo(() => {
        switch (student.status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400';
            case 'inactive': return 'bg-red-500/20 text-red-400';
            default: return 'bg-amber-500/20 text-amber-400';
        }
    }, [student.status]);

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <img
                        src={student.avatar}
                        alt={`صورة ${student.name}`}
                        className="w-10 h-10 rounded-full bg-white/5"
                        loading="lazy"
                    />
                    <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-gray-400 text-sm">{student.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span>{student.joinDate?.split('T')[0]}</span>
                </div>
            </td>
            <td className="py-4 px-6 text-white">المستوى {student.level}</td>
            <td className="py-4 px-6">
                <div className="flex flex-col gap-1 max-w-[200px]">
                    <span className="text-white text-sm line-clamp-1" title={student.activeCourses || 'لا يوجد'}>
                        {student.activeCourses || 'لا يوجد'}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min((student.completedLessons || 0) * 5, 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{student.completedLessons || 0} درس</span>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                {student.role === 'supervisor' ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg w-fit">
                        <Shield className="w-4 h-4" />
                        <span>مشرف ({student.supervisorPriority})</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-xs">المشرف:</span>
                        <span className="text-white text-sm">
                            {supervisors.find(sv => sv.id === student.supervisorId)?.name || 'الإدارة'}
                        </span>
                    </div>
                )}
            </td>
            <td className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                </span>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onView(student.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 transition-colors"
                        title="عرض الملف"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(student)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-blue-400 transition-colors"
                        title="تعديل"
                    >
                        <Edit className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 transition-colors"
                        title="حذف"
                    >
                        <UserX className="w-4 h-4" />
                    </button>
                    {student.role === 'student' ? (
                        <button
                            onClick={() => onPromote(student)}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="تعيين كمشرف"
                        >
                            <Award className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onDemote(student.id)}
                            className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                            title="إلغاء الإشراف"
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                    )}
                    {student.role === 'student' && (
                        <button
                            onClick={() => onTransfer(student)}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="نقل لمشرف آخر"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});
StudentRow.displayName = 'StudentRow';

/**
 * Add student modal component
 */
const AddStudentModal = memo<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewStudentForm) => void;
}>(({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<NewStudentForm>({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) return;
        onSubmit(formData);
        setFormData({ name: '', email: '', password: '', role: 'student' });
    }, [formData, onSubmit]);

    const handleChange = useCallback((field: keyof NewStudentForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-[#0a1815] border border-white/10 rounded-3xl w-full max-w-lg p-6 relative animate-fade-in border-t border-emerald-500/20">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="إغلاق النافذة"
                >
                    <X className="w-6 h-6" aria-hidden="true" />
                </button>

                <h3 id="modal-title" className="text-2xl font-bold text-white mb-6 font-serif">إضافة طالب جديد</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-400 text-sm mb-2">الاسم الكامل</label>
                        <input
                            id="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="أدخل اسم الطالب"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="example@domain.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-gray-400 text-sm mb-2">كلمة المرور المؤقتة</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="******"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" aria-hidden="true" />
                            <span>إضافة الطالب</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
AddStudentModal.displayName = 'AddStudentModal';

/**
 * Promote Student to Supervisor Modal
 */
const PromoteSupervisorModal = memo<{
    isOpen: boolean;
    onClose: () => void;
    student: User | null;
    onSubmit: (capacity: number, priority: number) => void;
}>(({ isOpen, onClose, student, onSubmit }) => {
    const [capacity, setCapacity] = useState(10);
    const [priority, setPriority] = useState(1);

    useEffect(() => {
        if (student) {
            setCapacity(student.supervisorCapacity || 10);
            setPriority(student.supervisorPriority || 1);
        }
    }, [student]);

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a1815] border border-white/10 rounded-3xl w-full max-w-md p-6 relative animate-fade-in border-t border-emerald-500/20">
                <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-white mb-6 font-serif">تعيين كمشرف: {student.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">سعة الطلاب القصوى</label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">أولوية الانضمام (1 هو الأعلى)</label>
                        <input
                            type="number"
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold">إلغاء</button>
                        <button
                            onClick={() => onSubmit(capacity, priority)}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                        >
                            <Shield className="w-5 h-5" />
                            <span>تثبيت كمشرف</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
PromoteSupervisorModal.displayName = 'PromoteSupervisorModal';

/**
 * Transfer Student to Supervisor Modal
 */
const TransferStudentModal = memo<{
    isOpen: boolean;
    onClose: () => void;
    student: User | null;
    supervisors: User[];
    onSubmit: (supervisorId: string | null) => void;
}>(({ isOpen, onClose, student, supervisors, onSubmit }) => {
    const [selectedId, setSelectedId] = useState<string | null>(student?.supervisorId || null);

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a1815] border border-white/10 rounded-3xl w-full max-w-md p-6 relative animate-fade-in border-t border-emerald-500/20">
                <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-white mb-6 font-serif">نقل الطالب: {student.name}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">اختر المشرف الجديد</label>
                        <select
                            value={selectedId || ''}
                            onChange={(e) => setSelectedId(e.target.value || null)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">الإدارة مباشرة</option>
                            {supervisors.map(sv => (
                                <option key={sv.id} value={sv.id}>{sv.name} ({sv.email})</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold">إلغاء</button>
                        <button
                            onClick={() => onSubmit(selectedId)}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                            <span>نقل الطالب</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
TransferStudentModal.displayName = 'TransferStudentModal';

/**
 * Supervisor Settings Card Component
 */
const SupervisorSettingsCard = memo<{
    supervisor: User & { studentCount?: number };
    onUpdate: (id: string, capacity: number, priority: number) => Promise<void>;
}>(({ supervisor, onUpdate }) => {
    const [capacity, setCapacity] = useState(supervisor.supervisorCapacity || 10);
    const [priority, setPriority] = useState(supervisor.supervisorPriority || 0);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state with props
    useEffect(() => {
        setCapacity(supervisor.supervisorCapacity || 10);
        setPriority(supervisor.supervisorPriority || 0);
    }, [supervisor]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(supervisor.id, capacity, priority);
            alert('تم حفظ الإعدادات بنجاح');
        } catch (e: any) {
            alert('فشل الحفظ: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="text-white font-medium">{supervisor.name}</p>
                <p className="text-gray-400 text-xs">{supervisor.email}</p>
                <p className="text-emerald-400 text-[10px] mt-1">الطلاب الحاليين: {supervisor.studentCount || 0}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-24">
                    <label className="text-[10px] text-gray-400 block mb-1">السعة</label>
                    <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                    />
                </div>
                <div className="w-24">
                    <label className="text-[10px] text-gray-400 block mb-1">الأولوية</label>
                    <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="mt-4 p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white disabled:opacity-50"
                    title="حفظ الإعدادات"
                >
                    <Save className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});
SupervisorSettingsCard.displayName = 'SupervisorSettingsCard';

/**
 * Supervisor Settings Modal
 */
const SupervisorSettingsModal = memo<{
    isOpen: boolean;
    onClose: () => void;
    supervisors: (User & { studentCount?: number })[];
    onUpdate: (id: string, capacity: number, priority: number) => void;
}>(({ isOpen, onClose, supervisors, onUpdate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a1815] border border-white/10 rounded-3xl w-full max-w-2xl p-6 relative animate-fade-in border-t border-emerald-500/20">
                <button onClick={onClose} className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-white mb-6 font-serif">إدارة المشرفين والأولويات</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {supervisors.map((sv) => (
                        <SupervisorSettingsCard key={sv.id} supervisor={sv} onUpdate={onUpdate} />
                    ))}
                    {supervisors.length === 0 && (
                        <p className="text-center text-gray-500 py-8">لا يوجد مشرفين حالياً. قم بترقية أحد الطلاب ليصبح مشرفاً.</p>
                    )}
                </div>
                <div className="pt-6">
                    <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold">إغلاق</button>
                </div>
            </div>
        </div>
    );
});
SupervisorSettingsModal.displayName = 'SupervisorSettingsModal';

/**
 * Admin Students component - Student management interface
 * 
 * Features:
 * - Student listing with search and filter
 * - Add new student functionality
 * - Delete student with confirmation
 * - Statistics overview
 * - Pagination support
 * - ARIA accessibility
 * 
 * @returns AdminStudents component
 */
const AdminStudents: React.FC<AdminStudentsProps> = memo(({ setActiveTab, onOpenChat }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Filter State
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New State for Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [supervisorSettings, setSupervisorSettings] = useState<{ userId: string, capacity: number, priority: number } | null>(null);

    // Debounce search for performance
    const debouncedSearch = useDebounce(searchTerm, 300);

    /** Load students and supervisors from API */
    /** Load students and supervisors from API */
    const loadData = useCallback(async () => {
        // Load Students
        try {
            const allUsers = await api.getUsers();
            if (Array.isArray(allUsers)) {
                setStudents(allUsers);
            }
        } catch (error) {
            console.error("Failed to load students", error);
        }

        // Load Supervisors (Independent)
        try {
            const allSupervisors = await api.supervisors.list();
            if (Array.isArray(allSupervisors)) {
                setSupervisors(allSupervisors);
            }
        } catch (error) {
            console.error("Failed to load supervisors", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /** Filter students based on search term and filters */
    const filteredStudents = useMemo(() => {
        const term = debouncedSearch.toLowerCase();
        return students.filter(student => {
            const matchesSearch = (student as User).name.toLowerCase().includes(term) ||
                (student as User).email.toLowerCase().includes(term);

            const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [students, debouncedSearch, statusFilter]);

    /** Use pagination hook */
    const { paginatedItems, currentPage, totalPages, nextPage, prevPage } = usePagination(filteredStudents, { itemsPerPage: 10 });

    /** Handle add student */
    const handleAddStudent = useCallback(async (formData: NewStudentForm) => {
        try {
            // Sanitize inputs
            const sanitizedName = sanitizeHTML(formData.name);
            const sanitizedEmail = sanitizeEmail(formData.email);

            await api.createUser({
                name: sanitizedName,
                nameEn: sanitizedName,
                email: sanitizedEmail,
                password: formData.password, // Include password
                role: 'student',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=064e3b&color=fff&size=100`,
                points: 0,
                level: 1,
                streak: 0,
                joinDate: new Date().toISOString().split('T')[0],
                status: 'active'
            });

            setIsAddModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error("Failed to add student", error);
            alert(`حدث خطأ أثناء إضافة الطالب: ${error.message || 'خطأ غير معروف'}`);
        }
    }, [loadData]);

    /** Handle delete student */
    const handleDeleteStudent = useCallback(async (id: string) => {
        await api.deleteUser(id);
        loadData();
    }, [loadData]);

    /** Handle update student */
    const handleUpdateStudent = useCallback(async (id: string, updates: Partial<User>) => {
        await api.updateUser(id, updates);
        setEditModalOpen(false);
        loadData();
    }, [loadData]);

    /** Open Edit Modal */
    const openEditModal = useCallback((student: User) => {
        setSelectedStudent(student);
        setEditModalOpen(true);
    }, []);

    /** Open Details Modal */
    const openDetailsModal = useCallback((id: string) => {
        setSelectedStudentId(id);
        setDetailsModalOpen(true);
    }, []);

    const handlePromote = useCallback(async (capacity: number, priority: number) => {
        if (selectedStudent) {
            try {
                await api.supervisors.promote(selectedStudent.id, capacity, priority);
                setIsPromoteModalOpen(false);
                loadData();
            } catch (error: any) {
                console.error("Failed to promote supervisor", error);
                alert(`فشل ترقية المشرف: ${error.message}`);
            }
        }
    }, [selectedStudent, loadData]);

    const handleTransfer = useCallback(async (supervisorId: string | null) => {
        if (selectedStudent) {
            try {
                await api.supervisors.assignStudent(selectedStudent.id, supervisorId);
                setIsTransferModalOpen(false);
                loadData();
            } catch (error: any) {
                console.error("Failed to transfer student", error);
                alert(`فشل نقل الطالب: ${error.message}`);
            }
        }
    }, [selectedStudent, loadData]);

    const handleDemote = useCallback(async (supervisorId: string) => {
        if (window.confirm('هل أنت متأكد من إلغاء تعيين هذا المشرف؟ سيتم تحويل طلابه للإدارة.')) {
            try {
                await api.supervisors.demote(supervisorId, null);
                loadData();
            } catch (error: any) {
                console.error("Failed to demote supervisor", error);
                alert(`فشل إلغاء المشرف: ${error.message}`);
            }
        }
    }, [loadData]);

    const handleUpdateSvSettings = useCallback(async (id: string, cap: number, prio: number) => {
        try {
            await api.supervisors.updateSettings(id, cap, prio);
            loadData();
        } catch (error: any) {
            console.error("Failed to update settings", error);
            alert(`فشل تحديث الإعدادات: ${error.message}`);
        }
    }, [loadData]);


    /** Handle email student */
    const handleEmailStudent = useCallback((email: string) => {
        window.location.href = `mailto:${email}`;
    }, []);

    /** Handle search change */
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    /** Open add modal */
    const handleOpenAddModal = useCallback(() => {
        setIsAddModalOpen(true);
    }, []);

    /** Close add modal */
    const handleCloseAddModal = useCallback(() => {
        setIsAddModalOpen(false);
    }, []);

    /** Statistics */
    const stats: StatItem[] = useMemo(() => {
        const totalStudents = students.length;
        const totalLessons = students.reduce((acc, s: any) => acc + (s.completedLessons || 0), 0);
        const avgProgress = totalStudents > 0 ? Math.round((totalLessons / (totalStudents * 20)) * 100) : 0; // Assuming 20 lessons average

        return [
            { label: 'إجمالي الطلاب', value: totalStudents, icon: Users, color: 'from-emerald-500 to-teal-600' },
            { label: 'الطلاب النشطين', value: students.filter(s => s.status === 'active').length, icon: UserCheck, color: 'from-blue-500 to-cyan-600' },
            { label: 'دروس مكتملة', value: totalLessons, icon: BookOpen, color: 'from-amber-500 to-orange-600' },
            { label: 'معدل الإنجاز', value: `${avgProgress}%`, icon: GraduationCap, color: 'from-purple-500 to-pink-600' },
        ];
    }, [students]);

    return (
        <div className="animate-fade-in space-y-6 relative" role="main" aria-label="إدارة الطلاب">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة الطلاب</h2>
                    <p className="text-gray-300">عرض وإدارة جميع الطلاب المسجلين</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSupervisorModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold transition-all"
                    >
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span>إدارة المشرفين</span>
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-bold shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-105"
                    >
                        <Users className="w-5 h-5" />
                        <span>إضافة طالب</span>
                    </button>
                </div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="إحصائيات الطلاب">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} stat={stat} />
                ))}
            </section>

            {/* Search and Filter */}
            <section className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4" aria-label="البحث والتصفية">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="بحث عن طالب..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        aria-label="البحث عن طالب"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                        aria-label="تصفية حسب الحالة"
                    >
                        <option value="all" className="text-black">جميع الحالات</option>
                        <option value="active" className="text-black">نشط</option>
                        <option value="inactive" className="text-black">غير نشط</option>
                    </select>
                </div>
            </section>

            {/* Students Table */}
            <section className="glass-panel rounded-2xl overflow-hidden" aria-label="قائمة الطلاب">
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 flex flex-col h-[calc(100vh-280px)]">
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-right" aria-label="جدول الطلاب">
                            <thead className="bg-white/5 text-gray-400 text-sm font-medium sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="py-4 px-6">الطالب</th>
                                    <th className="py-4 px-6">تاريخ الانضمام</th>
                                    <th className="py-4 px-6">المستوى</th>
                                    <th className="py-4 px-6">التقدم</th>
                                    <th className="py-4 px-6">المشرف</th>
                                    <th className="py-4 px-6">الحالة</th>
                                    <th className="py-4 px-6">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedItems.map((item) => {
                                    const student = item as User;
                                    return (
                                        <StudentRow
                                            key={student.id}
                                            student={student}
                                            supervisors={supervisors}
                                            onDelete={handleDeleteStudent}
                                            onEdit={openEditModal}
                                            onView={openDetailsModal}
                                            onPromote={() => { setSelectedStudent(student); setIsPromoteModalOpen(true); }}
                                            onTransfer={() => { setSelectedStudent(student); setIsTransferModalOpen(true); }}
                                            onDemote={handleDemote}
                                        />
                                    );
                                })}
                                {paginatedItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-500">
                                            لا يوجد طلاب مطابقين للبحث
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-sm flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                            عرض {paginatedItems.length} من أصل {filteredStudents.length} طالب
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                السابق
                            </button>
                            <button
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {isAddModalOpen && (
                <AddStudentModal
                    isOpen={isAddModalOpen}
                    onClose={handleCloseAddModal}
                    onSubmit={handleAddStudent}
                />
            )}

            <PromoteSupervisorModal
                isOpen={isPromoteModalOpen}
                onClose={() => setIsPromoteModalOpen(false)}
                student={selectedStudent}
                onSubmit={handlePromote}
            />

            <TransferStudentModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                student={selectedStudent}
                supervisors={supervisors}
                onSubmit={handleTransfer}
            />

            <SupervisorSettingsModal
                isOpen={isSupervisorModalOpen}
                onClose={() => setIsSupervisorModalOpen(false)}
                supervisors={supervisors as any}
                onUpdate={handleUpdateSvSettings}
            />

            {editModalOpen && selectedStudent && (
                <EditStudentModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSubmit={handleUpdateStudent}
                    student={selectedStudent}
                />
            )}

            {/* Student Details Modal */}
            <StudentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                studentId={selectedStudentId}
            />
        </div>
    );
});

AdminStudents.displayName = 'AdminStudents';

export default AdminStudents;
