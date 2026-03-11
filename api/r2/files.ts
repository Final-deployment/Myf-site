import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 Client Setup
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID || '615072ed401f3469aa1e91d7bceb2180'}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'mastaba-media';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const prefix = (req.query.prefix as string) || '';

    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: '/'
        });

        const response = await r2Client.send(command);

        // Process folders (CommonPrefixes)
        const folders = (response.CommonPrefixes || []).map(prefix => ({
            name: prefix.Prefix?.replace(/\/$/, '').split('/').pop() || '',
            path: prefix.Prefix || ''
        }));

        // Process files
        const files = (response.Contents || [])
            .filter(item => item.Key && item.Key !== prefix)
            .map(item => {
                const name = item.Key?.split('/').pop() || '';
                const ext = name.split('.').pop()?.toLowerCase() || '';
                const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
                const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);

                return {
                    name,
                    key: item.Key || '',
                    size: item.Size || 0,
                    lastModified: item.LastModified?.toISOString() || '',
                    url: R2_PUBLIC_DOMAIN
                        ? `https://${R2_PUBLIC_DOMAIN}/${item.Key}`
                        : `https://${BUCKET_NAME}.r2.dev/${item.Key}`,
                    type: isVideo ? 'video' : isAudio ? 'audio' : 'file'
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        return res.status(200).json({ files, folders, prefix });

    } catch (e) {
        console.error('R2 List Error:', e);
        return res.status(500).json({
            error: 'Failed to fetch files from R2',
            details: e instanceof Error ? e.message : 'Unknown error'
        });
    }
}
