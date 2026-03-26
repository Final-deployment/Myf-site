require('dotenv').config();
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, CopyObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Cloudflare R2 Credentials
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'myf-videos';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || ''; // If they have a custom domain

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Generates a pre-signed URL for direct frontend upload
 * @param {string} fileName 
 * @param {string} fileType 
 * @returns {Promise<{uploadUrl: string, key: string, publicUrl: string}>}
 */
async function generateUploadUrl(fileName, fileType, folderPath = 'uploads/') {
    // Ensure folderPath ends with / and doesn't start with /
    let prefix = folderPath.replace(/^\/+/, '');
    if (prefix && !prefix.endsWith('/')) prefix += '/';
    if (!prefix) prefix = 'uploads/';

    const key = `${prefix}${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    // URL valid for 1 hour
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Cloudflare R2 Public URL (assuming bucket is public or behind worker)
    const publicUrl = R2_PUBLIC_DOMAIN
        ? `${R2_PUBLIC_DOMAIN}/${key}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return { uploadUrl, key, publicUrl };
}

/**
 * Generates a pre-signed URL for downloading/viewing a file
 * @param {string} key 
 * @returns {Promise<string>}
 */
async function generateDownloadUrl(key) {
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
    });
    // Valid for 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Uploads a buffer directly to R2 from the server
 * @param {Buffer} buffer 
 * @param {string} fileName 
 * @param {string} fileType 
 * @returns {Promise<string>} publicUrl
 */
async function uploadBufferToR2(buffer, fileName, fileType, folderPath = 'uploads/') {
    // Ensure folderPath ends with / and doesn't start with /
    let prefix = folderPath.replace(/^\/+/, '');
    if (prefix && !prefix.endsWith('/')) prefix += '/';
    if (!prefix) prefix = 'uploads/';

    const key = `${prefix}${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: fileType
    });

    await s3Client.send(command);

    return R2_PUBLIC_DOMAIN
        ? `${R2_PUBLIC_DOMAIN}/${key}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Lists files and folders in the bucket structure
 * @param {string} prefix 
 * @returns {Promise<{files: Array, folders: Array, prefix: string}>}
 */
async function listFiles(prefix = '') {
    const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        Delimiter: '/' // Important to group by folders
    });

    const response = await s3Client.send(command);

    // Process Files
    const files = (response.Contents || []).map(item => ({
        id: item.Key,
        name: item.Key.replace(prefix, ''), // Relative name
        fullName: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: R2_PUBLIC_DOMAIN
            ? `${R2_PUBLIC_DOMAIN}/${item.Key}`
            : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${item.Key}`
    })).filter(f => f.name !== ''); // Remove "current folder" entry if it appears

    // Process Folders
    const folders = (response.CommonPrefixes || []).map(item => ({
        name: item.Prefix,
        path: item.Prefix
    }));

    return {
        files,
        folders,
        prefix
    };
}

/**
 * Deletes an object from R2
 * @param {string} key 
 */
async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
    });
    return await s3Client.send(command);
}

/**
 * Renames (moves) an object in R2
 * @param {string} oldKey 
 * @param {string} newKey 
 */
async function renameFile(oldKey, newKey) {
    const { CopyObjectCommand } = require('@aws-sdk/client-s3');
    const copyCommand = new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${oldKey}`,
        Key: newKey
    });
    await s3Client.send(copyCommand);

    const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: oldKey
    });
    return await s3Client.send(deleteCommand);
}

/**
 * Creates a "folder" in R2 (empty object ending in /)
 * @param {string} folderPath 
 */
async function createFolder(folderPath) {
    const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: ''
    });
    return await s3Client.send(command);
}

/**
 * Automates backing up the SQLite database to R2 and cleaning up old backups.
 */
async function backupDatabaseToR2(dbPath) {
    const fs = require('fs');
    try {
        if (!fs.existsSync(dbPath)) {
            console.error('[Backup] Database file not found at', dbPath);
            return;
        }

        const buffer = fs.readFileSync(dbPath);
        // e.g. database-backup-2023-10-27T12-30-00.sqlite
        const fileName = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
        
        console.log(`[Backup] Starting backup for ${fileName}...`);
        
        // Upload to a specific 'backups' folder in R2
        await uploadBufferToR2(buffer, fileName, 'application/vnd.sqlite3', 'backups/');
        console.log(`[Backup] Successfully uploaded ${fileName} to R2.`);

        // --- Cleanup old backups (older than 60 days) ---
        console.log('[Backup] Checking for old backups to clean up...');
        const { files } = await listFiles('backups/');
        
        const now = new Date();
        const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        for (const file of files) {
            if (!file.lastModified) continue;
            const lastModified = new Date(file.lastModified);
            if (now - lastModified > sixtyDaysMs) {
                console.log(`[Backup] Deleting old backup: ${file.name}`);
                await deleteFile(file.fullName);
                deletedCount++;
            }
        }
        
        console.log(`[Backup] Cleanup complete. Deleted ${deletedCount} old backups.`);
    } catch (e) {
        console.error('[Backup] Failed to backup database:', e);
    }
}

module.exports = { s3Client, generateUploadUrl, generateDownloadUrl, uploadBufferToR2, listFiles, deleteFile, renameFile, createFolder, backupDatabaseToR2, R2_BUCKET_NAME };
