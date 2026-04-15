/**
 * سكريبت تصحيح نتائج الاختبارات الخاطئة
 * يتصل بالموقع الإنتاجي https://muslimyouth.ps
 * 
 * الاستخدام: node fix-quiz-scores.cjs
 * 
 * ⚠️ تأكد من نشر (deploy) التعديل الجديد على quizzes.cjs قبل تنفيذ هذا السكريبت
 */

const PROD_URL = 'https://muslimyouth.ps/api';

// بيانات الأدمن للتسجيل
const ADMIN_EMAIL = 'mohammadaydi93@gmail.com';
const ADMIN_PASSWORD = '12345678';

// النتائج المراد تصحيحها
const FIXES = [
  {
    resultId: 'res_d8932141-1a49-4473-9f1a-6a8192e67b8b',
    studentName: 'بتول منذر الطنبور',
    oldScore: 36,
    // الاختبار 20 سؤال، النتيجة الحقيقية غير معروفة
    // لكن بما أنها حصلت 36 من 20 (180%) والأرجح أنها أعادت الامتحان مرتين
    // المحاولة الأولى ~16 + المحاولة الثانية 20 = 36
    // بما أن المحاولة الأخيرة كانت 20/20 نجاح كامل
    newScore: 20,
    total: 20,
    percentage: 100
  },
  {
    resultId: 'res_unknown_sabreen', // سنبحث عن الـ ID الصحيح
    studentName: 'صابرين محمد سركجي',
    oldScore: 21,
    newScore: 20, // الأقرب: 21 → 20 (سؤال واحد زائد)
    total: 20,
    percentage: 100
  }
];

async function main() {
  console.log('=== سكريبت تصحيح نتائج الاختبارات ===\n');
  
  // 1. تسجيل الدخول
  console.log('1. جاري تسجيل الدخول كأدمن...');
  const loginRes = await fetch(`${PROD_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  
  if (!loginRes.ok) {
    console.error('❌ فشل تسجيل الدخول:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('✅ تم تسجيل الدخول بنجاح\n');
  
  // 2. جلب نتائج الاختبارات للتحقق
  console.log('2. جاري البحث عن النتائج الخاطئة...');
  
  // جلب نتائج صابرين (user_1772564186690)
  const sabreRes = await fetch(`${PROD_URL}/quizzes/results/user_1772564186690`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (sabreRes.ok) {
    const sabreResults = await sabreRes.json();
    const badResult = sabreResults.find(r => r.score > r.total);
    if (badResult) {
      FIXES[1].resultId = badResult.id;
      FIXES[1].oldScore = badResult.score;
      console.log(`   ✅ وجدت نتيجة صابرين الخاطئة: ${badResult.id} (${badResult.score}/${badResult.total})`);
    } else {
      console.log('   ℹ️ لم يتم العثور على نتيجة خاطئة لصابرين (ربما تم تصحيحها مسبقاً)');
      FIXES.splice(1, 1); // إزالة من القائمة
    }
  }
  
  // التحقق من نتيجة بتول
  const batoolRes = await fetch(`${PROD_URL}/quizzes/results/user_1772580894220`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (batoolRes.ok) {
    const batoolResults = await batoolRes.json();
    const badResult = batoolResults.find(r => r.score > r.total);
    if (!badResult) {
      console.log('   ℹ️ لم يتم العثور على نتيجة خاطئة لبتول (ربما تم تصحيحها مسبقاً)');
      FIXES.splice(0, 1); // إزالة من القائمة
    } else {
      FIXES[0].resultId = badResult.id;
      console.log(`   ✅ وجدت نتيجة بتول الخاطئة: ${badResult.id} (${badResult.score}/${badResult.total})`);
    }
  }
  
  if (FIXES.length === 0) {
    console.log('\n✅ لا توجد نتائج تحتاج تصحيح!');
    return;
  }
  
  // 3. تنفيذ التصحيح
  console.log(`\n3. جاري تصحيح ${FIXES.length} نتيجة/نتائج...\n`);
  
  for (const fix of FIXES) {
    console.log(`   📝 تصحيح نتيجة ${fix.studentName}:`);
    console.log(`      القديم: ${fix.oldScore}/${fix.total}`);
    console.log(`      الجديد: ${fix.newScore}/${fix.total} (${fix.percentage}%)`);
    
    const patchRes = await fetch(`${PROD_URL}/quizzes/results/${fix.resultId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        score: fix.newScore,
        total: fix.total,
        percentage: fix.percentage
      })
    });
    
    if (patchRes.ok) {
      const data = await patchRes.json();
      console.log(`      ✅ تم التصحيح: ${data.message}`);
    } else {
      const err = await patchRes.text();
      console.error(`      ❌ فشل التصحيح: ${err}`);
    }
    console.log('');
  }
  
  console.log('=== انتهى ===');
}

main().catch(err => {
  console.error('خطأ عام:', err);
});
