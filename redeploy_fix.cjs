const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const ZIP_FILE = 'deploy_recovery_v1.zip';
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
                proc.stdin.write(SSH_PASS + '\n');
            }
        });

        proc.on('close', (code) => {
            resolve(code);
        });

        setTimeout(() => {
            proc.kill();
            resolve(-1);
        }, 600000); // 10 mins
    });
}

function prepareZip() {
    console.log('>>> Preparing Zip...');
    // Ensure .env exists (copy from production vps if needed)
    if (fs.existsSync('.env.production.vps')) {
        fs.copyFileSync('.env.production.vps', '.env');
        console.log('Copied .env.production.vps to .env');
    }

    const files = [
        'dist',
        'server',
        'server.cjs',
        'package.json',
        'package-lock.json',
        'db.json',
        '.env',
        'docker-compose.yml',
        'Dockerfile',
        'seed_production_data.cjs',
        'courses_merged_safe.json'
    ];

    try {
        const cmd = `powershell -Command "Compress-Archive -Path ${files.join(', ')} -DestinationPath ${ZIP_FILE} -Force"`;
        execSync(cmd);
        console.log(`Created ${ZIP_FILE}`);
    } catch (e) {
        console.error('Zip failed:', e.message);
        process.exit(1);
    }
}

async function main() {
    prepareZip();

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

    console.log('\n>>> Step 2: Extracting and Restarting Services...');
    const deployCmd = [
        `sudo mkdir -p ${REMOTE_DIR}`,
        `sudo mv /tmp/${ZIP_FILE} ${REMOTE_DIR}/`,
        `cd ${REMOTE_DIR}`,
        `sudo unzip -o ${ZIP_FILE}`,
        'sudo docker compose up -d --build'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${SSH_USER}@${SSH_HOST}`,
        `"${deployCmd}"`
    ]);

    if (sshCode !== 0) {
        console.error('>>> Error: Restart failed.');
        return;
    }

    console.log('\n>>> Step 3: Running Seeding and Data Sync...');
    const seedCmd = `docker exec mastaba-v3-container node seed_production_data.cjs`;
    const seedCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        `${SSH_USER}@${SSH_HOST}`,
        `"${seedCmd}"`
    ]);

    if (seedCode === 0) {
        console.log('\n--- RECOVERY SUCCESSFUL ---');
    } else {
        console.error('\n--- RECOVERY FAILED ---');
    }
}

main();
