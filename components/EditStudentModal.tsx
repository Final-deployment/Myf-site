import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { User } from '../types';

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: string, updates: Partial<User>) => void;
    student: User | null;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, onSubmit, student }) => {
    const [formData, setFormData] = useState<Partial<User>>({});

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name,
                email: student.email,
                phone: student.phone || '',
                bio: student.bio || '',
                status: student.status,
                level: student.level,
                points: student.points
            });
        }
    }, [student]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (student) {
            onSubmit(student.id, formData);
        }
    };

    const handleChange = (field: keyof User, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-lg p-6 relative animate-fade-in rounded-3xl border border-white/10">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-2xl font-bold text-white mb-6 font-serif">تعديل بيانات الطالب</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">الاسم</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            dir="auto"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">الحالة</label>
                        <select
                            value={formData.status || 'active'}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value="active" className="text-black">نشط</option>
                            <option value="inactive" className="text-black">غير نشط</option>
                            <option value="suspended" className="text-black">موقوف</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">المستوى</label>
                            <input
                                type="number"
                                value={formData.level || 1}
                                onChange={(e) => handleChange('level', parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">النقاط</label>
                            <input
                                type="number"
                                value={formData.points || 0}
                                onChange={(e) => handleChange('points', parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            <span>حفظ التغييرات</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditStudentModal;
