const http = require('http');
http.get('http://localhost:5000/api/courses', res => {
    let data = ''; res.on('data', c => data += c); res.on('end', () => {
        const courses = JSON.parse(data);
        console.log('Courses folder IDs:', [...new Set(courses.map(c => c.folderId))].join(', '));
    });
});
http.get('http://localhost:5000/api/folders', res => {
    let data = ''; res.on('data', c => data += c); res.on('end', () => {
        const f = JSON.parse(data);
        console.log('Folders IDs:', f.map(f => f.id).join(', '));
    });
});
