const db = require('better-sqlite3')('data/db.sqlite');
const courses = db.prepare('SELECT * FROM courses WHERE id = ?').all('course_seerah');
const episodesByCourse = new Map();
const allEpisodes = db.prepare('SELECT * FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC').all('course_seerah');
allEpisodes.forEach(ep => {
    if (!episodesByCourse.has(ep.courseId)) episodesByCourse.set(ep.courseId, []);
    episodesByCourse.get(ep.courseId).push(ep);
});
const result = courses.map(c => {
    const episodes = episodesByCourse.get(String(c.id)) || [];
    return {
        id: String(c.id),
        lessonsCount: c.lessons_count,
        episodesLength: episodes.length
    };
});
console.log(result);
