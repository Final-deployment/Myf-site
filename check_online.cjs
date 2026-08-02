const https = require('https');

https.get('https://muslimyouth.ps/api/quizzes', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const quizzes = JSON.parse(data);
            const seerahExam = quizzes.find(q => q.courseId === 'course_seerah');
            
            console.log("--- حالة امتحان السيرة في الموقع المباشر (Online) ---");
            if (!seerahExam) {
                console.log("❌ الامتحان مفقود تماماً من قاعدة البيانات في السيرفر المباشر!");
                console.log("💡 الحل: ادخل للوحة إدارة الموقع الأونلاين > إدارة الاختبارات > وقم بإنشائه من جديد.");
            } else {
                console.log("✅ الامتحان موجود!");
                console.log("- العنوان:", seerahExam.title);
                console.log("- يظهر بعد الدرس رقم:", seerahExam.afterEpisodeIndex);
                console.log("- عدد الأسئلة:", seerahExam.questions ? seerahExam.questions.length : 0);
                
                if (seerahExam.afterEpisodeIndex !== 10) {
                    console.log(`\n⚠️ هناك خطأ! مبرمج ليظهر بعد الدرس رقم ${seerahExam.afterEpisodeIndex} وليس 10.`);
                    console.log("💡 الحل: ادخل للوحة الإدارة الأونلاين > إدارة الاختبارات > عدله ليصبح 10.");
                } else {
                    console.log("\n✅ إعدادات الامتحان سليمة 100%. إذا لم يظهر، تأكد من تحديث صفحة المتصفح (Ctrl + F5).");
                }
            }
        } catch (e) {
            console.error("حدث خطأ أثناء الاتصال بالسيرفر:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("خطأ في الاتصال:", e.message);
});
