const { spawn } = require('child_process');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const cmdToRun = process.argv[2] || 'docker ps -a';

async function runInteractive(command, args) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => process.stdout.write(data));

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write(SSH_PASS + '\n');
            }
        });

        proc.on('close', (code) => {
            resolve(code);
        });

        // Timeout
        setTimeout(() => {
            proc.kill();
            resolve(-1);
        }, 30000);
    });
}

runInteractive('ssh', ['-o', 'StrictHostKeyChecking=no', `${SSH_USER}@${SSH_HOST}`, `"${cmdToRun}"`]);
