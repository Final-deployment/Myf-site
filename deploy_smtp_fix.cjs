const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });
        proc.stdout.on('data', (data) => process.stdout.write(data));
        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                proc.stdin.write(password + '\n');
            }
        });
        proc.on('close', (code) => resolve(code));
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = '72.61.88.213';
    const user = 'root';
    const appDir = '/var/www/apps/scientific-bench-v4';

    console.log('\n>>> Step 1: Uploading updated .env to server...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        '.env.production.vps',
        `${user}@${server}:${appDir}/.env`
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }
    console.log('>>> .env uploaded successfully!');

    console.log('\n>>> Step 2: Restarting Docker container...');
    const restartCmd = [
        `cd ${appDir}`,
        'docker compose down',
        'docker compose up -d',
        'sleep 3',
        'docker ps --filter name=mastaba',
        'echo "=== SMTP CONFIG CHECK ==="',
        'docker exec $(docker ps -q --filter name=mastaba) env | grep SMTP'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${user}@${server}`,
        `"${restartCmd}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Server restarted with new SMTP credentials!');
    } else {
        console.error('\n>>> Error: Restart failed with code ' + sshCode);
    }
}

main();
