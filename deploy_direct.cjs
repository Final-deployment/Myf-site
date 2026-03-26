const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const SSH_PASS = '@Qqaazz2222##';
const SSH_USER = 'root';
const SSH_HOST = '72.61.88.213';
const ZIP_FILE = 'deploy_production_latest.zip';
const REMOTE_DIR = '/var/www/apps/scientific-bench';

async function main() {
    try {
        console.log(`Connecting to ${SSH_USER}@${SSH_HOST}...`);
        await ssh.connect({
            host: SSH_HOST,
            username: SSH_USER,
            password: SSH_PASS
        });
        console.log("Connected successfully!");

        console.log(`Uploading ${ZIP_FILE} to /tmp/...`);
        console.log("Please wait, this will take a few minutes...");
        await ssh.putFile(
            path.join(__dirname, ZIP_FILE),
            `/tmp/${ZIP_FILE}`
        );
        console.log("Uploaded zip file.");

        console.log("Uploading deploy.sh to /tmp/...");
        await ssh.putFile(
            path.join(__dirname, 'deploy.sh'),
            `/tmp/deploy.sh`
        );
        console.log("Uploaded deploy.sh.");

        const deployCmd = [
            `sudo mv /tmp/${ZIP_FILE} ${REMOTE_DIR}/`,
            `sudo mv /tmp/deploy.sh ${REMOTE_DIR}/`,
            `cd ${REMOTE_DIR}`,
            `sudo chmod +x deploy.sh`,
            'sudo bash deploy.sh'
        ].join(' && ');

        console.log("Running deployment script on server (this will show docker logs)...");
        const result = await ssh.execCommand(deployCmd, {
            cwd: REMOTE_DIR,
            onStdout: (chunk) => process.stdout.write(chunk.toString('utf8')),
            onStderr: (chunk) => process.stderr.write(chunk.toString('utf8'))
        });

        console.log("Deployment finished with code:", result.code);
    } catch (err) {
        console.error("Deployment failed!", err);
    } finally {
        ssh.dispose();
    }
}

main();
