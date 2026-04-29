const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'db.sqlite'));

try {
    // 1. Find User
    const user = db.prepare('SELECT id, name, email FROM users WHERE name LIKE ?').get('%صابرين%سركجي%');
    if (!user) {
        console.log('User not found.');
        process.exit(0);
    }
    console.log('--- USER ---');
    console.log(user);

    // 2. Find Course
    const course = db.prepare('SELECT id, title, lessonsCount FROM courses WHERE title LIKE ?').get('%صفات المؤمنين المهتدين%');
    if (!course) {
        console.log('Course not found.');
        process.exit(0);
    }
    console.log('\n--- COURSE ---');
    console.log(course);

    // 3. Find Enrollment
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(user.id, course.id);
    console.log('\n--- ENROLLMENT ---');
    console.log(enrollment || 'Not enrolled');

    // 4. Find Episode Progress
    const episodes = db.prepare('SELECT id, title, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all(course.id);
    console.log('\n--- EPISODES & PROGRESS ---');
    for (const ep of episodes) {
        const progress = db.prepare('SELECT * FROM episode_progress WHERE user_id = ? AND episode_id = ?').get(user.id, ep.id);
        console.log(`[Episode ${ep.orderIndex}] ${ep.title} -> Completed: ${progress ? progress.completed : 'No Record'} (Watched: ${progress ? progress.watched_duration : 0}s)`);
    }

    // 5. Find Quizzes for this course
    const quizzes = db.prepare('SELECT id, title, afterEpisodeIndex FROM quizzes WHERE courseId = ?').all(course.id);
    console.log('\n--- QUIZZES ---');
    console.log(quizzes);

} catch (err) {
    console.error(err);
}
