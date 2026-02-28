const { spawn } = require('child_process');
const fs = require('fs');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
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

    console.log('\n>>> Step 1: Uploading NEW update package to Hostinger (Port 3005)...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'deploy_production_latest.zip',
        `${user}@${server}:/tmp/`
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }

    console.log('\n>>> Step 2: Executing NEW deployment commands on server...');
    const deployCommand = [
        'mkdir -p /var/www/apps/scientific-bench-v4',
        'mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench-v4/',
        'cd /var/www/apps/scientific-bench-v4',
        'unzip -o deploy_production_latest.zip',
        'docker compose down || true',
        'docker compose up -d --build',
        'cp nginx_app.conf /etc/nginx/sites-available/scientific-bench-v4',
        'ln -sf /etc/nginx/sites-available/scientific-bench-v4 /etc/nginx/sites-enabled/',
        'nginx -t && systemctl reload nginx'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${user}@${server}`,
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Site deployed on NEW port 3005 and V4 container!');
    } else {
        console.error('\n>>> Error: Deployment commands failed with code ' + sshCode);
    }
}

main();
