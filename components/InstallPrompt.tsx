import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_install_dismissed';
const INSTALLED_KEY = 'pwa_installed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Checks if the app is currently running in standalone/installed mode.
 */
function isRunningAsInstalledApp(): boolean {
    // CSS media query check (works on Chrome, Edge, etc.)
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
    // iOS Safari standalone check
    if ((window.navigator as any).standalone === true) return true;
    // Android TWA check
    if (document.referrer.startsWith('android-app://')) return true;
    return false;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIosSafari, setIsIosSafari] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        // ── 1. If running as installed app, never show prompt ──
        if (isRunningAsInstalledApp()) {
            setIsInstalled(true);
            localStorage.setItem(INSTALLED_KEY, 'true');
            return;
        }

        // ── 2. If user previously installed, don't show ──
        if (localStorage.getItem(INSTALLED_KEY) === 'true') {
            setIsInstalled(true);
            return;
        }

        // ── 3. If user dismissed recently, don't show ──
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISS_DURATION_MS) {
                return; // Still within the "don't bother me" window
            }
            // Expired — clear it and allow showing again
            localStorage.removeItem(DISMISSED_KEY);
        }

        // ── 4. Detect iOS Safari ──
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

        if (isIos && isSafari) {
            setIsIosSafari(true);
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        // ── 5. Listen for the browser's install prompt event ──
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 3000);
        };

        // ── 6. Listen for the actual installation event ──
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            localStorage.setItem(INSTALLED_KEY, 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
            localStorage.setItem(INSTALLED_KEY, 'true');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowPrompt(false);
        // Remember that user dismissed — don't ask again for 7 days
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    }, []);

    // ── Don't render anything if installed or not ready to show ──
    if (isInstalled || !showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in-up">
            <div className="glass-panel rounded-2xl p-4 shadow-2xl border border-gold-500/30 bg-[#0f3d36]/95 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">
                            {language === 'ar' ? 'ثبّت التطبيق' : 'Install App'}
                        </h3>
                        
                        {isIosSafari ? (
                            <div className="text-sm text-gray-300 mb-3 space-y-2">
                                <p>
                                    {language === 'ar'
                                        ? 'ثبّت المنصة لتجربة أسرع كالتطبيقات. اضغط على '
                                        : 'Install for a faster app-like experience. Tap '}
                                    <Share className="inline-block w-4 h-4 mx-1 pb-0.5" />
                                    {language === 'ar'
                                        ? ' ثم اختر "إضافة للشاشة الرئيسية"'
                                        : ' then select "Add to Home Screen"'}
                                </p>
                                <div className="text-xs bg-black/20 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                                    <span className="font-bold text-emerald-400 border border-emerald-400 rounded-md px-1.5">+</span>
                                    <span>{language === 'ar' ? 'إضافة للشاشة الرئيسية' : 'Add to Home Screen'}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                                {language === 'ar'
                                    ? 'أضف المصطبة العلمية إلى شاشتك الرئيسية للوصول السريع بدون إنترنت'
                                    : 'Add Al-Mastaba to your home screen for quick offline access'
                                }
                            </p>
                        )}

                        <div className="flex gap-2 mt-3">
                            {!isIosSafari && (
                                <button
                                    onClick={handleInstall}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-emerald-500/20 hover:scale-105 transition-all"
                                >
                                    {language === 'ar' ? 'تثبيت الآن' : 'Install Now'}
                                </button>
                            )}
                            <button
                                onClick={handleDismiss}
                                className={`px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm hover:bg-white/20 transition-all ${isIosSafari ? 'w-full text-center' : ''}`}
                            >
                                {language === 'ar' ? 'لاحقاً' : 'Later'}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-white transition p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
