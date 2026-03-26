const { db } = require('./server/database.cjs');

console.log('--- Updating Madkhal Episdoes ---');

const episodes = db.prepare('SELECT id, title, videoUrl, orderIndex FROM episodes WHERE courseId = ? ORDER BY orderIndex').all('course_madkhal');
console.log('Found episodes:', episodes);

const newUrls = [
    "https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/%D9%85%D9%82%D8%AF%D9%85%D8%A9%20%D9%84%D8%B7%D8%A7%D9%84%D8%A8%20%D8%A7%D9%84%D8%B9%D9%84%D9%85/1.mp4",
    "https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/%D9%85%D9%82%D8%AF%D9%85%D8%A9%20%D9%84%D8%B7%D8%A7%D9%84%D8%A8%20%D8%A7%D9%84%D8%B9%D9%84%D9%85/2.mp4",
    "https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/%D9%85%D9%82%D8%AF%D9%85%D8%A9%20%D9%84%D8%B7%D8%A7%D9%84%D8%A8%20%D8%A7%D9%84%D8%B9%D9%84%D9%85/3.mp4"
];

const updateStmt = db.prepare('UPDATE episodes SET videoUrl = ? WHERE id = ?');

let count = 0;
for (let i = 0; i < episodes.length && i < newUrls.length; i++) {
    const ep = episodes[i];
    updateStmt.run(newUrls[i], ep.id);
    console.log(`Updated episode ${ep.orderIndex} "${ep.title}" to ${newUrls[i]}`);
    count++;
}

console.log('Done updating ' + count + ' episodes.');
process.exit(0);
