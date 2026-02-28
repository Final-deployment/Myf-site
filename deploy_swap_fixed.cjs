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
    const server = 'root@147.93.62.42';

    console.log('\n>>> Step 2: Executing container swap on server...');
    const deployCommand = [
        'cd /var/www/apps/scientific-bench-v4',
        'docker rm -f mastaba-v3-container || true',
        'docker rm -f mastaba-v4-container || true',
        'docker compose up -d'
    ].join(' ; ');

    // CRITICAL: Double quotes around the entire remote command
    const sshCode = await runInteractive('ssh', [
        '-o', 'ConnectTimeout=15',
        '-o', 'StrictHostKeyChecking=no',
        server,
        `"${deployCommand}"`
    ], password);

    if (sshCode === 0) {
        console.log('\n>>> SUCCESS: Container swapped to port 3001!');
    } else {
        console.error('\n>>> Error: Swap failed with code ' + sshCode);
    }
}

main();
