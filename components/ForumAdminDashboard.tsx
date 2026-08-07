import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Compass, 
  Camera, 
  PlusCircle, 
  CheckCircle2, 
  Trash2, 
  LogOut, 
  Edit3, 
  Sparkles,
  Layers,
  Globe,
  ImageIcon,
  XCircle,
  Save,
  Eye,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import RichTextEditor from './RichTextEditor';
import { articlesApi, Article } from '../services/api/articles';
import { initiativesApi } from '../services/api/initiatives';
import { formatInitiativeWithCerebras } from '../services/cerebrasAI';

interface InitiativeItem {
  id: string;
  title: string;
  description: string;
  logo: string;
  vision: string;
}

interface ActivityItem {
  id: string;
  initId: string;
  title: string;
  summary: string;
  images: string;
}

export const ForumAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'article' | 'initiative' | 'activity' | 'manage' | 'analytics'>('article');
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    totalSiteViews: number;
    totalSiteDurationSeconds: number;
    overallAvgDurationSeconds: number;
    formattedOverallAvgDuration: string;
    pages: Array<{
      path: string;
      title: string;
      views: number;
      totalDurationSeconds: number;
      avgDurationSeconds: number;
      formattedAvgDuration: string;
      lastVisitedAt: string;
    }>;
  } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalyticsStats = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics/stats');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Fetch analytics stats error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsStats();
      const timer = setInterval(() => {
        fetchAnalyticsStats();
      }, 3000); // Live real-time polling every 3 seconds
      return () => clearInterval(timer);
    }
  }, [activeTab]);
  
  // Articles Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleImage, setArticleImage] = useState('');

  // Initiatives Form State
  const [editingInitId, setEditingInitId] = useState<string | null>(null);
  const [initTitle, setInitTitle] = useState('');
  const [initDesc, setInitDesc] = useState('');
  const [initLogo, setInitLogo] = useState('');
  const [initVision, setInitVision] = useState('');

  // Activities Form State
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [selectedInitId, setSelectedInitId] = useState('init_futuwwa');
  const [activityTitle, setActivityTitle] = useState('');
  const [activitySummary, setActivitySummary] = useState('');
  const [activityImages, setActivityImages] = useState('');

  // Storage Lists
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [initiativesList, setInitiativesList] = useState<InitiativeItem[]>([
    { id: 'init_futuwwa', title: 'أكاديمية فتوة/فلسطين', description: 'برنامج إعداد قيادي شبابي يهدف إلى بناء الشخصية الإسلامية المتكاملة.', logo: '/logos/فتوة.png', vision: 'بناء الوعي القيادي والتربية الإسلامية الشاملة' },
    { id: 'init_ehdena', title: 'مبادرة اهدنا (على هدي الحبيب)', description: 'نشر تعاليم الدين الإسلامي وإحياء المناسبات الدينية ومجالس الصلاة على النبي.', logo: '/logos/على هدي الحبيب.png', vision: 'تعزيز الاقتداء بالسيرة النبوية الشريفة' },
    { id: 'init_meraj', title: 'مقرأة معراج', description: 'مبادرة تعنى بالقرآن الكريم وحفظه وتكريمه وحلقات العلوم الشريفة.', logo: '/logos/معراج.png', vision: 'خدمة القرآن الكريم وحلقات الإقراء' },
    { id: 'init_nabd_hayat', title: 'مبادرة نبض الحياة', description: 'تزويد الشباب بمهارات الإسعافات الأولية والاستجابة الطارئة.', logo: '/logos/ نبض الحياة.png', vision: 'التدريب على الإسعافات والاستجابة الطارئة' },
    { id: 'init_nabd_aman', title: 'مبادرة نبض الأمان', description: 'تعزيز السلامة العامة والتعامل مع حالات الطوارئ والإطفاء.', logo: '/logos/ نبض الأمان.png', vision: 'السلامة والوقاية المجتمعية' },
    { id: 'init_basmat_amal', title: 'مبادرة بسمة أمل', description: 'دعم نفسي واجتماعي ودورات علمية وتثقيفية موجهة للشباب.', logo: '/logos/ بسمة أمل.png', vision: 'الدعم النفسي والتثقيف الشبابي' }
  ]);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>([]);

  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingActivityImg, setUploadingActivityImg] = useState(false);

  const [manageSubTab, setManageSubTab] = useState<'articles' | 'initiatives' | 'activities'>('articles');

  useEffect(() => {
    // Load existing articles from API
    articlesApi.getAll().then(setArticlesList).catch(() => {});
    
    // Load existing initiatives and their activities from API
    initiativesApi.getAll().then(async (data) => {
      if (data && data.length > 0) {
        setInitiativesList(data.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          logo: i.image || '/logos/الملتقى.png',
          vision: i.description
        })));

        // Fetch all activities across all initiatives
        const allActs: ActivityItem[] = [];
        for (const init of data) {
          try {
            const fullInit = await initiativesApi.getById(init.id);
            if (fullInit && fullInit.activities && fullInit.activities.length > 0) {
              for (const act of fullInit.activities) {
                allActs.push({
                  id: act.id,
                  initId: act.initiative_id || init.id,
                  title: act.title,
                  summary: act.description,
                  images: Array.isArray(act.images) ? act.images.join(', ') : (act.images || '')
                });
              }
            }
          } catch (err) {
            console.error('Error fetching activities for initiative:', init.id, err);
          }
        }
        if (allActs.length > 0) {
          setActivitiesList(allActs);
        }
      }
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('myf_forum_admin_auth');
    navigate('/');
  };

  // Helper for logo upload
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        if (data.url) {
          setInitLogo(data.url);
        } else {
          setInitLogo(base64);
        }
      } catch {
        setInitLogo(reader.result as string);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper for activity photos upload
  const handleActivityPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingActivityImg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();
        const uploadedUrl = data.url || base64;
        setActivityImages(activityImages ? `${activityImages}, ${uploadedUrl}` : uploadedUrl);
      } catch {
        const uploadedUrl = reader.result as string;
        setActivityImages(activityImages ? `${activityImages}, ${uploadedUrl}` : uploadedUrl);
      } finally {
        setUploadingActivityImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit/Update Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle || !articleContent) return;

    try {
      if (editingArticleId) {
        // Update existing article
        await articlesApi.update(editingArticleId, {
          title: articleTitle,
          content: articleContent,
          image: articleImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=400&fit=crop'
        });
        setEditingArticleId(null);
        setSuccessMsg('تم تحديث وتعديل المقال بنجاح وتحديث بياناته على الموقع!');
      } else {
        // Create new article
        await articlesApi.create({
          title: articleTitle,
          content: articleContent,
          image: articleImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=400&fit=crop'
        });
        setSuccessMsg('تم نشر المقال بنجاح وإضافته فوراً لصفحة الهبوط وصفحة المقالات!');
      }

      // Refresh list
      const updatedList = await articlesApi.getAll();
      setArticlesList(updatedList);
    } catch (err) {
      console.error(err);
      setSuccessMsg('تم نشر وتحديث المقال محلياً بنجاح!');
    }

    setArticleTitle('');
    setArticleContent('');
    setArticleImage('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Trigger editing an article
  const startEditArticle = (article: Article) => {
    setEditingArticleId(article.id);
    setArticleTitle(article.title);
    setArticleContent(article.content);
    setArticleImage(article.image || '');
    setActiveTab('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditArticle = () => {
    setEditingArticleId(null);
    setArticleTitle('');
    setArticleContent('');
    setArticleImage('');
  };

  // Submit/Update Initiative
  const handleSaveInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initTitle || !initDesc) return;

    try {
      if (editingInitId) {
        await initiativesApi.update(editingInitId, {
          title: initTitle,
          description: initDesc,
          image: initLogo || undefined,
          link: `/initiative/${editingInitId}`
        });
        setInitiativesList(initiativesList.map(i => 
          i.id === editingInitId 
            ? { ...i, title: initTitle, description: initDesc, logo: initLogo || i.logo, vision: initVision }
            : i
        ));
        setEditingInitId(null);
        setSuccessMsg(`تم تحديث معلومات المبادرة (${initTitle}) ودفع التحديث بقاعدة البيانات بنجاح!`);
      } else {
        const created = await initiativesApi.create({
          title: initTitle,
          description: initDesc,
          image: initLogo || '/logos/الملتقى.png',
          link: `/initiative/custom_${Date.now()}`
        });
        const newInit: InitiativeItem = {
          id: created.id,
          title: created.title,
          description: created.description,
          logo: created.image || '/logos/الملتقى.png',
          vision: initVision
        };
        setInitiativesList([...initiativesList, newInit]);
        setSuccessMsg(`تم إضافة المبادرة الجديدة (${initTitle}) وقيدها بقاعدة بيانات السيرفر بنجاح!`);
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg(`تم حفظ وتحديث المبادرة (${initTitle}) محلياً!`);
    }

    setInitTitle('');
    setInitDesc('');
    setInitLogo('');
    setInitVision('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const startEditInitiative = (init: InitiativeItem) => {
    setEditingInitId(init.id);
    setInitTitle(init.title);
    setInitDesc(init.description);
    setInitLogo(init.logo);
    setInitVision(init.vision);
    setActiveTab('initiative');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditInitiative = () => {
    setEditingInitId(null);
    setInitTitle('');
    setInitDesc('');
    setInitLogo('');
    setInitVision('');
  };

  // Submit/Update Activity
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle || !activitySummary) return;

    try {
      if (editingActivityId) {
        await initiativesApi.updateActivity(editingActivityId, {
          title: activityTitle,
          description: activitySummary,
          images: activityImages ? activityImages.split(',').map(s => s.trim()) : []
        });
        setActivitiesList(activitiesList.map(act => 
          act.id === editingActivityId
            ? { ...act, initId: selectedInitId, title: activityTitle, summary: activitySummary, images: activityImages }
            : act
        ));
        setEditingActivityId(null);
        setSuccessMsg(`تم تعديل وتحديث بيانات النشاط (${activityTitle}) بقاعدة البيانات بنجاح!`);
      } else {
        const actCreated = await initiativesApi.addActivity(selectedInitId, {
          title: activityTitle,
          description: activitySummary,
          images: activityImages ? activityImages.split(',').map(s => s.trim()) : []
        });
        const newAct: ActivityItem = {
          id: actCreated.id,
          initId: selectedInitId,
          title: actCreated.title,
          summary: actCreated.description,
          images: activityImages
        };
        setActivitiesList([newAct, ...activitiesList]);
        setSuccessMsg(`تم إدراج النشاط الجديد (${activityTitle}) بقاعدة بيانات السيرفر بنجاح!`);
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg(`تم حفظ وتحديث النشاط (${activityTitle}) محلياً!`);
    }

    setActivityTitle('');
    setActivitySummary('');
    setActivityImages('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const startEditActivity = (act: ActivityItem) => {
    setEditingActivityId(act.id);
    setSelectedInitId(act.initId);
    setActivityTitle(act.title);
    setActivitySummary(act.summary);
    setActivityImages(act.images);
    setActiveTab('activity');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditActivity = () => {
    setEditingActivityId(null);
    setActivityTitle('');
    setActivitySummary('');
    setActivityImages('');
  };

  const [aiInitLoading, setAiInitLoading] = useState(false);

  const handleAIFormatInitiative = async () => {
    if (!initTitle) return;
    setAiInitLoading(true);
    try {
      const data = await formatInitiativeWithCerebras(initTitle, initDesc);
      if (data.description) setInitDesc(data.description);
      if (data.vision) setInitVision(data.vision);
    } catch (err) {
      console.error('Cerebras AI Initiative Format Error:', err);
    } finally {
      setAiInitLoading(false);
    }
  };

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'article' | 'initiative' | 'activity';
    id: string;
    title: string;
  } | null>(null);

  const executeConfirmedDelete = async () => {
    if (!deleteConfirmTarget) return;

    const { type, id, title } = deleteConfirmTarget;

    try {
      if (type === 'article') {
        await articlesApi.delete(id);
        setArticlesList(prev => prev.filter(a => a.id !== id));
        setSuccessMsg(`تم حذف المقال (${title}) نهائياً من قاعدة البيانات!`);
      } else if (type === 'initiative') {
        await initiativesApi.delete(id);
        setInitiativesList(prev => prev.filter(i => i.id !== id));
        setSuccessMsg(`تم حذف المبادرة (${title}) نهائياً من قاعدة البيانات!`);
      } else if (type === 'activity') {
        await initiativesApi.deleteActivity(id);
        setActivitiesList(prev => prev.filter(a => a.id !== id));
        setSuccessMsg(`تم حذف النشاط (${title}) نهائياً من قاعدة البيانات!`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      if (type === 'article') setArticlesList(prev => prev.filter(a => a.id !== id));
      if (type === 'initiative') setInitiativesList(prev => prev.filter(i => i.id !== id));
      if (type === 'activity') setActivitiesList(prev => prev.filter(a => a.id !== id));
      setSuccessMsg(`تم إزالة المحتوى (${title}) محلياً.`);
    } finally {
      setDeleteConfirmTarget(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'day' ? 'bg-slate-100 text-slate-900' : 'bg-[#061325] text-slate-100'} font-cairo transition-colors duration-300 pb-20 relative`}>
      
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-3xl border ${theme === 'day' ? 'bg-white border-red-200 text-slate-900 shadow-2xl' : 'bg-slate-900 border-red-900/50 text-white shadow-2xl'} space-y-5 text-center`}>
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-cairo text-red-500 mb-2">⚠️ تأكيد الحذف النهائي</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف:
              </p>
              <p className="text-base font-extrabold text-amber-400 my-2 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                "{deleteConfirmTarget.title}"
              </p>
              <p className="text-xs text-red-400 font-semibold">
                هذا الإجراء سيقوم بإزالة المحتوى نهائياً من قاعدة البيانات وموقع الملتقى ولا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg transition"
              >
                🗑️ نعم، حذف نهائي
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border transition ${theme === 'day' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'}`}
              >
                ✖️ إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Admin Header */}
      <header className={`border-b ${theme === 'day' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0a192f] border-slate-800'} px-6 py-4 sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d4a045] flex items-center justify-center text-black font-extrabold shadow-md">
              MYF
            </div>
            <div>
              <h1 className="font-bold text-lg font-cairo">لوحة التحكم بالمحتوى والإصدارات</h1>
              <p className="text-xs opacity-60">الموقع الرسمي: muslimyouth.ps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open('https://muslimyouth.ps', '_blank')}
              className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 transition"
            >
              <Globe size={16} />
              <span>الموقع الرسمي</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Success Banner Notification */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-bold flex items-center gap-3 shadow-lg animate-fade-in">
            <CheckCircle2 size={22} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Control Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-500/20 pb-4">
          <button
            onClick={() => setActiveTab('article')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'article'
                ? 'bg-[#d4a045] text-black shadow-lg scale-105'
                : theme === 'day' ? 'bg-white text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText size={18} />
            <span>{editingArticleId ? '✏️ تعديل المقال المحدد' : '1. إضافة مقال جديد (محرر احترافي)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('initiative')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'initiative'
                ? 'bg-[#d4a045] text-black shadow-lg scale-105'
                : theme === 'day' ? 'bg-white text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass size={18} />
            <span>{editingInitId ? '✏️ تعديل المبادرة المحددة' : '2. إضافة مبادرة جديدة'}</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'activity'
                ? 'bg-[#d4a045] text-black shadow-lg scale-105'
                : theme === 'day' ? 'bg-white text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera size={18} />
            <span>{editingActivityId ? '✏️ تعديل النشاط المحدد' : '3. إضافة نشاط لمبادرة'}</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'manage'
                ? 'bg-[#d4a045] text-black shadow-lg scale-105'
                : theme === 'day' ? 'bg-white text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers size={18} />
            <span>4. تصفح وتعديل المحتوى المنشور</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-black shadow-lg scale-105'
                : theme === 'day' ? 'bg-white text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 size={18} />
            <span>📊 5. عداد زوار الموقع ومعدل البقاء</span>
          </button>
        </div>

        {/* Tab 1: New / Edit Article */}
        {activeTab === 'article' && (
          <form onSubmit={handleSaveArticle} className="space-y-6">
            {editingArticleId && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <span className="text-sm font-bold text-amber-500">أنت الآن تقوم بتعديل وتحرير مقال محدد منشور سابقاً</span>
                <button 
                  type="button" 
                  onClick={cancelEditArticle}
                  className="flex items-center gap-1 text-xs font-bold text-red-400 hover:underline"
                >
                  <XCircle size={16} />
                  <span>إلغاء التعديل</span>
                </button>
              </div>
            )}

            <RichTextEditor
              title={articleTitle}
              setTitle={setArticleTitle}
              content={articleContent}
              setContent={setArticleContent}
              image={articleImage}
              setImage={setArticleImage}
            />

            <div className="flex justify-end gap-3 pt-4">
              {editingArticleId && (
                <button
                  type="button"
                  onClick={cancelEditArticle}
                  className="bg-gray-500/20 hover:bg-gray-500/30 text-slate-300 font-bold py-4 px-6 rounded-2xl transition"
                >
                  إلغاء
                </button>
              )}
              <button
                type="submit"
                className="bg-[#047857] hover:bg-[#035e44] text-white font-bold py-4 px-10 rounded-2xl shadow-xl flex items-center gap-3 text-lg transition-transform transform active:scale-98"
              >
                {editingArticleId ? <Save size={22} /> : <PlusCircle size={22} />}
                <span>{editingArticleId ? 'حفظ وتحديث المقال فوراً' : 'نشر المقال فوراً على الموقع'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: New / Edit Initiative */}
        {activeTab === 'initiative' && (
          <form onSubmit={handleSaveInitiative} className={`p-8 rounded-3xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl'} space-y-6 max-w-4xl mx-auto`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold font-cairo text-gradient-gold mb-1">
                  {editingInitId ? 'تعديل بيانات المبادرة الحالية' : 'إضافة مبادرة جديدة وتخصيص صفحة خاصة لها'}
                </h3>
                <p className={`text-xs ${theme === 'day' ? 'text-slate-600' : 'text-slate-400'}`}>
                  سيتم تحديث معلومات المبادرة وصفحتها الخاصة فوراً.
                </p>
              </div>

              {editingInitId && (
                <button type="button" onClick={cancelEditInitiative} className="text-xs font-bold text-red-400 hover:underline">
                  إلغاء التعديل
                </button>
              )}
            </div>

            {/* AI Generator Button for Initiative */}
            <button
              type="button"
              onClick={handleAIFormatInitiative}
              disabled={aiInitLoading || !initTitle}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-600 hover:from-amber-600 hover:to-emerald-700 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] border border-amber-300/30 disabled:opacity-50"
            >
              <Sparkles size={18} className={aiInitLoading ? 'animate-spin' : 'animate-pulse'} />
              <span>{aiInitLoading ? 'جاري توليد وصياغة أهداف ورؤية المبادرة (gpt-oss-120b على Cerebras)...' : '✨ توليد وصياغة أهداف ورؤية المبادرة بالذكاء الاصطناعي (Cerebras gpt-oss-120b)'}</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold mb-2">اسم المبادرة *</label>
                <input
                  type="text"
                  required
                  value={initTitle}
                  onChange={(e) => setInitTitle(e.target.value)}
                  placeholder="مثال: مبادرة بناء الوعي القيادي"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
                />
              </div>

              {/* Logo File Upload / URL */}
              <div>
                <label className="block text-xs font-bold mb-2">صورة لوجو المبادرة (رفع لسيرفر /public/uploads/forum/)</label>
                <div className="flex gap-2">
                  <label className="flex items-center justify-center gap-1 cursor-pointer px-4 py-3 rounded-xl bg-[#d4a045] text-black font-bold text-xs shrink-0 shadow-md">
                    <ImageIcon size={16} />
                    <span>{uploadingLogo ? 'رفع...' : '📁 اختيار لوجو'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" disabled={uploadingLogo} />
                  </label>
                  <input
                    type="text"
                    value={initLogo}
                    onChange={(e) => setInitLogo(e.target.value)}
                    placeholder="أو أدخل رابط اللوجو..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">الشرح المختصر والمقدمة *</label>
              <textarea
                rows={3}
                required
                value={initDesc}
                onChange={(e) => setInitDesc(e.target.value)}
                placeholder="نبذة عامة تظهر في بطاقة المبادرة بصفحة الهبوط..."
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">رؤية وأهداف المبادرة تفصيلياً (تظهر في صفحة المبادرة)</label>
              <textarea
                rows={4}
                value={initVision}
                onChange={(e) => setInitVision(e.target.value)}
                placeholder="أهداف المبادرة، المستهدفين، ومحاور البرامج..."
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
              />
            </div>

            {/* Live Interactive Preview */}
            <div className={`p-6 rounded-2xl border ${theme === 'day' ? 'bg-slate-50 border-amber-300/50' : 'bg-slate-800/60 border-amber-500/30'} space-y-4`}>
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm border-b border-amber-500/20 pb-2">
                <Eye size={18} />
                <span>🔍 معاينة حية للمبادرة قبل الإضافة والإنشاء (Live Interactive Preview)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* 1. Card Preview */}
                <div className={`p-4 rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900 border-slate-700'} flex flex-col justify-between`}>
                  <div>
                    <div className="text-[11px] font-bold text-[#d4a045] mb-2 flex items-center gap-1">
                      <span>1️⃣ مظهر بطاقة المبادرة (في الرئيسية)</span>
                    </div>
                    <div className={`h-32 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center p-3 ${theme === 'day' ? 'bg-slate-100' : 'bg-[#01140e]'}`}>
                      <img 
                        src={initLogo || '/logos/الملتقى.png'} 
                        alt={initTitle || 'اسم المبادرة'} 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { (e.target as HTMLElement).setAttribute('src', '/logos/الملتقى.png'); }}
                      />
                    </div>
                    <h4 className="font-bold text-base text-amber-400 mb-1 line-clamp-1">{initTitle || 'عنوان المبادرة الجاري كتابته...'}</h4>
                    <p className="text-xs opacity-75 line-clamp-3 leading-relaxed">
                      {initDesc || 'الشرح المختصر والمقدمة سيعرضان هنا بشكل حقيقي وتفاعلي...'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-500/10">
                    <span className="text-[11px] font-bold text-emerald-400">استعراض تفاصيل المبادرة ⬅️</span>
                  </div>
                </div>

                {/* 2. Initiative Page Header Preview */}
                <div className={`p-4 rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900 border-slate-700'} flex flex-col justify-between`}>
                  <div>
                    <div className="text-[11px] font-bold text-[#d4a045] mb-2 flex items-center gap-1">
                      <span>2️⃣ مظهر ترويسة الصفحة الخاصة للمبادرة</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#047857]/20 border border-[#047857]/40 flex items-center justify-center overflow-hidden p-1 shrink-0">
                        <img 
                          src={initLogo || '/logos/الملتقى.png'} 
                          alt="Logo" 
                          className="w-full h-full object-contain" 
                          onError={(e) => { (e.target as HTMLElement).setAttribute('src', '/logos/الملتقى.png'); }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{initTitle || 'عنوان المبادرة'}</h4>
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full inline-block mt-0.5">مبادرة رسمية - ملتقى الشباب المسلم</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-80 space-y-1">
                      <div className="font-semibold text-slate-300">الرؤية والأهداف:</div>
                      <p className="text-[11px] opacity-75 line-clamp-3 leading-relaxed">
                        {initVision || initDesc || 'أهداف المبادرة ومحاور العمل ستظهر هنا داخل صفحتها التفصيلية...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base transition"
            >
              {editingInitId ? <Save size={20} /> : <Sparkles size={20} />}
              <span>{editingInitId ? 'حفظ وتحديث بيانات المبادرة' : 'إنشاء ونشر المبادرة فوراً'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: New / Edit Activity */}
        {activeTab === 'activity' && (
          <form onSubmit={handleSaveActivity} className={`p-8 rounded-3xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-xl' : 'bg-slate-900 border-slate-800 shadow-2xl'} space-y-6 max-w-4xl mx-auto`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold font-cairo text-gradient-gold mb-1">
                  {editingActivityId ? 'تعديل وتحديث بيانات النشاط الحالي' : 'إضافة نشاط جديد لمبادرة حالية'}
                </h3>
                <p className={`text-xs ${theme === 'day' ? 'text-slate-600' : 'text-slate-400'}`}>
                  اختر المبادرة المستهدفة وأدرج صور وشرح النشاط المنفذ.
                </p>
              </div>

              {editingActivityId && (
                <button type="button" onClick={cancelEditActivity} className="text-xs font-bold text-red-400 hover:underline">
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">اختر المبادرة المستهدفة *</label>
              <select
                value={selectedInitId}
                onChange={(e) => setSelectedInitId(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
              >
                {initiativesList.map(init => (
                  <option key={init.id} value={init.id}>{init.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">عنوان النشاط / الفعالية *</label>
              <input
                type="text"
                required
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="مثال: ورشة الإسعافات الأوّلية المتقدمة"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
              />
            </div>

            {/* Photo Gallery File Upload */}
            <div>
              <label className="block text-xs font-bold mb-2">صور النشاط (رفع صور لسيرفر /public/uploads/forum/ أو أدخل روابط)</label>
              <div className="flex gap-2">
                <label className="flex items-center justify-center gap-1 cursor-pointer px-4 py-3 rounded-xl bg-[#d4a045] text-black font-bold text-xs shrink-0 shadow-md">
                  <ImageIcon size={16} />
                  <span>{uploadingActivityImg ? 'رفع...' : '📁 إضافة صورة للنشاط'}</span>
                  <input type="file" accept="image/*" onChange={handleActivityPhotoUpload} className="hidden" disabled={uploadingActivityImg} />
                </label>
                <input
                  type="text"
                  value={activityImages}
                  onChange={(e) => setActivityImages(e.target.value)}
                  placeholder="روابط الصور تفصل بينها بفصلة..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">شرح مختصر عن النشاط والنتائج *</label>
              <textarea
                rows={4}
                required
                value={activitySummary}
                onChange={(e) => setActivitySummary(e.target.value)}
                placeholder="تفاصيل التغطية، عدد المشاركين، وأبرز المخرجات..."
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none ${theme === 'day' ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#047857] hover:bg-[#035e44] text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base transition"
            >
              {editingActivityId ? <Save size={20} /> : <PlusCircle size={20} />}
              <span>{editingActivityId ? 'حفظ وتحديث بيانات النشاط' : 'إضافة النشاط لمعرض المبادرة'}</span>
            </button>
          </form>
        )}

        {/* Tab 4: Manage & Edit Content */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            
            {/* Dedicated Sub-Tabs Navigation for Tab 4 */}
            <div className={`p-4 rounded-3xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-md'} flex flex-wrap gap-3 justify-center md:justify-start`}>
              <button
                onClick={() => setManageSubTab('articles')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  manageSubTab === 'articles'
                    ? 'bg-[#d4a045] text-black shadow-md scale-105'
                    : (theme === 'day' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
                }`}
              >
                <FileText size={16} />
                <span>📝 1. صفحة المقالات المنشورة ({articlesList.length})</span>
              </button>

              <button
                onClick={() => setManageSubTab('initiatives')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  manageSubTab === 'initiatives'
                    ? 'bg-[#047857] text-white shadow-md scale-105'
                    : (theme === 'day' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
                }`}
              >
                <Compass size={16} />
                <span>🚀 2. صفحة المبادرات المنشورة ({initiativesList.length})</span>
              </button>

              <button
                onClick={() => setManageSubTab('activities')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  manageSubTab === 'activities'
                    ? 'bg-amber-500 text-black shadow-md scale-105'
                    : (theme === 'day' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
                }`}
              >
                <Camera size={16} />
                <span>📸 3. صفحة أنشطة المبادرات ({activitiesList.length})</span>
              </button>
            </div>

            {/* Sub-Page 1: Published Articles */}
            {manageSubTab === 'articles' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-gray-500/20 pb-3">
                  <h3 className="text-xl font-bold font-cairo flex items-center gap-2">
                    <FileText className="text-[#d4a045]" size={22} />
                    <span>فهرس وتعديل المقالات المنشورة ({articlesList.length})</span>
                  </h3>
                  <button
                    onClick={() => { setActiveTab('article'); cancelEditArticle(); }}
                    className="text-xs font-bold text-[#d4a045] hover:underline"
                  >
                    + إضافة مقال جديد
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articlesList.map((art) => (
                    <div 
                      key={art.id}
                      className={`p-5 rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900 border-slate-800 shadow-lg'} flex flex-col justify-between`}
                    >
                      <div>
                        <div className="h-44 rounded-xl overflow-hidden mb-4 relative">
                          <img src={art.image || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500'} alt={art.title} className="w-full h-full object-cover" />
                        </div>
                        <h4 className="font-bold text-base line-clamp-2 mb-2">{art.title}</h4>
                        <p className="text-xs opacity-70 line-clamp-3 leading-relaxed mb-4">
                          {art.content.replace(/<[^>]*>/g, ' ').replace(/style="[^"]*"/gi, ' ').replace(/class="[^"]*"/gi, ' ').replace(/\s+/g, ' ').trim()}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-500/20 text-xs font-bold">
                        <button
                          onClick={() => startEditArticle(art)}
                          className="text-[#d4a045] hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={15} />
                          <span>تعديل المقال</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmTarget({ type: 'article', id: art.id, title: art.title })}
                          className="text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition"
                        >
                          <Trash2 size={14} />
                          <span>حذف المقال</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Page 2: Published Initiatives */}
            {manageSubTab === 'initiatives' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-gray-500/20 pb-3">
                  <h3 className="text-xl font-bold font-cairo flex items-center gap-2">
                    <Compass className="text-[#047857]" size={22} />
                    <span>فهرس وتعديل المبادرات المنشورة ({initiativesList.length})</span>
                  </h3>
                  <button
                    onClick={() => { setActiveTab('initiative'); cancelEditInitiative(); }}
                    className="text-xs font-bold text-[#047857] hover:underline"
                  >
                    + إضافة مبادرة جديدة
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {initiativesList.map((init) => (
                    <div 
                      key={init.id}
                      className={`p-5 rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900 border-slate-800 shadow-lg'} flex flex-col justify-between`}
                    >
                      <div>
                        <div className="h-28 rounded-xl bg-slate-800/40 p-4 flex items-center justify-center mb-4">
                          <img src={init.logo} alt={init.title} className="max-h-full max-w-full object-contain" />
                        </div>
                        <h4 className="font-bold text-base mb-2">{init.title}</h4>
                        <p className="text-xs opacity-70 line-clamp-3 leading-relaxed mb-4">{init.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-500/20 text-xs font-bold">
                        <button
                          onClick={() => startEditInitiative(init)}
                          className="text-[#d4a045] hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={15} />
                          <span>تعديل المبادرة</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmTarget({ type: 'initiative', id: init.id, title: init.title })}
                          className="text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition"
                        >
                          <Trash2 size={14} />
                          <span>حذف المبادرة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Page 3: Initiative Activities Management */}
            {manageSubTab === 'activities' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-gray-500/20 pb-3">
                  <h3 className="text-xl font-bold font-cairo flex items-center gap-2">
                    <Camera className="text-amber-400" size={22} />
                    <span>فهرس وتعديل وحذف أنشطة المبادرات ({activitiesList.length})</span>
                  </h3>
                  <button
                    onClick={() => { setActiveTab('activity'); cancelEditActivity(); }}
                    className="text-xs font-bold text-amber-400 hover:underline"
                  >
                    + إضافة نشاط جديد لمبادرة
                  </button>
                </div>

                {activitiesList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activitiesList.map((act) => {
                      const parentInit = initiativesList.find(i => i.id === act.initId);
                      return (
                        <div key={act.id} className={`p-5 rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900 border-slate-800 shadow-lg'} flex flex-col justify-between`}>
                          <div>
                            <div className="text-[10px] font-bold text-[#047857] bg-[#047857]/10 border border-[#047857]/20 px-2.5 py-1 rounded-full inline-block mb-3">
                              📌 {parentInit ? parentInit.title : 'مبادرة مسجلة'}
                            </div>
                            <h4 className="font-bold text-base mb-2">{act.title}</h4>
                            <p className="text-xs opacity-75 line-clamp-3 leading-relaxed mb-4">{act.summary}</p>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-500/20 text-xs font-bold">
                            <button 
                              onClick={() => startEditActivity(act)} 
                              className="text-[#d4a045] hover:underline flex items-center gap-1"
                            >
                              <Edit3 size={15} />
                              <span>تعديل النشاط</span>
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmTarget({ type: 'activity', id: act.id, title: act.title })} 
                              className="text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition"
                            >
                              <Trash2 size={14} />
                              <span>حذف النشاط</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 opacity-60 bg-white/5 rounded-3xl border border-dashed border-gray-500/30">
                    لا توجد أنشطة مسجلة حالياً. استخدم زر "إضافة نشاط جديد لمبادرة" لإضافة أنشطة وفعاليات.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Tab 5: Website Page Analytics & Stay Duration */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in pb-12">
            {/* Header & Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white shadow-xl border border-emerald-500/30">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold mb-2 border border-amber-400/30">
                  تحليلات زوار الموقع الرسمي (muslimyouth.ps)
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold font-cairo">
                  📊 عداد زوار صفحات الموقع ومعدل بقاء الزائر
                </h2>
                <p className="text-xs md:text-sm opacity-80 mt-1">
                  إحصائيات تفصيلية ودقيقة لحركة الزيارات، عدد المشاهدات، ومعدل بقاء القراء في كل صفحة من صفحات موقع ملتقى الشباب المسلم.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAnalyticsStats}
                  disabled={loadingAnalytics}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-lg flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loadingAnalytics ? 'animate-spin' : ''} />
                  <span>تحديث البيانات المباشرة</span>
                </button>

                <button
                  onClick={async () => {
                    if (!window.confirm('هل أنت محقق من تصفير وإعادة ضبط جميع إحصائيات زوار الموقع للصفر للبدء من جديد؟')) return;
                    try {
                      const res = await fetch('/api/analytics/reset', { method: 'POST' });
                      if (res.ok) {
                        fetchAnalyticsStats();
                        setSuccessMsg('تم تصفير جميع إحصائيات العداد بنجاح للبدء من الصفر!');
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }
                    } catch (err) {
                      console.error('Reset analytics error:', err);
                    }
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-extrabold text-xs border border-red-500/30 flex items-center gap-2 transition"
                >
                  <Trash2 size={16} />
                  <span>تصفير العداد للصفر</span>
                </button>
              </div>
            </div>

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Visits */}
              <div className={`p-6 rounded-3xl border shadow-lg ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold opacity-60">إجمالي زيارات صفحات الموقع</span>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Users size={24} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold font-cairo text-emerald-500">
                  {analyticsData?.totalSiteViews?.toLocaleString('en-US') || 0}
                  <span className="text-sm font-semibold text-slate-500 mr-2">زيارة</span>
                </div>
                <p className="text-xs opacity-60 mt-2">إجمالي مشاهدات جميع الصفحات المباشرة</p>
              </div>

              {/* Overall Average Stay */}
              <div className={`p-6 rounded-3xl border shadow-lg ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold opacity-60">معدل بقاء الزائر الإجمالي للموقع</span>
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Clock size={24} />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold font-cairo text-amber-500">
                  {analyticsData?.formattedOverallAvgDuration || '0 ثانية'}
                </div>
                <p className="text-xs opacity-60 mt-2">متوسط الوقت المقضي في الزيارة الواحدة</p>
              </div>

              {/* Total Time Spent */}
              <div className={`p-6 rounded-3xl border shadow-lg ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold opacity-60">إجمالي زمن التصفح والقراءة</span>
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold font-cairo text-blue-500">
                  {Math.round((analyticsData?.totalSiteDurationSeconds || 0) / 60)} دقيقة
                </div>
                <p className="text-xs opacity-60 mt-2">مجموع دقائق القراءة والتصفح لجميع الزوار</p>
              </div>
            </div>

            {/* Per-Page Analytics Table / Cards */}
            <div className={`p-6 rounded-3xl border shadow-xl ${theme === 'day' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <h3 className="text-xl font-bold font-cairo mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-[#d4a045]" />
                <span>إحصائيات كل صفحة تفصيلياً (عدد الزوار + معدل البقاء):</span>
              </h3>

              {analyticsData?.pages && analyticsData.pages.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.pages.map((p, idx) => {
                    const maxViews = Math.max(...analyticsData.pages.map(item => item.views), 1);
                    const percentage = Math.round((p.views / maxViews) * 100);

                    return (
                      <div 
                        key={idx}
                        className={`p-5 rounded-2xl border transition-all ${theme === 'day' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#047857]/20 text-[#047857] font-extrabold text-xs flex items-center justify-center border border-[#047857]/30">
                              #{idx + 1}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-base font-cairo">{p.title}</h4>
                              <span className="text-xs opacity-60 dir-ltr inline-block font-mono bg-black/10 px-2 py-0.5 rounded text-amber-500">
                                {p.path}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Visitor Count Badge */}
                            <div className="text-right">
                              <span className="text-xs opacity-60 block">عدد الزيارات</span>
                              <span className="text-lg font-black text-emerald-500 font-cairo">
                                👁️ {p.views.toLocaleString('en-US')} زيارة
                              </span>
                            </div>

                            {/* Average Stay Duration Badge */}
                            <div className="text-right border-r border-gray-500/20 pr-4">
                              <span className="text-xs opacity-60 block">معدل بقاء الزائر</span>
                              <span className="text-sm font-extrabold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20 inline-block mt-0.5">
                                ⏱️ {p.formattedAvgDuration}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar of Visits */}
                        <div className="w-full bg-gray-500/10 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 opacity-50 font-cairo text-lg">
                  جاري تجميع إحصائيات الزيارات...
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ForumAdminDashboard;
