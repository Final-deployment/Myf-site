const db = require('better-sqlite3')('data/db.sqlite');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const targetCourses = [
    'course_madkhal',
    'course_aqeeda',
    'course_fiqh1-waseelit',
    'course_nifas',
    'course_tafseer',
    'course_tazkiyah',
    'course_seerah',
    'course_arba3oon',
    'course_fiqh2-it7af'
];

async function getVideoDuration(url) {
    try {
        if (!url || !url.startsWith('http')) return 0;
        const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${url}"`;
        const { stdout } = await execPromise(cmd);
        const duration = parseFloat(stdout.trim());
        return isNaN(duration) ? 0 : duration;
    } catch (err) {
        console.error('Error probing', url, err.message);
        return 0;
    }
}

function formatEpDuration(sec) {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatCourseDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

async function run() {
    for (const courseId of targetCourses) {
        console.log(`Processing course: ${courseId}`);
        const episodes = db.prepare('SELECT id, title, videoUrl, duration FROM episodes WHERE courseId = ?').all(courseId);
        let courseTotalSec = 0;
        let count = 0;

        for (const ep of episodes) {
            count++;
            let sec = 0;
            if (ep.videoUrl) {
                console.log(`  Probing ${ep.title}...`);
                sec = await getVideoDuration(ep.videoUrl);
                const formatted = formatEpDuration(sec);
                db.prepare('UPDATE episodes SET duration = ? WHERE id = ?').run(formatted, ep.id);
                console.log(`    -> ${formatted} (${Math.round(sec)}s)`);
            }
            courseTotalSec += sec;
        }

        const totalFormatted = formatCourseDuration(courseTotalSec);
        console.log(`Course total: ${totalFormatted} (${count} lessons)`);
        db.prepare('UPDATE courses SET lessons_count = ?, duration = ? WHERE id = ?').run(count, totalFormatted, courseId);
    }
    console.log('All done!');
}

run().catch(console.error);
