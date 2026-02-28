const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password')) {
                proc.stdin.write(password + '\n');
            }
        });

        proc.on('close', (code) => {
            resolve(code);
        });
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = '147.93.62.42';
    const user = 'root';

    console.log('\n>>> Step 1: Uploading Update package to Hostinger (Targeting port 3001)...');

    // We only need to upload docker-compose.yml actually, but let's just make sure
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'docker-compose.yml',
        `${user}@${server}:/var/www/apps/scientific-bench-v4/`
    ], password);

    console.log('\n>>> Step 2: Executing NEW deployment commands on server...');
    const deployCommand = [
        'cd /var/www/apps/scientific-bench-v4',
        'docker stop mastaba-v3-container || true',
        'docker rm mastaba-v3-container || true',
        'docker stop mastaba-v4-container || true',
        'docker rm mastaba-v4-container || true',
        'docker compose up -d'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${user}@${server}`,
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Site deployed on original active port 3001!');
    } else {
        console.error('\n>>> Error: Deployment commands failed with code ' + sshCode);
    }
}

main();
