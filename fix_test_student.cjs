const Database = require('better-sqlite3');
const db = new Database('database.sqlite', { verbose: console.log });

try {
    const email = 'student_1772042173769@example.com';
    const id = 'user_' + Date.now();

    db.prepare('UPDATE users SET emailVerified = 1, id = ? WHERE email = ?').run(id, email);
    console.log(`Student with email ${email} successfully updated with emailVerified = 1 and assigned id.`);

    // Let's also check the fields to ensure it looks correct
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    console.log('Updated user record:', user);
} catch (e) {
    console.error('Error updating student:', e);
}
