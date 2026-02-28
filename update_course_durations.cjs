const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

const updates = [
    { id: 'course_madkhal', title: 'المدخل إلى الفقه', days: 5 },
    { id: 'course_aqeeda', title: 'العقيدة: الجواهر الكلامية', days: 15 },
    { id: 'course_fiqh1-waseelit', title: 'فقه 1: وسيلة الطلب', days: 20 },
    { id: 'course_nifas', title: 'فقه الحيض والنفاس', days: 12 },
    { id: 'course_tafseer', title: 'التفسير: صفات المؤمنين المهتدين', days: 5 },
    { id: 'course_tazkiyah', title: 'التزكية والسلوك', days: 10 },
    { id: 'course_seerah', title: 'السيرة النبوية: مختصر في السيرة', days: 15 },
    { id: 'course_arba3oon', title: 'الحديث الشريف: الأربعون النووية', days: 25 },
    { id: 'course_fiqh2-it7af', title: 'فقه 2: إتحاف الطالب', days: 25 }
];

try {
    db.transaction(() => {
        const stmt = db.prepare('UPDATE courses SET title = ?, days_available = ? WHERE id = ?');
        for (const update of updates) {
            const info = stmt.run(update.title, update.days, update.id);
            if (info.changes > 0) {
                console.log(`Updated ${update.id}: ${update.title} - ${update.days} days`);
            } else {
                console.warn(`Warning: Course ${update.id} not found.`);
            }
        }
    })();
    console.log('--- All courses updated successfully ---');
} catch (error) {
    console.error('Error updating courses:', error);
} finally {
    db.close();
}
