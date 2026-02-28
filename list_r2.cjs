const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

async function listAll() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
        });

        const response = await client.send(command);
        console.log('--- R2 BUCKET CONTENTS ---');
        if (response.Contents) {
            response.Contents.forEach(item => {
                console.log(item.Key);
            });
            fs.writeFileSync('r2_contents.txt', response.Contents.map(i => i.Key).join('\n'));
        } else {
            console.log('Bucket is empty.');
        }
    } catch (err) {
        console.error('Error listing R2:', err);
    }
}

listAll();
