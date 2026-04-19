import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Course, CourseFolder } from '../types';
import { api } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { Folder, ChevronRight, Plus, X, Image as ImageIcon, LayoutGrid, ArrowRight, Lock, Book, Award, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { QuizResult } from '../types';

interface CoursesGridProps {
    onPlayCourse: (course: Course) => void;
}

const CoursesGrid: React.FC<CoursesGridProps> = ({ onPlayCourse }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [folders, setFolders] = useState<CourseFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [confirmEnroll, setConfirmEnroll] = useState<Course | null>(null);

    // Add Folder Form State
    const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
    const [newFolderForm, setNewFolderForm] = useState({ name: '', thumbnail: '' });

    const loadData = async () => {
        try {
            const [coursesData, foldersData] = await Promise.all([
                api.getCourses(),
                api.getFolders()
            ]);

            if (Array.isArray(coursesData)) {
                const sorted = [...coursesData].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                setCourses(sorted);
            }
            if (Array.isArray(foldersData)) setFolders(foldersData);

            // Fetch quiz results and quizzes for grade display
            try {
                const [resultsData, quizzesData] = await Promise.all([
                    api.quizResults.get(),
                    api.getQuizzes()
                ]);
                setQuizResults(resultsData || []);
                setQuizzes(quizzesData || []);
            } catch (e) {
                console.error('Failed to load quiz data:', e);
            }

        } catch (error) {
            console.error("Failed to load data", error);
            setError('فشل تحميل البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    // Re-fetch courses on every navigation to this page to get fresh isLocked status.
    // location.key changes on every navigation event, triggering a refetch.
    const location = useLocation();

    useEffect(() => {
        loadData();
    }, [location.key]);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createFolder(newFolderForm.name, newFolderForm.thumbnail);
            setIsAddFolderModalOpen(false);
            setNewFolderForm({ name: '', thumbnail: '' });
            loadData();
        } catch (err: any) {
            alert(err.message || 'فشل إنشاء المجلد');
        }
    };

    const currentFolder = folders.find(f => f.id === selectedFolderId);

    // Filter folders based on whether they have courses for the student
    // (In folder view, we show all folders that contain any courses)
    // Actually, user wants "Folders for general course names".

    const visibleFolders = selectedFolderId ? [] : (isAdmin ? folders : folders.filter(f => courses.some(c => c.folderId === f.id)));

    // Courses to show in current view
    const visibleCourses = selectedFolderId
        ? courses.filter(c => c.folderId === selectedFolderId)
        : [];

    const enrolledCourses = courses.filter(course => (course as any).isEnrolled);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 py-10">
                {error}
            </div>
        )
    }

    return (
        <div className="animate-fade-in relative z-10 p-6 lg:p-8 pb-24 lg:pb-8 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-transparent">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">دوراتي</h2>
                    {selectedFolderId ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                className="hover:text-emerald-300 flex items-center gap-1 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                                العودة للمجلدات
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                            <span>{currentFolder?.name}</span>
                        </div>
                    ) : (
                        <p className="text-gray-300">تصفح الدورات المنظمة في مجلدات تعليمية</p>
                    )}
                </div>

                {!selectedFolderId && isAdmin && (
                    <button
                        onClick={() => setIsAddFolderModalOpen(true)}
                        className="px-5 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-xl border border-violet-500/30 flex items-center gap-2 transition-all shadow-lg shadow-violet-900/10"
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة مجلد</span>
                    </button>
                )}
            </div>

            {/* Folder Grid */}
            {!selectedFolderId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleFolders.map(folder => {
                        const folderCourses = courses.filter(c => c.folderId === folder.id);
                        const enrolledInFolder = folderCourses.filter(c => (c as any).isEnrolled);

                        return (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className="glass-panel p-0 rounded-2xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all bg-white/5 hover:bg-black/40 border border-white/10 relative h-64 overflow-hidden"
                            >
                                <img
                                    src={folder.thumbnail}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40"
                                    alt={folder.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:scale-110 transition-all duration-300">
                                            <Folder className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors drop-shadow-lg">{folder.name}</h3>
                                    </div>
                                    <div className="flex gap-4 text-xs font-semibold">
                                        <span className="text-gray-300 flex items-center gap-1.5">
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            {folderCourses.length} دورات
                                        </span>
                                        {enrolledInFolder.length > 0 && (
                                            <span className="text-emerald-400 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                {enrolledInFolder.length} ملتحق بها
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <ChevronRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                {/* Admin folder controls */}
                                {isAdmin && (
                                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newName = prompt('أدخل الاسم الجديد للمجلد:', folder.name);
                                                if (newName && newName.trim()) {
                                                    api.updateFolder(folder.id, { name: newName.trim() }).then(() => loadData()).catch(() => alert('فشل تحديث المجلد'));
                                                }
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-400 flex items-center justify-center backdrop-blur-md shadow-lg transition-all"
                                            title="تعديل الاسم"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-white" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`هل أنت متأكد من حذف مجلد "${folder.name}"؟ \nسيتم نقل المساقات المرتبطة به ولن تُحذف.`)) {
                                                    api.deleteFolder(folder.id).then(() => loadData()).catch(() => alert('فشل حذف المجلد'));
                                                }
                                            }}
                                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-400 flex items-center justify-center backdrop-blur-md shadow-lg transition-all"
                                            title="حذف المجلد"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Folder Card for Admins */}
                    {isAdmin && (
                        <div
                            onClick={() => setIsAddFolderModalOpen(true)}
                            className="group glass-panel h-64 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all animate-pulse-subtle"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20 group-hover:bg-violet-600 group-hover:scale-110 transition-all duration-300">
                                <Plus className="w-8 h-8 text-violet-400 group-hover:text-white" />
                            </div>
                            <div className="text-center">
                                <span className="block text-white font-bold text-lg group-hover:text-violet-300 transition-colors">إضافة مجلد لدورة جديدة</span>
                                <span className="text-gray-500 text-xs">لتنظيم مجموعة من الدورات التعليمية</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Courses View (Inside Folder) */}
            {selectedFolderId && (
                <div className="space-y-8 animate-slide-up">
                    {/* --- Study Schedule & Constraints Information --- */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4">
                            <Book className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-xl font-bold text-white">الخطة الدراسية والجدول الزمني</h3>
                        </div>

                        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" /> تقييدات فنية هامة:
                            </h4>
                            <ul className="list-disc leading-relaxed list-inside text-sm text-amber-200/80 space-y-1">
                                <li><strong>التسلسل الإلزامي:</strong> لا يمكنك الانتقال إلى المحاضرة التالية قبل إتمام المحاضرة الحالية بالكامل.</li>
                                <li><strong>فتح المواد:</strong> تفتح المواد تدريجياً، ولا يمكنك فتح مادة جديدة قبل اجتياز امتحان المادة التي تسبقها بنجاح.</li>
                                <li><strong>الإغلاق التلقائي (وقت الدراسة المتاح):</strong> لكل مادة فترة زمنية محددة بالأيام تبدأ من لحظة التحاقك بها. إذا لم يتم تقديم الامتحان واجتيازه خلال هذه الفترة، سيتم <strong>إغلاق المساق</strong> ولن تتمكن من الدخول إليه، وعليك مراجعة المشرف لفتحه مجدداً.</li>
                            </ul>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tr-lg font-bold">المادة</th>
                                        <th className="px-4 py-3 font-bold text-center">عدد المحاضرات</th>
                                        <th className="px-4 py-3 font-bold text-center">ساعات المادة</th>
                                        <th className="px-4 py-3 font-bold text-center">وقت الدراسة المتاح</th>
                                        <th className="px-4 py-3 font-bold text-center">الحالة</th>
                                        <th className="px-4 py-3 rounded-tl-lg font-bold text-center">العلامة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleCourses.map((course, idx) => {
                                        const isEnrolled = (course as any).isEnrolled;
                                        const isExempt = user?.role === 'admin' || user?.role === 'supervisor';
                                        const effectivelyLocked = course.isLocked && !isExempt;
                                        return (
                                            <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                    {course.title}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-300 font-medium">{course.lessonsCount}</td>
                                                <td className="px-4 py-3 text-center text-emerald-400 font-medium">{course.duration}</td>
                                                <td className="px-4 py-3 text-center text-amber-400 font-bold">{(course as any).daysAvailable || 30} يوم</td>
                                                <td className="px-4 py-3 text-center">
                                                    {isEnrolled ? (
                                                        course.progress >= 100 ? (
                                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">✓ منتهية</span>
                                                        ) : (
                                                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs font-bold inline-block">نشطة ({course.progress || 0}%)</span>
                                                        )
                                                    ) : effectivelyLocked ? (
                                                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto"><Lock className="w-3 h-3" /> مغلق</span>
                                                    ) : (
                                                        <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md text-xs font-bold inline-block">متاح للتسجيل</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {(() => {
                                                        const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
                                                        if (courseQuizzes.length === 0) return <span className="text-gray-600 text-xs">لا يوجد</span>;
                                                        // Get the latest result for each quiz of this course
                                                        const courseResults = quizResults.filter(r => courseQuizzes.some(q => q.id === r.quizId));
                                                        if (courseResults.length === 0) return <span className="text-gray-500 text-xs">لم يُقدّم</span>;
                                                        // Get the latest result (last one)
                                                        const latest = courseResults[courseResults.length - 1];
                                                        const pct = latest.percentage;
                                                        const passed = pct >= (courseQuizzes[0]?.passingScore || 70);
                                                        return (
                                                            <span className={`px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                <Award className="w-3 h-3" />
                                                                {pct}%
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-white/5 border-t border-white/20">
                                    <tr>
                                        <td className="px-4 py-4 font-bold text-white rounded-br-lg">المجموع الكلي:</td>
                                        <td className="px-4 py-4 text-center text-emerald-300 font-bold">
                                            {visibleCourses.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)} محاضرة
                                        </td>
                                        <td className="px-4 py-4 text-center text-emerald-400 font-bold">
                                            {(() => {
                                                const totalMins = visibleCourses.reduce((sum, c) => {
                                                    const str = c.durationEn || c.duration || '';
                                                    const matchH = str.match(/(\d+)\s*[hHس]/);
                                                    const matchM = str.match(/(\d+)\s*[mMد]/);
                                                    const h = matchH ? parseInt(matchH[1], 10) : 0;
                                                    const m = matchM ? parseInt(matchM[1], 10) : 0;
                                                    return sum + (h * 60) + m;
                                                }, 0);
                                                const finalH = Math.floor(totalMins / 60);
                                                const finalM = totalMins % 60;
                                                return finalH > 0 ? `${finalH}س ${finalM}د` : `${finalM}د`;
                                            })()}
                                        </td>
                                        <td className="px-4 py-4 text-center text-amber-400 font-bold">
                                            {visibleCourses.reduce((sum, c) => sum + ((c as any).daysAvailable || 30), 0)} يوم
                                        </td>
                                        <td className="px-4 py-4 rounded-bl-lg"></td>
                                        <td className="px-4 py-4 text-center">
                                            {/* GPA Calculation */}
                                            {(() => {
                                                const gradedCourses = visibleCourses.filter(c => {
                                                    const cq = quizzes.filter(q => q.courseId === c.id);
                                                    if (cq.length === 0) return false;
                                                    return quizResults.some(r => cq.some(q => q.id === r.quizId));
                                                });
                                                if (gradedCourses.length === 0) return <span className="text-gray-600 text-xs">—</span>;
                                                const totalPct = gradedCourses.reduce((sum, c) => {
                                                    const cq = quizzes.filter(q => q.courseId === c.id);
                                                    const cr = quizResults.filter(r => cq.some(q => q.id === r.quizId));
                                                    const latest = cr[cr.length - 1];
                                                    return sum + (latest?.percentage || 0);
                                                }, 0);
                                                const gpa = Math.round(totalPct / gradedCourses.length);
                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-xl font-bold px-3 py-1 rounded-lg ${gpa >= 80 ? 'bg-emerald-500/20 text-emerald-400' : gpa >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {gpa}%
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">المعدل العام</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    {/* --- End Schedule --- */}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleCourses.map(course => {
                            const isEnrolled = (course as any).isEnrolled;
                            const isExempt = user?.role === 'admin' || user?.role === 'supervisor';
                            const effectivelyLocked = course.isLocked && !isExempt;
                            return (
                                <div
                                    key={course.id}
                                    className={`glass-panel p-0 rounded-2xl overflow-hidden transition-all duration-500 border border-white/5 ${effectivelyLocked ? 'border-red-500/20 opacity-80' : isEnrolled ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:border-white/20'}`}
                                >
                                    <div
                                        className={`h-48 relative group ${effectivelyLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                        onClick={async () => {
                                            if (effectivelyLocked) {
                                                alert(`هذا المساق مغلق. ${(course as any).lockedByPrerequisiteName ? `يجب اجتياز مساق "${(course as any).lockedByPrerequisiteName}" أولاً` : 'اجتز المساق السابق للفتح'}`);
                                                return;
                                            }
                                            if (isEnrolled) {
                                                onPlayCourse(course);
                                            } else {
                                                setConfirmEnroll(course);
                                            }
                                        }}
                                    >
                                        <img
                                            src={course.thumbnail}
                                            className={`w-full h-full object-cover transition-all duration-700 ${effectivelyLocked ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
                                            alt={course.title}
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />

                                        {effectivelyLocked ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                                                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-md border border-white/20">
                                                    <Lock className="w-6 h-6 text-white/50" />
                                                </div>
                                                <span className="bg-black/80 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 border border-white/5">
                                                    {(course as any).lockedByPrerequisiteName
                                                        ? `يجب اجتياز مساق "${(course as any).lockedByPrerequisiteName}" أولاً`
                                                        : "اجتز المساق السابق للفتح"}
                                                </span>
                                            </div>
                                        ) : isEnrolled && (
                                            <>
                                                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                                                    ملتحق
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg">
                                                        واصل التعلم
                                                    </span>
                                                </div>
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${course.progress || 0}%` }} />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-white mb-1 leading-tight">{course.title}</h3>
                                        <p className="text-xs text-gray-400 mb-4">{course.instructor}</p>

                                        {effectivelyLocked ? (
                                            <div className="space-y-2">
                                                <button
                                                    disabled
                                                    className="w-full py-4 bg-red-500/10 text-red-400 rounded-xl font-bold text-sm border border-red-500/20 cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Lock className="w-4 h-4" />
                                                    مغلق
                                                </button>
                                                <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                                                    {(course as any).lockedByPrerequisiteName
                                                        ? `يجب اجتياز مساق "${(course as any).lockedByPrerequisiteName}" أولاً`
                                                        : "اجتز المساق السابق للفتح"}
                                                </p>
                                            </div>
                                        ) : isEnrolled ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-md">
                                                    <span>{course.duration}</span>
                                                    <span>{course.progress || 0}% مكتمل</span>
                                                </div>
                                                <button
                                                    onClick={() => onPlayCourse(course)}
                                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    استمرار
                                                </button>
                                                {course.bookPath && (
                                                    <a
                                                        href={course.bookPath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 border border-white/10"
                                                        title="تحميل الكتاب"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Book className="w-3.5 h-3.5" />
                                                        تحميل الكتاب
                                                    </a>
                                                )}
                                            </div>
                                        ) : enrollingId === course.id ? (
                                            <button
                                                disabled
                                                className="w-full py-4 bg-white/5 text-emerald-400 rounded-xl font-bold text-sm border border-white/10 flex items-center justify-center gap-2"
                                            >
                                                جاري...
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmEnroll(course)}
                                                className="w-full py-4 bg-white/5 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl font-bold text-sm transition-all border border-white/10 hover:border-emerald-500 flex items-center justify-center gap-2"
                                            >
                                                تسجيل مجاني
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Folder Modal */}
            {isAddFolderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="glass-panel w-full max-w-md border border-white/10 overflow-hidden rounded-3xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">إضافة مجلد جديد</h3>
                            <button onClick={() => setIsAddFolderModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-bold">اسم المجلد</label>
                                <input
                                    required
                                    value={newFolderForm.name}
                                    onChange={e => setNewFolderForm({ ...newFolderForm, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none transition-all"
                                    placeholder="مثال: علوم العقيدة"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-bold">رابط صورة المجلد (اختياري)</label>
                                <div className="flex gap-3">
                                    <input
                                        value={newFolderForm.thumbnail}
                                        onChange={e => setNewFolderForm({ ...newFolderForm, thumbnail: e.target.value })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none text-xs"
                                        placeholder="https://images..."
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {newFolderForm.thumbnail ? <img src={newFolderForm.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-gray-600" />}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 italic">سيتم استخدام صورة افتراضية في حال ترك الحقل فارغاً</p>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    إنشاء المجلد
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFolderModalOpen(false)}
                                    className="px-6 py-4 bg-white/5 text-gray-300 rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Enrollment Confirmation Modal (U3) */}
            {confirmEnroll && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="glass-panel w-full max-w-md border border-white/10 overflow-hidden rounded-3xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                تأكيد التسجيل
                            </h3>
                            <button onClick={() => setConfirmEnroll(null)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-white text-lg font-bold text-center">{confirmEnroll.title}</p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                                <p className="text-amber-200 text-sm font-bold text-center">⚠️ تنبيه مهم قبل التسجيل</p>
                                <p className="text-amber-100/80 text-sm leading-relaxed text-center">
                                    سيبدأ العد التنازلي فور تسجيلك. إذا لم تنهِ المساق خلال الفترة المحددة سيتم إغلاقه تلقائياً.
                                </p>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                        <p className="text-2xl font-bold text-amber-400">{(confirmEnroll as any).daysAvailable || 30}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">يوم متاح</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                        <p className="text-2xl font-bold text-emerald-400">{confirmEnroll.lessonsCount || 0}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">درس</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                                        <p className="text-2xl font-bold text-violet-400">{confirmEnroll.duration || '-'}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">مدة المساق</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={async () => {
                                        const course = confirmEnroll;
                                        setConfirmEnroll(null);
                                        setEnrollingId(course.id);
                                        try {
                                            await api.enroll(course.id);
                                            const updatedCourses = await api.getCourses();
                                            const updated = updatedCourses.find((c: any) => String(c.id) === String(course.id));
                                            if (updated) onPlayCourse(updated);
                                            else onPlayCourse(course);
                                        } catch (err: any) {
                                            alert(err.message || 'فشل التسجيل في الدورة');
                                        } finally {
                                            setEnrollingId(null);
                                        }
                                    }}
                                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    نعم، سجّلني
                                </button>
                                <button
                                    onClick={() => setConfirmEnroll(null)}
                                    className="px-6 py-4 bg-white/5 text-gray-300 rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursesGrid;
