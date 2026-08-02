import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, User, Clock, Share2 } from 'lucide-react';
import { useTheme } from './ThemeContext';
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
  const { theme } = useTheme();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        console.error(err);
        setError('تعذر تحميل المقالة. قد تكون محذوفة أو الرابط غير صحيح.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen message="جاري تحميل المقالة..." />;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#020617]' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-white/5 border-white/10' : 'bg-white shadow-xl';

  if (error || !article) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass} flex flex-col items-center justify-center p-6`}>
        <div className="text-2xl font-cairo mb-4 text-red-500">{error || 'المقالة غير موجودة'}</div>
        <button 
          onClick={() => navigate('/')} 
          className="bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Format content for paragraphs
  const paragraphs = article.content.split('\n').filter(p => p.trim() !== '');

  return (
    <div className={`h-screen overflow-y-auto overflow-x-hidden ${bgClass} ${textClass} font-sans pb-24 transition-colors duration-500`}>
      {/* Navbar Minimal for Article Page */}
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

      <main className="max-w-4xl mx-auto px-6 pt-32">
        {/* Header Section */}
        <header className="mb-12 text-center animate-fade-in-up">
          <div className="inline-block px-4 py-1 rounded-full bg-[#047857]/20 text-[#10b981] font-semibold text-sm mb-6">
            مقالة فكرية
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-cairo leading-tight mb-6">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm opacity-70">
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
        <div className="w-full h-64 md:h-[500px] rounded-[2rem] overflow-hidden mb-16 shadow-2xl relative animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <img 
            src={article.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=1200&h=800&fit=crop'} 
            alt={article.title} 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" 
          />
        </div>

        {/* Content Body */}
        <article className={`prose ${isDark ? 'prose-invert' : ''} prose-lg md:prose-xl max-w-none font-sans leading-relaxed text-justify mb-16 px-4 md:px-12`}>
          {paragraphs.map((p, idx) => (
            <p key={idx} className={`mb-6 ${idx === 0 ? 'text-xl md:text-2xl font-medium leading-loose text-[#d4a045]' : ''}`}>
              {p}
            </p>
          ))}
        </article>

        {/* Footer Navigation */}
        <div className={`mt-16 pt-8 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#047857] hover:text-[#065f46] font-bold transition-colors">
            <ArrowRight size={20} />
            العودة للملتقى
          </button>
        </div>
      </main>
    </div>
  );
};

export default ArticlePage;
