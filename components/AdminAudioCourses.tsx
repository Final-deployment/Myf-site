import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic2, Play, Pause, Edit, Trash2, Plus, Clock, Users, Eye, MoreVertical, Search, Filter, X, Image as ImageIcon, Save, Video } from 'lucide-react';
import { api } from '../services/api';
import { Course, CourseStatus, CourseFolder } from '../types';
import { useLanguage } from './LanguageContext';
import R2FilePicker from './R2FilePicker';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from './AuthContext';
import { Folder, ChevronRight, LayoutGrid, ArrowRight } from 'lucide-react';

interface AdminAudioCoursesProps {
    onPreview?: (course: Course) => void;
}

const CourseCard: React.FC<{
    course: Course;
    t: any;
    onPreview?: (course: Course) => void;
    onEdit: (course: Course) => void;
    onDelete: (id: string) => void;
    isSupervisor: boolean;
}> = ({ course, t, onPreview, onEdit, onDelete, isSupervisor }) => (
    <div className="glass-panel p-0 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group">
        <div className="flex flex-col sm:flex-row">
            {/* Thumbnail */}
            <div className="w-full sm:w-32 h-32 flex-shrink-0 relative">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onPreview?.(course)}
                        className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all"
                    >
                        <Play className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white text-lg line-clamp-1">{course.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 capitalize`}>
                            {t('admin.published')}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{course.instructor}</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-300">
                        <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            {course.lessonsCount}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.studentsCount}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPreview?.(course)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors"
                            title="معاينة"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {!isSupervisor && (
                            <>
                                <button
                                    onClick={() => onEdit(course)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(course.id)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const AdminAudioCourses: React.FC<AdminAudioCoursesProps> = ({ onPreview }) => {
    const { t } = useLanguage();
    const [courses, setCourses] = useState<Course[]>([]);
    const [folders, setFolders] = useState<CourseFolder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isR2PickerOpen, setIsR2PickerOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
    const [newFolderForm, setNewFolderForm] = useState({ name: '', thumbnail: '' });
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const { user } = useAuth();
    const isSupervisor = user?.role === 'supervisor';

    // Form State
    const [courseForm, setCourseForm] = useState<Partial<Course>>({
        title: '',
        instructor: '',
        duration: '',
        category: 'Quran',
        status: 'published',
        passingScore: 80,
        quizFrequency: 3,
        thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=225&fit=crop',
        folderId: ''
    });

    const loadData = async () => {
        const [dbCourses, dbFolders] = await Promise.all([
            api.getCourses(),
            api.getFolders()
        ]);
        setCourses(dbCourses);
        setFolders(dbFolders);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
            try {
                await api.deleteCourse(id);
                loadData();
            } catch (error: any) {
                console.error('Failed to delete course:', error);
                alert(`فشل الحذف: ${error.message}`);
            }
        }
    };

    const handleEdit = (course: Course) => {
        setEditingId(course.id);
        setCourseForm({
            title: course.title,
            instructor: course.instructor,
            duration: course.duration,
            category: course.category,
            status: 'published',
            thumbnail: course.thumbnail,
            videoUrl: course.videoUrl,
            passingScore: course.passingScore || 80,
            quizFrequency: course.quizFrequency || 0,
            folderId: course.folderId || '',
            episodes: course.episodes || []
        });
        setIsModalOpen(true);
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createFolder(newFolderForm.name, newFolderForm.thumbnail);
            setIsAddFolderModalOpen(false);
            setNewFolderForm({ name: '', thumbnail: '' });
            loadData();
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('فشل إنشاء المجلد');
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`هل أنت متأكد من حذف المجلد "${name}"؟\nسيتم نقل الدورات الموجودة فيه إلى القائمة الرئيسية.`)) {
            try {
                const result = await api.deleteFolder(id);
                if (result.success) {
                    loadData();
                    if (selectedFolderId === id) setSelectedFolderId(null);
                }
            } catch (error: any) {
                console.error('Failed to delete folder:', error);
                alert('فشل حذف المجلد');
            }
        }
    };

    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Update existing
                await api.updateCourse(editingId, {
                    title: courseForm.title,
                    instructor: courseForm.instructor,
                    duration: courseForm.duration,
                    category: courseForm.category,
                    thumbnail: courseForm.thumbnail,
                    videoUrl: courseForm.videoUrl,
                    episodes: courseForm.episodes,
                    passingScore: courseForm.passingScore,
                    quizFrequency: courseForm.quizFrequency,
                    folderId: courseForm.folderId
                });
            } else {
                // Create new
                const courseToAdd: Course = {
                    id: Date.now().toString(),
                    title: courseForm.title || 'Untitled',
                    titleEn: courseForm.title || 'Untitled',
                    instructor: courseForm.instructor || 'Unknown',
                    instructorEn: courseForm.instructor || 'Unknown',
                    progress: 0,
                    category: courseForm.category || 'General',
                    categoryEn: courseForm.category || 'General',
                    duration: courseForm.duration || '0h',
                    durationEn: courseForm.duration || '0h',
                    thumbnail: courseForm.thumbnail || '',
                    description: 'New Course Description',
                    descriptionEn: 'New Course Description',
                    lessonsCount: courseForm.episodes?.length || 0,
                    studentsCount: 0,
                    videoUrl: courseForm.videoUrl,
                    episodes: courseForm.episodes || [],
                    passingScore: courseForm.passingScore || 80,
                    quizFrequency: courseForm.quizFrequency || 0,
                    folderId: courseForm.folderId
                };
                await api.addCourse(courseToAdd);
            }

            loadData();
            setIsModalOpen(false);
            setEditingId(null);
            setCourseForm({
                title: '',
                instructor: '',
                duration: '',
                category: 'Quran',
                status: 'published',
                thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=225&fit=crop',
                videoUrl: '',
                folderId: ''
            });
        } catch (error: any) {
            console.error('Failed to save course:', error);
            alert(`حدث خطأ أثناء حفظ الدورة: ${error.message}`);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setCourseForm({
            title: '',
            instructor: '',
            duration: '',
            category: 'Quran',
            status: 'published',
            thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=225&fit=crop',
            videoUrl: '',
            passingScore: 80,
            quizFrequency: 3,
            folderId: ''
        });
        setIsModalOpen(true);
    };

    const stats = [
        { label: t('admin.totalCourses'), value: courses.length.toString(), icon: Mic2, color: 'from-violet-500 to-purple-600' },
        { label: t('admin.publishedEpisodes'), value: courses.reduce((acc, c) => acc + (c.lessonsCount || 0), 0).toString(), icon: Play, color: 'from-emerald-500 to-teal-600' },
        { label: t('admin.totalHours'), value: '230', icon: Clock, color: 'from-blue-500 to-cyan-600' },
        { label: t('admin.totalListeners'), value: courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0).toString(), icon: Users, color: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="animate-fade-in space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('admin.audioCourses')}</h2>
                    <p className="text-gray-300">{selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : t('courses.subtitle')}</p>
                </div>
                {!isSupervisor && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setCourseForm({
                                    title: '',
                                    instructor: '',
                                    duration: '',
                                    category: 'Quran',
                                    status: 'published',
                                    passingScore: 80,
                                    quizFrequency: 3,
                                    thumbnail: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=225&fit=crop',
                                    folderId: ''
                                });
                                setIsModalOpen(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t('admin.addCourse')}</span>
                        </button>
                        <button
                            onClick={() => setIsAddFolderModalOpen(true)}
                            className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 font-bold transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>إنشاء مجلد جديد</span>
                        </button>
                    </div>
                )}
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
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filter */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder={t('admin.searchPlaceholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500"
                    />
                </div>
                <select className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500">
                    <option value="">{t('admin.allStatuses')}</option>
                    <option value="published">{t('admin.published')}</option>
                    <option value="draft">{t('admin.draft')}</option>
                </select>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
                    <Filter className="w-5 h-5" />
                    <span>{t('admin.filter')}</span>
                </button>
                {selectedFolderId && (
                    <button
                        onClick={() => setSelectedFolderId(null)}
                        className="px-6 py-3 bg-violet-500/20 text-violet-300 rounded-xl border border-violet-500/30 font-bold hover:bg-violet-500/30 transition-all flex items-center gap-2"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span>العودة للمجلدات</span>
                    </button>
                )}
            </div>

            {/* Folders and Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!selectedFolderId ? (
                    <>
                        {/* Folders Grid */}
                        {folders.map(folder => {
                            const folderCourses = courses.filter(c => c.folderId === folder.id);
                            return (
                                <div
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className="glass-panel p-0 rounded-2xl overflow-hidden cursor-pointer group hover:border-violet-500/50 transition-all bg-white/5 hover:bg-black/40 border border-white/10 relative h-48"
                                >
                                    <img
                                        src={folder.thumbnail}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30"
                                        alt={folder.name}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30 group-hover:bg-violet-500 transition-all">
                                                    <Folder className="w-5 h-5 text-violet-400 group-hover:text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-violet-300">{folder.name}</h3>
                                            </div>
                                            {!isSupervisor && (
                                                <button
                                                    onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                                                    className="w-8 h-8 rounded-lg bg-black/40 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                                    title="حذف المجلد"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                                            <LayoutGrid className="w-3 h-3" />
                                            {folderCourses.length} دورات
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Courses without folders */}
                        {filteredCourses.filter(c => !c.folderId).map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                t={t}
                                onPreview={onPreview}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isSupervisor={isSupervisor}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        {/* Courses in selected folder */}
                        {filteredCourses.filter(c => c.folderId === selectedFolderId).map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                t={t}
                                onPreview={onPreview}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isSupervisor={isSupervisor}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Add New Course CTA */}
            {!isSupervisor && (
                <div
                    onClick={openAddModal}
                    className="glass-panel p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-violet-500/50 transition-colors cursor-pointer group"
                >
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/30 transition-colors">
                            <Plus className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t('admin.addCourse')}</h3>
                        <p className="text-gray-400">{t('admin.clickToAdd')}</p>
                    </div>
                </div>
            )}

            {/* Course Modal - PORTAL */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold text-white">
                                {editingId ? t('admin.editCourse') : t('admin.addCourse')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            <section className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">المعلومات الأساسية</h4>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">{t('admin.title')}</label>
                                    <input
                                        value={courseForm.title}
                                        onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                        placeholder="مثال: تفسير جزء عم"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">{t('admin.instructor')}</label>
                                        <input
                                            value={courseForm.instructor}
                                            onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                            placeholder="الشيخ فلان"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">{t('admin.duration')}</label>
                                        <input
                                            value={courseForm.duration}
                                            onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                            placeholder="مثال: 12 ساعة"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">{t('admin.category')}</label>
                                        <select
                                            value={courseForm.category}
                                            onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                        >
                                            <option value="Fiqh">الفقه</option>
                                            <option value="Quran">القرآن</option>
                                            <option value="History">التاريخ</option>
                                            <option value="Ethics">الأخلاق</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">المجلد</label>
                                        <select
                                            value={courseForm.folderId}
                                            onChange={e => setCourseForm({ ...courseForm, folderId: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                        >
                                            <option value="">بدون مجلد</option>
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">إعدادات العرض والأداء</h4>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">{t('admin.thumbnail')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={courseForm.thumbnail}
                                            onChange={e => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none text-xs font-mono transition-all"
                                            placeholder="https://..."
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {courseForm.thumbnail ? <img src={courseForm.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-500" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">درجة النجاح</label>
                                        <input
                                            type="number"
                                            value={courseForm.passingScore}
                                            onChange={e => setCourseForm({ ...courseForm, passingScore: parseInt(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-300">تكرار الاختبار</label>
                                        <input
                                            type="number"
                                            value={courseForm.quizFrequency}
                                            onChange={e => setCourseForm({ ...courseForm, quizFrequency: parseInt(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">الحالة</label>
                                    <select
                                        value={courseForm.status}
                                        onChange={e => setCourseForm({ ...courseForm, status: e.target.value as CourseStatus })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 focus:outline-none transition-all"
                                    >
                                        <option value="published">منشور</option>
                                        <option value="draft">مسودة</option>
                                    </select>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-4 border-t border-white/5 pt-6 p-6">
                            <div className="flex justify-between items-center mb-1">
                                <div>
                                    <h4 className="text-sm font-bold text-violet-400">محاضرات الدورة ({courseForm.episodes?.length || 0})</h4>
                                    <p className="text-[10px] text-gray-500 italic">انقر على الاسم للتعديل</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsR2PickerOpen(true)}
                                    className="text-xs px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>إضافة محاضرات</span>
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {courseForm.episodes?.map((ep, idx) => (
                                    <div key={idx} className="flex gap-3 items-center bg-white/[0.03] p-3 rounded-xl border border-white/5 group hover:border-violet-500/40 hover:bg-white/[0.05] transition-all focus-within:border-violet-500/60 focus-within:bg-violet-500/5">
                                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs text-gray-400 font-bold font-mono group-focus-within:text-violet-400 transition-colors">
                                            {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 flex items-center gap-3">
                                            <Edit className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-focus-within:animate-pulse transition-colors" />
                                            <input
                                                value={ep.title}
                                                onChange={e => {
                                                    const newEps = [...(courseForm.episodes || [])];
                                                    newEps[idx] = { ...newEps[idx], title: e.target.value };
                                                    setCourseForm({ ...courseForm, episodes: newEps });
                                                }}
                                                className="bg-transparent text-gray-300 text-sm focus:text-white focus:outline-none w-full"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newEps = [...(courseForm.episodes || [])];
                                                newEps.splice(idx, 1);
                                                setCourseForm({ ...courseForm, episodes: newEps });
                                            }}
                                            className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!courseForm.episodes || courseForm.episodes.length === 0) && (
                                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                                        <p className="text-gray-500 text-xs">لم يتم إضافة أي محاضرات بعد. اضغط على الزر أعلاه للبدء.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                {t('admin.cancel')}
                            </button>
                            <button
                                onClick={handleSaveCourse}
                                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all font-bold"
                            >
                                {t('admin.save')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* R2 File Picker Modal */}
            {
                isR2PickerOpen && (
                    <ErrorBoundary>
                        <R2FilePicker
                            isOpen={isR2PickerOpen}
                            onClose={() => setIsR2PickerOpen(false)}
                            multiSelect={true}
                            onSelect={(url) => {
                                const newEp = {
                                    id: Date.now().toString(),
                                    courseId: courseForm.id || '',
                                    title: url.split('/').pop()?.replace(/%20/g, ' ') || 'محاضرة جديدة',
                                    videoUrl: url,
                                    orderIndex: (courseForm.episodes?.length || 0)
                                };
                                setCourseForm(prev => ({
                                    ...prev,
                                    episodes: [...(prev.episodes || []), newEp],
                                    videoUrl: url // Keep for backward compatibility or featured video
                                }));
                                setIsR2PickerOpen(false);
                            }}
                            onSelectMultiple={(urls) => {
                                const newEps = urls.map((url, i) => ({
                                    id: (Date.now() + i).toString(),
                                    courseId: courseForm.id || '',
                                    title: url.split('/').pop()?.replace(/%20/g, ' ') || `محاضرة ${i + 1}`,
                                    videoUrl: url,
                                    orderIndex: (courseForm.episodes?.length || 0) + i
                                }));
                                // Sort by title (natural sort)
                                const allEps = [...(courseForm.episodes || []), ...newEps].sort((a, b) =>
                                    a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
                                );
                                // Re-index
                                allEps.forEach((ep, i) => ep.orderIndex = i);

                                setCourseForm(prev => ({
                                    ...prev,
                                    episodes: allEps,
                                    videoUrl: urls[0] // Featured video
                                }));
                                setIsR2PickerOpen(false);
                            }}
                        />
                    </ErrorBoundary>
                )
            }
            {/* Add Folder Modal */}
            {isAddFolderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="glass-panel w-full max-w-md border border-white/10 overflow-hidden rounded-3xl bg-[#0a1815]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">إنشاء مجلد جديد</h3>
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
                                    placeholder="مثال: العلوم الشرعية"
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
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all text-sm"
                                >
                                    حفظ المجلد
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddFolderModalOpen(false)}
                                    className="px-6 py-4 bg-white/5 text-gray-300 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default AdminAudioCourses;
