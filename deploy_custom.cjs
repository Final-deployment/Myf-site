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

    console.log('\n>>> Step 1: Uploading update package to Hostinger...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'deploy_production_latest.zip',
        `${user}@${server}:/tmp/`
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }

    console.log('\n>>> Step 2: Executing deployment commands on server...');
    const deployCommand = [
        'mkdir -p /var/www/apps/scientific-bench',
        'mv /tmp/deploy_production_latest.zip /var/www/apps/scientific-bench/',
        'cd /var/www/apps/scientific-bench',
        'bash deploy.sh'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${user}@${server}`,
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Site deployed and updated on Hostinger!');
    } else {
        console.error('\n>>> Error: Deployment commands failed with code ' + sshCode);
    }
}

main();
