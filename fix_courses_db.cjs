const Database = require('better-sqlite3');
const db = new Database('/app/data/db.sqlite');

const fixes = [
    { id: 'course_madkhal', duration: '1س 30د', duration_en: '1h 30m', days: 5 },
    { id: 'course_aqeeda', duration: '2س 15د', duration_en: '2h 15m', days: 15 },
    { id: 'course_fiqh1-waseelit', duration: '3س', duration_en: '3h', days: 20 },
    { id: 'course_nifas', duration: '1س', duration_en: '1h', days: 12 },
    { id: 'course_tafseer', duration: '10س', duration_en: '10h', days: 5 },
    { id: 'course_tazkiyah', duration: '1س 50د', duration_en: '1h 50m', days: 10 },
    { id: 'course_seerah', duration: '5س', duration_en: '5h', days: 15 },
    { id: 'course_arba3oon', duration: '2س 30د', duration_en: '2h 30m', days: 25 },
    { id: 'course_fiqh2-it7af', duration: '4س', duration_en: '4h', days: 25 }
];

for (const f of fixes) {
    const eps = db.prepare('SELECT COUNT(*) as cnt FROM episodes WHERE courseId = ?').get(f.id);
    const count = eps ? eps.cnt : 0;
    db.prepare('UPDATE courses SET lessons_count = ?, duration = ?, duration_en = ?, days_available = ? WHERE id = ?').run(count, f.duration, f.duration_en, f.days, f.id);
    console.log(`Fixed ${f.id} -> lessons: ${count} | duration: ${f.duration} | days: ${f.days}`);
}
console.log('Done modifying the database!');
