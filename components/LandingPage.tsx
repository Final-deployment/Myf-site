import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { Sun, Moon, ArrowLeft, ArrowRight, BookOpen, Users, Globe, Mail, ChevronDown, PlayCircle, ChevronRight, ChevronLeft, Home, Compass, GraduationCap, UserCheck, Menu, X } from 'lucide-react';
import { articlesApi, Article } from '../services/api/articles';
import { INITIAL_OFFICIAL_ARTICLES } from '../services/api/officialArticles';
import { initiativesApi, Initiative } from '../services/api/initiatives';
import AnimatedBackground from './AnimatedBackground';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState<Article[]>(INITIAL_OFFICIAL_ARTICLES);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const articlesScrollRef = useRef<HTMLDivElement>(null);
  
  // Theme classes for general layout
  const bgClass = theme === 'day' ? 'bg-[#f4f7f6]' : 'bg-[#0a192f]';
  const textClass = theme === 'day' ? 'text-gray-800' : 'text-gray-100';

  useEffect(() => {
    // Fetch dynamic content
    const fetchContent = async () => {
      try {
        const fetchedArticles = await articlesApi.getAll();
        setArticles(fetchedArticles);
      } catch (err) {
        console.error('Error fetching articles', err);
      }
      try {
        const fetchedInit = await initiativesApi.getAll();
        setInitiatives(fetchedInit);
      } catch (err) {
        console.error('Error fetching initiatives', err);
      }
    };
    fetchContent();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollArticles = (direction: 'left' | 'right') => {
    if (articlesScrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? window.innerWidth / 2 : window.innerWidth * 0.8;
      articlesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`font-sans w-full h-screen overflow-y-auto overflow-x-hidden relative ${bgClass} ${textClass} transition-colors duration-500`}>

      {/* --- HEADER NAVIGATION --- */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-12 py-4 w-full bg-black/20 backdrop-blur-md border-b border-white/10 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3 text-white cursor-pointer" onClick={() => scrollToSection('hero')}>
          <img
            src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg"
            alt="Muslim Youth Forum Logo"
            className="w-10 h-10 rounded-full border-2 border-[#d4a045] shadow-md object-cover"
          />
          <span className="text-xl font-bold tracking-wide">ملتقى الشباب المسلم</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
          <button onClick={() => navigate('/about')} className="hover:text-[#d4a045] transition">من نحن</button>
          <button onClick={() => scrollToSection('initiatives')} className="hover:text-[#d4a045] transition">المبادرات</button>
          <button onClick={() => navigate('/articles')} className="hover:text-[#d4a045] transition">المقالات</button>
          <button onClick={() => scrollToSection('mastaba')} className="hover:text-[#d4a045] transition">المصطبة العلمية</button>
          <button onClick={() => scrollToSection('contact')} className="hover:text-[#d4a045] transition">تواصل معنا</button>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 text-white"
          >
            {theme === 'day' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <button onClick={onLoginClick} className="hidden md:flex items-center gap-2 bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold px-5 py-2 rounded-full transition-transform hover:scale-105">
            تسجيل الدخول
          </button>
        </div>
      </header>

      {/* --- MOBILE DROPDOWN MENU --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 bg-[#0a192f]/95 backdrop-blur-2xl border-b border-white/10 p-6 flex flex-col gap-4 text-white md:hidden animate-fade-in-down shadow-2xl">
          <button onClick={() => { navigate('/about'); setMobileMenuOpen(false); }} className="text-right py-2 text-lg border-b border-white/5 font-semibold">من نحن</button>
          <button onClick={() => { scrollToSection('initiatives'); setMobileMenuOpen(false); }} className="text-right py-2 text-lg border-b border-white/5 font-semibold">المبادرات</button>
          <button onClick={() => { navigate('/articles'); setMobileMenuOpen(false); }} className="text-right py-2 text-lg border-b border-white/5 font-semibold">المقالات</button>
          <button onClick={() => { scrollToSection('mastaba'); setMobileMenuOpen(false); }} className="text-right py-2 text-lg border-b border-white/5 font-semibold">المصطبة العلمية</button>
          <button onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }} className="text-right py-2 text-lg border-b border-white/5 font-semibold">تواصل معنا</button>
          <button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="bg-[#d4a045] text-black font-bold py-3 rounded-xl mt-2 text-center text-lg shadow-lg">تسجيل الدخول / المصطبة</button>
        </div>
      )}

      {/* --- 1. HERO SECTION (VIDEO BACKGROUND) --- */}
      <section id="hero" className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        
        {/* Base dark background for contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a192f] via-[#020c1b] to-[#112240] z-0"></div>
        
        {/* 3D Animated Background */}
        <AnimatedBackground />
        
        {/* Overlay Gradients & Patterns */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#022c22]/30 to-[#0a192f] z-0 pointer-events-none"></div>
        <div className="absolute inset-0 mashrabiya-pattern opacity-10 z-0 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mt-16">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#d4a045] shadow-[0_0_30px_rgba(212,160,69,0.3)] mb-6 animate-pulse-slow">
            <img src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg" alt="Logo" className="w-full h-full object-cover transform scale-110" />
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-lg font-cairo">
            ملتقى الشباب <span className="text-gradient-gold">المسلم</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
            مساحة رائدة تجمع الشباب على أسس راسخة من العلم والتربية، لبناء جيل واعٍ، مثقف، ومؤثر.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => scrollToSection('about')} className="bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
              اكتشف الملتقى <ChevronDown size={20} />
            </button>
            <button onClick={() => scrollToSection('mastaba')} className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 text-white font-medium py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
              المصطبة العلمية <BookOpen size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* --- 2. ABOUT US --- */}
      <section id="about" className="relative py-24 px-6 md:px-12 w-full flex justify-center">
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-block px-4 py-1 rounded-full bg-[#047857]/20 border border-[#047857]/50 text-[#10b981] font-semibold text-sm mb-2">من نحن</div>
            <h2 className="text-3xl md:text-5xl font-bold font-cairo text-gradient-gold">رؤية تنبض بالحياة</h2>
            <p className={`text-lg leading-relaxed ${theme === 'day' ? 'text-gray-600' : 'text-gray-300'}`}>
              ملتقى الشباب المسلم هو مركز بحثي مستقل تأسس في مدينة نابلس، فلسطين، عام 2022. 
              يُعنى بالبحث والأنشطة الفكرية والثقافية ذات البعد المجتمعي، حيث يركّز على قضايا الشباب وتأثيرهم.
              ويعتمد الملتقى منهجًا إسلاميًا وسطيًا، مستندًا إلى التراث الإسلامي الأصيل وملتزمًا وفقًا للمذاهب الأربعة المعتبرة.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className={`p-4 rounded-2xl ${theme === 'day' ? 'bg-white shadow-md' : 'bg-white/5 border border-white/10'}`}>
                <Globe className="text-[#047857] mb-2" size={30} />
                <h4 className="font-bold text-lg mb-1">تأثير عالمي</h4>
                <p className="text-sm opacity-70">نصل للشباب أينما كانوا</p>
              </div>
              <div className={`p-4 rounded-2xl ${theme === 'day' ? 'bg-white shadow-md' : 'bg-white/5 border border-white/10'}`}>
                <Users className="text-[#d4a045] mb-2" size={30} />
                <h4 className="font-bold text-lg mb-1">مجتمع متكاتف</h4>
                <p className="text-sm opacity-70">بيئة تفاعلية داعمة</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/about')}
              className="mt-4 bg-gradient-to-r from-[#d4a045] to-[#b8860b] hover:from-[#b8860b] hover:to-[#966d07] text-[#0a192f] font-bold py-3 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 inline-flex items-center gap-2"
            >
              <span>معرفة المزيد (عن الملتقى، الرؤية، الإدارة)</span>
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#047857] to-[#0f766e] transform rotate-3 rounded-[3rem] opacity-20 blur-xl"></div>
            <img src="https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=600&fit=crop" alt="Islamic Architecture" className="relative rounded-[2rem] shadow-2xl object-cover w-full h-[400px] border-4 border-white/10" />
          </div>
        </div>
      </section>

      {/* --- 3. INITIATIVES (المبادرات) --- */}
      <section id="initiatives" className={`py-24 px-6 md:px-12 w-full ${theme === 'day' ? 'bg-gray-100' : 'bg-[#021812]'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-cairo mb-4">مبادراتنا <span className="text-[#047857]">الرئيسية</span></h2>
            <p className="text-lg opacity-70 max-w-2xl mx-auto">مجموعة من البرامج والأنشطة المصممة خصيصاً لتلبية تطلعات الشباب وبناء قدراتهم.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Fallback Static Initiatives if DB is empty */}
            {(initiatives.length > 0 ? initiatives : [
              { id: 'init_futuwwa', title: 'أكاديمية فتوة/فلسطين', description: 'برنامج إعداد قيادي شبابي يهدف إلى بناء الشخصية الإسلامية المتكاملة من خلال التربية الإيمانية، والوعي الفكري، والمهارات الحياتية.', image: '/logos/فتوة.png' },
              { id: 'init_ehdena', title: 'مبادرة اهدنا (على هدي الحبيب)', description: 'نشر تعاليم الدين الإسلامي من خلال الدورات، المحاضرات، وإحياء المناسبات الدينية ومجالس الصلاة على النبي.', image: '/logos/على هدي الحبيب.png' },
              { id: 'init_meraj', title: 'مبادرة معراج', description: 'مبادرة تعني بالقرآن الكريم وحفظه وتكريمه وحلقات العلوم الشريفة.', image: '/logos/معراج.png' },
              { id: 'init_nabd_hayat', title: 'مبادرة نبض الحياة', description: 'تزويد الشباب والمتطوعين بمهارات الإسعافات الأولية والاستجابة الطارئة.', image: '/logos/ نبض الحياة.png' },
              { id: 'init_nabd_aman', title: 'مبادرة نبض الأمان', description: 'تعزيز السلامة العامة من خلال تدريب الشباب على التعامل مع حالات الطوارئ والإطفاء.', image: '/logos/ نبض الأمان.png' },
              { id: 'init_basmat_amal', title: 'مبادرة بسمة أمل (المصطبة العلمية)', description: 'مبادرة دعم نفسي واجتماعي ودورات علمية وتثقيفية موجهة لتطوير قدرات الشباب.', image: '/logos/ بسمة أمل.png' }
            ]).map((init, i) => (
              <div 
                key={i} 
                onClick={() => navigate(`/initiative/${init.id}`)}
                className={`group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer ${theme === 'day' ? 'bg-white shadow-lg' : 'bg-white/5 border border-white/10'}`}
              >
                <div className="h-48 overflow-hidden relative bg-[#01140e] flex items-center justify-center p-6">
                  <img src={init.image || '/logos/الملتقى.png'} alt={init.title} className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                </div>
                <div className="p-6 relative -mt-10 bg-gradient-to-t from-black/80 to-transparent pt-12">
                  <h3 className="text-xl font-bold text-white mb-2">{init.title}</h3>
                  <p className="text-gray-300 text-sm">{init.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. MASTABA SECTION (المصطبة العلمية) --- */}
      <section id="mastaba" className="relative py-24 px-6 md:px-12 w-full flex justify-center bg-gradient-to-br from-[#047857] to-[#022c22] text-white overflow-hidden">
        <div className="absolute inset-0 mashrabiya-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4a045] rounded-full blur-[100px] opacity-20"></div>
        
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1">
            <img src="/logos/المصطبة.png" alt="Mastaba" className="w-full max-w-md mx-auto rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-white/20 transform -rotate-3 hover:rotate-0 transition-all duration-500 bg-[#0a2f2a] p-8 object-contain" />
          </div>
          <div className="flex-1 space-y-6 text-center md:text-right">
            <h2 className="text-4xl md:text-5xl font-bold font-cairo text-[#d4a045]">المصطبة العلمية</h2>
            <p className="text-xl text-gray-200 leading-relaxed">
              منصتنا التعليمية الرائدة. نقدم مسارات منهجية متدرجة في العلوم الشرعية، باختبارات وتقييمات دورية، وبإشراف مباشر لضمان أفضل تجربة تعليمية.
            </p>
            <ul className="space-y-3 text-right inline-block">
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#d4a045]"></div> دورات منهجية مسجلة</li>
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#d4a045]"></div> اختبارات وشهادات معتمدة</li>
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#d4a045]"></div> متابعة من مشرفين متخصصين</li>
            </ul>
            <div className="pt-6">
              <button onClick={onLoginClick} className="bg-white text-[#047857] hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg flex items-center justify-center gap-3 transition-transform transform hover:scale-105 w-full md:w-auto">
                <span>الدخول للمصطبة</span>
                <PlayCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. LATEST ARTICLES (المقالات) --- */}
      <section id="articles" className="py-24 px-6 md:px-12 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-500/20 pb-4 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-cairo">أحدث <span className="text-[#047857]">المقالات</span></h2>
              <p className="opacity-70 mt-2">إصدارات ومقالات فكرية وتربوية.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" dir="ltr">
                <button onClick={() => scrollArticles('left')} className="w-10 h-10 rounded-full border border-[#d4a045] text-[#d4a045] flex items-center justify-center hover:bg-[#d4a045] hover:text-white transition">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => scrollArticles('right')} className="w-10 h-10 rounded-full border border-[#d4a045] text-[#d4a045] flex items-center justify-center hover:bg-[#d4a045] hover:text-white transition">
                  <ChevronRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => navigate('/articles')}
                className="text-[#d4a045] hover:text-[#b8860b] font-bold flex items-center gap-2 transition mr-4"
              >
                <span>عرض جميع المقالات</span>
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>

          <div ref={articlesScrollRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6 pb-8 -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth">
            {articles.length > 0 ? articles.slice(0, 6).map((article, idx) => (
              <div 
                key={article.id} 
                onClick={() => navigate(`/article/${article.id}`)}
                className={`snap-center shrink-0 w-[85vw] md:w-[calc(50%-1.5rem)] lg:w-[calc(25%-1.5rem)] rounded-2xl overflow-hidden ${theme === 'day' ? 'bg-white shadow-md' : 'bg-white/5 border border-white/10'} group cursor-pointer transition-transform duration-300 hover:-translate-y-2`}
              >
                <div className="h-48 overflow-hidden">
                  <img src={article.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&h=300&fit=crop'} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>
                  <p className="opacity-70 text-sm line-clamp-3 mb-4">{article.content}</p>
                  <div className="flex justify-between items-center text-xs opacity-60">
                    <span>{new Date(article.created_at).toLocaleDateString('ar-EG')}</span>
                    <span className="text-[#d4a045] font-bold">اقرأ المزيد ←</span>
                  </div>
                </div>
              </div>
            )) : (
              // Empty State
              <div className="w-full text-center py-12 opacity-50">لا توجد مقالات منشورة حالياً.</div>
            )}
          </div>
        </div>
      </section>

      {/* --- 6. CONTACT US & FOOTER --- */}
      <footer id="contact" className={`relative pt-24 pb-28 md:pb-8 px-6 md:px-12 w-full ${theme === 'day' ? 'bg-[#0f172a]' : 'bg-[#020617]'} text-white`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold font-cairo mb-4 text-[#d4a045]">تواصل معنا</h2>
              <p className="text-gray-400 mb-8 max-w-md">نحن هنا للإجابة على استفساراتك ومقترحاتك. لا تتردد في التواصل معنا عبر قنواتنا الرسمية.</p>
              
              <div className="space-y-4">
                <a href="mailto:info@myf.com" className="flex items-center gap-3 text-gray-300 hover:text-white transition">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><Mail size={18} /></div>
                  info@myf.com
                </a>
              </div>
            </div>
            
            {/* Quick Contact Form (Visual Only for now) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div>
                  <input type="text" placeholder="الاسم الكريم" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4a045] transition" />
                </div>
                <div>
                  <input type="email" placeholder="البريد الإلكتروني" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4a045] transition" />
                </div>
                <div>
                  <textarea placeholder="رسالتك..." rows={4} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#d4a045] transition resize-none"></textarea>
                </div>
                <button className="w-full bg-[#047857] hover:bg-[#0369a1] text-white font-bold py-3 rounded-xl transition shadow-lg">إرسال الرسالة</button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">ملتقى الشباب المسلم © 2026. جميع الحقوق محفوظة.</div>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/MYF.PAL" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#1877F2] transition">
                <i className="fab fa-facebook-f text-white"></i>
              </a>
              <a href="https://t.me/Majalis_al_Noor" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#26A5E4] transition">
                <i className="fab fa-telegram-plane text-white"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* --- MOBILE BOTTOM APP BAR (Native Mobile Experience) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a192f]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex justify-around items-center text-white pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
        <button onClick={() => scrollToSection('hero')} className="flex flex-col items-center gap-1 text-xs opacity-80 hover:opacity-100 hover:text-[#d4a045] transition active:scale-95">
          <Home size={20} />
          <span>الرئيسية</span>
        </button>
        <button onClick={() => scrollToSection('initiatives')} className="flex flex-col items-center gap-1 text-xs opacity-80 hover:opacity-100 hover:text-[#d4a045] transition active:scale-95">
          <Compass size={20} />
          <span>المبادرات</span>
        </button>
        <button onClick={() => navigate('/articles')} className="flex flex-col items-center gap-1 text-xs opacity-80 hover:opacity-100 hover:text-[#d4a045] transition active:scale-95">
          <BookOpen size={20} />
          <span>المقالات</span>
        </button>
        <button onClick={() => scrollToSection('mastaba')} className="flex flex-col items-center gap-1 text-xs opacity-80 hover:opacity-100 hover:text-[#d4a045] transition active:scale-95">
          <GraduationCap size={20} />
          <span>المصطبة</span>
        </button>
        <button onClick={onLoginClick} className="flex flex-col items-center gap-1 text-xs font-bold text-[#d4a045] transition active:scale-95 bg-[#d4a045]/10 px-3 py-1 rounded-xl border border-[#d4a045]/30">
          <UserCheck size={20} />
          <span>دخول</span>
        </button>
      </div>

    </div>
  );
};

export default LandingPage;