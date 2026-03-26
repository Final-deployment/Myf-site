const { db } = require('./server/database.cjs');
const bcrypt = require('bcryptjs');

try {
    const passwordHash = bcrypt.hashSync('12345678', 10);
    const existingById = db.prepare('SELECT * FROM users WHERE id = ?').get('admin_manager');
    const existingByEmail = db.prepare('SELECT * FROM users WHERE email = ?').get('manager@mastaba.com');

    console.log('existingById:', existingById);
    console.log('existingByEmail:', existingByEmail);

    if (existingByEmail && existingByEmail.id !== 'admin_manager') {
        console.log('User exists with different ID. Deleting old and inserting new...');
        db.prepare('DELETE FROM users WHERE email = ?').run('manager@mastaba.com');
    }

    if (!existingById) {
        db.prepare(`
            INSERT INTO users (id, email, password, name, role, joinDate, emailVerified, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            'admin_manager',
            'manager@mastaba.com',
            passwordHash,
            'مدير الدعم الفني',
            'admin',
            new Date().toISOString(),
            1,
            'https://ui-avatars.com/api/?name=Support&background=0284c7&color=fff'
        );
        console.log('Successfully created admin_manager account.');
    }
} catch (error) {
    console.error('Error creating admin_manager account:', error);
}
