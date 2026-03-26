import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, RefreshCw, X, Eye, Award, BookOpen } from 'lucide-react';
import { Quiz as QuizType, Question } from '../types';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import RatingModal from './RatingModal';

interface QuizProps {
  quiz: QuizType;
  onSuccess: () => void;
  onClose: () => void;
  courseName?: string;
}

const Quiz: React.FC<QuizProps> = ({ quiz, onSuccess, onClose, courseName }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">هذا الاختبار لا يحتوي على أسئلة حالياً</h2>
        <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">إغلاق</button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestionIdx];
  const totalQuestions = quiz.questions.length;
  const passingScore = quiz.passingScore || 70;

  const handleNext = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = selectedOption as number;
    setUserAnswers(newAnswers);

    if (currentQuestionIdx < totalQuestions - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      setSelectedOption(newAnswers[nextIdx] !== undefined ? newAnswers[nextIdx] : null);
    } else {
      let finalScore = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans !== undefined && ans === quiz.questions[idx].correctAnswer) {
          finalScore++;
        }
      });
      setScore(finalScore);
      finishQuiz(finalScore);
    }
  };

  const finishQuiz = async (finalScore: number) => {
    setIsSaving(true);
    try {
      await api.quizResults.save(quiz.id, finalScore, totalQuestions);
      setIsSubmitted(true);

      const percentage = (finalScore / totalQuestions) * 100;
      if (percentage >= passingScore) {
        setShowRatingModal(true);
        onSuccess();
      }
    } catch (error) {
      console.error('Quiz save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCertificate = () => {
    alert("جاري تحميل الشهادة... (Simulation)");
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      const prevIdx = currentQuestionIdx - 1;
      setCurrentQuestionIdx(prevIdx);
      setSelectedOption(userAnswers[prevIdx] !== undefined ? userAnswers[prevIdx] : null);
    }
  };

  if (isSubmitted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassed = percentage >= passingScore;

    if (showReview) {
      return (
        <div className="max-w-3xl mx-auto py-10 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">مراجعة الأخطاء</h2>
            <button
              onClick={() => setShowReview(false)}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>العودة للنتيجة</span>
            </button>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const isWrong = userAnswer !== q.correctAnswer;

              if (!isWrong) return null;

              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl border-l-4 border-red-500 bg-red-500/5">
                  <p className="text-white font-medium mb-4">{idx + 1}. {q.text}</p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-red-400 flex items-center gap-3">
                      <X className="w-4 h-4" />
                      <span>إجابتك: {q.options[userAnswer]}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">الإجابة التي اخترتها خاطئة. يرجى مراجعة الدرس المتعلق بهذا السؤال.</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowReview(false)}
            className="w-full mt-8 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
          >
            العودة للنتيجة
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in py-10">
        <div className="glass-panel p-10 rounded-3xl text-center max-w-lg w-full relative overflow-hidden border-2 border-white/5">
          <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} />

          {/* Course Name in Results */}
          {courseName && (
            <div className="mb-4 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <p className="text-violet-300 text-sm font-bold">{courseName}</p>
            </div>
          )}

          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isPassed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {isPassed ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            ) : (
              <X className="w-12 h-12 text-red-400" />
            )}
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {isPassed ? 'أحسنت صنعاً!' : 'تحتاج لمراجعة أكثر'}
          </h2>
          <p className="text-gray-300 mb-8">
            {isPassed
              ? `تهانينا ${user?.name?.split(' ')[0] || ''}، لقد اجتزت الاختبار بنجاح.`
              : 'للأسف لم تصل لدرجة النجاح المطلوبة هذه المرة.'}
          </p>

          <div className="flex justify-center items-end gap-2 mb-2">
            <div className={`text-6xl font-bold ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>{percentage}%</div>
          </div>
          <div className="flex flex-col gap-1 items-center mb-4">
            <p className="text-sm text-gray-400">درجتك النهائية</p>
            <p className="text-xs text-gray-500">{score} من {totalQuestions} إجابة صحيحة</p>
            <p className="text-xs text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full mt-1">
              مطلوب {passingScore}% للنجاح
            </p>
          </div>

          {!isPassed && (
            <button
              onClick={() => setShowReview(true)}
              className="w-full mb-4 py-3 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              مراجعة الأسئلة الخاطئة
            </button>
          )}

          <div className="flex gap-4">
            {!isPassed && (
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentQuestionIdx(0);
                  setScore(0);
                  setSelectedOption(null);
                  setUserAnswers([]);
                }}
                className="flex-1 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-bold"
              >
                إعادة المحاولة
              </button>
            )}
            <button
              onClick={onClose}
              className={`py-4 rounded-xl text-white font-bold transition-colors ${isPassed ? 'w-full bg-emerald-600 hover:bg-emerald-500' : 'flex-1 bg-white/10 hover:bg-white/20'}`}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIdx + 1) / totalQuestions) * 100;
  const remaining = totalQuestions - currentQuestionIdx - 1;

  return (
    <>
      <div className="max-w-3xl mx-auto py-10 animate-fade-in">

        {/* Course Name Header */}
        {courseName && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
              <BookOpen className="w-5 h-5 text-violet-400" />
              <span className="text-violet-300 font-bold text-lg">{courseName}</span>
            </div>
          </div>
        )}

        {/* Enhanced Progress Header */}
        <div className="mb-8 glass-panel p-5 rounded-2xl border border-white/10">
          {/* Question Counter */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
                <span className="text-gold-500 font-bold text-lg">{currentQuestionIdx + 1}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">السؤال {currentQuestionIdx + 1} من {totalQuestions}</p>
                <p className="text-gray-500 text-xs">
                  {remaining === 0 ? 'هذا هو السؤال الأخير' : `متبقي ${remaining} ${remaining === 1 ? 'سؤال' : remaining === 2 ? 'سؤالان' : remaining <= 10 ? 'أسئلة' : 'سؤال'}`}
                </p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-gold-500">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Question Dots */}
          <div className="flex gap-1 mt-3 justify-center flex-wrap">
            {quiz.questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${idx < currentQuestionIdx ? 'bg-emerald-500' :
                  idx === currentQuestionIdx ? 'bg-gold-500 scale-150' :
                    'bg-gray-700'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-[2rem] border-2 border-white/5">
          <h2 className="text-2xl font-bold text-white mb-10 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-4">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`w-full p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${selectedOption === idx
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${selectedOption === idx ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-500 text-gray-500'
                  }`}>
                  {String.fromCharCode(1571 + idx)}
                </div>
                <span className={`text-lg ${selectedOption === idx ? 'text-white font-medium' : 'text-gray-300'}`}>
                  {option}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={handlePrevious}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>{t('quiz.previous')}</span>
            </button>

            <button
              disabled={selectedOption === null || isSaving}
              onClick={handleNext}
              className="flex items-center gap-2 px-10 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gold-500/20"
            >
              {isSaving ? (
                <span>...</span>
              ) : (
                <>
                  <span>{currentQuestionIdx === totalQuestions - 1 ? t('quiz.finish') : t('quiz.next')}</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          onClose();
        }}
      />
    </>
  );
};

export default Quiz;
