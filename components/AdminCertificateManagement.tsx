import React, { useState, useEffect } from 'react';
import { Award, Plus, Download, Eye, Trash2, Search, Filter, Printer, Mail, Users, CheckCircle, X, Save, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import { Certificate } from '../types';

const AdminCertificateManagement: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCert, setNewCert] = useState<{ studentName: string, courseTitle: string, grade: string }>({
        studentName: '',
        courseTitle: '',
        grade: 'Excellent'
    });

    useEffect(() => {
        loadCertificates();
    }, []);

    const loadCertificates = async () => {
        try {
            // @ts-ignore - Dynamic property from adminApi spread
            const data = await api.getAllCertificates();
            setCertificates(data);
        } catch (error) {
            console.error('Failed to load certificates:', error);
        }
    };

    const handleIssueCertificate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // @ts-ignore - Dynamic property from adminApi spread
            await api.issueCertificate({
                userId: 'manual-' + Date.now(),
                studentId: 'manual-' + Date.now(),
                userName: newCert.studentName, // using userName to match backend expectation
                studentName: newCert.studentName, // sending both just in case
                courseId: 'manual-' + Date.now(),
                courseTitle: newCert.courseTitle,
                grade: newCert.grade
            });
            setIsModalOpen(false);
            setNewCert({ studentName: '', courseTitle: '', grade: 'Excellent' });
            loadCertificates();
        } catch (error) {
            console.error('Failed to issue certificate:', error);
            alert('فشل إصدار الشهادة');
        }
    };

    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadImage = async (cert: Certificate) => {
        setSelectedCert(cert);
        // Wait for state to update and modal to open
        setTimeout(async () => {
            const element = document.getElementById('certificate-template-full');
            if (!element) return;
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const link = document.createElement('a');
            link.download = `certificate-${cert.id}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();
        }, 500);
    };

    const handleDownloadPDF = async (cert: Certificate) => {
        setSelectedCert(cert);
        setTimeout(async () => {
            const element = document.getElementById('certificate-template-full');
            if (!element) return;
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificate-${cert.id}.pdf`);
        }, 500);
    };

    const filteredCertificates = certificates.filter(c =>
        c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'الشهادات الصادرة', value: certificates.length.toString(), icon: Award, color: 'from-emerald-500 to-teal-600' },
        { label: 'بانتظار الإصدار', value: '0', icon: CheckCircle, color: 'from-amber-500 to-orange-600' }, // Mock
        { label: 'الطلاب المؤهلين', value: '89', icon: Users, color: 'from-blue-500 to-cyan-600' }, // Mock
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">إدارة الشهادات</h2>
                    <p className="text-gray-300">إصدار وإدارة شهادات الإتمام</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /><span>إصدار شهادة</span>
                </button>
            </div>

            {/* Stats - Hide in print */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 print:hidden">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="بحث عن شهادة..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 flex items-center gap-2 hover:bg-white/10">
                    <Filter className="w-4 h-4" /><span>تصفية</span>
                </button>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden print:bg-white print:text-black">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 print:bg-gray-100 print:text-black">
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الطالب</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الدورة</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">التاريخ</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">التقدير</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:text-black">الحالة</th>
                            <th className="text-right py-4 px-6 text-gray-300 font-medium print:hidden">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCertificates.map((cert) => (
                            <tr key={cert.id} className="border-b border-white/5 hover:bg-white/5 print:border-gray-200">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold print:hidden">{cert.userName.charAt(0)}</div>
                                        <span className="text-white print:text-black">{cert.userName}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-gray-300 print:text-black">{cert.courseTitle}</td>
                                <td className="py-4 px-6 text-gray-400 print:text-black">{cert.issueDate}</td>
                                <td className="py-4 px-6 text-emerald-400 print:text-black">{cert.grade}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 print:bg-transparent print:text-black print:p-0`}>
                                        صادرة
                                    </span>
                                </td>
                                <td className="py-4 px-6 print:hidden">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedCert(cert)} className="p-2 rounded-lg bg-white/5 text-emerald-400 hover:bg-emerald-500/10"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => handleDownloadImage(cert)} className="p-2 rounded-lg bg-white/5 text-blue-400 hover:bg-blue-500/10"><ImageIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDownloadPDF(cert)} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10"><FileText className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0a1815] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute left-4 top-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">إصدار شهادة جديدة</h3>
                            <form onSubmit={handleIssueCertificate} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">اسم الطالب</label>
                                    <input
                                        required
                                        value={newCert.studentName}
                                        onChange={e => setNewCert({ ...newCert, studentName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="اسم الطالب كاملاً"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">اسم الدورة</label>
                                    <input
                                        required
                                        value={newCert.courseTitle}
                                        onChange={e => setNewCert({ ...newCert, courseTitle: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="مثال: فقه الطهارة"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">التقدير</label>
                                    <select
                                        value={newCert.grade}
                                        onChange={e => setNewCert({ ...newCert, grade: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ممتاز">ممتاز</option>
                                        <option value="جيد جداً">جيد جداً</option>
                                        <option value="جيد">جيد</option>
                                        <option value="مقبول">مقبول</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    <Award className="w-5 h-5" />
                                    <span>إصدار الشهادة</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Preview Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-scale-in">
                    <div className="w-full max-w-5xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold text-white">معاينة الشهادة</h4>
                            <button onClick={() => setSelectedCert(null)} className="p-2 text-gray-400 hover:text-white"><X className="w-8 h-8" /></button>
                        </div>

                        <div className="bg-white shadow-2xl relative overflow-hidden aspect-[1.414/1] w-full">
                            <div id="certificate-template-full" className="relative w-full h-full flex flex-col items-center">
                                <img src="/certificate-frame.png" className="absolute inset-0 w-full h-full object-fill" alt="Frame" />
                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center py-[12%] px-[15%]">
                                    <Award className="w-[10%] aspect-square text-emerald-800 mb-[2%]" />
                                    <h2 className="text-[3.5vw] font-serif text-emerald-950 font-bold mb-[1%] decoration-gold-600">شهادة إتمام</h2>
                                    <h3 className="text-[1.8vw] text-gold-600 font-bold mb-[5%]">المصطبة العلمية</h3>
                                    <p className="text-[1.2vw] text-gray-600 mb-[1%]">نشهد بأن</p>
                                    <h1 className="text-[3vw] font-bold text-emerald-950 mb-[4%] border-b-4 border-gold-400 px-12">{selectedCert.userName}</h1>
                                    <div className="text-[1.4vw] text-gray-700 leading-relaxed mb-[6%]">
                                        قد اجتاز بنجاح دورة <span className="font-bold text-emerald-900">"{selectedCert.courseTitle}"</span> بتقدير <span className="text-gold-600 font-bold">{selectedCert.grade}</span>
                                    </div>
                                    <div className="flex justify-between w-full mt-auto px-10 items-end">
                                        <div className="text-center w-[30%]"><div className="text-[1.2vw] border-b border-gray-300 italic">Academy Office</div></div>
                                        <div className="w-[15%] aspect-square bg-emerald-950 rounded-full border-4 border-gold-500 flex flex-col items-center justify-center text-white scale-110 shadow-xl">
                                            <span className="text-[0.6vw] opacity-70">المصطبة</span>
                                            <span className="text-[1vw] font-bold">معتمد</span>
                                        </div>
                                        <div className="text-center w-[30%]"><div className="text-[1.2vw] border-b border-gray-300 italic">Director Sign</div></div>
                                    </div>
                                    <div className="absolute bottom-[4%] text-[0.8vw] text-gray-400 font-mono tracking-widest">CODE: {selectedCert.code}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCertificateManagement;
