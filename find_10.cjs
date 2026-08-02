const { s3Client } = require('./server/r2.cjs');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
async function run() {
    try {
        const data = await s3Client.send(new ListObjectsV2Command({ Bucket: 'myf-videos' }));
        const files = data.Contents ? data.Contents.map(o => o.Key) : [];
        const seerahFiles = files.filter(f => f.toLowerCase().includes('seerah'));
        console.log('Seerah files:', seerahFiles);
        const tenFiles = files.filter(f => f.includes('10'));
        console.log('Files with 10:', tenFiles);
    } catch(e) {
        console.error(e);
    }
}
run();
