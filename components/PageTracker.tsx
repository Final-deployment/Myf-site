import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTracker: React.FC = () => {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    let path = location.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // STRICT FILTER: Only track public Multaqa Website pages!
    // Do NOT track Mastaba pages (/dashboard, /player, /courses, /admin, etc.)
    const isMultaqaPage = 
      path === '/' || 
      path === '/about' || 
      path === '/articles' || 
      path.startsWith('/article/') || 
      path.startsWith('/initiative/');

    if (!isMultaqaPage) {
      return; // Ignore Mastaba LMS pages completely
    }

    let title = 'موقع ملتقى الشباب المسلم';
    if (path === '/') title = 'الصفحة الرئيسية للملتقى';
    else if (path === '/about') title = 'صفحة من نحن والتعريف بالملتقى';
    else if (path === '/articles') title = 'مكتبة المقالات الفكرية والتربوية';
    else if (path.startsWith('/article/')) title = `عرض مقالة (${path.split('/article/')[1] || ''})`;
    else if (path.startsWith('/initiative/')) title = `عرض مبادرة (${path.split('/initiative/')[1] || ''})`;

    if (document.title && !document.title.includes('المصطبة')) {
      title = document.title;
    }

    currentPathRef.current = path;
    startTimeRef.current = Date.now();

    // 1. Instant Visit Tracking Hit
    const sendHit = () => {
      try {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, title })
        }).catch(() => {});
      } catch {}
    };

    sendHit();

    // 2. Real-time periodic heartbeat stay duration every 10 seconds
    const intervalId = setInterval(() => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (durationSeconds >= 5) {
        startTimeRef.current = Date.now(); // Reset chunk timer
        try {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentPathRef.current, title, duration_seconds: durationSeconds })
          }).catch(() => {});
        } catch {}
      }
    }, 10000);

    // 3. Send final duration on page change / unmount
    return () => {
      clearInterval(intervalId);
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (durationSeconds >= 2 && durationSeconds <= 3600) {
        const payload = JSON.stringify({
          path: currentPathRef.current,
          title,
          duration_seconds: durationSeconds
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/track', blob);
        } else {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      }
    };
  }, [location.pathname]);

  return null;
};

export default PageTracker;
