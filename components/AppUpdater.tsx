import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, DownloadCloud, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const AppUpdater: React.FC = () => {
    const { language } = useLanguage();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(swRegistration) {
            console.log('SW Registered:', swRegistration);
            // Check for updates every 60 minutes
            if (swRegistration) {
                setInterval(() => {
                    swRegistration.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('SW Registration Error:', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    // NEVER show the blocking update screen during verification or registration!
    // A forced reload here would destroy the pendingEmail state and lock the user out.
    const isOnCriticalFlow = window.location.pathname === '/verify' || window.location.pathname === '/signup';

    // S1: Full Screen critical blocker if a new update is found!
    if (needRefresh && !isOnCriticalFlow) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1815]/95 backdrop-blur-md animate-fade-in">
                <div className="max-w-md w-full mx-4 glass-panel p-8 rounded-3xl border-2 border-emerald-500/50 text-center shadow-2xl shadow-emerald-500/20">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/50">
                        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {language === 'ar' ? 'تحديث هام وإجباري!' : 'Critical Update Required!'}
                    </h2>
                    
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 text-right">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="text-amber-500 font-bold">{language === 'ar' ? 'تحديث نظام الامتحانات' : 'Exam System Update'}</h3>
                        </div>
                        <p className="text-amber-200/80 text-sm leading-relaxed">
                            {language === 'ar'
                                ? 'لضمان تصحيح إجاباتك بشكل دقيق واعتماد النتيجة الصحيحة في قاعدة البيانات، يجب عليك تحديث التطبيق الآن للعمل على النسخة الأخيرة.'
                                : 'To ensure your answers are graded accurately and saved securely, you must update the application to the latest version now.'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            // Call updateServiceWorker but don't strictly wait for it if it hangs
                            updateServiceWorker(true).catch(console.error);
                            
                            // Immediately force a reload after a short delay regardless of promise resolution
                            // to ensure the user isn't stuck on the frozen AppUpdater screen
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 border border-emerald-400/30"
                    >
                        <RefreshCw className="w-6 h-6" />
                        {language === 'ar' ? 'تحديث التطبيق الآن' : 'Update Application Now'}
                    </button>
                    
                    <p className="mt-4 text-gray-500 text-xs">
                        {language === 'ar' ? 'لن تستغرق العملية سوى ثوانٍ معدودة' : 'This will only take a few seconds'}
                    </p>
                </div>
            </div>
        );
    }

    // Unintrusive banner for offlineReady message
    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[60] animate-fade-in-up">
            <div className="glass-panel border border-emerald-500/30 rounded-2xl p-4 shadow-2xl bg-[#0f3d36]/90 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex flex-shrink-0 items-center justify-center">
                        <DownloadCloud className="w-5 h-5 text-emerald-400" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-white font-bold mb-1 text-sm">
                            {language === 'ar' ? 'اكتمل التحميل' : 'App Ready'}
                        </h3>
                        <p className="text-gray-300 text-xs mb-3">
                            {language === 'ar' ? 'التطبيق جاهز الآن للعمل بدون إنترنت!' : 'App is now ready to work offline!'}
                        </p>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={close}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all"
                            >
                                {language === 'ar' ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>

                    <button onClick={close} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppUpdater;
