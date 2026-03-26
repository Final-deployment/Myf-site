const { spawn } = require('child_process');
const fs = require('fs');

const cmd = process.argv[2] || 'docker ps';
const logFile = 'ssh_remote.log';

fs.writeFileSync(logFile, `--- Running: ${cmd} ---\n`);

const proc = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', 'root@72.61.88.213', cmd], { shell: true });

proc.stdout.on('data', d => {
    fs.appendFileSync(logFile, d.toString());
    process.stdout.write(d.toString());
});

proc.stderr.on('data', d => {
    const msg = d.toString();
    fs.appendFileSync(logFile, 'STDERR: ' + msg);
    if (msg.toLowerCase().includes('password')) {
        proc.stdin.write('@Qqaazz2222##\n');
        fs.appendFileSync(logFile, '[Password Sent]\n');
    }
});

proc.on('close', c => {
    fs.appendFileSync(logFile, `[Finished Code: ${c}]\n`);
    console.log(`\n--- Completed with exit code ${c} ---`);
});
