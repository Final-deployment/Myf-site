const http = require('http');

const data = JSON.stringify({
    email: 'student_1772042173769@example.com',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let responseData = '';
    res.on('data', (d) => {
        responseData += d;
    });
    res.on('end', () => {
        console.log(responseData);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
