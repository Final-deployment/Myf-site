import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, Eye, Calendar, Send, Users, X, Save, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Announcement } from '../types';

const AdminAnnouncements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Announcement>>({
        title: '',
        content: '',
        target: 'all',
        priority: 'medium'
    });

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const data = await api.getAnnouncements();
            // Map backend 'type' to frontend 'target' if needed, or just use data as is if type matches
            // Backend returns: { id, title, content, type, priority, is_active, created_at }
            // Frontend expects: Announcement type. 
            // We'll map type -> target for compatibility or just use type.
            // Let's assume we map type to target for the UI dropdown.
            const mapped = (data as any[]).map(a => ({
                ...a,
                target: a.type || 'all',
                date: a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            }));
            setAnnouncements(mapped);
        } catch (error) {
            console.error('Failed to load announcements', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
            try {
                await api.deleteAnnouncement(id);
                loadAnnouncements();
            } catch (error) {
                console.error('Failed to delete', error);
                alert('فشل الحذف');
            }
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            target: announcement.target || announcement.type || 'all',
            priority: announcement.priority
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                type: formData.target, // Map target to type
                priority: formData.priority,
            };

            if (editingId) {
                await api.updateAnnouncement(editingId, payload);
            } else {
                await api.addAnnouncement(payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ title: '', content: '', target: 'all', priority: 'medium' });
            loadAnnouncements();
        } catch (error) {
            console.error('Failed to save', error);
            alert('فشل الحفظ');
        }
    };

    const handlePublish = async (id: string) => {
        // Toggle active status or re-publish?
        // Server has is_active.
        // For now, let's toggle active status via update.
        try {
            const announcement = announcements.find(a => a.id === id);
            if (announcement) {
                await api.updateAnnouncement(id, { isActive: !announcement.isActive });
                loadAnnouncements();
                alert(announcement.isActive ? 'تم إيقاف الإعلان' : 'تم نشر الإعلان');
            }
        } catch (error) {
            console.error('Publish failed', error);
        }
    };

    return (
        <div className="animate-fade-in space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">الإعلانات</h2>
                    <p className="text-gray-300">إدارة إعلانات المنصة</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', content: '', target: 'all', priority: 'medium' });
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>إعلان جديد</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{announcements.length}</p>
                            <p className="text-gray-400 text-sm">إجمالي الإعلانات</p>
                        </div>
                    </div>
                </div>
                {/* Mock stats */}
                <div className="glass-panel p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">2,135</p>
                            <p className="text-gray-400 text-sm">إجمالي المشاهدات</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">1,247</p>
                            <p className="text-gray-400 text-sm">المستلمين</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <div key={announcement.id} className="glass-panel p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400`}>منشور</span>
                                </div>
                                <p className="text-gray-400 mb-3">{announcement.content}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{announcement.date}</span>
                                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{announcement.target === 'all' ? 'الجميع' : announcement.target}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handlePublish(announcement.id)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 hover:bg-emerald-500/30">
                                    <Send className="w-4 h-4" />نشر
                                </button>
                                <button onClick={() => handleEdit(announcement)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Edit className="w-5 h-5" /></button>
                                <button onClick={() => handleDelete(announcement.id)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="text-center py-10 text-gray-400">لا توجد إعلانات حالياً</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a1815] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">{editingId ? 'تعديل الإعلان' : 'إعلان جديد'}</h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">عنوان الإعلان</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="عنوان الإعلان..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">محتوى الإعلان</label>
                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 h-32 resize-none"
                                        placeholder="اكتب نص الإعلان هنا..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الجمهور المستهدف</label>
                                        <select
                                            value={formData.target}
                                            onChange={e => setFormData({ ...formData, target: e.target.value as any })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="all" className="text-black">الجميع</option>
                                            <option value="students" className="text-black">الطلاب فقط</option>
                                            <option value="supervisors" className="text-black">المشرفين فقط</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">الأولوية</label>
                                        <select
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="low">عادية</option>
                                            <option value="medium">متوسطة</option>
                                            <option value="high">عالية</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{editingId ? 'حفظ التعديلات' : 'نشر الإعلان'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncements;
