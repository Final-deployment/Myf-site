import React, { useState, useEffect, useRef } from 'react';
import { Upload, Book, Trash2, Edit, Search, Plus, Save, X, Link, Eye, Globe, FileSearch } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import { useToast } from '../components/Toast';

interface Book {
    id: string;
    title: string;
    path: string; // Filename in /Books folder
    courseId?: string;
    courseTitle?: string;
    url?: string;
}

interface Course {
    id: string;
    title: string;
}

const AdminLibrary: React.FC = () => {
    const { t } = useLanguage();
    const { success, error } = useToast();
    const [books, setBooks] = useState<Book[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [formData, setFormData] = useState({ title: '', path: '', courseId: '' });

    // R2 Browser State
    const [isR2BrowserOpen, setIsR2BrowserOpen] = useState(false);
    const [r2Files, setR2Files] = useState<any[]>([]);
    const [isLoadingR2, setIsLoadingR2] = useState(false);
    const [r2SearchTerm, setR2SearchTerm] = useState('');

    // Fetch Data
    useEffect(() => {
        fetchBooks();
        fetchCourses();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await fetch('/api/books');
            if (res.ok) {
                const data = await res.json();
                setBooks(data);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            error('فشل تحميل الكتب');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchR2Files = async () => {
        setIsLoadingR2(true);
        try {
            const res = await fetch('/api/r2/files?prefix=Books/');
            if (res.ok) {
                const data = await res.json();
                setR2Files(data.files || []);
            }
        } catch (error) {
            console.error('Error fetching R2 files:', error);
            error('فشل استعراض الملفات');
        } finally {
            setIsLoadingR2(false);
        }
    };

    const handleSelectR2File = (file: any) => {
        const filename = file.name;
        // Clean title (remove extension and replace underscores/dashes)
        let cleanTitle = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        // Capitalize first letter of each word
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        setFormData({
            ...formData,
            path: filename,
            title: formData.title || cleanTitle
        });
        setIsR2BrowserOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation
        if (!formData.title || !formData.path) {
            error('يرجى تعبئة العنوان ومسار الملف');
            return;
        }

        const endpoint = editingBook
            ? `/api/books/${editingBook.id}`
            : '/api/books';

        const method = editingBook ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                success(editingBook ? 'تم تحديث الكتاب بنجاح' : 'تم إضافة الكتاب بنجاح');
                fetchBooks();
                closeModal();
            } else {
                error('حدث خطأ أثناء الحفظ');
            }
        } catch (error) {
            console.error('Error saving book:', error);
            error('فشل الاتصال الخادم');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكتاب من المكتبة؟')) return;

        try {
            const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
            if (res.ok) {
                success('تم حذف الكتاب بنجاح');
                setBooks(books.filter(b => b.id !== id));
            } else {
                error('فشل الحذف');
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            error('حدث خطأ');
        }
    };

    const openModal = (book?: Book) => {
        if (book) {
            setEditingBook(book);
            setFormData({
                title: book.title,
                path: book.path,
                courseId: book.courseId || ''
            });
        } else {
            setEditingBook(null);
            setFormData({ title: '', path: '', courseId: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBook(null);
    };

    const filteredBooks = books.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('admin.library')}</h2>
                    <p className="text-gray-300">إدارة الكتب وربطها بالمساقات</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('admin.addBook')}</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t('admin.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder-gray-500"
                />
            </div>

            {/* Books Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">{t('admin.bookTitle')}</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">{t('admin.bookPath')}</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">{t('admin.linkedCourse')}</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium">{t('admin.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">جاري التحميل...</td></tr>
                        ) : filteredBooks.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد كتب مضافة</td></tr>
                        ) : (
                            filteredBooks.map((book) => (
                                <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <Book className="w-5 h-5" />
                                            </div>
                                            <span className="text-white font-medium">{book.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-400 font-mono text-sm" dir="ltr">
                                        <a href={book.url || `https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/${book.path}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                                            {book.path}
                                        </a>
                                    </td>
                                    <td className="py-4 px-6">
                                        {book.courseTitle ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/10">
                                                <Link className="w-3 h-3" />
                                                {book.courseTitle}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500 text-xs">{t('admin.noCourse')}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openModal(book)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(book.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0a1f1c] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xl font-bold text-white">
                                {editingBook ? t('admin.editBook') : t('admin.addBook')}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.bookTitle')}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="مثال: كتاب الطهارة"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.bookPath')}</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={formData.path}
                                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all pl-10"
                                            placeholder="مثال: purity_book.pdf"
                                            dir="ltr"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">/Books/</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsR2BrowserOpen(true);
                                            fetchR2Files();
                                        }}
                                        className="px-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                        title="استعراض الملفات في السحابة"
                                    >
                                        <Globe className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">تأكد من وجود الملف في مجلد Books في السيرفر أو استعرض الملفات</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('admin.linkedCourse')}</label>
                                <select
                                    value={formData.courseId}
                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    <option value="">{t('admin.noCourse')}</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    {t('admin.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-105"
                                >
                                    {t('admin.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* R2 File Browser Modal */}
            {isR2BrowserOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-[#0f2e2a] border border-emerald-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-bold text-white">متصفح ملفات الكتب (R2)</h3>
                            </div>
                            <button onClick={() => setIsR2BrowserOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="بحث في ملفات السحابة..."
                                    value={r2SearchTerm}
                                    onChange={(e) => setR2SearchTerm(e.target.value)}
                                    className="w-full bg-black/20 border border-white/5 rounded-xl pr-9 pl-4 py-2 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {isLoadingR2 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p>جاري تحميل قائمة الملفات...</p>
                                </div>
                            ) : r2Files.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">لا توجد ملفات في مجلد Books</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-1">
                                    {r2Files.filter(f => f.name.toLowerCase().includes(r2SearchTerm.toLowerCase())).map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => handleSelectR2File(file)}
                                            className="w-full text-right p-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                    <FileSearch className="w-4 h-4" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-white text-sm font-medium truncate" dir="ltr">{file.name}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase">{file.id.split('.').pop()} file</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 shrink-0">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-black/20 text-center text-xs text-gray-500 rounded-b-2xl border-t border-white/5">
                            المسار المتصفح حالياً: <span className="font-mono text-emerald-400/80">R2://Books/</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLibrary;
