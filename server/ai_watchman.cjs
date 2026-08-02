/**
 * 🕵️‍♂️ Al-Mastaba AI Night Watchman (حارس المصطبة الذكي)
 * 
 * هذا السكربت يمثل "عين وعقل" الوكيل الذكي.
 * يقوم بجمع بيانات الموقع المعمارية بالكامل، واكتشاف أي شذوذ (Anomalies)،
 * ثم يجهز التقرير لعرضه على نموذج الذكاء الاصطناعي لاتخاذ القرار.
 */

const { db } = require('./database.cjs');
const path = require('path');
const { createNotification } = require('./routes/notifications_internal.cjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 1. القواعد الصارمة للموقع (System Prompt المحقون في عقل الوكيل)
const MASTABA_RULES = `
أنت "الحارس الليلي" لموقع "المصطبة العلمية" (نظام إدارة تعليم إسلامي).
مهمتك هي مراجعة التقرير اليومي لقاعدة البيانات واكتشاف الأخطاء النائمة التي تمنع الطلاب من التقدم.
قواعد المعمارية الخاصة بالموقع (القواعد الذهبية الثلاث):
1. قاعدة العالقين: إذا وصل تقدم الطالب (progress) لـ 100% في مساق معين ولم يُوسم بأنه مكتمل، فهذا طالب عالق.
2. قاعدة الامتحانات المفقودة: كل مساق يجب أن يكون امتحانه مربوطاً بآخر درس فعلي (afterEpisodeIndex = عدد الدروس الفعلي).
3. قاعدة الشهادات الضائعة: إذا أنهى الطالب المساق واجتاز الامتحان بنجاح (فوق درجة النجاح) ولم تصدر له شهادة، فهذه مشكلة خطيرة.

قم بتحليل البيانات المرفقة (JSON) وصياغة تقرير قصير وعملي باللغة العربية للإدارة.
إذا لم تكن هناك أي مشاكل، قل ببساطة: "🟢 الفحص اليومي سليم 100%. لم يتم رصد أي مشاكل للطلاب أو المساقات."
أما إذا وجدت مشاكل، اذكرها بوضوح (دون تفصيل ممل) واقترح الإجراء المطلوب كالتالي:
"⚠️ تم رصد مشاكل: [المشكلة] - [الحل المقترح]"
`;

// 2. وظيفة التفتيش اليومي (استخراج البيانات الخام للوكيل)
function gatherSystemHealthData() {
    const report = {
        timestamp: new Date().toISOString(),
        missing_exams: [],
        stuck_students: [],
        lost_certificates: []
    };

    // أ- قاعدة الامتحانات المفقودة: فحص المساقات والدروس والامتحانات
    const courses = db.prepare('SELECT id, title FROM courses').all();
    const epCounts = db.prepare('SELECT courseId, count(*) as cnt FROM episodes GROUP BY courseId').all();
    const epCountMap = new Map(epCounts.map(e => [e.courseId, e.cnt]));
    const allQuizzes = db.prepare('SELECT id, courseId, title, afterEpisodeIndex FROM quizzes').all();
    const quizzesByCourse = new Map();
    
    for (const q of allQuizzes) {
        if (!quizzesByCourse.has(q.courseId)) quizzesByCourse.set(q.courseId, []);
        quizzesByCourse.get(q.courseId).push(q);
    }

    for (const course of courses) {
        const episodesCount = epCountMap.get(course.id) || 0;
        const quizzes = quizzesByCourse.get(course.id) || [];
        
        if (episodesCount > 0 && quizzes.length === 0) {
            report.missing_exams.push({ course: course.title, reason: 'لا يوجد امتحان' });
        } else {
            for (const q of quizzes) {
                if (q.afterEpisodeIndex !== episodesCount) {
                    report.missing_exams.push({ 
                        course: course.title, 
                        quiz: q.title, 
                        reason: `afterEpisodeIndex (${q.afterEpisodeIndex}) لا يطابق عدد الدروس (${episodesCount})` 
                    });
                }
            }
        }
    }

    // ب- قاعدة العالقين: نسبة الإنجاز 100% ولم يكتمل
    report.stuck_students = db.prepare(`
        SELECT u.id as user_id, u.name, u.email, c.id as course_id, c.title as course, e.progress 
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.progress >= 100 AND e.completed = 0
    `).all();

    // ج- قاعدة الشهادات الضائعة: نجح ولم يحصل على شهادة
    report.lost_certificates = db.prepare(`
        SELECT u.id as user_id, u.name, u.email, c.id as course_id, c.title as course, qr.percentage
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        JOIN quiz_results qr ON qr.userId = u.id AND qr.quizId IN (SELECT id FROM quizzes WHERE courseId = c.id)
        LEFT JOIN certificates cert ON cert.user_id = u.id AND cert.course_id = c.id
        WHERE e.completed = 1 AND qr.percentage >= 70 AND cert.id IS NULL
    `).all();

    return report;
}

// 3. الدالة التي تتصل بالذكاء الاصطناعي (أو تولد تقريراً محلياً)
async function analyzeWithAI(systemPrompt, healthData) {
    console.log("[الوكيل يفكر الآن]... جاري التحليل...");
    
    let aiResponse = "";
    
    // Check if there are any issues at all
    const hasIssues = healthData.missing_exams.length > 0 || 
                      healthData.stuck_students.length > 0 || 
                      healthData.lost_certificates.length > 0;

    const xaiKey = process.env.XAI_API_KEY;

    if (xaiKey) {
        try {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${xaiKey}`
                },
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "البيانات:\\n" + JSON.stringify(healthData, null, 2) }
                    ],
                    temperature: 0.1
                })
            });
            const data = await response.json();
            aiResponse = data.choices?.[0]?.message?.content || "فشل تحليل النموذج";
        } catch (error) {
            console.error("xAI API Error:", error.message);
            aiResponse = "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي (xAI).";
        }
    } else {
        // Local simulation fallback
        if (!hasIssues) {
            aiResponse = "🟢 الفحص اليومي سليم 100%. جميع المساقات مربوطة باختباراتها، ولا يوجد طلاب عالقين، وجميع الشهادات مُصدرة.";
        } else {
            aiResponse = "⚠️ **تنبيه من الوكيل الذكي:**\n";
            if (healthData.missing_exams.length > 0) aiResponse += `- مساقات بها مشاكل امتحانات: ${healthData.missing_exams.length}\n`;
            if (healthData.stuck_students.length > 0) aiResponse += `- طلاب عالقين (تقدم 100% بدون اكتمال): ${healthData.stuck_students.length}\n`;
            if (healthData.lost_certificates.length > 0) aiResponse += `- شهادات ضائعة لطلاب ناجحين: ${healthData.lost_certificates.length}\n`;
            aiResponse += "يرجى مراجعة قاعدة البيانات فوراً.";
        }
    }

    console.log("--------------------------------------------------");
    console.log("🧠 رد الوكيل:");
    console.log(aiResponse);
    console.log("--------------------------------------------------");

    // إرسال الإشعار للإدارة (أدمن ومشرفين)
    alertManagers(aiResponse, hasIssues);
    return aiResponse;
}

// 4. إرسال الإشعارات داخل النظام للإدارة
function alertManagers(message, hasIssues) {
    if (!hasIssues) return; // Don't spam admins if everything is fine.

    try {
        const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
        for (const admin of admins) {
            createNotification(admin.id, 'info', 'تقرير الوكيل الذكي (Smart Guardian)', message);
        }
        console.log(`[نظام الإشعارات]: تم إرسال التقرير إلى ${admins.length} مديرين.`);
    } catch (e) {
        console.error("Failed to send in-app notification:", e.message);
    }
}

// 5. الإجراء التصحيحي التلقائي (Auto-Remediation)
function autoRemediate(healthData) {
    let fixCount = 0;
    try {
        db.exec("BEGIN TRANSACTION");
        
        // 1. إصلاح العالقين
        for (const st of healthData.stuck_students) {
            db.prepare("UPDATE enrollments SET completed = 1 WHERE user_id = ? AND course_id = ?")
              .run(st.user_id, st.course_id);
              
            createNotification(st.user_id, 'course', 'تم إكمال مسار الدروس!', `لقد أكملت جميع الدروس في مساق "${st.course}". يمكنك الآن الدخول للاختبار.`);
            fixCount++;
        }
        
        // 2. إصدار الشهادات الضائعة
        const insertCert = db.prepare(`
            INSERT INTO certificates (id, user_id, course_id, issue_date) 
            VALUES (?, ?, ?, datetime('now'))
        `);
        for (const cert of healthData.lost_certificates) {
            const certId = 'CERT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            insertCert.run(certId, cert.user_id, cert.course_id);
            
            createNotification(cert.user_id, 'achievement', 'تم إصدار شهادتك!', `تم استخراج شهادة اجتياز مساق "${cert.course}" بنجاح.`);
            fixCount++;
        }
        
        db.exec("COMMIT");
        if (fixCount > 0) {
            console.log(`[الوكيل الذكي]: تم التدخل وتصحيح ${fixCount} حالة آلياً بنجاح.`);
        }
    } catch(e) {
        db.exec("ROLLBACK");
        console.error("[خطأ في التصحيح التلقائي]", e);
    }
}

// دالة التشغيل الرئيسية
async function runWatchman() {
    console.log("🕵️‍♂️ بدء تشغيل الحارس الليلي...");
    const data = gatherSystemHealthData();
    await analyzeWithAI(MASTABA_RULES, data);
    autoRemediate(data);
}

// تصدير الدوال لاستخدامها في ملف Cron Job
module.exports = {
    gatherSystemHealthData,
    analyzeWithAI,
    autoRemediate,
    MASTABA_RULES,
    runWatchman
};

// If run directly from terminal
if (require.main === module) {
    runWatchman();
}
