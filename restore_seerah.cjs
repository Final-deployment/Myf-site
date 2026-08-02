const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

console.log('--- Restoring Seerah Course ---');

try {
    db.transaction(() => {
        // 1. Re-insert the 10th episode
        const insertEp = db.prepare(`
            INSERT INTO episodes(id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
            VALUES('ep_seerah_10', 'course_seerah', 'الدرس 10', null, '', 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Seerah/Seerah 10.mp4', 10, 0)
        `);
        const epResult = insertEp.run();
        console.log(`Restored episode: ${epResult.changes} rows affected`);

        // 2. Revert lessons count
        const updateCourse = db.prepare("UPDATE courses SET lessons_count = 10 WHERE id = 'course_seerah'");
        const courseResult = updateCourse.run();
        console.log(`Reverted course lessons_count to 10: ${courseResult.changes} rows affected`);

        // 3. Revert the quiz afterEpisodeIndex
        const updateQuiz = db.prepare("UPDATE quizzes SET afterEpisodeIndex = 10 WHERE courseId = 'course_seerah'");
        const quizResult = updateQuiz.run();
        console.log(`Reverted quiz afterEpisodeIndex to 10: ${quizResult.changes} rows affected`);
    })();
    console.log('Successfully restored Seerah course!');
} catch (e) {
    console.error('Error restoring Seerah course:', e);
}
