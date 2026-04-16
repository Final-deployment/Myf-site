import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { getAuthToken } from '../services/api/auth';
import { useToast } from './Toast';

const PushNotificationManager: React.FC = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            checkSubscription();
        } else {
            setIsLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = async () => {
        setIsLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('يجب الموافقة على صلاحية الإشعارات أولاً');
                setIsLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            // Fetch VAPID public key
            const token = getAuthToken();
            const response = await fetch('/api/notifications/vapid-public-key', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const { publicKey } = await response.json();

            const convertedVapidKey = urlBase64ToUint8Array(publicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // Send to server
            const subResponse = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
            });

            if (subResponse.ok) {
                setIsSubscribed(true);
                toast.success('تم تفعيل الإشعارات بنجاح!');
            } else {
                toast.error('فشل في حفظ الاشتراك على الخادم');
            }
        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast.error('حدث خطأ أثناء محاولة تفعيل الإشعارات');
        } finally {
            setIsLoading(false);
        }
    };


    if (!isSupported) {
        return (
            <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-3 mb-2">
                    <BellOff className="w-5 h-5 text-red-400" />
                    <h3 className="font-bold text-white">إشعارات الموقع غير مدعومة</h3>
                </div>
                <p className="text-sm text-gray-400">
                    متصفحك الحالي أو نظام التشغيل لا يدعم إشعارات الويب. (إذا كنت تستخدم آيفون، يرجى تحديث النظام لـ iOS 16.4+ وإضافة الموقع للشاشة الرئيسية).
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-emerald-400" />
                        إشعارات الإدارة المباشرة
                    </h3>
                    <p className="text-sm text-gray-400">
                        استلم إشعارات النظام المهمة لتبقى على اطلاع بآخر التحديثات، حتى لو كان الموقع مغلقاً.
                    </p>
                </div>
                <button
                    onClick={!isSubscribed ? subscribeUser : undefined}
                    disabled={isLoading || isSubscribed}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isSubscribed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                        } disabled:opacity-80`}
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubscribed ? 'الإشعارات مفعلة ✓' : 'تفعيل الإشعارات الآن'}
                </button>
            </div>
        </div>
    );
};

export default PushNotificationManager;
