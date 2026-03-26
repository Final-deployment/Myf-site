// Creates tester account b@b.com with is_tester=1
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

// Ensure is_tester column exists
try { db.prepare('ALTER TABLE users ADD COLUMN is_tester INTEGER DEFAULT 0').run(); } catch (e) { }

const email = 'b@b.com';
const password = '123456';
const hashedPassword = bcrypt.hashSync(password, 10);

// Check if user already exists
const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
if (existing) {
    // Update existing user to be tester
    db.prepare('UPDATE users SET is_tester = 1, emailVerified = 1 WHERE id = ?').run(existing.id);
    console.log(`Updated existing user ${existing.id} (${email}) to tester.`);
} else {
    const id = 'user_tester_' + Date.now();
    db.prepare(`
    INSERT INTO users (id, email, password, name, nameEn, role, points, level, joinDate, emailVerified, is_tester)
    VALUES (?, ?, ?, ?, ?, 'student', 0, 1, ?, 1, 1)
  `).run(id, email, hashedPassword, 'حساب اختبار', 'Test Account', new Date().toISOString().split('T')[0]);

    // Auto-enroll in foundational course
    const fCourse = db.prepare('SELECT days_available FROM courses WHERE id = ?').get('course_madkhal');
    if (fCourse) {
        const date = new Date();
        date.setDate(date.getDate() + (fCourse.days_available || 30));
        const deadline = date.toISOString();
        db.prepare(`
      INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at, deadline, progress, completed, is_locked)
      VALUES (?, 'course_madkhal', CURRENT_TIMESTAMP, ?, 0, 0, 0)
    `).run(id, deadline);
    }
    console.log(`Created tester account: ${email} (id: ${id})`);
}

db.close();
console.log('Done.');
