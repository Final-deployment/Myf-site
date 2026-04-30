import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../services/api/config';
import { getAuthToken } from '../services/api/auth';
import { CheckCircle, Play, Lock, AlertCircle, BookOpen, MapPin } from 'lucide-react';

interface JourneyNode {
  courseId: string;
  title: string;
  folderTitle: string;
  status: 'completed' | 'active' | 'locked_failed' | 'locked';
  progress: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string | null;
  deadline: string | null;
  extensions: number;
  daysTaken: number | null;
  daysSpentSoFar: number | null;
  quizAttempts: number;
  finalScore: number | null;
  currentEpisode: string | null;
}

interface StudentJourneyMapProps {
  studentId: string;
}

export const StudentJourneyMap: React.FC<StudentJourneyMapProps> = ({ studentId }) => {
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const token = getAuthToken();
        
        // Fetch both journey and courses to get accurate lessons_count (since backend might not be restarted)
        const [journeyRes, coursesRes] = await Promise.all([
          fetch(getApiUrl(`/users/${studentId}/journey`), {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(getApiUrl('/courses'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const journeyData = await journeyRes.json();
        const coursesData = await coursesRes.json();

        if (!journeyRes.ok) throw new Error(journeyData.error || 'Failed to load journey');
        
        setStudent(journeyData.student);
        
        // Inject accurate totalLessons from the fresh courses API
        const enhancedNodes = journeyData.journey.map((node: any) => {
           const course = coursesData.find((c: any) => c.id === node.courseId);
           const accurateCount = course ? (course.lessonsCount || (course.episodes ? course.episodes.length : 0)) : 0;
           return {
               ...node,
               totalLessons: accurateCount > 0 ? accurateCount : (node.totalLessons || 0)
           };
        });

        setNodes(enhancedNodes);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center font-bold">
        <p>{error}</p>
      </div>
    );
  }

  const completedCount = nodes.filter(n => n.status === 'completed').length;
  const totalDays = student ? Math.floor((new Date().getTime() - new Date(student.joinDate).getTime()) / (1000 * 3600 * 24)) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6" dir="rtl">
      
      {/* 1. HEADER & HADITH SECTION */}
      <div className="bg-gradient-to-b from-white to-emerald-50/30 border border-emerald-100/60 rounded-3xl p-6 md:p-10 shadow-lg shadow-emerald-900/5 mb-10 text-center relative overflow-hidden">
        {/* Subtle Modern Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500"></div>
        
        <p className="text-gray-500 text-lg md:text-xl font-medium mb-4">
          عن مُعَاوِيَةَ بن أبي سفيان رضي الله عنهما قال: سَمِعْتُ النَّبِيَّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ:
        </p>
        
        {/* MODERN TYPOGRAPHY FOR HADITH */}
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-900 to-teal-800 my-8 py-4 leading-relaxed tracking-tight drop-shadow-sm">
          « مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ »
        </h1>
        
        <p className="text-emerald-600 font-bold mb-10 bg-emerald-100/50 inline-block px-4 py-1 rounded-full text-sm border border-emerald-100">( متفق عليه )</p>

        {student && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-emerald-100/50 pt-8">
            <div className="bg-white/60 rounded-xl p-4 border border-emerald-50">
              <p className="text-xs text-emerald-600/70 mb-1 font-semibold uppercase tracking-wider">اسم الطالب</p>
              <p className="font-bold text-gray-800 truncate">{student.name}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-emerald-50">
              <p className="text-xs text-emerald-600/70 mb-1 font-semibold uppercase tracking-wider">تاريخ البدء</p>
              <p className="font-bold text-gray-800">{new Date(student.joinDate).toLocaleDateString('ar-SA')}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-emerald-50">
              <p className="text-xs text-emerald-600/70 mb-1 font-semibold uppercase tracking-wider">إجمالي الأيام</p>
              <p className="font-bold text-gray-800">{totalDays} يوم</p>
            </div>
            <div className="bg-emerald-500 rounded-xl p-4 border border-emerald-600 shadow-md shadow-emerald-200">
              <p className="text-xs text-emerald-100 mb-1 font-semibold uppercase tracking-wider">المساقات المنجزة</p>
              <p className="font-bold text-white">{completedCount} من {nodes.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. THE VERTICAL JOURNEY TIMELINE */}
      <div className="bg-gradient-to-b from-white to-emerald-50/20 border border-emerald-100/60 rounded-3xl p-6 md:p-10 shadow-lg shadow-emerald-900/5">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-10 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          خارطة مسار الطالب
        </h2>

        <div className="relative border-r-4 border-gray-100 pr-6 md:pr-12 ml-4">
          {nodes.map((node, index) => {
            const isCompleted = node.status === 'completed';
            const isActive = node.status === 'active';
            const isLockedFailed = node.status === 'locked_failed';
            const isLocked = node.status === 'locked';

            // Modern Styling variables based on status
            let dotColor = "bg-gray-100 border-gray-200 text-gray-400";
            let cardStyle = "bg-gray-50/50 border-gray-100 opacity-60";
            let titleColor = "text-gray-500";
            let Icon = Lock;

            if (isCompleted) {
              dotColor = "bg-emerald-600 border-emerald-200 text-white shadow-lg shadow-emerald-200";
              cardStyle = "bg-white border-emerald-100 shadow-md shadow-emerald-50";
              titleColor = "text-emerald-950";
              Icon = CheckCircle;
            } else if (isActive) {
              dotColor = "bg-amber-500 border-amber-200 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse";
              cardStyle = "bg-amber-50/30 border-amber-200 shadow-xl shadow-amber-100/50";
              titleColor = "text-amber-950";
              Icon = Play;
            } else if (isLockedFailed) {
              dotColor = "bg-rose-500 border-rose-200 text-white";
              cardStyle = "bg-rose-50 border-rose-100";
              titleColor = "text-rose-900";
              Icon = AlertCircle;
            }

            return (
              <div key={node.courseId} className="mb-12 relative last:mb-0 group">
                
                {/* The Timeline Dot */}
                <div className={`absolute -right-[43px] md:-right-[67px] top-5 w-12 h-12 md:w-14 md:h-14 rounded-2xl border-4 flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${dotColor} ${isActive ? 'rotate-3' : ''}`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>

                {/* The Content Card */}
                <div className={`w-full p-6 md:p-8 rounded-2xl border transition-all ${cardStyle}`}>
                  
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        {node.folderTitle} — المحطة {index + 1}
                      </span>
                      <h3 className={`text-xl md:text-2xl font-extrabold ${titleColor}`}>
                        {node.title}
                      </h3>
                    </div>
                    {isActive && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 w-fit shadow-md shadow-amber-200">
                        <MapPin className="w-4 h-4" /> المساق الحالي
                      </span>
                    )}
                  </div>

                  {/* DATA SECTIONS */}
                  <div className="mt-2">
                    
                    {/* Data for Completed Course */}
                    {isCompleted && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 border border-emerald-50 rounded-xl p-5">
                        <div>
                          <p className="text-xs font-bold text-emerald-600 mb-1 uppercase">النتيجة النهائية</p>
                          <p className="text-3xl font-black text-emerald-800">{node.finalScore}%</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 mb-1 uppercase">الأيام المستغرقة</p>
                          <p className="text-xl font-bold text-emerald-900">{node.daysTaken} يوم</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 mb-1 uppercase">عدد المحاولات</p>
                          <p className="text-xl font-bold text-emerald-900">{node.quizAttempts}</p>
                        </div>
                      </div>
                    )}

                    {/* Data for Active Course */}
                    {isActive && (
                      <div className="space-y-5 bg-white border border-amber-100 rounded-xl p-5 shadow-sm">
                        
                        <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                          <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-600 mb-1 uppercase">الدروس المنجزة</p>
                            <p className="text-2xl font-black text-amber-900">{node.completedLessons || 0} <span className="text-lg text-amber-700">من {node.totalLessons || 0} درس</span></p>
                          </div>
                        </div>

                        {node.currentEpisode && (
                          <div className="flex items-center gap-3 p-1">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Play className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">الدرس الحالي: <span className="text-amber-700">{node.currentEpisode}</span></span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 mt-2">
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase">الأيام المنقضية</p>
                            <p className="font-extrabold text-gray-800 text-lg">{node.daysSpentSoFar} يوم</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 mb-1 uppercase">مرات التمديد</p>
                            <p className="font-extrabold text-gray-800 text-lg">{node.extensions}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data for Locked/Failed Course */}
                    {isLockedFailed && (
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-700 text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        تعثر الطالب في هذا المساق أو انتهت المدة المخصصة له قبل إتمامه.
                      </div>
                    )}

                    {/* Data for Locked Course */}
                    {isLocked && (
                      <div className="text-gray-400 text-sm font-bold flex items-center gap-3 px-2 py-1">
                        <Lock className="w-5 h-5 opacity-50" /> مساق مغلق، بانتظار إتمام المساقات السابقة.
                      </div>
                    )}

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};




