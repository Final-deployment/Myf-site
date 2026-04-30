/**
 * FIX: Update order_index for all courses in the production database.
 * 
 * This script fixes the root cause of the "first course locked" bug:
 * All courses had order_index = 0, causing alphabetical sorting by ID,
 * which placed course_madkhal at position 5 instead of position 1.
 * 
 * Run on server: node fix_course_order_production.cjs
 */
const { db } = require('./server/database.cjs');

const CORRECT_ORDER = [
    { id: 'course_madkhal',        order_index: 0, label: 'مدخل للعلوم الشرعية' },
    { id: 'course_aqeeda',         order_index: 1, label: 'عقيدة' },
    { id: 'course_fiqh1-waseelit', order_index: 2, label: 'فقه (الوسيلة)' },
    { id: 'course_nifas',          order_index: 3, label: 'أحكام النفاس' },
    { id: 'course_tafseer',        order_index: 4, label: 'تفسير' },
    { id: 'course_tazkiyah',       order_index: 5, label: 'تزكية' },
    { id: 'course_seerah',         order_index: 6, label: 'سيرة نبوية' },
    { id: 'course_arba3oon',       order_index: 7, label: 'الأربعون النووية' },
    { id: 'course_fiqh2-it7af',    order_index: 8, label: 'فقه (الإتحاف)' },
];

console.log('=== FIX: Updating course order_index values ===\n');

// Show current state
console.log('--- BEFORE (current order_index values) ---');
const currentCourses = db.prepare('SELECT id, title, order_index FROM courses ORDER BY order_index ASC, id ASC').all();
currentCourses.forEach((c, i) => {
    console.log(`  ${i}: [order_index=${c.order_index}] ${c.id} — ${c.title}`);
});

// Apply fix
console.log('\n--- APPLYING FIX ---');
const updateStmt = db.prepare('UPDATE courses SET order_index = ? WHERE id = ?');

db.transaction(() => {
    for (const entry of CORRECT_ORDER) {
        const result = updateStmt.run(entry.order_index, entry.id);
        if (result.changes > 0) {
            console.log(`  ✅ ${entry.id} → order_index = ${entry.order_index} (${entry.label})`);
        } else {
            console.log(`  ⚠️  ${entry.id} — NOT FOUND in database`);
        }
    }
})();

// Show result
console.log('\n--- AFTER (verified order) ---');
const updatedCourses = db.prepare('SELECT id, title, order_index FROM courses ORDER BY order_index ASC, id ASC').all();
updatedCourses.forEach((c, i) => {
    const isFirst = i === 0;
    console.log(`  ${i}: [order_index=${c.order_index}] ${c.id} — ${c.title} ${isFirst ? '← هذا هو المساق الأول (مفتوح دائماً)' : ''}`);
});

// Also fix any locked enrollments for the first course that shouldn't be locked
console.log('\n--- FIXING locked enrollments for first course (Madkhal) ---');
const fixLocked = db.prepare(`
    UPDATE enrollments SET is_locked = 0 
    WHERE course_id = 'course_madkhal' AND is_locked = 1 AND (progress >= 100 OR completed = 1)
`).run();
console.log(`  Unlocked ${fixLocked.changes} completed-but-locked enrollment(s) for Madkhal.`);

console.log('\n=== DONE ===');
