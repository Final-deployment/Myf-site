const db = require('better-sqlite3')('data/db.sqlite');

const order = [
    'course_madkhal',
    'course_aqeeda',
    'course_fiqh1-waseelit',
    'course_nifas',
    'course_tafseer',
    'course_tazkiyah',
    'course_seerah',
    'course_arba3oon',
    'course_fiqh2-it7af'
];

function parseDuration(dStr) {
    if (!dStr) return 0;
    const parts = dStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
}

order.forEach((courseId, idx) => {
    const episodes = db.prepare('SELECT duration FROM episodes WHERE courseId = ?').all(courseId);
    const count = episodes.length;

    let totalSecs = 0;
    for (const ep of episodes) {
        totalSecs += parseDuration(ep.duration);
    }
    const totalFormatted = formatDuration(totalSecs);

    console.log('Course:', courseId, '-> Order:', idx, 'Count:', count, 'Duration:', totalFormatted);

    db.prepare('UPDATE courses SET order_index = ?, lessons_count = ?, duration = ? WHERE id = ?').run(idx, count, totalFormatted, courseId);
});
console.log('Done updating.');
