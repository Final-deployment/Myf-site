const db = require('better-sqlite3')('data/db.sqlite');
const bcrypt = require('bcryptjs');

const email = 'manager@mastaba.com';
const password = '12345678';

const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);

if (!user) {
    console.log('User not found in database.');
} else {
    console.log('User found:', user.email, 'Role:', user.role);
    const match = bcrypt.compareSync(password, user.password);
    console.log('Password "12345678" matches:', match);
}
