const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/db.sqlite');
const db = new Database(dbPath);

console.log('--- بدء عملية التحقق والتسجيل التلقائي الرجعي للطلاب ---');

// 1. Get all active users
const users = db.prepare("SELECT id, name FROM users WHERE status = 'active'").all();
console.log(`تم العثور على ${users.length} مستخدم نشط في النظام.`);

function isCoursePassed(userId, courseId) {
    const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE courseId = ?').get(courseId).c;
    if (quizCount > 0) {
        const passedCount = db.prepare(`
            SELECT COUNT(DISTINCT q.id) as c FROM quiz_results qr
            JOIN quizzes q ON qr.quizId = q.id
            WHERE qr.userId = ? AND q.courseId = ? AND qr.percentage >= (q.passing_score OR 70)
        `).get(userId, courseId).c;
        return passedCount >= quizCount;
    }
    const completed = db.prepare(
        'SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? AND (progress >= 100 OR completed = 1)'
    ).get(userId, courseId);
    return !!completed;
}

let enrolledCount = 0;

for (const user of users) {
    // Get all enrollments for this user
    const enrollments = db.prepare('SELECT course_id FROM enrollments WHERE user_id = ?').all(user.id);
    
    for (const enrollment of enrollments) {
        const courseId = enrollment.course_id;
        
        // Check if they passed this course
        if (isCoursePassed(user.id, courseId)) {
            // Find next course in the same folder
            const currentCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
            if (currentCourse && currentCourse.folder_id) {
                const folderCourses = db.prepare(
                    'SELECT * FROM courses WHERE LOWER(TRIM(folder_id)) = ? ORDER BY order_index ASC, id ASC'
                ).all(String(currentCourse.folder_id).toLowerCase().trim());

                const currentIdx = folderCourses.findIndex(c => String(c.id) === String(courseId));
                if (currentIdx !== -1 && currentIdx < folderCourses.length - 1) {
                    const nextCourse = folderCourses[currentIdx + 1];
                    const existingEnrollment = db.prepare(
                        'SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?'
                    ).get(user.id, nextCourse.id);

                    if (!existingEnrollment) {
                        const daysAvailable = nextCourse.days_available || 30;
                        const deadline = new Date();
                        deadline.setDate(deadline.getDate() + daysAvailable);

                        try {
                            db.prepare(`
                                INSERT INTO enrollments (user_id, course_id, enrolled_at, progress, completed, deadline, is_locked)
                                VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0, ?, 0)
                            `).run(user.id, nextCourse.id, deadline.toISOString());

                            db.prepare('UPDATE courses SET students_count = students_count + 1 WHERE id = ?').run(nextCourse.id);
                            
                            console.log(`✅ [نجاح] تم تسجيل الطالب "${user.name}" في المساق التالي: "${nextCourse.title}"`);
                            enrolledCount++;
                        } catch (e) {
                            console.error(`❌ [خطأ] محاولة تسجيل الطالب ${user.name}:`, e.message);
                        }
                    }
                }
            }
        }
    }
}

console.log(`\n--- انتهت العملية! تم إتمام عملية التسجيل التلقائي لعدد ${enrolledCount} طالب من القدامى بنجاح. ---`);
