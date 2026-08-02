const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'db.sqlite');

if (!fs.existsSync(dbPath)) {
    console.error('Database not found!');
    process.exit(1);
}

const db = new Database(dbPath);

console.log('Seeding data from articles.txt...');

const articlesContent = fs.readFileSync(path.join(__dirname, 'articles.txt'), 'utf8');
const lines = articlesContent.split('\n');

const articles = [];
let currentArticle = null;

// Simple parse based on '١. ', '٢. ', etc.
// We will only use top-level ones (1 to 16)
const topLevelRegex = /^([١٢٣٤٥٦٧٨٩٠\d]+)\.\s*(.*)/;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
        if (currentArticle) currentArticle.content += '\n\n';
        continue;
    }

    const match = line.match(topLevelRegex);
    // If it's a top level heading like "١. Title" but not inside the text like "1. تفكيك"
    // Wait, the subheadings have english digits like "1." or arabic like "١."
    // Let's assume the main ones are strictly at the beginning and the list is small.
    if (match && !line.startsWith('1.') && !line.startsWith('2.') && !line.startsWith('3.') && !line.startsWith('4.') && !line.startsWith('5.')) {
        // It's a new article
        if (currentArticle) {
            articles.push(currentArticle);
        }
        currentArticle = {
            id: `art_auto_${Date.now()}_${articles.length}`,
            title: match[2],
            content: '',
            image: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&h=300&fit=crop'
        };
    } else {
        if (currentArticle) {
            currentArticle.content += line + '\n';
        }
    }
}

if (currentArticle) {
    articles.push(currentArticle);
}

console.log(`Parsed ${articles.length} articles.`);

const insertArt = db.prepare('INSERT OR REPLACE INTO articles (id, title, content, image) VALUES (?, ?, ?, ?)');

const deleteOld = db.prepare(`DELETE FROM articles WHERE id LIKE 'art_auto_%' OR id = 'art_default1' OR id = 'art_1785626143213_2'`);
deleteOld.run();

let count = 0;
for (const art of articles) {
    if (art.title && art.content.trim()) {
        insertArt.run(art.id, art.title, art.content.trim(), art.image);
        count++;
    }
}

console.log(`Inserted ${count} articles.`);

// Also seed a default initiative so the UI doesn't break
const initCount = db.prepare('SELECT COUNT(*) as count FROM initiatives').get();
if (initCount.count === 0) {
    const insertInit = db.prepare('INSERT INTO initiatives (id, title, description, image) VALUES (?, ?, ?, ?)');
    insertInit.run('init_futuwwa', 'برنامج الفتوة', 'برنامج إعداد قيادي شبابي يهدف إلى بناء الشخصية الإسلامية المتكاملة من خلال التربية الإيمانية، والوعي الفكري، والمهارات الحياتية. يتضمن البرنامج لقاءات أسبوعية، معسكرات، ومبادرات عملية تسهم في خدمة المجتمع وتنمية روح المسؤولية.', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&h=300&fit=crop');
    console.log('Seeded default initiative.');
} else {
    // Overwrite the specific initiative requested
    const updateInit = db.prepare('UPDATE initiatives SET description = ? WHERE id = ?');
    updateInit.run('برنامج إعداد قيادي شبابي يهدف إلى بناء الشخصية الإسلامية المتكاملة من خلال التربية الإيمانية، والوعي الفكري، والمهارات الحياتية. يتضمن البرنامج لقاءات أسبوعية، معسكرات، ومبادرات عملية تسهم في خدمة المجتمع وتنمية روح المسؤولية.', 'init_futuwwa');
    console.log('Updated default initiative.');
}

console.log('Seeding complete.');
