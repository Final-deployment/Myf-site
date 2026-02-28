const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite', { verbose: console.log });

console.log('Applying migrations...');
try { db.prepare('ALTER TABLE courses ADD COLUMN days_available INTEGER DEFAULT 30').run(); } catch (e) { console.log('Migration days_available exists'); }
try { db.prepare('ALTER TABLE enrollments ADD COLUMN deadline TEXT').run(); } catch (e) { console.log('Migration deadline exists'); }
try { db.prepare('ALTER TABLE enrollments ADD COLUMN is_locked INTEGER DEFAULT 0').run(); } catch (e) { console.log('Migration is_locked exists'); }

console.log('Seeding course days_available mapping...');
const courseMapping = {
    'course_madkhal': 5,
    'course_aqeeda': 15,
    'course_fiqh1-waseelit': 20,
    'course_nifas': 12,
    'course_tafseer': 5,
    'course_tazkiyah': 10,
    'course_seerah': 15,
    'course_arba3oon': 25,
    'course_fiqh2-it7af': 25
};

const updateCourse = db.prepare('UPDATE courses SET days_available = ? WHERE id = ?');
let updatedCount = 0;
for (const [courseId, days] of Object.entries(courseMapping)) {
    const result = updateCourse.run(days, courseId);
    if (result.changes > 0) {
        console.log(`Updated course ${courseId} to ${days} days.`);
        updatedCount++;
    } else {
        console.log(`Course ${courseId} not found mapped.`);
    }
}
console.log(`Seeded ${updatedCount} courses with days_available.`);
