import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, Share2, Users, Calendar, Image as ImageIcon, X, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { OFFICIAL_ACTIVITIES } from '../services/api/officialActivities';
import LoadingSpinner from './LoadingSpinner';

interface Activity {
  id: string;
  initiative_id: string;
  title: string;
  date: string;
  description: string;
  images: string[];
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  image: string;
  activities?: Activity[];
}

const InitiativePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lightbox Modal State
  const [activeModalImages, setActiveModalImages] = useState<string[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number>(0);
  const [activeActivityTitle, setActiveActivityTitle] = useState<string>('');

  const openLightbox = (images: string[], initialIndex: number, title: string) => {
    setActiveModalImages(images);
    setActiveModalIndex(initialIndex);
    setActiveActivityTitle(title);
  };

  const closeLightbox = () => {
    setActiveModalImages([]);
    setActiveModalIndex(0);
    setActiveActivityTitle('');
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModalIndex(prev => (prev - 1 + activeModalImages.length) % activeModalImages.length);
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModalIndex(prev => (prev + 1) % activeModalImages.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModalImages.length === 0) return;
      if (e.key === 'ArrowLeft') {
        nextImage();
      } else if (e.key === 'ArrowRight') {
        prevImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalImages]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchInitiative = async () => {
      try {
        const response = await fetch(`/api/initiatives/${id}`);
        if (!response.ok) throw new Error('Failed to fetch initiative');
        const data = await response.json();
        setInitiative(data);
        if (data.activities && data.activities.length > 0) {
          setActivities(data.activities);
        } else {
          const fallbackActs = OFFICIAL_ACTIVITIES.filter(a => a.initiative_id === id);
          setActivities(fallbackActs);
        }
      } catch (err) {
        console.error(err);
        const fallbackActs = OFFICIAL_ACTIVITIES.filter(a => a.initiative_id === id);
        setActivities(fallbackActs);
        
        const defaultInits: Record<string, Initiative> = {
          'init_futuwwa': { 
            id: 'init_futuwwa', 
            title: 'أكاديمية فتوة/فلسطين', 
            description: 'بدأت العمل في فلسطين عام 2024م، وتهدف إلى ترسيخ القيم والأخلاق الإسلامية الأساسية لدى الرجال والنساء، والتي تتجذر في القرآن الكريم والسنة النبوية. تقوم الأكاديمية على تعزيز خمسة عناصر أساسية للفتوة: العلم، الأدب، الخدمة، الصحة البدنية والنفسية، والحرفية. تشمل أنشطتها بناء قدرات مجتمعية فعالة لمواجهة التحديات التي يواجهها الشعب الفلسطيني بسبب الاحتلال وعنف المستوطنين لا سيما في المخيمات وأطراف المدن والمناطق الحضرية.', 
            image: '/logos/فتوة.png' 
          },
          'init_ehdena': { 
            id: 'init_ehdena', 
            title: 'مبادرة اهدنا (على هدي الحبيب)', 
            description: 'مبادرة دعوية تهدف إلى نشر تعاليم الدين الإسلامي، من خلال الدورات، المحاضرات، المواد العلمية على وسائل التواصل الاجتماعي، وإحياء المناسبات الدينية ومجالس الذكر. يعقد الملتقى من خلال هذه المبادرة مجلساً أسبوعياً للذكر والصلاة على النبي، ومجالس شهرية مع بداية كل شهر في مساجد (رجال العمود، الشهداء، وسعد بن أبي وقاص) في مدينة نابلس.', 
            image: '/logos/على هدي الحبيب.png' 
          },
          'init_meraj': { 
            id: 'init_meraj', 
            title: 'مقرأة معراج', 
            description: 'منصة تهدف لتحفيظ وتصحيح تلاوة القرآن الكريم، تتخذ مسارين: إلكتروني ووجاهي في مدرسة المسجد الحنبلي بالبلدة القديمة بنابلس. تجمع مشاركين من جميع أنحاء العالم، وشعارها: «من أرض المعراج، نعرج معاً نحو العلا برفقة كتاب الله تعالى».', 
            image: '/logos/معراج.png' 
          },
          'init_nabd_hayat': { 
            id: 'init_nabd_hayat', 
            title: 'مبادرة نبض الحياة', 
            description: 'مبادرة تدريبية رائدة تهدف إلى تزويد الشباب والمتطوعين في المناطق عالية الخطورة بمهارات الإسعافات الأولية والاستجابة الطارئة لإنقاذ الأرواح وتعزيز الأمن الصحي في المجتمع الفلسطيني، تم تنظيمها تحت رعاية محافظة نابلس.', 
            image: '/logos/ نبض الحياة.png' 
          },
          'init_nabd_aman': { 
            id: 'init_nabd_aman', 
            title: 'مبادرة نبض الأمان', 
            description: 'تركز على تعزيز السلامة العامة في المجتمع من خلال تدريب الشباب على التعامل مع حالات الطوارئ وتعزيز جاهزية المجتمع لها وتقليل الخسائر البشرية حال حدوثها، وقد تم تنظيمها بالتعاون مع إطفائية نابلس والدفاع المدني.', 
            image: '/logos/ نبض الأمان.png' 
          },
          'init_basmat_amal': { 
            id: 'init_basmat_amal', 
            title: 'مبادرة بسمة أمل', 
            description: 'مبادرة دعم نفسي واجتماعي تستهدف توعية المتدربين على سبل التعامل مع النساء والأطفال المتأثرين بالصدمات النفسية، وتشمل أنشطة ميدانية كزيارة أطفال مرضى السرطان في مستشفى النجاح الوطني الجامعي.', 
            image: '/logos/ بسمة أمل.png' 
          }
        };
        
        if (id && defaultInits[id]) {
          setInitiative(defaultInits[id]);
        } else {
          setError('تعذر تحميل المبادرة.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitiative();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen message="جاري تحميل المبادرة وأنشطتها..." />;

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

  const objectives = [
    'تعزيز القيم والأخلاق لدى الشباب ضمن بيئة محفزة.',
    'بناء قدرات ومهارات الجيل الصاعد لمواجهة التحديات.',
    'توفير مساحات آمنة للإبداع والابتكار الموجه.',
    'نشر ثقافة العمل التطوعي وخدمة المجتمع بفاعلية.'
  ];

  return (
    <div className={`min-h-screen w-full overflow-x-hidden overflow-y-auto ${bgClass} ${textClass} font-sans pb-24 transition-colors duration-500`}>
      {/* Navbar Minimal for Initiative Page */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-black/50 border-b border-white/10' : 'bg-white/70 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
              <ArrowRight size={24} />
            </button>
            <div className="font-cairo font-bold text-xl flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logos/الملتقى.png" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#d4a045] object-contain" />
              <span className="hidden sm:inline">ملتقى الشباب المسلم</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'}`} 
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => {
              if (navigator.share) {
                navigator.share({ title: initiative.title, url: window.location.href });
              }
            }} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`} title="مشاركة">
              <Share2 size={20} />
            </button>
          </div>
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

      <main className="max-w-6xl mx-auto px-6 -mt-16 relative z-20">
        {/* Main Content Card */}
        <div className={`rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'} mb-16 flex flex-col md:flex-row`}>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className={`text-3xl font-bold font-cairo mb-6 ${isDark ? 'text-[#d4a045]' : 'text-[#047857]'}`}>
              عن المبادرة (من الواقع الفعلي)
            </h2>
            <p className="text-base md:text-lg leading-relaxed opacity-90 mb-6 text-justify">
              {initiative.description}
            </p>

            {/* Initiative Specific Highlights */}
            {initiative.id === 'init_futuwwa' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-bold text-amber-400 mb-2 text-sm">عناصر الفتوة الخمسة الأساسية:</h4>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-white">
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg">📖 العلم</span>
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg">🤝 الأدب</span>
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg">🌱 الخدمة</span>
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg">🏋️ الصحة البدنية والنفسية</span>
                  <span className="px-3 py-1 bg-amber-500/20 rounded-lg">🛠️ الحرفية</span>
                </div>
              </div>
            )}

            {initiative.id === 'init_meraj' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm font-bold text-emerald-400 italic mb-2">«من أرض المعراج، نعرج معاً نحو العلا برفقة كتاب الله تعالى»</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-white">
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-lg">🕌 المسار الوجاهي: مدرسة المسجد الحنبلي - نابلس</span>
                  <span className="px-3 py-1 bg-emerald-500/20 rounded-lg">🌐 المسار الإلكتروني: مشاركون من أنحاء العالم</span>
                </div>
              </div>
            )}

            {initiative.id === 'init_nabd_hayat' && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <span className="text-xs font-bold text-red-400 block mb-1">🏛️ برعاية محافظة نابلس</span>
                <p className="text-xs opacity-90">تدريب المتطوعين على الإسعافات الأولية والاستجابة الطارئة في المناطق عالية الخطورة.</p>
              </div>
            )}

            {initiative.id === 'init_nabd_aman' && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                <span className="text-xs font-bold text-blue-400 block mb-1">🚒 بالشراكة مع إطفائية نابلس والدفاع المدني</span>
                <p className="text-xs opacity-90">التدريب على أساسيات الإطفاء والسلامة العامة والتعامل مع حالات الطوارئ.</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xl font-bold font-cairo mb-3 flex items-center gap-2">
                <Star size={20} className="text-[#d4a045]" /> أهداف المبادرة
              </h3>
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#10b981] mt-1 shrink-0" />
                  <span className="opacity-90 text-sm md:text-base">{obj}</span>
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

        {/* --- ACTIVITIES SECTION (نشاطات المبادرة) --- */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10 border-b border-gray-500/20 pb-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-cairo flex items-center gap-3">
                <span className="w-4 h-10 bg-[#047857] rounded-full inline-block"></span>
                نشاطات وفعاليات <span className="text-[#047857]">المبادرة</span>
              </h2>
              <p className="opacity-70 mt-2">توثيق الأنشطة واللقاءات والمشاركات الميدانية للمبادرة.</p>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#047857]/10 text-[#047857] font-bold text-sm">
              {activities.length} نشاط مُوثّق
            </div>
          </div>

          {activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((act) => (
                <div 
                  key={act.id} 
                  className={`rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white border border-gray-100'}`}
                >
                  {/* Activity Image Showcase */}
                  <div 
                    className="relative h-56 bg-slate-950 overflow-hidden group cursor-pointer" 
                    onClick={() => openLightbox(act.images, 0, act.title)}
                  >
                    <img 
                      src={act.images[0] || initiative.image} 
                      alt={act.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[#d4a045] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-[#d4a045]/30">
                      <Calendar size={14} />
                      <span>{act.date}</span>
                    </div>

                    {/* Multi-Image Badge */}
                    {act.images.length > 1 && (
                      <div className="absolute bottom-4 left-4 bg-[#047857]/90 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <ImageIcon size={14} />
                        <span>+{act.images.length} صور</span>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-cairo mb-3 leading-snug">{act.title}</h3>
                      <p className="opacity-75 text-sm leading-relaxed mb-6">{act.description}</p>
                    </div>

                    {/* Image Thumbnails Strip */}
                    {act.images.length > 0 && (
                      <div className="pt-4 border-t border-gray-500/15 flex items-center gap-3 overflow-x-auto">
                        {act.images.map((imgUrl, imgIdx) => (
                          <div 
                            key={imgIdx} 
                            onClick={() => openLightbox(act.images, imgIdx, act.title)}
                            className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 shrink-0 cursor-pointer transition-transform hover:scale-105 hover:border-[#047857]"
                          >
                            <img src={imgUrl} alt={`صورة ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 opacity-50 bg-white/5 rounded-3xl border border-white/10">
              لا توجد نشاطات مسجلة لهذه المبادرة حالياً.
            </div>
          )}
        </div>

        {/* --- LIGHTBOX MODAL WITH GALLERY NAVIGATION --- */}
        {activeModalImages.length > 0 && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 select-none" 
            onClick={closeLightbox}
          >
            {/* Header Controls */}
            <div className="w-full max-w-6xl flex items-center justify-between z-10 text-white pt-2" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <span className="font-cairo font-bold text-lg md:text-xl text-[#d4a045]">{activeActivityTitle}</span>
                {activeModalImages.length > 1 && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                    {activeModalIndex + 1} / {activeModalImages.length}
                  </span>
                )}
              </div>
              <button 
                onClick={closeLightbox}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-transform transform hover:scale-110"
                title="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Center Image + Navigation Arrows */}
            <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4" onClick={e => e.stopPropagation()}>
              {/* Previous Button */}
              {activeModalImages.length > 1 && (
                <button 
                  onClick={prevImage}
                  className="absolute right-2 md:right-4 z-20 p-3.5 bg-black/60 hover:bg-[#047857] text-white rounded-full transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/20 hover:scale-110"
                  title="الصورة السابقة"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              <img 
                src={activeModalImages[activeModalIndex]} 
                alt={`${activeActivityTitle} - صورة ${activeModalIndex + 1}`} 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-all duration-300"
              />

              {/* Next Button */}
              {activeModalImages.length > 1 && (
                <button 
                  onClick={nextImage}
                  className="absolute left-2 md:left-4 z-20 p-3.5 bg-black/60 hover:bg-[#047857] text-white rounded-full transition-all duration-300 backdrop-blur-md shadow-2xl border border-white/20 hover:scale-110"
                  title="الصورة التالية"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Navigation Bar */}
            {activeModalImages.length > 1 && (
              <div className="w-full max-w-2xl flex items-center justify-center gap-3 overflow-x-auto py-2 z-10" onClick={e => e.stopPropagation()}>
                {activeModalImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveModalIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 ${idx === activeModalIndex ? 'border-[#d4a045] scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                  >
                    <img src={imgUrl} alt={`مصغر ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
