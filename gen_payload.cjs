const db = require('better-sqlite3')('data/db.sqlite');
const quiz = db.prepare("SELECT * FROM quizzes WHERE courseId='course_seerah'").get();
const p = {
    id: quiz.id,
    title: quiz.title,
    titleEn: quiz.title_en,
    courseId: quiz.courseId,
    questions: JSON.parse(quiz.questions),
    passingScore: quiz.passing_score,
    afterEpisodeIndex: quiz.afterEpisodeIndex
};
require('fs').writeFileSync('payload.json', JSON.stringify(p));
console.log("Done.");
