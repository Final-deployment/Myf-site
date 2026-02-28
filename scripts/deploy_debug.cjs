const { spawn } = require('child_process');
const fs = require('fs');
const logFile = 'deploy_debug.log';

function log(msg) {
    const text = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logFile, text);
    process.stdout.write(text);
}

async function runInteractive(command, args, password) {
    return new Promise((resolve) => {
        log(`Running: ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, { shell: true });

        proc.stdout.on('data', (data) => {
            log(`STDOUT: ${data}`);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString();
            log(`STDERR: ${msg}`);
            if (msg.toLowerCase().includes('password:')) {
                log('Sending password...');
                proc.stdin.write(password + '\n');
            }
        });

        proc.on('close', (code) => {
            log(`Process closed with code ${code}`);
            resolve(code);
        });
    });
}

async function main() {
    const password = '@Qqaazz2222##';
    const server = 'root@147.93.62.42';

    fs.writeFileSync(logFile, '--- Deployment Debug Log ---\n');

    log('Testing core tools...');
    await runInteractive('ssh', ['-o', 'StrictHostKeyChecking=no', server, 'docker --version && docker compose version'], password);

    log('Checking directory content...');
    await runInteractive('ssh', ['-o', 'StrictHostKeyChecking=no', server, 'ls -la /var/www/apps/scientific-bench'], password);

    log('Running partial deploy.sh...');
    // We already unzipped, let's try the docker part manually
    await runInteractive('ssh', ['-o', 'StrictHostKeyChecking=no', server, 'cd /var/www/apps/scientific-bench && docker compose up -d --build'], password);
}

main();
