// public/push-sw.js
// Custom Service Worker for handling Web Push Notifications

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push Received:', data);

            const title = data.title || 'إشعار جديد من المصطبة العلمية';
            const options = {
                body: data.body || 'لديك رسالة جديدة',
                icon: data.icon || '/icons/icon-192x192.png',
                badge: data.badge || '/icons/icon-192x192.png',
                vibrate: [200, 100, 200, 100, 200, 100, 200], // distinct vibration pattern
                data: {
                    url: data.url || '/'
                },
                requireInteraction: true // keeps the notification until user interacts with it
            };

            const notificationPromise = self.registration.showNotification(title, options);
            event.waitUntil(notificationPromise);
        } catch (e) {
            console.error('[Service Worker] Error parsing push message:', e);
        }
    } else {
        console.log('[Service Worker] Push event but no data');
    }
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click received.');
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;

        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url.includes(urlToOpen)) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
