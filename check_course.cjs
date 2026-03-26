const Database = require('better-sqlite3');
const db = new Database('data/db.sqlite');

console.log('=== COURSE INFO ===');
const course = db.prepare("SELECT id, title, lessons_count FROM courses WHERE id = 'course_madkhal'").get();
console.log(course);

console.log('\n=== EPISODES ===');
const episodes = db.prepare("SELECT id, title, orderIndex FROM episodes WHERE courseId = 'course_madkhal' ORDER BY orderIndex").all();
console.log(episodes);
console.log('Total episodes:', episodes.length);

console.log('\n=== QUIZZES ===');
const quizzes = db.prepare("SELECT id, title, courseId, afterEpisodeIndex FROM quizzes WHERE courseId = 'course_madkhal'").all();
console.log(quizzes);
console.log('Total quizzes:', quizzes.length);

console.log('\n=== PROGRESS CALCULATION ===');
// Check how progress is tracked
const progressSample = db.prepare("SELECT user_id, episode_id, course_id, completed FROM episode_progress WHERE course_id = 'course_madkhal' LIMIT 10").all();
console.log('Sample progress entries:', progressSample);

db.close();
