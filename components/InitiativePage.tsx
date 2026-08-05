import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, Share2, Users } from 'lucide-react';
import { useTheme } from './ThemeContext';
import LoadingSpinner from './LoadingSpinner';

interface Initiative {
  id: string;
  title: string;
  description: string;
  image: string;
}

const InitiativePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchInitiative = async () => {
      try {
        const response = await fetch(`/api/initiatives/${id}`);
        if (!response.ok) throw new Error('Failed to fetch initiative');
        const data = await response.json();
        setInitiative(data);
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل المبادرة. قد تكون محذوفة أو الرابط غير صحيح.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitiative();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen message="جاري تحميل المبادرة..." />;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#020617]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';

  if (error || !initiative) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex flex-col items-center justify-center p-6`}>
        <div className="text-2xl font-cairo mb-4 text-red-500">{error || 'المبادرة غير موجودة'}</div>
        <button 
          onClick={() => navigate('/')} 
          className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Fallback placeholder objectives if not specified in DB
  const objectives = [
    'تعزيز القيم والأخلاق لدى الشباب ضمن بيئة محفزة.',
    'بناء قدرات ومهارات الجيل الصاعد لمواجهة التحديات.',
    'توفير مساحات آمنة للإبداع والابتكار الموجه.',
    'نشر ثقافة العمل التطوعي وخدمة المجتمع بفاعلية.'
  ];

  return (
    <div className={`h-screen overflow-y-auto overflow-x-hidden ${bgClass} ${textClass} font-sans pb-24 transition-colors duration-500`}>
      {/* Navbar Minimal for Initiative Page */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-black/50 border-b border-white/10' : 'bg-white/70 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
              <ArrowRight size={24} />
            </button>
            <div className="font-cairo font-bold text-xl flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#d4a045]" />
              <span className="hidden sm:inline">ملتقى الشباب المسلم</span>
            </div>
          </div>
          <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`} title="مشاركة">
            <Share2 size={20} />
          </button>
        </div>
      </nav>

      {/* Hero Header Section */}
      <div className={`relative pt-32 pb-24 px-6 overflow-hidden ${isDark ? 'bg-[#0f172a]' : 'bg-green-900'} text-white`}>
        <div className="absolute inset-0 mashrabiya-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4a045] rounded-full blur-[100px] opacity-20" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-block px-6 py-2 rounded-full bg-[#d4a045]/20 text-[#d4a045] font-bold text-sm mb-6 border border-[#d4a045]/30">
            مبادرة مجتمعية
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-cairo mb-6 drop-shadow-md">
            {initiative.title}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            {initiative.description}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button className="bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transition-transform transform hover:scale-105">
              انضم للمبادرة <Users size={20} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
        {/* Main Content Card */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'} mb-16 flex flex-col md:flex-row`}>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className={`text-3xl font-bold font-cairo mb-6 ${isDark ? 'text-[#d4a045]' : 'text-[#047857]'}`}>
              عن المبادرة
            </h2>
            <p className="text-lg leading-relaxed opacity-80 mb-8 text-justify">
              تعتبر مبادرة "{initiative.title}" من أهم البرامج التي يقدمها ملتقى الشباب المسلم، حيث تم تصميمها بعناية لتتناسب مع احتياجات الجيل وتواكب التطورات المعاصرة برؤية إسلامية أصيلة. نسعى من خلال هذه المبادرة إلى إحداث أثر إيجابي ومستدام في المجتمع.
            </p>
            <div className="space-y-4">
              <h3 className="text-xl font-bold font-cairo mb-4 flex items-center gap-2">
                <Star size={20} className="text-[#d4a045]" /> أهداف المبادرة
              </h3>
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-[#10b981] mt-1 shrink-0" />
                  <span className="opacity-90">{obj}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`md:w-1/2 min-h-[300px] md:h-auto relative flex items-center justify-center p-8 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <img 
              src={initiative.image || '/logos/الملتقى.png'} 
              alt={initiative.title} 
              className="max-h-80 max-w-full object-contain filter drop-shadow-lg" 
            />
          </div>
        </div>

        {/* Action Call */}
        <div className={`text-center py-12 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-green-50 border border-green-100'} mb-16`}>
          <h2 className="text-3xl font-bold font-cairo mb-4">كن جزءاً من التغيير</h2>
          <p className="opacity-70 max-w-2xl mx-auto mb-8">نرحب بكل المبادرات الشبابية والأفكار الإبداعية. إذا كنت تجد في نفسك الكفاءة والرغبة في العطاء، فلا تتردد في الانضمام لفريقنا.</p>
          <button className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
            تواصل معنا للالتحاق
          </button>
        </div>
      </main>
    </div>
  );
};

export default InitiativePage;
