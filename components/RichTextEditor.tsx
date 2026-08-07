import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Palette, 
  Heading1, 
  Heading2, 
  Type, 
  Sparkles,
  Eye,
  PenTool,
  Image as ImageIcon
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import { formatArticleWithCerebras } from '../services/cerebrasAI';

interface RichTextEditorProps {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  image: string;
  setImage: (image: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  title,
  setTitle,
  content,
  setContent,
  image,
  setImage
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [textColor, setTextColor] = useState<string>('#d4a045');
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const getPreviewHTML = (raw: string) => {
    if (!raw) return '<p class="opacity-40 italic">محتوى المقال سيظهر هنا أثناء الكتابة...</p>';
    return String(raw).split('className=').join('class=');
  };

  const handleAIFormatArticle = async () => {
    if (!content) return;
    setAiLoading(true);
    try {
      const formatted = await formatArticleWithCerebras(title, content);
      if (formatted) {
        setContent(formatted);
        setActiveTab('preview');
      }
    } catch (err) {
      console.error('Cerebras AI Format Error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
          setImage(data.url);
        } else {
          setImage(base64);
        }
      } catch {
        setImage(reader.result as string);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Insert HTML tag into content at cursor or append
  const insertFormatting = (openTag: string, closeTag: string) => {
    const textarea = document.getElementById('rich-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || 'نص محدد';
    const replacement = `${openTag}${selectedText}${closeTag}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  // Preset color picker options
  const colorPresets = [
    { label: 'ذهبي (اللون الرسمي)', color: '#d4a045' },
    { label: 'خفاش/زمردي', color: '#047857' },
    { label: 'أزرق ملكي', color: '#2563eb' },
    { label: 'أحمر داكن', color: '#dc2626' },
    { label: 'رمادي دافئ', color: '#64748b' }
  ];

  return (
    <div className={`rounded-2xl border ${theme === 'day' ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900 border-slate-800 shadow-2xl'} p-6 transition-all duration-300`}>
      
      {/* Editor Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4 border-gray-500/20">
        <div>
          <h3 className={`text-xl font-bold font-cairo flex items-center gap-2 ${theme === 'day' ? 'text-slate-900' : 'text-white'}`}>
            <PenTool size={22} className="text-[#d4a045]" />
            <span>محرر المقالات الاحترافي</span>
          </h3>
          <p className={`text-xs mt-1 ${theme === 'day' ? 'text-slate-600' : 'text-slate-400'}`}>
            حرر المقال بكامل التفاصيل مع خيارات الألوان، الأحجام، والاقتباسات المميزة.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-500/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              activeTab === 'editor' 
                ? 'bg-[#d4a045] text-black shadow-md' 
                : theme === 'day' ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <PenTool size={16} />
            <span>التحرير والتنسيق</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              activeTab === 'preview' 
                ? 'bg-[#d4a045] text-black shadow-md' 
                : theme === 'day' ? 'text-slate-700 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Eye size={16} />
            <span>معاينة حية للمقال</span>
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="space-y-6">
          
          {/* Article Title */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'day' ? 'text-slate-700' : 'text-slate-300'}`}>
              عنوان المقال الرئيسي *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان المقال الشامل والمتكامل..."
              className={`w-full px-4 py-3 rounded-xl border text-base font-bold transition-all outline-none ${
                theme === 'day' 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#d4a045] focus:bg-white' 
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-[#d4a045]'
              }`}
            />
          </div>

          {/* Cover Image URL / Upload to Server Folder */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'day' ? 'text-slate-700' : 'text-slate-300'}`}>
              صورة المقال الرئيسية (رفع صورة إلى مجلد السيرفر /public/uploads/forum/ أو إضافة رابط)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center justify-center gap-2 cursor-pointer px-5 py-3 rounded-xl bg-[#d4a045] hover:bg-[#b8860b] text-black font-bold text-xs shadow-md transition shrink-0">
                <ImageIcon size={18} />
                <span>{uploading ? 'جاري الرفع إلى السيرفر...' : '📁 اختيار صورة من جهازك'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  disabled={uploading}
                />
              </label>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="أو أدخل رابط الصورة مباشرة هنا..."
                  className={`w-full px-4 py-3 pl-10 rounded-xl border text-sm transition-all outline-none ${
                    theme === 'day' 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#d4a045]' 
                      : 'bg-slate-800/80 border-slate-700 text-white focus:border-[#d4a045]'
                  }`}
                />
                <ImageIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            {image && (
              <div className="mt-3 relative h-48 rounded-xl overflow-hidden border border-amber-400/40 shadow-lg">
                <img src={image} alt="Cover preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 bg-black/80 text-amber-400 text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                  ✨ معاينة صورة المقال (محفوظة بالسيرفر)
                </span>
              </div>
            )}
          </div>

          {/* AI Assistance Button */}
          <button
            type="button"
            onClick={handleAIFormatArticle}
            disabled={aiLoading || !content}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] border border-amber-300/30 disabled:opacity-50"
          >
            <Sparkles size={18} className={aiLoading ? 'animate-spin' : 'animate-pulse'} />
            <span>{aiLoading ? 'جاري إعادة تنسيق وتجميل المقال بالذكاء الاصطناعي (gpt-oss-120b على Cerebras)...' : '✨ تنسيق وتجميل المقال تلقائياً بالذكاء الاصطناعي (Cerebras gpt-oss-120b)'}</span>
          </button>

          {/* Formatting Toolbar */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 ${theme === 'day' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700'}`}>
            
            {/* Heading 2 */}
            <button
              type="button"
              onClick={() => insertFormatting('<h2 style="font-size: 1.6rem; font-weight: bold; color: #d4a045; margin: 1rem 0;">', '</h2>')}
              className={`p-2 rounded-lg hover:bg-amber-400/20 text-amber-500 transition`}
              title="عنوان فرعي كبير H2"
            >
              <Heading1 size={18} />
            </button>

            {/* Heading 3 */}
            <button
              type="button"
              onClick={() => insertFormatting('<h3 style="font-size: 1.3rem; font-weight: bold; color: #047857; margin: 0.75rem 0;">', '3')}
              className={`p-2 rounded-lg hover:bg-amber-400/20 text-amber-500 transition`}
              title="عنوان فرعي متوسط H3"
            >
              <Heading2 size={18} />
            </button>

            <div className="h-5 w-[1px] bg-gray-400/30 mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => insertFormatting('<strong>', '</strong>')}
              className={`p-2 rounded-lg hover:bg-gray-400/20 transition`}
              title="نص عريض (Bold)"
            >
              <Bold size={18} />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => insertFormatting('<em>', '</em>')}
              className={`p-2 rounded-lg hover:bg-gray-400/20 transition`}
              title="نص مائل (Italic)"
            >
              <Italic size={18} />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>')}
              className={`p-2 rounded-lg hover:bg-gray-400/20 transition`}
              title="تسطير أسفل النص (Underline)"
            >
              <Underline size={18} />
            </button>

            <div className="h-5 w-[1px] bg-gray-400/30 mx-1" />

            {/* Golden Highlight Quote */}
            <button
              type="button"
              onClick={() => insertFormatting('<blockquote style="border-right: 5px solid #d4a045; background-color: rgba(212, 160, 69, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-style: italic; font-weight: 600; color: #d4a045;">', '</blockquote>')}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition`}
              title="اقتباس ذهبي مميز"
            >
              <Sparkles size={16} />
              <span>سطر ذهبي مميز</span>
            </button>

            {/* Emerald Highlight Box */}
            <button
              type="button"
              onClick={() => insertFormatting('<div style="border: 1px solid rgba(4, 120, 87, 0.5); background-color: rgba(4, 120, 87, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-weight: 500; color: #047857;">', '</div>')}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition`}
              title="تظليل زمردي"
            >
              <Quote size={16} />
              <span>تظليل زمردي</span>
            </button>

            <div className="h-5 w-[1px] bg-gray-400/30 mx-1" />

            {/* Custom Color Selector */}
            <div className="flex items-center gap-2 border border-gray-400/20 px-2 py-1 rounded-lg">
              <Palette size={16} className="text-amber-400" />
              <span className="text-xs font-semibold">تلوين محدد:</span>
              <input 
                type="color" 
                value={textColor} 
                onChange={(e) => setTextColor(e.target.value)} 
                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => insertFormatting(`<span style="color: ${textColor}; font-weight: bold;">`, '</span>')}
                className="text-xs font-bold px-2 py-1 bg-amber-500 text-black rounded hover:bg-amber-400 transition"
              >
                تطبيق اللون
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'day' ? 'text-slate-700' : 'text-slate-300'}`}>
              محتوى المقال تفصيلياً (التنسيق الأوتوماتيكي المعتمد مفعل تلقائياً)
            </label>
            <textarea
              id="rich-content-textarea"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب أو ألصق نص المقال هنا... يمكنك تحديد أي سطر وتطبيق الألوان والتنسيقات المميزة من الشريط في الأعلى..."
              className={`w-full px-4 py-3 rounded-xl border text-base leading-relaxed transition-all outline-none font-sans ${
                theme === 'day' 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#d4a045] focus:bg-white' 
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-[#d4a045]'
              }`}
            />
          </div>
        </div>
      ) : (
        /* Live Preview Tab */
        <div className={`p-8 rounded-2xl border ${theme === 'day' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`}>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest">معاينة حيّة لقراءة المقالة</div>
            
            {title ? (
              <h1 className="text-3xl md:text-4xl font-bold font-cairo leading-tight text-gradient-gold">
                {title}
              </h1>
            ) : (
              <h1 className="text-3xl font-bold opacity-30">عنوان المقال المعاين...</h1>
            )}

            {image && (
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-2xl border border-amber-400/20">
                <img src={image} alt={title} className="w-full h-full object-cover" />
              </div>
            )}

            <div 
              className={`text-lg leading-loose space-y-4 ${theme === 'day' ? 'text-slate-700' : 'text-slate-200'}`}
              dangerouslySetInnerHTML={{ 
                __html: (content || '<p className="opacity-40 italic">محتوى المقال سيظهر هنا أثناء الكتابة...</p>')
                  .replace(/className=/g, 'class=')
                  .replace(/class="border-r-4 border-\[#d4a045\] bg-\[#d4a045\]\/10 p-4 rounded-xl my-4 text-base italic font-semibold"/g, 'style="border-right: 5px solid #d4a045; background-color: rgba(212, 160, 69, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-style: italic; font-weight: 600; color: #d4a045;"')
                  .replace(/class="border border-\[#047857\]\/40 bg-\[#047857\]\/10 p-4 rounded-xl my-4 text-sm font-medium"/g, 'style="border: 1px solid rgba(4, 120, 87, 0.5); background-color: rgba(4, 120, 87, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-weight: 500; color: #047857;"')
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
