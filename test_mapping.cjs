const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: 'user_1772042850048', email: 'student_1@example.com', role: 'student' }, process.env.SECRET_KEY, { expiresIn: '1h' });

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/courses',
    headers: { 'Authorization': `Bearer ${token}` }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(data);
        const sample = parsed[0];
        console.log("Keys returned for first course:", Object.keys(sample));
        console.log("Folder mapping -> DB folder_id vs API folderId:");
        console.log("Has 'folder_id'? :", 'folder_id' in sample);
        console.log("Has 'folderId'? :", 'folderId' in sample);
        console.log("Value of folderId:", sample.folderId);
        console.log("Value of folder_id:", sample.folder_id);
    });
});
req.end();
