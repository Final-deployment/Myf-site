import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, User, Clock, Share2, ZoomIn, ZoomOut, Hand, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { articlesApi } from '../services/api/articles';
import { INITIAL_OFFICIAL_ARTICLES } from '../services/api/officialArticles';
import LoadingSpinner from './LoadingSpinner';

interface Article {
  id: string;
  title: string;
  content: string;
  image: string;
  author_id: string;
  created_at: string;
}

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interactive Tools State
  const [fontSize, setFontSize] = useState(19); // Default 19px for comfortable reading
  const [isHandMode, setIsHandMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Direct ref to the scrollable container div of this page
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    const fetchArticle = async () => {
      try {
        if (!id) return;
        const data = await articlesApi.getById(id);
        if (data) {
          setArticle(data);
          setError('');
        } else {
          setError('تعذر تحميل المقالة. قد تكون محذوفة أو الرابط غير صحيح.');
        }
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل المقالة.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  // Drag to Scroll (Hand Tool) Logic - 1:1 Instant, Ultra-Smooth Sync
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHandMode) return;
    setIsDragging(true);
    setStartY(e.clientY);
    const currentScroll = window.scrollY || document.documentElement.scrollTop || (containerRef.current ? containerRef.current.scrollTop : 0);
    setScrollTop(currentScroll);
  };

  useEffect(() => {
    if (!isHandMode || !isDragging) return;

    let animationFrameId: number;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const targetPos = Math.max(0, scrollTop - deltaY);

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        window.scrollTo({ top: targetPos, behavior: 'instant' });
        if (containerRef.current && containerRef.current.scrollHeight > containerRef.current.clientHeight) {
          containerRef.current.scrollTop = targetPos;
        }
      });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      cancelAnimationFrame(animationFrameId);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isHandMode, isDragging, startY, scrollTop]);

  if (loading) return <LoadingSpinner fullScreen message="جاري تحميل المقالة..." />;

  const isDark = theme === 'dark' || theme === 'night';
  const pageBgClass = isDark ? 'bg-[#0f172a]' : 'bg-[#f8fafc]';
  const paperBgClass = isDark ? 'bg-[#1e293b] border-slate-700 text-slate-100 shadow-2xl' : 'bg-white border-slate-100 text-slate-800 shadow-xl';

  if (error || !article) {
    return (
      <div className={`h-screen ${pageBgClass} flex flex-col items-center justify-center p-6`}>
        <div className="text-2xl font-cairo mb-4 text-red-500">{error || 'المقالة غير موجودة'}</div>
        <button 
          onClick={() => navigate('/articles')} 
          className="bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-md"
        >
          الرجوع إلى قائمة المقالات
        </button>
      </div>
    );
  }

  const handleShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(article.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
  };

  // Smart Formatting Logic for White Theme
  const formatText = (text: string, idx: number) => {
    const trimText = text.trim();
    if (!trimText) return null;
    
    // Subheadings: Ends with colon or starts with a number.
    const isHeading = trimText.endsWith(':') || /^[\u0660-\u06690-9]+[\.\-]\s/.test(trimText);
    
    // Pull Quotes: contains important keywords
    const isImportant = /(قاعدة|هام|تنبيه|فائدة)/.test(trimText);

    if (isImportant) {
      return (
        <aside key={idx} className={`my-8 p-6 border-r-4 border-[#d4a045] rounded-l-2xl ${isDark ? 'bg-[#d4a045]/10 text-amber-200' : 'bg-[#fffbeb] text-[#92400e] border-[#f59e0b]'} shadow-sm`}>
          <div className="flex gap-3 items-start">
            <span className="text-2xl">💡</span>
            <p className="font-bold leading-relaxed m-0" style={{ fontSize: `${fontSize + 2}px` }}>{trimText}</p>
          </div>
        </aside>
      );
    }

    if (isHeading) {
      return (
        <h3 key={idx} className={`font-bold font-cairo mt-10 mb-5 pb-2 border-b ${isDark ? 'text-[#34d399] border-slate-700' : 'text-[#047857] border-emerald-100'}`} style={{ fontSize: `${fontSize + 6}px` }}>
          {trimText}
        </h3>
      );
    }

    return (
      <p 
        key={idx} 
        className={`mb-6 leading-relaxed ${idx === 0 ? `font-semibold leading-loose ${isDark ? 'text-amber-300' : 'text-[#b45309]'}` : (isDark ? 'text-slate-200' : 'text-slate-700')}`} 
        style={{ fontSize: `${fontSize}px` }}
      >
        {trimText}
      </p>
    );
  };

  const paragraphs = article.content.split('\n');

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen w-full overflow-x-hidden overflow-y-auto ${pageBgClass} font-sans pb-24 transition-colors duration-500 ${isHandMode ? (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none') : 'cursor-auto'}`}
      onMouseDown={handleMouseDown}
    >
      {/* Top Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-b border-slate-800 text-white' : 'bg-white/85 border-b border-slate-200 text-slate-800 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/articles')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} title="رجوع للمقالات">
              <ArrowRight size={24} />
            </button>
            <div className="font-cairo font-bold text-xl flex items-center gap-3 cursor-pointer" onClick={() => navigate('/articles')}>
              <img src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#d4a045]" />
              <span className="hidden sm:inline font-extrabold text-[#047857]">رجوع للمقالات</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-700'}`} 
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleShare} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-700'}`} title="مشاركة على فيسبوك">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Floating Interactive Toolbar (Mobile Dock / Desktop Side) */}
      <div className={`fixed left-4 bottom-6 md:bottom-auto md:top-1/3 flex md:flex-col gap-2 p-2.5 rounded-2xl shadow-2xl z-40 backdrop-blur-lg border ${isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-700'}`}>
        <button 
          onClick={() => setFontSize(f => Math.min(f + 2, 32))} 
          className="p-2.5 rounded-xl hover:bg-[#047857] hover:text-white transition-colors" 
          title="تكبير الخط"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={() => setFontSize(f => Math.max(f - 2, 14))} 
          className="p-2.5 rounded-xl hover:bg-[#047857] hover:text-white transition-colors" 
          title="تصغير الخط"
        >
          <ZoomOut size={20} />
        </button>
        <div className="hidden md:block w-full h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
        <button 
          onClick={() => setIsHandMode(!isHandMode)} 
          className={`hidden md:flex p-2.5 rounded-xl transition-all ${isHandMode ? 'bg-[#047857] text-white shadow-lg scale-105' : 'hover:bg-[#047857] hover:text-white'}`} 
          title={isHandMode ? "إيقاف أداة اليد" : "تفعيل أداة اليد (للسحب)"}
        >
          <Hand size={20} />
        </button>
      </div>

      {/* Main Content Paper Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-28">
        <div className={`rounded-3xl border ${paperBgClass} p-6 md:p-14 my-6`}>
          {/* Header Section */}
          <header className="mb-10 text-center animate-fade-in-up">
            <div className="inline-block px-5 py-1.5 rounded-full bg-[#047857]/10 text-[#047857] font-bold text-sm mb-6 border border-[#047857]/20">
              مقالة فكرية
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-cairo leading-tight mb-8 text-[#047857]">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium opacity-80 border-t border-b border-slate-100 dark:border-slate-800 py-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#d4a045]" />
                <span>{new Date(article.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-[#d4a045]" />
                <span>إدارة الملتقى</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#d4a045]" />
                <span>{Math.max(1, Math.ceil(article.content.length / 800))} دقائق للقراءة</span>
              </div>
            </div>
          </header>

          {/* Hero Image */}
          <div className="w-full h-64 md:h-[450px] rounded-2xl overflow-hidden mb-12 shadow-md relative">
            <img 
              src={article.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&h=800&fit=crop'} 
              alt={article.title} 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Article Body */}
          <article className="max-w-none font-sans text-justify px-2 md:px-4">
            {article.content.includes('<') && article.content.includes('>') ? (
              <div
                style={{ fontSize: `${fontSize}px` }}
                className={`space-y-4 leading-loose ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                dangerouslySetInnerHTML={{
                  __html: article.content
                    .replace(/className=/g, 'class=')
                    .replace(/class="border-r-4 border-\[#d4a045\] bg-\[#d4a045\]\/10 p-4 rounded-xl my-4 text-base italic font-semibold"/g, 'style="border-right: 5px solid #d4a045; background-color: rgba(212, 160, 69, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-style: italic; font-weight: 600; color: #d4a045;"')
                    .replace(/class="border border-\[#047857\]\/40 bg-\[#047857\]\/10 p-4 rounded-xl my-4 text-sm font-medium"/g, 'style="border: 1px solid rgba(4, 120, 87, 0.5); background-color: rgba(4, 120, 87, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-weight: 500; color: #047857;"')
                }}
              />
            ) : (
              paragraphs.map((p, idx) => formatText(p, idx))
            )}
          </article>

          {/* Footer Back Button */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <button 
              onClick={() => navigate('/articles')} 
              className="flex items-center gap-2 text-[#047857] hover:text-[#065f46] font-bold text-lg transition-colors"
            >
              <ArrowRight size={22} />
              رجوع للمقالات
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticlePage;
