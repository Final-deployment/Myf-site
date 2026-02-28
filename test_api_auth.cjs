const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Create a valid token exactly as the user logging in would have
const testUserId = 'user_1772042850048'; // student_1@example.com
const token = jwt.sign({ id: testUserId, email: 'student_1@example.com', role: 'student' }, process.env.SECRET_KEY, { expiresIn: '1h' });

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status with auth:", res.statusCode);
        if (res.statusCode === 200) {
            console.log("Success! Total courses:", JSON.parse(data).length);
        } else {
            console.log("Error response:", data);
        }
    });
});
req.on('error', e => console.error(e));
req.end();
