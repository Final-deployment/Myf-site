const http = require('http');

http.get('http://localhost:5000/api/courses', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            console.log("Total courses from API:", parsed.length);
        } else {
            console.log("Error response:", data.substring(0, 500));
        }
    });
}).on('error', err => console.log('HTTP GET error:', err.message));
