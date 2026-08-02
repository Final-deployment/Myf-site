const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath);

console.log('--- Fixing Seerah Course ---');

try {
    db.transaction(() => {
        // 1. Delete the 10th episode
        const deleteEp = db.prepare("DELETE FROM episodes WHERE id = 'ep_seerah_10'");
        const epResult = deleteEp.run();
        console.log(`Deleted episode: ${epResult.changes} rows affected`);

        // 2. Update lessons count
        const updateCourse = db.prepare("UPDATE courses SET lessons_count = 9 WHERE id = 'course_seerah'");
        const courseResult = updateCourse.run();
        console.log(`Updated course lessons_count to 9: ${courseResult.changes} rows affected`);

        // 3. Update the quiz afterEpisodeIndex
        const updateQuiz = db.prepare("UPDATE quizzes SET afterEpisodeIndex = 9 WHERE courseId = 'course_seerah'");
        const quizResult = updateQuiz.run();
        console.log(`Updated quiz afterEpisodeIndex to 9: ${quizResult.changes} rows affected`);
    })();
    console.log('Successfully fixed Seerah course!');
} catch (e) {
    console.error('Error fixing Seerah course:', e);
}
