const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');
const bcrypt = require('bcrypt');

try {
    const hash = bcrypt.hashSync('password123', 10);
    db.prepare(`
        INSERT INTO users (id, name, email, password, role)
        VALUES (?, ?, ?, ?, ?)
    `).run('supervisor_1', 'Test Supervisor', 'supervisor_1@example.com', hash, 'supervisor');
    console.log("Created supervisor user");
} catch (e) {
    console.log("Supervisor already exists maybe");
}

const student = db.prepare("SELECT id FROM users WHERE role = 'student' OR role = 'user' LIMIT 1").get();
const supervisor = db.prepare("SELECT id FROM users WHERE role = 'supervisor' LIMIT 1").get();
const course = db.prepare("SELECT id FROM courses LIMIT 1").get();

if (student && supervisor && course) {
    db.prepare("UPDATE users SET supervisor_id = ? WHERE id = ?").run(supervisor.id, student.id);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const existing = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?").get(student.id, course.id);
    if (!existing) {
        db.prepare(`
            INSERT INTO enrollments (user_id, course_id, enrolled_at, progress, completed, deadline, is_locked)
            VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0, ?, 1)
        `).run(student.id, course.id, yesterday.toISOString());
        console.log("Created an expired, locked enrollment for student.");
    } else {
        db.prepare(`
            UPDATE enrollments SET deadline = ?, is_locked = 1
            WHERE user_id = ? AND course_id = ?
        `).run(yesterday.toISOString(), student.id, course.id);
        console.log("Updated existing enrollment to be expired and locked.");
    }
}
