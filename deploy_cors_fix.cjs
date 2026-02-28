const { spawn } = require('child_process');

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, { shell: true });
        let passwordSent = false;

        const handleOutput = (data) => {
            const msg = data.toString();
            process.stdout.write(msg);
            if (!passwordSent && msg.toLowerCase().includes('password')) {
                passwordSent = true;
                setTimeout(() => {
                    proc.stdin.write(password + '\n');
                }, 100);
            }
        };

        proc.stdout.on('data', handleOutput);
        proc.stderr.on('data', handleOutput);

        proc.on('close', (code) => {
            resolve(code);
        });

        // Timeout after 2 minutes
        setTimeout(() => {
            console.log('\n[Script] Timeout reached. Killing process.');
            proc.kill();
            resolve(-1);
        }, 120000);
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = 'root@72.61.88.213';
    const remoteDir = '/var/www/apps/scientific-bench';

    console.log('--- CORS FIX DEPLOYMENT (server.cjs only) ---');
    console.log('This will ONLY update server.cjs without affecting the frontend.\n');

    // Step 1: Upload only server.cjs
    console.log('>>> Step 1: Uploading server.cjs...');
    const scpCode = await runInteractive('scp', [
        '-o', 'StrictHostKeyChecking=no',
        'server.cjs',
        `${server}:${remoteDir}/server.cjs`
    ], password);

    if (scpCode !== 0) {
        console.error('>>> Error: Upload failed with code ' + scpCode);
        return;
    }
    console.log('>>> server.cjs uploaded successfully.\n');

    // Step 2: Restart the application (pm2 or docker)
    console.log('>>> Step 2: Restarting the application...');
    const restartCommand = [
        `cd ${remoteDir}`,
        // Try pm2 first, then docker
        '(pm2 restart all 2>/dev/null || docker compose restart 2>/dev/null || echo "Manual restart needed")',
        'echo "--- Server restarted ---"'
    ].join(' && ');

    const sshCode = await runInteractive('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        server,
        `"${restartCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n--- CORS FIX DEPLOYED SUCCESSFULLY ---');
        console.log('Only server.cjs was updated. No frontend changes were made on the server.');
    } else {
        console.error('\n--- RESTART FAILED --- Please restart the server manually.');
    }
}

main();
