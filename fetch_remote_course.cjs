const { spawn } = require('child_process');
const fs = require('fs');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '147.93.62.42';
const REMOTE_DB = '/var/www/apps/scientific-bench/data/db.sqlite';

const query = `
sqlite3 -json ${REMOTE_DB} "SELECT id, title, lessons_count FROM courses WHERE title LIKE '%الفقه%' OR id = 'course_madkhal';"
`;

async function fetchRemoteData() {
    console.log('--- FETCHING REMOTE COURSE DATA ---');

    return new Promise((resolve) => {
        const proc = spawn('ssh', [
            '-o', 'StrictHostKeyChecking=no',
            `${SSH_USER}@${SSH_HOST}`,
            `"${query}"`
        ], { shell: true });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            stderr += msg;
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write(SSH_PASS + '\n');
            }
        });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log('Success!');
                fs.writeFileSync('remote_courses.json', stdout);
                console.log('Data saved to remote_courses.json');
            } else {
                console.error('Failed with code:', code);
                console.error('Error:', stderr);
            }
            resolve();
        });

        // Timeout
        setTimeout(() => proc.kill(), 30000);
    });
}

fetchRemoteData();
