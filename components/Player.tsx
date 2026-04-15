import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, ArrowRight, Maximize, Minimize, Lock, CheckCircle, FileText, Heart, ClipboardList, Book } from 'lucide-react';
import { Course } from '../types';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import Quiz from './Quiz';
import { Quiz as QuizType, QuizResult } from '../types';

interface PlayerProps {
  course: Course;
  onBack: () => void;
  onPlayCourse: (course: Course) => void;
}

const Player: React.FC<PlayerProps> = ({ course, onBack, onPlayCourse }) => {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  const episodes = useMemo(() => course.episodes && course.episodes.length > 0
    ? course.episodes
    : [{ id: 'default', title: course.title, videoUrl: course.videoUrl || '', orderIndex: 0, lastPosition: 0, watchedDuration: 0, completed: false }]
    , [course]);

  const currentEpisode = episodes[currentEpisodeIndex];
  const [progress, setProgress] = useState((currentEpisode as any).progress || 0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizType | null>(null);
  const [passedQuizIds, setPassedQuizIds] = useState<string[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [maxTimeReached, setMaxTimeReached] = useState((currentEpisode as any).lastPosition || 0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [hasSeeked, setHasSeeked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [nextCourse, setNextCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  /** Check if ALL quizzes for this course have been passed */
  const allCourseQuizzesPassed = useMemo(() => {
    const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
    if (courseQuizzes.length === 0) return true; // No quizzes = considered passed
    return courseQuizzes.every(q => passedQuizIds.includes(q.id));
  }, [quizzes, passedQuizIds, course.id]);

  /** Check if ALL episodes are completed */
  const allEpisodesCompleted = useMemo(() => {
    return episodes.length > 0 && episodes.every(ep => (ep as any).completed);
  }, [episodes]);

  /** Derive true completion: isCompleted (set when last episode finishes) + all quizzes passed
   * Note: We don't check allEpisodesCompleted here because the episodes array from the initial
   * API call is immutable and doesn't update after marking individual episodes complete via API.
   * isCompleted is only set to true by handleMarkComplete/onClose after reaching the last episode,
   * so episode completion is already guaranteed when isCompleted = true.
   */
  const isTrulyCompleted = isCompleted && allCourseQuizzesPassed;

  /** Sync isCompleted for previously completed courses once quiz data is loaded */
  useEffect(() => {
    if (!isLoadingQuizzes && course.progress >= 100 && allCourseQuizzesPassed) {
      setIsCompleted(true);
    }
  }, [isLoadingQuizzes, course.progress, allCourseQuizzesPassed]);

  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number } | null>(null);

  useEffect(() => {
    if ((course as any).deadline && user?.role !== 'admin' && user?.role !== 'supervisor') {
      const timer = setInterval(() => {
        const diff = new Date((course as any).deadline).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, mins: 0 });
          clearInterval(timer);
        } else {
          setTimeLeft({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            mins: Math.floor((diff / 1000 / 60) % 60)
          });
        }
      }, 60000); // Check every minute

      // Initial calculation
      const diff = new Date((course as any).deadline).getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
      }
      return () => clearInterval(timer);
    }
  }, [course, user]);

  // Track the furthest episode reached to keep it unlocked even when navigating back
  const [maxReachedIndex, setMaxReachedIndex] = useState(() => {
    const firstUncompleted = (course.episodes || []).findIndex(ep => !ep.completed);
    return firstUncompleted === -1 ? (course.episodes?.length || 1) - 1 : firstUncompleted;
  });

  const videoSrc = currentEpisode.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  /** Combine episodes and quizzes into a single curriculum list */
  const curriculumItems = useMemo(() => {
    const items: Array<{ type: 'episode'; data: any; index: number } | { type: 'quiz'; data: QuizType }> = [];

    // Quizzes at the very beginning
    quizzes.filter(q => q.afterEpisodeIndex === 0).forEach(q => {
      items.push({ type: 'quiz', data: q });
    });

    episodes.forEach((ep, idx) => {
      items.push({ type: 'episode', data: ep, index: idx });
      // Quizzes after this episode
      quizzes.filter(q => q.afterEpisodeIndex === idx + 1).forEach(q => {
        items.push({ type: 'quiz', data: q });
      });
    });

    return items;
  }, [episodes, quizzes]);

  /** Save progress to backend */
  const saveProgress = useCallback(async (isCompletedParam = false) => {
    if (!videoRef.current || user?.role === 'admin' || user?.role === 'supervisor') return;

    // Don't save if we haven't seeked to the last position yet (to avoid overwriting with 0)
    if (!hasSeeked && (currentEpisode as any).lastPosition > 0) return;

    const time = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    try {
      await api.updateEpisodeProgress(
        course.id,
        currentEpisode.id,
        isCompletedParam || isCompleted || (currentEpisode as any).completed,
        time,
        Math.max(time, (currentEpisode as any).watchedDuration || 0)
      );
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [course.id, currentEpisode, user?.role, hasSeeked, isCompleted]);

  /** Periodic saving */
  useEffect(() => {
    let interval: any;
    if (isPlaying && !activeQuiz) {
      interval = setInterval(() => {
        saveProgress();
      }, 10000); // Save every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeQuiz, saveProgress]);

  /** Handle Seeking to last position */
  const handleLoadedMetadata = () => {
    const total = videoRef.current?.duration || 0;
    setDuration(total);

    if (!hasSeeked) {
      const lastPos = (currentEpisode as any).lastPosition || 0;
      // Don't seek if it's too close to the end (e.g. within 2 seconds)
      if (lastPos > 0 && lastPos < total - 2) {
        videoRef.current!.currentTime = lastPos;
        setCurrentTime(lastPos);
      }
      setHasSeeked(true);
    }
  };

  /** Reset seek flag when episode changes */
  useEffect(() => {
    setHasSeeked(false);
    setMaxTimeReached((currentEpisode as any).lastPosition || 0);
    setProgress((currentEpisode as any).progress || 0); // Update progress state when episode changes

    // Update max reached index if we advanced
    if (currentEpisodeIndex > maxReachedIndex) {
      setMaxReachedIndex(currentEpisodeIndex);
    }
  }, [currentEpisodeIndex, maxReachedIndex]);

  const [attachedBook, setAttachedBook] = useState<{ title: string, path: string, url?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseQuizzes = await api.getQuizzes();
        setQuizzes(courseQuizzes.filter(q => q.courseId === course.id));

        const results = await api.quizResults.get();
        const passedIds = results
          .filter(r => r.percentage >= (courseQuizzes.find(q => q.id === r.quizId)?.passingScore || 70))
          .map(r => r.quizId);
        setPassedQuizIds(passedIds);

        // Fetch all courses to find the next one
        const coursesData = await api.getCourses();
        setAllCourses(coursesData);

        // Check favorite status
        if (user) {
          const favorites = await api.getFavorites(user.id);
          setIsFavorite(favorites.some((f: any) => String(f.targetId) === String(course.id) && f.type === 'course'));
        }

        // Fetch attached book
        try {
          const bookData = await api.getBookByCourseId(course.id);
          setAttachedBook(bookData);
        } catch (err) {
          console.error("Failed to fetch book:", err);
          setAttachedBook(null);
        }

      } catch (e) {
        console.error('Error loading player data:', e);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };
    fetchData();
  }, [course.id]);

  /** Find next course when allCourses or course changes */
  useEffect(() => {
    if (allCourses.length > 0 && course) {
      // L2: Filter by same folder to prevent cross-folder navigation
      const sameFolderCourses = allCourses.filter(c => c.folderId === course.folderId);
      const sorted = [...sameFolderCourses].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      const currentIndex = sorted.findIndex(c => String(c.id) === String(course.id));
      if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
        setNextCourse(sorted[currentIndex + 1]);
      } else {
        setNextCourse(null);
      }
    }
  }, [allCourses, course]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total || 0);

      // Track how far the student has watched
      if (current > maxTimeReached) {
        setMaxTimeReached(current);
      }

      const newProgress = Math.floor((current / total) * 100);
      setProgress(newProgress);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only students get the security alert
      if (document.hidden && isPlaying && user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester) {
        setIsPlaying(false);
        setShowSecurityAlert(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen or common shortcuts for students only
      if (e.key === 'PrintScreen' && user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester) {
        setShowSecurityAlert(true);
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  /** Sync muted state */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleMarkComplete = async () => {
    const time = videoRef.current?.currentTime || 0;
    const duration = videoRef.current?.duration || 0;

    await api.updateEpisodeProgress(
      course.id,
      currentEpisode.id,
      true,
      duration > 0 ? duration : time,
      duration > 0 ? duration : time
    );

    // Check for manual quiz at this stage
    let quizToShow = quizzes.find(q => q.afterEpisodeIndex === currentEpisodeIndex + 1);

    // Filter out quizzes already passed
    if (quizToShow && passedQuizIds.includes(quizToShow.id)) {
      quizToShow = undefined;
    }

    if (quizToShow && user?.role !== 'admin' && user?.role !== 'supervisor') {
      setActiveQuiz(quizToShow);
      return;
    }

    // If it's the last episode, check if all quizzes are passed before marking course as complete
    if (currentEpisodeIndex === episodes.length - 1) {
      // Check if there are remaining quizzes that haven't been passed
      const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
      const allQuizzesPassed = courseQuizzes.length === 0 || courseQuizzes.every(q => passedQuizIds.includes(q.id));

      if (allQuizzesPassed) {
        api.updateCourseProgress(course.id, 100);
        setIsCompleted(true);
      } else {
        // Don't mark as complete, student still has quizzes to pass
        console.log('Cannot complete course: not all quizzes passed yet.');
        setIsCompleted(false);
      }
    } else {
      // Auto-advance
      setCurrentEpisodeIndex(prev => prev + 1);
      // Reset maxTimeReached for the new episode
      setMaxTimeReached(0);
      setProgress(0);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    try {
      const res = await api.toggleFavorite(user.id, course.id, 'course');
      if (res) {
        setIsFavorite(res.action === 'added');
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
    }
  };

  const isEpisodeLocked = (index: number) => {
    if (user?.role === 'admin' || user?.role === 'supervisor' || user?.is_tester) return false; // Administrative roles and testers can go anywhere
    if (index === 0) return false;
    if (index <= maxReachedIndex) return false;

    // Additional check: if previous episode is completed, this one should be open
    const prevEpisode = episodes[index - 1];
    if (prevEpisode && prevEpisode.completed) return false;

    return true;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 w-fit transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span>{t('player.backToCourses')}</span>
      </button>

      {activeQuiz ? (
        <div className="flex-1">
          <Quiz
            quiz={activeQuiz}
            courseName={course.title}
            onSuccess={() => {
              setPassedQuizIds(prev => [...prev, activeQuiz.id]);
            }}
            onClose={() => {
              // Build a local snapshot including the just-passed quiz
              const updatedPassedIds = passedQuizIds.includes(activeQuiz.id)
                ? passedQuizIds
                : [...passedQuizIds, activeQuiz.id];

              if (updatedPassedIds.includes(activeQuiz.id)) {
                if (currentEpisodeIndex < episodes.length - 1) {
                  setCurrentEpisodeIndex(prev => prev + 1);
                } else {
                  // Last episode: check if ALL course quizzes are now passed
                  const courseQuizzes = quizzes.filter(q => q.courseId === course.id);
                  const allPassed = courseQuizzes.length === 0 || courseQuizzes.every(q => updatedPassedIds.includes(q.id));
                  if (allPassed) {
                    api.updateCourseProgress(course.id, 100);
                    setIsCompleted(true);
                  }
                }
              }
              setActiveQuiz(null);
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col-reverse md:flex-row gap-8 items-center justify-center">

          {/* Right Column (Controls + Curriculum) - RTL First */}
          <div className="w-full md:w-96 flex flex-col gap-4 h-full max-h-[85vh]">

            {/* Custom Control Bar & Info Moved Here */}
            <div className="w-full bg-black/20 backdrop-blur-lg p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col gap-4">
              {/* Course Name */}
              <div className="text-center px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <p className="text-violet-300 font-bold text-sm">{course.title}</p>
              </div>
              {/* Info & Mark Complete */}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white mb-1 truncate leading-tight">{currentEpisode.title}</h2>
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-1 rounded-lg transition-colors ${isFavorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-white'}`}
                      title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {/* Book Download Button */}
                    {attachedBook && (
                      <a
                        href={attachedBook.url || attachedBook.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg animate-pulse-subtle"
                        title="تحميل الكتاب المرافق"
                        download
                      >
                        <Book className="w-5 h-5" />
                        <span className="text-xs font-bold whitespace-nowrap">تحميل الكتاب</span>
                      </a>
                    )}
                  </div>
                  <p className="text-violet-400 text-xs font-medium truncate">{course.instructor}</p>
                </div>
                <button
                  onClick={handleMarkComplete}
                  disabled={user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester && progress < 100 && !isCompleted}
                  className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-lg flex-shrink-0 flex items-center gap-1 ${user?.role !== 'admin' && !user?.is_tester && progress < 100 && !isCompleted
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                    }`}
                >
                  {user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester && progress < 100 && !isCompleted ? <Lock className="w-3 h-3" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {currentEpisodeIndex === episodes.length - 1 ? "إكمال" : "التالي"}
                </button>
              </div>

              {/* Time Left Countdown / Completion Badge */}
              {user?.role !== 'admin' && user?.role !== 'supervisor' && (
                <div className={`flex items-center justify-between border p-3 rounded-xl ${isTrulyCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  {isTrulyCompleted ? (
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-2">
                       <CheckCircle className="w-4 h-4" />
                       المساق منجَز بنجاح
                    </span>
                  ) : timeLeft ? (
                    <>
                      <span className="text-amber-400 font-bold text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 animate-[spin_3s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        الوقت المتبقي لإنهاء المساق:
                      </span>
                      <div className="flex gap-1.5" dir="ltr">
                        <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-1 rounded text-xs">{timeLeft.days}d</span>
                        <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-1 rounded text-xs">{timeLeft.hours}h</span>
                        <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-1 rounded text-xs">{timeLeft.mins}m</span>
                      </div>
                    </>
                  ) : (
                      <span className="text-gray-400 font-bold text-xs flex items-center gap-2">
                         لا يوجد فترة محددة
                      </span>
                  )}
                </div>
              )}

              {/* Next Course Button - STRICTLY requires all episodes completed AND all quizzes passed */}
              {isTrulyCompleted && nextCourse && !nextCourse.isLocked && (
                <button
                  onClick={() => onPlayCourse(nextCourse)}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 animate-bounce-subtle"
                >
                  <SkipForward className="w-5 h-5" />
                  <span>الانتقال للمساق التالي: {nextCourse.title}</span>
                </button>
              )}
            </div>

            {/* Progress Bar (Forced LTR) */}
            <div className="space-y-1 group" dir="ltr">
              <input
                type="range"
                value={progress}
                onChange={(e) => {
                  const newProgress = Number(e.target.value);
                  const newTime = (newProgress / 100) * duration;

                  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || !!user?.is_tester;
                  const isEpisodeFullyCompleted = (currentEpisode as any).completed;
                  if (isAdminOrSupervisor || newTime <= maxTimeReached || isCompleted || isEpisodeFullyCompleted || newTime < currentTime) {
                    setProgress(newProgress);
                    if (videoRef.current && duration) {
                      videoRef.current.currentTime = newTime;
                    }
                  } else {
                    console.warn("Seeking forward is restricted until content is watched.");
                  }
                }}
                style={{
                  background: `linear-gradient(to right, #8b5cf6 ${progress}%, rgba(255,255,255,0.1) ${progress}%)`
                }}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons (RTL Layout) */}
            <div className="flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isPlaying) videoRef.current?.pause();
                    else videoRef.current?.play();
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                </button>

                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="1"
                    dir="ltr"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (videoRef.current) {
                        videoRef.current.volume = val;
                        if (val > 0 && isMuted) setIsMuted(false);
                        else if (val === 0 && !isMuted) setIsMuted(true);
                      }
                    }}
                    className="w-16 h-1 bg-white/10 rounded-lg accent-gray-400 hover:accent-white hidden sm:block"
                  />
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-violet-500"
                  dir="ltr"
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      const newTime = videoRef.current.currentTime + 10;
                      const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || !!user?.is_tester;
                      if (isAdminOrSupervisor || newTime <= maxTimeReached || isCompleted) {
                        videoRef.current.currentTime = newTime;
                      } else {
                        console.warn("Cannot skip forward beyond watched content.");
                      }
                    }
                  }}
                  className={`p-1.5 rounded-full transition-colors ${(user?.role === 'admin' || user?.role === 'supervisor' || user?.is_tester || currentTime + 10 <= maxTimeReached || isCompleted)
                    ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                    : 'text-gray-600 cursor-not-allowed'
                    }`}
                  title="+10s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title="-10s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={toggleFullscreen} className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Curriculum Sidebar */}
            <div className="flex-1 flex flex-col min-h-0 glass-panel border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-violet-400" />
                  منهج الدورة
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {curriculumItems.map((item, idx) => {
                  if (item.type === 'episode') {
                    const ep = item.data;
                    const epIdx = item.index;
                    const inProgress = !ep.completed && (ep as any).watchedDuration > 0;
                    const active = epIdx === currentEpisodeIndex;
                    const locked = isEpisodeLocked(epIdx);

                    const parseDuration = (dur: string) => {
                      if (!dur) return 0;
                      const parts = dur.split(':').map(Number);
                      if (parts.length === 2) return parts[0] * 60 + parts[1];
                      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                      return 0;
                    };
                    const totalSec = parseDuration(ep.duration);

                    return (
                      <button
                        key={`ep-${ep.id}`}
                        disabled={locked}
                        onClick={() => setCurrentEpisodeIndex(epIdx)}
                        className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start gap-3 group relative ${active ? 'bg-violet-600/20 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]' :
                          ep.completed ? 'bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-500/10' :
                            inProgress ? 'bg-amber-600/5 hover:bg-amber-600/10 border border-amber-500/20' :
                              locked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white/5 border border-transparent'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${active ? 'bg-violet-500 text-white ring-2 ring-violet-500/20 animate-pulse' :
                          ep.completed ? 'bg-emerald-500 text-white shadow-sm' :
                            inProgress ? 'bg-amber-500 text-white shadow-sm' :
                              'bg-black/40 text-gray-400'
                          }`}>
                          {active ? <Play className="w-2.5 h-2.5 fill-current" /> :
                            ep.completed ? <CheckCircle className="w-3 h-3" /> :
                              <span className="text-[9px] font-bold">{epIdx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate transition-colors ${active ? 'text-white font-bold' :
                            ep.completed ? 'text-emerald-400' :
                              inProgress ? 'text-amber-400' :
                                'text-gray-400'
                            }`}>
                            {ep.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {ep.duration && <p className={`text-[9px] ${ep.completed ? 'text-emerald-600/60' : inProgress ? 'text-amber-600/60' : 'text-gray-500'}`}>{ep.duration}</p>}
                            {inProgress && totalSec > 0 && (
                              <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden max-w-[40px]">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${Math.min(100, Math.floor(((ep as any).watchedDuration / totalSec) * 100))}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {locked ? (
                          <Lock className="w-3 h-3 text-gray-600 mt-1" />
                        ) : active ? (
                          <div className="flex flex-col items-center gap-0.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                            <span className="text-[7px] text-violet-400 font-bold uppercase tracking-tighter">الآن</span>
                          </div>
                        ) : ep.completed ? (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[8px] text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">مكتمل</span>
                          </div>
                        ) : inProgress ? (
                          <div className="mt-1">
                            <Repeat className="w-3 h-3 text-amber-500 opacity-60" />
                          </div>
                        ) : null}
                      </button>
                    );
                  } else {
                    const quiz = item.data;
                    const isPassed = passedQuizIds.includes(quiz.id);
                    const afterEpIdx = quiz.afterEpisodeIndex || 0;
                    const isAdmin = user?.role === 'admin' || user?.role === 'supervisor' || !!user?.is_tester;
                    const isLocked = !isAdmin && afterEpIdx > 0 && isEpisodeLocked(afterEpIdx);

                    return (
                      <div
                        key={`quiz-${quiz.id}`}
                        onClick={() => {
                          if (isAdmin || (!isLocked && !isPassed)) {
                            setActiveQuiz(quiz);
                          }
                        }}
                        className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-3 border ${isPassed
                          ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-300'
                          : isLocked
                            ? 'bg-white/5 border-transparent opacity-50 grayscale cursor-not-allowed'
                            : 'bg-amber-600/10 border-amber-500/30 text-amber-300 hover:bg-amber-600/20 cursor-pointer'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${isPassed ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                          <ClipboardList className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">
                            {quiz.title}
                          </p>
                          <p className="text-[9px] opacity-70 mt-0.5">
                            {isPassed ? 'تم الاجتياز بنجاح' : isLocked ? 'مغلق حتى إكمال المحاضرة' : 'اختبار متاح - اضغط للبدء'}
                          </p>
                        </div>
                        {isPassed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-1" />}
                        {isLocked && <Lock className="w-3 h-3 text-gray-600 mt-1" />}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          </div>

          {/* Video / Audio Area */}
          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 min-h-[400px]">
            <div ref={containerRef} className={`relative group transition-all rounded-2xl overflow-hidden shadow-2xl bg-black ${isFullscreen ? 'fixed inset-0 z-50 rounded-none w-full h-full flex items-center justify-center' : 'w-fit max-w-full mx-auto'}`} style={{ height: isFullscreen ? '100vh' : 'auto' }}>
              {videoLoading && !videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
                  <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-sm font-medium">جاري تحميل المحتوى...</p>
                </div>
              )}

              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20 p-6 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">عذراً، فشل تحميل الفيديو</h3>
                  <p className="text-gray-400 text-sm mb-6">يرجى التحقق من اتصال الإنترنت أو المحاولة مرة أخرى لاحقاً.</p>
                  <button
                    onClick={() => { setVideoError(false); setVideoLoading(true); }}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                playsInline
                preload="metadata"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => setIsPlaying(prev => !prev)}
                className={`max-h-[70vh] w-auto max-w-full mx-auto block transition-opacity duration-300 cursor-pointer object-contain ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                  setIsPlaying(false);
                  saveProgress();
                }}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={() => setVideoLoading(true)}
                onPlaying={() => setVideoLoading(false)}
                onCanPlay={() => setVideoLoading(false)}
                onLoadedMetadata={handleLoadedMetadata}
                onError={() => {
                  setVideoError(true);
                  setVideoLoading(false);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  handleMarkComplete();
                }}
              />

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => setIsPlaying(prev => !prev)}>
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
              )}

              {isFullscreen && (
                <div className="absolute top-6 left-6 z-50 animate-fade-in">
                  <button
                    onClick={toggleFullscreen}
                    className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/10 shadow-lg group-hover:opacity-100 opacity-0 transition-opacity duration-3000 delay-1000"
                    style={{ opacity: 1 }}
                  >
                    <Minimize className="w-4 h-5" />
                    <span className="text-sm font-bold">تصغير الشاشة</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSecurityAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 animate-fade-in backdrop-blur-md">
          <div className="bg-red-600/20 border border-red-500/50 p-8 rounded-3xl max-w-md text-center space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">تنبيه أمان!</h3>
            <p className="text-red-200">
              يُمنع تسجيل الشاشة أو مغادرة الصفحة أثناء تشغيل المحتوى. يرجى الالتزام بسياسات المنصة لحماية حقوق الملكية.
            </p>
            <button
              onClick={() => setShowSecurityAlert(false)}
              className="px-6 py-2 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}

      {/* Lock out overlay if deadline passed */}
      {(((course as any).isLockedByDeadline && user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester) || 
        (timeLeft && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.mins === 0 && user?.role !== 'admin' && user?.role !== 'supervisor' && !user?.is_tester)) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-fade-in">
          <div className="bg-red-900/30 border border-red-500/50 p-8 rounded-3xl max-w-md text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">انتهى الوقت!</h3>
            <p className="text-red-200 text-lg">
              لقد انتهت الفترة الزمنية المتاحة لدراسة هذا المساق. لا يمكنك استكمال المشاهدة أو تقديم الامتحانات.
            </p>
            <p className="text-gray-400 text-sm mt-4">
              يرجى التواصل مع المشرف الخاص بك بطلب تمديد الفترة أو فتح المساق لك من جديد.
            </p>
            <button
              onClick={onBack}
              className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg w-full flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              العودة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
