require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { db } = require('./database.cjs');
const { gatherSystemHealthData, analyzeWithAI, autoRemediate, MASTABA_RULES } = require('./ai_watchman.cjs');

// المتغيرات البيئية المطلوبة
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_IDS = (process.env.ADMIN_CHAT_ID || "").split(',').map(id => id.trim()).filter(id => id !== "");
const XAI_API_KEY = process.env.XAI_API_KEY;

if (!BOT_TOKEN || ADMIN_CHAT_IDS.length === 0) {
    console.error("⚠️ تحذير: يرجى إضافة TELEGRAM_BOT_TOKEN و ADMIN_CHAT_ID في ملف .env ليعمل بوت تليجرام");
}

// تهيئة البوت
const bot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { polling: true }) : null;

if (bot) {
    bot.on('polling_error', (error) => {
        console.warn('[Telegram Bot Polling Warning]:', error?.message || error);
    });
}

// ==========================================
// التفاعل مع تليجرام (ChatOps)
// ==========================================
if (bot) {
    // فلتر الأمان: لا تستجب لأي شخص غير المدير
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id.toString();
        
        if (!ADMIN_CHAT_IDS.includes(chatId)) {
            console.log(`[أمان] محاولة وصول مرفوضة للبوت من المعرف: ${chatId}`);
            return;
        }

        const text = msg.text || '';

        // أوامر الأزرار السريعة
        if (text === '/start') {
            const opts = {
                reply_markup: {
                    keyboard: [
                        [{ text: '🔍 فحص الآن (Health Check)' }],
                        [{ text: '🛠️ الإصلاح الآلي (Auto Remediate)' }]
                    ],
                    resize_keyboard: true
                }
            };
            bot.sendMessage(chatId, `أهلاً بك سيدي المدير 🫡\nأنا "الحارس الليلي". كيف يمكنني مساعدتك اليوم؟`, opts);
            return;
        }

        // زر الفحص الشامل
        if (text.includes('فحص الآن') || text === '/health') {
            bot.sendMessage(chatId, "🕵️‍♂️ جاري إجراء الفحص واستشارة الذكاء الاصطناعي (xAI)...");
            
            try {
                const data = gatherSystemHealthData();
                const aiReport = await analyzeWithAI(MASTABA_RULES, data);
                
                bot.sendMessage(chatId, aiReport, { parse_mode: 'Markdown' });
            } catch (err) {
                bot.sendMessage(chatId, `❌ حدث خطأ أثناء الفحص: ${err.message}`);
            }
            return;
        }
        
        // زر الإصلاح الآلي
        if (text.includes('الإصلاح الآلي') || text === '/fix') {
            bot.sendMessage(chatId, "🔧 جاري استدعاء بروتوكول الإصلاح الآلي...");
            try {
                const data = gatherSystemHealthData();
                let fixCount = 0;
                fixCount += data.stuck_students.length;
                fixCount += data.lost_certificates.length;
                
                if (fixCount === 0) {
                    bot.sendMessage(chatId, "🟢 لم يتم العثور على أي طلاب عالقين أو شهادات ضائعة. النظام نظيف!");
                } else {
                    bot.sendMessage(chatId, `تم العثور على ${fixCount} حالة تحتاج لتدخل. جاري الإصلاح...`);
                    autoRemediate(data);
                    bot.sendMessage(chatId, `✅ تمت عملية التدخل وتصحيح ${fixCount} حالة بنجاح وتم إرسال الإشعارات للطلاب.`);
                }
            } catch (err) {
                bot.sendMessage(chatId, `❌ حدث خطأ أثناء الإصلاح: ${err.message}`);
            }
            return;
        }

        // الذكاء الاصطناعي (المحادثة الحرة - ChatOps عبر xAI)
        if (text && !text.startsWith('/')) {
            if (!XAI_API_KEY) {
                bot.sendMessage(chatId, "⚠️ مفتاح XAI_API_KEY غير موجود في ملف .env.");
                return;
            }

            bot.sendMessage(chatId, "⏳ جاري التفكير...");
            try {
                const data = gatherSystemHealthData();
                const systemPrompt = `
                ${MASTABA_RULES}
                
                حالة النظام الحالية بالأرقام:
                - مساقات بها مشاكل: ${data.missing_exams.length}
                - طلاب عالقين (تقدم 100% بلا اكتمال): ${data.stuck_students.length}
                - شهادات ضائعة: ${data.lost_certificates.length}
                
                تحدث مع المدير باختصار وبطريقة احترافية.
                طلب المدير هو: "${text}"
                `;

                const fetch = (await import('node-fetch')).default;
                const response = await fetch("https://api.x.ai/v1/chat/completions", {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${XAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "grok-beta",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: text }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }

                const result = await response.json();
                const reply = result.choices[0].message.content;
                
                bot.sendMessage(chatId, reply);
            } catch (error) {
                bot.sendMessage(chatId, `❌ خطأ في الاتصال بالذكاء الاصطناعي: ${error.message}`);
            }
        }
    });

    console.log("✅ الوكيل الذكي (Telegram Bot) جاهز بانتظار أوامرك...");
} else {
    console.log("⚠️ البوت لا يعمل. لن يتم تلقي أوامر تليجرام.");
}
