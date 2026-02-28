const { spawn } = require('child_process');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const SETUP_SCRIPT = 'setup_https.sh';

async function runInteractive(command, args) {
    return new Promise((resolve) => {
        console.log(`>>> Running: ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            process.stderr.write(msg);
            if (msg.toLowerCase().includes('password:')) {
                console.log('\n[Script] Sending password...');
                proc.stdin.write(SSH_PASS + '\n');
            }
        });

        proc.on('close', (code) => {
            console.log(`>>> Finished with code ${code}`);
            resolve(code);
        });

        setTimeout(() => {
            console.log('\n[Script] Timeout reached.');
            proc.kill();
            resolve(-1);
        }, 600000); // 10 mins (apt-get update might take time)
    });
}

async function main() {
    console.log('--- STARTING HTTPS SETUP ---');

    console.log('\n>>> Step 1: Uploading setup script...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        SETUP_SCRIPT,
        `${SSH_USER}@${SSH_HOST}:/tmp/`
    ]);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed.');
        return;
    }

    console.log('\n>>> Step 1.1: Uploading docker-compose and nginx config...');
    await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'docker-compose.yml', 'nginx_app.conf',
        `${SSH_USER}@${SSH_HOST}:/tmp/`
    ]);

    console.log('\n>>> Step 2: Executing HTTPS setup...');
    const deployDir = '/var/www/apps/scientific-bench';
    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${SSH_USER}@${SSH_HOST}`,
        `"sudo mv /tmp/docker-compose.yml ${deployDir}/ && sudo mv /tmp/nginx_app.conf ${deployDir}/ && cd ${deployDir} && sudo docker compose up -d && chmod +x /tmp/${SETUP_SCRIPT} && sudo bash /tmp/${SETUP_SCRIPT}"`
    ]);

    if (sshCode === 0) {
        console.log('\n--- HTTPS SETUP SUCCESSFUL ---');
    } else {
        console.error('\n--- HTTPS SETUP FAILED ---');
    }
}

main();
