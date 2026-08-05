import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Award, Users, HeartHandshake, Lightbulb, ShieldCheck, Landmark, GraduationCap } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-[#0a192f] min-h-screen ${theme === 'day' ? 'bg-slate-50 text-slate-800' : 'bg-[#0a192f] text-slate-100'} font-cairo transition-colors duration-300`}>
      {/* --- TOP NAVBAR --- */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a192f]/90 border-b border-amber-500/20 px-4 md:px-8 py-4 flex items-center justify-between shadow-lg">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold text-sm md:text-base transition-transform hover:-translate-x-1"
        >
          <ArrowRight size={20} />
          <span>الرجوع للرئيسية</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md">
            <img src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg md:text-xl text-white font-cairo">من نحن</span>
        </div>

        <button
          onClick={() => navigate('/articles')}
          className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium px-4 py-2 rounded-xl text-xs md:text-sm transition-colors"
        >
          المقالات
        </button>
      </header>

      {/* --- HERO BANNER --- */}
      <section className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-slate-950/80 to-[#0a192f] pointer-events-none z-0"></div>
        <div className="absolute inset-0 mashrabiya-pattern opacity-10 pointer-events-none z-0"></div>

        {/* Floating Ambient Glows */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-xs md:text-sm shadow-inner">
            <Compass size={16} />
            <span>وحدة الكلمة.. وسطية المنهج</span>
          </div>

          <h1 className="text-3xl md:text-6xl font-black text-white leading-tight font-cairo drop-shadow-md">
            ملتقى الشباب <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">المسلم</span>
          </h1>

          <p className="text-base md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            مركز بحثي وثقافي مستقل يُعنى بالنهوض بالفكر الشبابي، وترسيخ القيم الإسلامية الأصيلة، وبناء مجتمع واعد يعتز بهويته الوطنية والدينية.
          </p>
        </div>
      </section>

      {/* --- CONTENT CONTAINER --- */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pb-24 space-y-16">

        {/* SECTION 1: عن الملتقى */}
        <section id="about-forum" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>

          <div className={`relative p-6 md:p-10 rounded-3xl ${theme === 'day' ? 'bg-white border border-slate-200 shadow-xl' : 'bg-slate-900/90 border border-slate-800 shadow-2xl'} space-y-6`}>
            <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Landmark size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">تأسس في نابلس عام 2022م</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white font-cairo">عن الملتقى</h2>
              </div>
            </div>

            <div className="space-y-4 text-slate-200 leading-relaxed text-base md:text-lg">
              <p className="first-letter:text-3xl font-light">
                <strong className="text-amber-400 font-semibold">ملتقى الشباب المسلم</strong> هو مركز بحثي مستقل تأسس في مدينة نابلس، فلسطين، عام 2022م. يُعنى بالبحث والأنشطة الفكرية والثقافية ذات البعد المجتمعي، حيث يركّز على قضايا الشباب بوصفهم الفئة الأكثر فاعلية وتأثيراً في المجتمع، وذلك من خلال معالجة المسائل التي تمس حاضرهم ومستقبلهم دينياً، ثقافياً، وعلمياً.
              </p>

              <p className="font-light">
                يعتمد الملتقى منهجا إسلاميا وسطيا، مستندا إلى التراث الإسلامي الأصيل ومستلزمات منهج أهل السنة والجماعة وفقاً للمذاهب الأربعة المعتبرة، ساعياً إلى التوفيق بين العلوم الشرعية التقليدية ومتطلبات الحياة المعاصرة، بلا إفراط ولا تفريط.
              </p>
            </div>

            {/* Sub-cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/40 transition-colors">
                <ShieldCheck className="text-amber-400 mb-2" size={26} />
                <h3 className="font-bold text-white text-base mb-1">مركز بحثي مستقل</h3>
                <p className="text-xs text-slate-300 leading-relaxed">تأسس في فلسطين ويعتمد منهجية البحث العلمي الرصين.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/40 transition-colors">
                <Compass className="text-emerald-400 mb-2" size={26} />
                <h3 className="font-bold text-white text-base mb-1">منهج إسلامي وسطي</h3>
                <p className="text-xs text-slate-300 leading-relaxed">التزام بمنهج أهل السنة والجماعة والمذاهب الأربعة المعتبرة.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/40 transition-colors">
                <Lightbulb className="text-amber-300 mb-2" size={26} />
                <h3 className="font-bold text-white text-base mb-1">الأصالة والمعاصرة</h3>
                <p className="text-xs text-slate-300 leading-relaxed">التوفيق المبدئي بين العلوم الشرعية ومتطلبات العصر الحديث.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: رؤية الملتقى */}
        <section id="forum-vision" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>

          <div className={`relative p-6 md:p-10 rounded-3xl ${theme === 'day' ? 'bg-white border border-slate-200 shadow-xl' : 'bg-slate-900/90 border border-slate-800 shadow-2xl'} space-y-6`}>
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <HeartHandshake size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">تطلع نحو المستقبل</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white font-cairo">رؤية الملتقى</h2>
              </div>
            </div>

            <div className="space-y-4 text-slate-200 leading-relaxed text-base md:text-lg">
              <p className="font-light leading-relaxed">
                تقوم رؤيتنا على <strong className="text-emerald-400 font-semibold">تعزيز الوحدة، ونبذ الفرقة، وترسيخ السلم الاجتماعي</strong> وبناء الفهم المشترك، مما يساهم في حماية الهوية الدينية والوطنية.
              </p>

              <p className="font-light leading-relaxed">
                كما يحرص الملتقى على أن يضم الرجال والنساء على حد سواء، مع ضمان مشاركة فعالة للمرأة، إيماناً بدورها الجوهري في نهضة المجتمع وتقدمه.
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-1">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-1">تعزيز الوحدة والسلم الاجتماعي</h4>
                  <p className="text-xs text-slate-300">جمع كلمة الأمة وتوطيد أواصر التآخي وبناء الفهم الوطني والمجتمعي المشترك.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-1">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-1">مشاركة المرأة والشباب</h4>
                  <p className="text-xs text-slate-300">تمكين المرأة والشباب وإبراز دورهم القيادي والجوهري في نهضة المجتمع.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: إدارة الملتقى */}
        <section id="forum-management" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-emerald-500/20 to-amber-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>

          <div className={`relative p-6 md:p-10 rounded-3xl ${theme === 'day' ? 'bg-white border border-slate-200 shadow-xl' : 'bg-slate-900/90 border border-slate-800 shadow-2xl'} space-y-6`}>
            <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <GraduationCap size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">القيادة والأكاديمية</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white font-cairo">إدارة الملتقى</h2>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-2">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-xl flex-shrink-0 bg-slate-800">
                <img
                  src="https://raw.githubusercontent.com/NinjaWorld1234/Files/main/myf%20LOGO.jpg"
                  alt="السيد محمد الشربيني"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 text-right flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-amber-400 font-cairo">السيد محمد الشربيني</h3>
                  <p className="text-xs md:text-sm text-emerald-400 font-medium">مدير ملتقى الشباب المسلم وباحث دكتوراه في العلوم الاجتماعية</p>
                </div>

                <div className="space-y-3 text-slate-200 leading-relaxed text-sm md:text-base font-light">
                  <p>
                    يتولى إدارة ملتقى الشباب المسلم السيد <strong>محمد الشربيني</strong>، وهو باحث دكتوراه في العلوم الاجتماعية يتمتع بأساس أكاديمي وبحثي رصين في تاريخ الأفكار. تشمل مسيرته الأكاديمية درجة الماجستير في <em>"التفاعلات الفكرية في العالم الإسلامي"</em> من جامعة برلين الحرة، ودرجة الماجستير في الفلسفة الإسلامية من جامعة القدس.
                  </p>

                  <p>
                    ككاتب وباحث، نشر الشربيني العديد من الأعمال التي تتناول الخطابات الاجتماعية المعاصرة، حيث قدّم قراءات نقدية للفكر الحديث تجمع بين العمق التحليلي والرؤية الثقافية، لا سيما فيما يتعلق بالتحديات الدينية والفكرية الراهنة.
                  </p>

                  <p>
                    ومن خلال ملتقى الشباب المسلم، يسعى الشربيني إلى تمكين الشباب من التفكير النقدي المتزن، وتعزيز ثقافة البحث والحوار والمشاركة الفكرية عبر مختلف مبادرات وبرامج الملتقى. وتستند رؤيته إلى التزام عميق بالاعتدال والأصالة والنزاهة الأكاديمية.
                  </p>
                </div>

                {/* Academic Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    🎓 دكتوراه (قيد الدراسة) - العلوم الاجتماعية
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    🏛️ ماجستير جامعة برلين الحرة
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                    📖 ماجستير جامعة القدس
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK NAVIGATION ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>استكشف مبادرات الملتقى</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/articles')}
            className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3.5 px-8 rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <BookOpen size={18} />
            <span>تصفح المقالات الفكرية</span>
          </button>
        </div>

      </main>
    </div>
  );
};

export default AboutUs;
