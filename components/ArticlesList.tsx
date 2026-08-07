import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Calendar, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { articlesApi, Article } from '../services/api/articles';
import { INITIAL_OFFICIAL_ARTICLES } from '../services/api/officialArticles';
import LoadingSpinner from './LoadingSpinner';

const ArticlesList: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [articles, setArticles] = useState<Article[]>(INITIAL_OFFICIAL_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
    const fetchArticles = async () => {
      try {
        const data = await articlesApi.getAll();
        setArticles(data);
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل المقالات. يرجى المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const isDark = theme === 'dark' || theme === 'night';
  const bgClass = isDark ? 'bg-[#020617]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  
  // Real-time search engine
  const filteredArticles = articles.filter(article => {
      const query = searchQuery.toLowerCase();
      return article.title.toLowerCase().includes(query) || 
             article.content.toLowerCase().includes(query);
  });

  const stripHtml = (html: string): string => {
    if (!html) return '';
    let text = html.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    text = text.replace(/<[^>]*>/g, ' ');
    text = text.replace(/style="[^"]*"/gi, ' ')
               .replace(/class="[^"]*"/gi, ' ')
               .replace(/\b(blockquote|style|color|background-color|padding|border-radius|margin|font-style|font-weight)\b/gi, ' ');
    return text.replace(/\s+/g, ' ').trim();
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden overflow-y-auto ${bgClass} ${textClass} font-sans pb-32 transition-colors duration-500`}>
      {/* Navbar Minimal */}
      <nav className={`sticky top-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-black/50 border-b border-white/10' : 'bg-white/70 border-b border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
              <ArrowRight size={24} />
            </button>
            <div className="font-cairo font-bold text-xl flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#d4a045]" />
              <span className="hidden sm:inline">العودة للرئيسية</span>
            </div>
          </div>
          <button 
            onClick={toggleTheme} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md border transform hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300'
                : 'bg-slate-900 text-amber-400 border-amber-400/40 hover:bg-slate-800'
            }`} 
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDark ? <Sun size={20} className="fill-slate-950 text-slate-950" /> : <Moon size={20} className="fill-amber-400 text-amber-400" />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-cairo mb-4">مقالات <span className="text-[#047857]">الملتقى</span></h1>
          <p className="opacity-70 max-w-2xl mx-auto text-lg">
            تصفح أحدث الإصدارات والمقالات الفكرية والتربوية. يمكنك البحث للوصول السريع إلى المواضيع التي تهمك.
          </p>
        </div>

        {/* Search Engine */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="relative">
            <input 
              type="text" 
              placeholder="ابحث في عنوان أو محتوى المقالة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-4 px-12 rounded-full text-lg border-2 focus:outline-none focus:border-[#d4a045] transition-colors shadow-lg ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-black placeholder-gray-500'}`}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm opacity-70 text-center">
              تم العثور على {filteredArticles.length} مقالة
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner message="جاري تحميل المقالات..." /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-20">{error}</div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, idx) => (
              <div 
                key={article.id} 
                onClick={() => navigate(`/article/${article.id}`)}
                className={`rounded-2xl overflow-hidden ${idx === 0 ? 'border-2 border-amber-400 shadow-2xl ring-2 ring-amber-400/20' : ''} ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl'} group cursor-pointer transition-transform duration-300 hover:-translate-y-2 flex flex-col h-full relative`}
              >
                {idx === 0 && (
                  <div className="absolute top-3 left-3 z-10 bg-amber-500 text-black text-xs font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    ✨ المقال الأحدث
                  </div>
                )}
                <div className="h-56 overflow-hidden relative">
                  <img src={article.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&h=300&fit=crop'} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 bg-[#047857]/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-md">
                    مقالة
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-xs opacity-70 mb-3 text-[#d4a045] font-bold">
                    <Calendar size={14} />
                    <span>{new Date(article.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 line-clamp-2 font-cairo leading-tight">{article.title}</h3>
                  <p className="opacity-70 text-sm line-clamp-3 mb-6 flex-grow">{stripHtml(article.content)}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-500/20">
                    <span className="text-sm font-semibold opacity-80">إدارة الملتقى</span>
                    <span className="text-[#047857] hover:text-[#d4a045] transition-colors font-bold text-sm">اقرأ المزيد ←</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 opacity-50 text-xl font-cairo">
            لا توجد مقالات مطابقة للبحث.
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticlesList;
