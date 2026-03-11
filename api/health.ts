import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({
        status: 'ok',
        message: 'API system is operational',
        timestamp: new Date().toISOString()
    });
}
