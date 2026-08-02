const fetch = require('node-fetch');

/**
 * دالة مركزية لإرسال إشعارات التليجرام لأرقام الإدارة (Audit Trail)
 * تستخدم واجهة تليجرام الرسمية لإرسال رسائل التنبيه والتدقيق.
 */
async function sendTelegramAlert(message) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatIdsStr = process.env.ADMIN_CHAT_ID || "";
    
    // تقسيم الـ IDs إذا كان هناك أكثر من مدير
    const adminChatIds = adminChatIdsStr.split(',').map(id => id.trim()).filter(id => id !== "");

    if (!botToken || adminChatIds.length === 0) {
        console.warn("[Telegram Alert] لم يتم إرسال الإشعار لأن TELEGRAM_BOT_TOKEN أو ADMIN_CHAT_ID غير متوفرين.");
        return false;
    }

    let successCount = 0;
    
    for (const chatId of adminChatIds) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            if (response.ok) {
                successCount++;
            } else {
                console.error(`[Telegram Alert] فشل الإرسال للمعرف ${chatId}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`[Telegram Alert] خطأ أثناء الإرسال: ${error.message}`);
        }
    }

    return successCount > 0;
}

module.exports = { sendTelegramAlert };
