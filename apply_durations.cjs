const Database = require('better-sqlite3');
const db = new Database('/app/data/db.sqlite');

const courseDurations = {
    'مقدمة لطالب العلم': 5,
    'العقيدة: الجواهر الكلامية': 15,
    'فقه 1: وسيلة الطلب': 20,
    'فقه الحيض والنفاس': 12,
    'التفسير: صفات المؤمنين المهتدين': 5,
    'التزكية والسلوك': 10,
    'السيرة النبوية: مختصر في السيرة': 15,
    'الحديث الشريف: الأربعون النووية': 25,
    'فقه 2: إتحاف الطالب': 25
};

console.log('--- Updating Course Days Available ---');
const updateCourseStmt = db.prepare('UPDATE courses SET days_available = ? WHERE title = ?');
let updatedCourses = 0;

db.transaction(() => {
    for (const [title, days] of Object.entries(courseDurations)) {
        const result = updateCourseStmt.run(days, title);
        if (result.changes > 0) {
            console.log(`Updated "${title}" to ${days} days.`);
            updatedCourses++;
        } else {
            console.log(`WARNING: Course "${title}" not found in database.`);
        }
    }
})();
console.log(`Finished updating ${updatedCourses} courses.`);

console.log('\n--- Recalculating All Enrollments ---');
const enrollments = db.prepare(`
    SELECT e.user_id, e.course_id, e.enrolled_at, c.days_available 
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
`).all();

let updatedCount = 0;
const updateEnrollmentStmt = db.prepare('UPDATE enrollments SET deadline = ?, is_locked = 0 WHERE user_id = ? AND course_id = ?');

db.transaction(() => {
    for (const enr of enrollments) {
        if (!enr.days_available) continue;

        const enrolledDate = new Date(enr.enrolled_at);
        const deadlineDate = new Date(enrolledDate);
        deadlineDate.setDate(deadlineDate.getDate() + enr.days_available);

        updateEnrollmentStmt.run(deadlineDate.toISOString(), enr.user_id, enr.course_id);
        updatedCount++;
    }
})();

console.log(`Successfully updated deadlines for ${updatedCount} enrollments based on new durations.`);
