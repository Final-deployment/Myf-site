const { spawn } = require('child_process');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const ZIP_FILE = 'deploy_production_latest.zip';
const REMOTE_DIR = '/var/www/apps/scientific-bench';

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

        // Timeout
        setTimeout(() => {
            console.log('\n[Script] Timeout reached. Killing process.');
            proc.kill();
            resolve(-1);
        }, 300000); // 5 mins
    });
}

async function main() {
    console.log('--- STARTING MULTAQA DEPLOYMENT ---');

    console.log('\n>>> Step 1: Uploading package...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        ZIP_FILE,
        `${SSH_USER}@${SSH_HOST}:/tmp/`
    ]);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed.');
        return;
    }

    console.log('\n>>> Step 1.1: Uploading deploy script...');
    const scpScriptCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'deploy.sh',
        `${SSH_USER}@${SSH_HOST}:/tmp/`
    ]);

    if (scpScriptCode !== 0) {
        console.error('>>> Error: Script upload failed.');
        return;
    }

    console.log('\n>>> Step 2: Executing server-side deployment...');
    const deployCmd = [
        `sudo mv /tmp/${ZIP_FILE} ${REMOTE_DIR}/`,
        `sudo mv /tmp/deploy.sh ${REMOTE_DIR}/`,
        `cd ${REMOTE_DIR}`,
        `sudo chmod +x deploy.sh`,
        'sudo bash deploy.sh'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${SSH_USER}@${SSH_HOST}`,
        `"${deployCmd}"`
    ]);

    if (sshCode === 0) {
        console.log('\n--- DEPLOYMENT SUCCESSFUL ---');
    } else {
        console.error('\n--- DEPLOYMENT FAILED ---');
    }
}

main();
