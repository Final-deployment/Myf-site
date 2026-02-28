const { spawn } = require('child_process');
const fs = require('fs');

const logFile = 'diag_ssh.log';
fs.writeFileSync(logFile, '--- Start ---\n');

const proc = spawn('ssh', ['-o', 'ConnectTimeout=10', '-o', 'StrictHostKeyChecking=no', 'root@147.93.62.42', 'docker ps && ufw status && netstat -tulnp | grep 3008'], { shell: true });

proc.stdout.on('data', d => {
    fs.appendFileSync(logFile, d.toString());
});

proc.stderr.on('data', d => {
    const msg = d.toString();
    fs.appendFileSync(logFile, 'STDERR: ' + msg);
    if (msg.toLowerCase().includes('password')) {
        proc.stdin.write('@Qqaazz2222##\n');
        fs.appendFileSync(logFile, '--- sent password ---\n');
    }
});

proc.on('close', c => {
    fs.appendFileSync(logFile, 'Closed: ' + c + '\n');
});
