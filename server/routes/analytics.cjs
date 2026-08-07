const express = require('express');
const router = express.Router();
const { db } = require('../database.cjs');

// Predefined map of initiative names fallback
const INITIATIVE_NAMES = {
  'init_futuwwa': 'الفتوة المسلمة',
  'init_1': 'نبض الحياة',
  'init_2': 'بصمات أمل',
  'init_3': 'نبض الأمان',
  'init_meraj': 'معراج المعرفة',
  'init_rawafed': 'روافد الخير'
};

// Helper to format seconds into Arabic readable duration with English digits
function formatArabicDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 ثانية';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins === 0) return `${secs} ثانية`;
  if (secs === 0) return `${mins} دقيقة`;
  return `${mins} دقيقة و ${secs} ثانية`;
}

// STRICT FILTER: Only allow public Multaqa Website pages!
// Exclude all Mastaba LMS pages (/dashboard, /player, /courses, /admin, etc.)
function isMultaqaPage(path) {
  if (!path) return false;
  return path === '/' || 
         path === '/about' || 
         path === '/articles' || 
         path.startsWith('/article/') || 
         path.startsWith('/initiative/');
}

// Map path to friendly Arabic page title with real Article/Initiative database titles
function getFriendlyTitle(path, providedTitle) {
  if (path === '/') return 'الصفحة الرئيسية للملتقى';
  if (path === '/about') return 'صفحة من نحن والتعريف بالملتقى';
  if (path === '/articles') return 'مكتبة المقالات الفكرية والتربوية';

  if (path.startsWith('/article/')) {
    const artId = path.split('/article/')[1];
    if (artId) {
      try {
        const art = db.prepare('SELECT title FROM articles WHERE id = ?').get(artId);
        if (art && art.title) {
          const cleanTitle = art.title.replace(/<[^>]*>?/gm, '').trim();
          return `مقالة: ${cleanTitle}`;
        }
      } catch (e) {}
    }
    if (providedTitle && !providedTitle.includes('المصطبة') && !providedTitle.includes('art_new_') && providedTitle !== 'مستند') {
      return providedTitle.startsWith('مقالة:') ? providedTitle : `مقالة: ${providedTitle}`;
    }
    return `مقالة فكرية (${artId || ''})`;
  }

  if (path.startsWith('/initiative/')) {
    const initId = path.split('/initiative/')[1];
    if (initId) {
      if (INITIATIVE_NAMES[initId]) {
        return `مبادرة: ${INITIATIVE_NAMES[initId]}`;
      }
      try {
        const init = db.prepare('SELECT title FROM initiatives WHERE id = ?').get(initId);
        if (init && init.title) {
          const cleanTitle = init.title.replace(/<[^>]*>?/gm, '').trim();
          return `مبادرة: ${cleanTitle}`;
        }
      } catch (e) {}
    }
    if (providedTitle && !providedTitle.includes('المصطبة') && !providedTitle.includes('init_') && providedTitle !== 'مستند') {
      return providedTitle.startsWith('مبادرة:') ? providedTitle : `مبادرة: ${providedTitle}`;
    }
    return `مبادرة (${initId || ''})`;
  }

  if (providedTitle && !providedTitle.includes('المصطبة') && providedTitle !== 'مستند' && providedTitle !== 'Document') {
    return providedTitle;
  }

  return path;
}

// Track page view or stay duration
router.post('/track', (req, res) => {
  try {
    const { path, title, duration_seconds } = req.body;
    if (!path) return res.status(400).json({ error: 'path is required' });

    // STRICT CHECK: Reject Mastaba LMS pages completely
    if (!isMultaqaPage(path)) {
      return res.json({ success: true, ignored: true });
    }

    const friendlyTitle = getFriendlyTitle(path, title);
    const duration = parseInt(duration_seconds) || 0;

    // Check if record exists
    const existing = db.prepare('SELECT page_path, views_count, total_duration_seconds FROM page_analytics WHERE page_path = ?').get(path);

    if (!existing) {
      db.prepare(`
        INSERT INTO page_analytics (page_path, page_title, views_count, total_duration_seconds, last_visited_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(path, friendlyTitle, duration > 0 ? 0 : 1, duration);
    } else {
      if (duration > 0) {
        // Record stay duration
        db.prepare(`
          UPDATE page_analytics 
          SET total_duration_seconds = total_duration_seconds + ?, 
              last_visited_at = CURRENT_TIMESTAMP,
              page_title = ?
          WHERE page_path = ?
        `).run(duration, friendlyTitle, path);
      } else {
        // Record new page view visit
        db.prepare(`
          UPDATE page_analytics 
          SET views_count = views_count + 1, 
              last_visited_at = CURRENT_TIMESTAMP,
              page_title = ?
          WHERE page_path = ?
        `).run(friendlyTitle, path);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Analytics Track Error]:', err);
    res.status(500).json({ error: 'Failed to record analytics' });
  }
});

// Get overall and per-page analytics for Dashboard
router.get('/stats', (req, res) => {
  try {
    // Purge any accidental non-Multaqa rows
    db.prepare(`
      DELETE FROM page_analytics 
      WHERE page_path NOT IN ('/', '/about', '/articles') 
        AND page_path NOT LIKE '/article/%' 
        AND page_path NOT LIKE '/initiative/%'
    `).run();

    const rows = db.prepare(`
      SELECT page_path, page_title, views_count, total_duration_seconds, last_visited_at 
      FROM page_analytics 
      ORDER BY views_count DESC
    `).all();

    let totalSiteViews = 0;
    let totalSiteDuration = 0;

    const pages = rows.map(r => {
      totalSiteViews += (r.views_count || 0);
      totalSiteDuration += (r.total_duration_seconds || 0);
      const avgSecs = r.views_count > 0 ? Math.round(r.total_duration_seconds / r.views_count) : 0;
      
      const realTitle = getFriendlyTitle(r.page_path, r.page_title);
      // Keep DB updated with real titles
      try {
        db.prepare('UPDATE page_analytics SET page_title = ? WHERE page_path = ?').run(realTitle, r.page_path);
      } catch(e) {}

      return {
        path: r.page_path,
        title: realTitle,
        views: r.views_count || 0,
        totalDurationSeconds: r.total_duration_seconds || 0,
        avgDurationSeconds: avgSecs,
        formattedAvgDuration: formatArabicDuration(avgSecs),
        lastVisitedAt: r.last_visited_at
      };
    });

    const overallAvgSecs = totalSiteViews > 0 ? Math.round(totalSiteDuration / totalSiteViews) : 0;

    res.json({
      totalSiteViews,
      totalSiteDurationSeconds: totalSiteDuration,
      overallAvgDurationSeconds: overallAvgSecs,
      formattedOverallAvgDuration: formatArabicDuration(overallAvgSecs),
      pages
    });
  } catch (err) {
    console.error('[Analytics Stats Error]:', err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

// Reset/Clear all analytics data
router.post('/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM page_analytics').run();
    res.json({ success: true, message: 'تم إعادة ضبط جميع الإحصائيات للصفر بنجاح' });
  } catch (err) {
    console.error('[Analytics Reset Error]:', err);
    res.status(500).json({ error: 'Failed to reset analytics' });
  }
});

module.exports = router;
