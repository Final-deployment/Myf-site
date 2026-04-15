import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, DownloadCloud, X } from 'lucide-react';
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

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[60] animate-fade-in-up">
            <div className="glass-panel border border-emerald-500/30 rounded-2xl p-4 shadow-2xl bg-[#0f3d36]/90 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex flex-shrink-0 items-center justify-center">
                        {needRefresh ? <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin-slow" /> : <DownloadCloud className="w-5 h-5 text-emerald-400" />}
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-white font-bold mb-1 text-sm">
                            {needRefresh 
                                ? (language === 'ar' ? 'تحديث جديد متاح' : 'New Update Available')
                                : (language === 'ar' ? 'اكتمل التحميل' : 'App Ready')}
                        </h3>
                        <p className="text-gray-300 text-xs mb-3">
                            {needRefresh
                                ? (language === 'ar' ? 'تتوفر نسخة جديدة من الموقع بأحدث الميزات، قم بالتحديث الآن.' : 'A new version with the latest features is available. Update now.')
                                : (language === 'ar' ? 'التطبيق جاهز الآن للعمل بدون إنترنت!' : 'App is now ready to work offline!')}
                        </p>
                        
                        <div className="flex gap-2">
                            {needRefresh && (
                                <button
                                    onClick={() => updateServiceWorker(true)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
                                >
                                    {language === 'ar' ? 'تحديث الآن' : 'Reload'}
                                </button>
                            )}
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
