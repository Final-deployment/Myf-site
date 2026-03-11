const fs = require('fs');
const path = require('path');
const { db } = require('../database.cjs');
const { uploadBufferToR2, listFiles, deleteFile } = require('../r2.cjs');

/**
 * Performs a database backup and optionally uploads it to cloud
 * @returns {Promise<{success: boolean, fileName: string, size: number, publicUrl?: string}>}
 */
async function performBackup(toCloud = false) {
    console.log(`[BackupService] Starting backup (cloud: ${toCloud})...`);

    // 1. Resolve paths
    const backupDir = path.join(__dirname, '../../data/backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `${toCloud ? 'cloud-' : ''}backup-${Date.now()}.sqlite`;
    const backupPath = path.join(backupDir, fileName);

    try {
        // 2. Execute SQLite backup
        await db.backup(backupPath);
        const stats = fs.statSync(backupPath);
        console.log(`[BackupService] SQLite backup created: ${fileName} (${stats.size} bytes)`);

        let publicUrl = null;
        if (toCloud) {
            // 3. Upload to R2 if requested
            console.log(`[BackupService] Uploading to R2...`);
            const buffer = fs.readFileSync(backupPath);
            publicUrl = await uploadBufferToR2(buffer, fileName, 'application/x-sqlite3', 'backups/');
            console.log(`[BackupService] Cloud upload successful: ${publicUrl}`);

            // Delete local temp file after cloud upload to save space
            fs.unlinkSync(backupPath);
        }

        return {
            success: true,
            fileName,
            size: stats.size,
            publicUrl
        };
    } catch (e) {
        console.error('[BackupService] Backup error:', e.message);
        throw e;
    }
}

/**
 * Cleans up old cloud backups based on the retention days setting
 * @param {number} retentionDays 
 */
async function cleanupOldBackups(retentionDays) {
    if (!retentionDays || retentionDays <= 0) return;
    try {
        console.log(`[BackupService] Checking for backups older than ${retentionDays} days...`);
        const { files } = await listFiles('backups/');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        let deletedCount = 0;
        for (const file of files) {
            const fileDate = new Date(file.lastModified);
            if (fileDate < cutoffDate) {
                console.log(`[BackupService] Deleting old backup: ${file.name}`);
                await deleteFile(file.id);
                deletedCount++;
            }
        }
        console.log(`[BackupService] Cleanup complete. Deleted ${deletedCount} old backups.`);
    } catch (e) {
        console.error('[BackupService] Cleanup error:', e.message);
    }
}

/**
 * Runs the daily backup task if enabled
 */
async function startBackupScheduler() {
    console.log('[BackupService] Initializing background scheduler...');

    // Check every hour
    setInterval(async () => {
        const now = new Date();
        // Run at 2:XX AM and 14:XX PM (Twice a day)
        if (now.getHours() === 2 || now.getHours() === 14) {
            try {
                // Check if auto-backup is enabled in DB
                const setting = db.prepare('SELECT value FROM system_settings WHERE key = "auto_backup_enabled"').get();
                if (setting && setting.value === '1') {
                    const cloudSetting = db.prepare('SELECT value FROM system_settings WHERE key = "cloud_backup_enabled"').get();
                    const retentionSetting = db.prepare('SELECT value FROM system_settings WHERE key = "backup_retention_days"').get();

                    const toCloud = cloudSetting && cloudSetting.value === '1';
                    const retentionDays = retentionSetting ? parseInt(retentionSetting.value, 10) : 30;

                    console.log(`[BackupService] Triggering automatic backup (Hour: ${now.getHours()})...`);
                    await performBackup(toCloud);

                    if (toCloud) {
                        await cleanupOldBackups(retentionDays);
                    }
                }
            } catch (e) {
                console.error('[BackupService] Scheduler error:', e.message);
            }
        }
    }, 1000 * 60 * 60); // Every hour
}

module.exports = {
    performBackup,
    startBackupScheduler
};
