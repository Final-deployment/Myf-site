const fetch = require('node-fetch'); // Needs node-fetch or use built-in fetch in Node 18+

async function testLogin(email, password) {
    console.log(`Testing login for ${email}...`);
    try {
        const response = await fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const status = response.status;
        const data = await response.json();

        console.log(`Status: ${status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
    console.log('-----------------------------------');
}

(async () => {
    await testLogin('ahmed@example.com', '123456');
    await testLogin('admin@example.com', 'admin123');
})();
