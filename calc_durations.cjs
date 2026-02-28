const { exec } = require('child_process');
const db = require('better-sqlite3')('data/db.sqlite');
const fs = require('fs');

function getDurationObj(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // episode string format e.g. "45:30", "1:15:00"
    let epFormat = '';
    if (hours > 0) {
        epFormat += hours + ':';
        epFormat += String(minutes).padStart(2, '0') + ':';
    } else {
        epFormat += minutes + ':';
    }
    epFormat += String(seconds).padStart(2, '0');

    // course strings
    let arStr = '';
    let enStr = '';
    if (hours > 0) {
        arStr += hours + 'س ';
        enStr += hours + 'h ';
    }
    if (minutes > 0 || hours === 0) {
        arStr += minutes + 'د';
        enStr += minutes + 'm';
    }

    return {
        epFormat,
        courseAr: arStr.trim(),
        courseEn: enStr.trim(),
        hours, minutes, seconds, totalSeconds
    };
}

const getDuration = (url) => {
    return new Promise((resolve, reject) => {
        // use ffprobe to get duration in seconds
        // handle spaces in url
        const cleanUrl = url.replace(/ /g, '%20');
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${cleanUrl}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error on ${cleanUrl}:`, error.message);
                resolve(0);
                return;
            }
            const seconds = parseFloat(stdout.trim());
            resolve(isNaN(seconds) ? 0 : seconds);
        });
    });
};

async function main() {
    console.log("Fetching courses and episodes...");
    const courses = db.prepare("SELECT id, title FROM courses").all();

    const fixes = [];
    const episodeUpdates = [];

    // Loop by course
    for (const course of courses) {
        const episodes = db.prepare("SELECT id, videoUrl FROM episodes WHERE courseId = ? ORDER BY orderIndex ASC").all(course.id);

        console.log(`\nProcessing Course: ${course.title} (${episodes.length} episodes)`);
        let courseTotalSeconds = 0;

        // Loop episodes in parallel batch or sequentially. Sequentially is safer, let's do batches of 5
        const batchSize = 5;
        for (let i = 0; i < episodes.length; i += batchSize) {
            const batch = episodes.slice(i, i + batchSize);
            const durations = await Promise.all(batch.map(ep => getDuration(ep.videoUrl)));

            for (let j = 0; j < batch.length; j++) {
                const ep = batch[j];
                const seconds = durations[j];
                courseTotalSeconds += seconds;

                const epObj = getDurationObj(seconds);
                episodeUpdates.push({
                    id: ep.id,
                    duration: epObj.epFormat
                });
                console.log(`  - Episode: ${epObj.epFormat} (${Math.round(seconds)}s)`);
            }
        }

        const courseObj = getDurationObj(courseTotalSeconds);
        console.log(`> Total Course Duration: ${courseObj.courseAr}`);

        fixes.push({
            id: course.id,
            duration: courseObj.courseAr,
            duration_en: courseObj.courseEn
        });
    }

    // Output generating script
    console.log("\n\n--- SERVER FIX SCRIPT ---");

    const scriptParts = [];
    scriptParts.push("const Database = require('better-sqlite3');");
    scriptParts.push("const db = new Database('/app/data/db.sqlite');");
    scriptParts.push("");
    scriptParts.push("const courseFixes = " + JSON.stringify(fixes, null, 2) + ";");
    scriptParts.push("const episodeUpdates = " + JSON.stringify(episodeUpdates, null, 2) + ";");
    scriptParts.push("");
    scriptParts.push("const epStmt = db.prepare('UPDATE episodes SET duration = ? WHERE id = ?');");
    scriptParts.push("for (const ep of episodeUpdates) {");
    scriptParts.push("    if (ep.duration && ep.duration !== '0:00') {");
    scriptParts.push("        epStmt.run(ep.duration, ep.id);");
    scriptParts.push("    }");
    scriptParts.push("}");
    scriptParts.push("console.log('Updated ' + episodeUpdates.length + ' episodes.');");
    scriptParts.push("");
    scriptParts.push("const daysMap = {");
    scriptParts.push("  'course_madkhal': 5,");
    scriptParts.push("  'course_aqeeda': 15,");
    scriptParts.push("  'course_fiqh1-waseelit': 20,");
    scriptParts.push("  'course_nifas': 12,");
    scriptParts.push("  'course_tafseer': 5,");
    scriptParts.push("  'course_tazkiyah': 10,");
    scriptParts.push("  'course_seerah': 15,");
    scriptParts.push("  'course_arba3oon': 25,");
    scriptParts.push("  'course_fiqh2-it7af': 25");
    scriptParts.push("};");
    scriptParts.push("");
    scriptParts.push("const cStmt = db.prepare('UPDATE courses SET duration = ?, duration_en = ?, days_available = ?, lessons_count = ? WHERE id = ?');");
    scriptParts.push("for (const f of courseFixes) {");
    scriptParts.push("    const eps = db.prepare('SELECT COUNT(*) as cnt FROM episodes WHERE courseId = ?').get(f.id);");
    scriptParts.push("    const count = eps ? eps.cnt : 0;");
    scriptParts.push("    const days = daysMap[f.id] || 30;");
    scriptParts.push("    cStmt.run(f.duration, f.duration_en, days, count, f.id);");
    scriptParts.push("    console.log('Fixed ' + f.id + ' -> lessons: ' + count + ' | duration: ' + f.duration + ' | days: ' + days);");
    scriptParts.push("}");
    scriptParts.push("console.log('Done modifying the database!');");

    fs.writeFileSync('server_duration_fix.cjs', scriptParts.join('\\n'));
    console.log('Saved to server_duration_fix.cjs');
}

main().catch(console.error);
