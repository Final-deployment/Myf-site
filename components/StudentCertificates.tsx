import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, Download, Eye, FileText, Lock, Loader, Image as ImageIcon, Plus, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { Certificate, Course } from '../types';
import { useToast } from './Toast';

const StudentCertificates: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [certs, allCourses] = await Promise.all([
                api.getCertificates(),
                api.getCourses()
            ]);
            setCertificates(certs);
            setCourses(allCourses);
        } catch (e) {
            console.error(e);
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (courseId: string) => {
        setGeneratingId(courseId);
        try {
            const cert = await api.generateCertificate(courseId);
            setCertificates(prev => [cert, ...prev]);
            setSelectedCert(cert);
            toast.success('تم إصدار الشهادة بنجاح');
        } catch (e: any) {
            toast.error(e.message || 'فشل إصدار الشهادة');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleGenerateMaster = async () => {
        setGeneratingId('MASTER');
        try {
            const cert = await api.generateMasterCertificate();
            setCertificates(prev => [cert, ...prev]);
            setSelectedCert(cert);
            toast.success('تم إصدار الشهادة الجامعية بنجاح! 🎓');
        } catch (e: any) {
            toast.error(e.message || 'فشل إصدار الشهادة الجامعية');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('certificate-template');
        if (!element) return;

        try {
            toast.success('جاري تجهيز ملف PDF...');
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificate - ${selectedCert?.courseId}.pdf`);
            toast.success('تم تحميل الشهادة بنجاح');
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error('حدث خطأ أثناء تحميل الملف');
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('certificate-template');
        if (!element) return;

        try {
            toast.success('جاري تجهيز الصورة...');
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const link = document.createElement('a');
            link.download = `certificate - ${selectedCert?.courseId}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();
            toast.success('تم تحميل الصورة بنجاح');
        } catch (error) {
            console.error('Image download error:', error);
            toast.error('حدث خطأ أثناء تحميل الصورة');
        }
    };

    // Calculate Eligible Courses (Completed but no certificate yet)
    const safeCourses = Array.isArray(courses) ? courses : [];

    const eligibleCourses = safeCourses.filter(course => {
        const hasCert = certificates.some(c => c.courseId === course.id);
        const isCompleted = course.progress === 100;
        return isCompleted && !hasCert;
    });

    const completedCoursesCount = safeCourses.filter(c => c.progress === 100).length;
    const totalCourses = safeCourses.length;
    const isMasterEligible = totalCourses > 0 && completedCoursesCount === totalCourses;
    const hasMasterCert = certificates.some(c => c.courseId === 'MASTER_CERT');

    if (loading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-gold-500" /></div>;

    return (
        <div className="animate-fade-in flex flex-col items-center pt-10 relative z-10 pb-20 px-4">
            <style>
                {`
@media print {
    body * { visibility: hidden; }
    #certificate - template, #certificate - template * { visibility: visible; }
    #certificate - template {
        position: fixed; left: 0; top: 0; width: 100 %; height: 100 %;
        margin: 0; padding: 0; background: white!important;
        z - index: 9999;
        -webkit - print - color - adjust: exact; print - color - adjust: exact;
    }
                        .no - print { display: none!important; }
}
                    .cert - card - preview {
    background - image: url('/certificate-frame.png');
    background - size: cover;
    background - position: center;
}
`}
            </style>

            <div className="text-center mb-12 no-print">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 bg-clip-text text-transparent mb-3">شهاداتي التعليمية</h2>
                <p className="text-gray-300 max-w-lg mx-auto">فخورون بإنجازاتك العلمية. هنا تجد كافة الشهادات التي حصلت عليها خلال مسيرتك التعليمية.</p>
            </div>

            {/* List of Earned Certificates */}
            {!selectedCert && (
                <div className="w-full max-w-6xl space-y-12 no-print">

                    {/* Master Certificate Banner */}
                    {!hasMasterCert && (
                        <div className="relative group overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-gold-900/40 to-black/60 p-8">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[80px] -mr-32 -mt-32 rounded-full group-hover:bg-gold-500/20 transition-all"></div>
                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gold-500/20 rounded-2xl flex items-center justify-center border border-gold-500/40 shadow-lg shadow-gold-500/10">
                                        <Award className="w-10 h-10 text-gold-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">الشهادة الجامعية الكبرى</h3>
                                        <p className="text-gray-400 text-sm">
                                            متبقي لك إتمام <span className="text-gold-400 font-bold">{totalCourses - completedCoursesCount}</span> دورات إضافية للحصول على الشهادة الشاملة
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    {isMasterEligible ? (
                                        <button
                                            onClick={handleGenerateMaster}
                                            disabled={generatingId === 'MASTER'}
                                            className="px-8 py-3 bg-gradient-to-r from-gold-600 to-amber-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-gold-900/30 flex items-center gap-2"
                                        >
                                            {generatingId === 'MASTER' ? <Loader className="animate-spin" /> : <Award className="w-5 h-5" />}
                                            إصدار الشهادة الجامعية
                                        </button>
                                    ) : (
                                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-500 flex items-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            <span>غير متوفرة حالياً</span>
                                        </div>
                                    )}
                                    <div className="w-64 bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-gold-600 to-amber-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${(completedCoursesCount / totalCourses) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Eligible Courses (Mini Cards) */}
                    {eligibleCourses.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" />
                                دورات تنتظر إصدار الشهادة
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {eligibleCourses.map(course => (
                                    <div key={course.id} className="glass-panel group p-6 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">مكتملة 100%</span>
                                        </div>
                                        <h4 className="text-white font-bold text-lg mb-6 line-clamp-1">{course.title}</h4>
                                        <button
                                            onClick={() => handleGenerate(course.id)}
                                            disabled={generatingId === course.id}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                                        >
                                            {generatingId === course.id ? <Loader className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            إصدار الشهادة الآن
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Your Certificates Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white">سجل الشهادات ({certificates.length})</h3>
                            <div className="h-px flex-1 mx-8 bg-gradient-to-r from-gold-500/50 to-transparent"></div>
                        </div>

                        {certificates.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                                <p className="text-gray-500 text-lg">لم تقم بإصدار أي شهادات بعد</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {certificates.map(cert => (
                                    <div
                                        key={cert.id}
                                        onClick={() => setSelectedCert(cert)}
                                        className="group relative cursor-pointer"
                                    >
                                        {/* Certificate Preview Card */}
                                        <div className="aspect-[1.4/1] w-full rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-gold-500/10">
                                            <div className="cert-card-preview w-full h-full p-4 flex flex-col items-center justify-center text-center relative border border-white/10">
                                                <div className="absolute inset-0 bg-white/40 group-hover:bg-transparent transition-colors duration-500"></div>
                                                <Award className="w-12 h-12 text-emerald-900 mb-2 relative z-10" />
                                                <h5 className="text-emerald-950 font-bold text-xs mb-1 relative z-10 line-clamp-2 px-6">{cert.courseId === 'MASTER_CERT' ? 'الشهادة الجامعية' : cert.courseTitle}</h5>
                                                <p className="text-[10px] text-gold-700 font-bold relative z-10">{cert.userName}</p>

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-emerald-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Eye className="w-10 h-10 text-white" />
                                                        <span className="text-white text-sm font-bold">عرض الشهادة</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-center">
                                            <h4 className="text-white font-bold line-clamp-1">{cert.courseTitle}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{cert.issueDate}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Certificate View / Template */}
            {selectedCert && (
                <div className="animate-scale-in flex flex-col items-center w-full max-w-5xl">
                    <div className="w-full flex justify-between items-center mb-6 no-print">
                        <button
                            onClick={() => setSelectedCert(null)}
                            className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-gray-300 hover:text-white flex items-center gap-2 transition-all hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                            <span>إغلاق المعاينة</span>
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={handleDownloadPDF}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                            >
                                <FileText className="w-5 h-5" />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleDownloadImage}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <span>صورة</span>
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                            >
                                <Download className="w-5 h-5" />
                                <span>طباعة</span>
                            </button>
                        </div>
                    </div>

                    <div className="w-full bg-white shadow-2xl relative overflow-hidden">
                        <div id="certificate-template" className="relative aspect-[1.414/1] w-full p-0 flex flex-col items-center">
                            {/* Background Frame */}
                            <img
                                src="/certificate-frame.png"
                                className="absolute inset-0 w-full h-full object-fill"
                                alt="Frame"
                            />

                            {/* Content */}
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center py-[12%] px-[15%]">
                                <div className="w-[10%] aspect-square text-emerald-800 mb-[2%]">
                                    <Award className="w-full h-full" />
                                </div>

                                <h2 className="text-[3.5vw] font-serif text-emerald-950 font-bold mb-[1%] tracking-wide leading-tight">
                                    {selectedCert.courseId === 'MASTER_CERT' ? 'الشهادة الجامعية' : 'شهادة إتمام'}
                                </h2>
                                <h3 className="text-[1.8vw] text-gold-600 font-bold mb-[5%]">المصطبة العلمية</h3>

                                <p className="text-[1.2vw] text-gray-600 mb-[2%]">تشهد إدارة المنصة بأن الطالب</p>
                                <h1 className="text-[3vw] font-bold text-emerald-950 mb-[4%] border-b-[3px] border-gold-400 px-8 py-2">
                                    {selectedCert.userName}
                                </h1>

                                <div className="text-[1.4vw] text-gray-700 mb-[6%] max-w-[85%] leading-relaxed">
                                    {selectedCert.courseId === 'MASTER_CERT' ? (
                                        <>
                                            قد أتم بنجاح <span className="font-bold text-emerald-900">كافة الدورات التأسيسية</span> المقررة في المنهج العلمي وحاز على تقدير
                                        </>
                                    ) : (
                                        <>
                                            قد أتم بنجاح دورة <span className="font-bold text-emerald-900">"{selectedCert.courseTitle}"</span> وحقق كافة متطلبات الاجتياز بتقدير
                                        </>
                                    )}
                                    <div className="font-bold text-gold-600 text-[1.8vw] mt-[1%]">
                                        {selectedCert.grade === 'Distinction' || selectedCert.grade === 'ممتاز' ? 'ممتاز مع مرتبة الشرف' : (selectedCert.grade || 'امتياز')}
                                    </div>
                                </div>

                                <div className="flex justify-between w-full mt-auto items-end">
                                    <div className="text-center w-[30%]">
                                        <div className="text-[1.4vw] border-b-2 border-emerald-900/30 mb-1 font-serif text-emerald-950 italic">Ahmed Ali</div>
                                        <p className="text-[0.9vw] text-gray-600 font-bold">المشرف العام</p>
                                    </div>

                                    <div className="w-[15%] aspect-square relative flex items-center justify-center">
                                        <div className="absolute inset-0 border-[3px] border-gold-400 rounded-full bg-white shadow-xl opacity-90 scale-110"></div>
                                        <div className="relative w-[85%] aspect-square bg-emerald-950 rounded-full flex flex-col items-center justify-center text-white text-center border-2 border-gold-500 shadow-inner">
                                            <span className="text-[0.6vw] opacity-70 mb-0.5">المصطبة العلمية</span>
                                            <span className="text-[1.2vw] font-bold">معتمد</span>
                                            <span className="text-[0.7vw] mt-1 font-mono">{selectedCert.issueDate.split('-')[0]}</span>
                                        </div>
                                    </div>

                                    <div className="text-center w-[30%]">
                                        <div className="text-[1.4vw] border-b-2 border-emerald-900/30 mb-1 font-serif text-emerald-950 italic">Science Bench Office</div>
                                        <p className="text-[0.9vw] text-gray-600 font-bold">إدارة المنصة</p>
                                    </div>
                                </div>

                                <div className="absolute bottom-[4%] text-[0.8vw] text-gray-400 font-mono tracking-widest opacity-60">
                                    VERIFICATION CODE: {selectedCert.code}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default StudentCertificates;
