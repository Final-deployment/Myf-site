const db = require('better-sqlite3')('data/db.sqlite');

const courseId = 'course_seerah';
const episodes = db.prepare(`SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC`).all(courseId);
const quizzes = db.prepare(`SELECT * FROM quizzes WHERE courseId = ?`).all(courseId);

const items = [];

quizzes.filter(q => q.afterEpisodeIndex === 0).forEach(q => {
  items.push({ type: 'quiz', data: q.title });
});

episodes.forEach((ep, idx) => {
  items.push({ type: 'episode', data: ep.title, index: idx });
  
  quizzes.filter(q => q.afterEpisodeIndex === idx + 1).forEach(q => {
    items.push({ type: 'quiz', data: q.title, afterIdx: idx + 1 });
  });
});

console.log('Curriculum Items in order:');
items.forEach(i => {
    console.log(`- [${i.type.toUpperCase()}] ${i.data} ${i.type === 'quiz' ? '(After ep ' + i.afterIdx + ')' : ''}`);
});
