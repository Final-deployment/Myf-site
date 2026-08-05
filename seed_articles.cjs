const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const articlesFilePath = path.join(__dirname, 'articles.txt');

const db = new Database(dbPath);

console.log('Starting to seed articles...');

const rawText = fs.readFileSync(articlesFilePath, 'utf-8');
const lines = rawText.split('\n');

let articles = [];
let currentArticle = null;
let expectingTitle = true;

for (let line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (expectingTitle && /^[\u0660-\u06690-9]+\.\s*(.*)/.test(trimmedLine)) {
        const titleMatch = trimmedLine.match(/^[\u0660-\u06690-9]+\.\s*(.*)/);
        currentArticle = {
            title: titleMatch[1].trim(),
            content: []
        };
        articles.push(currentArticle);
        expectingTitle = false;
    } else if (trimmedLine.includes('-ملتقى الشباب المسلم')) {
        expectingTitle = true;
    } else if (currentArticle) {
        currentArticle.content.push(trimmedLine);
    } else if (trimmedLine === 'مقالات – ملتقى الشباب المسلم') {
        // Skip header
    }
}

const facebookDates = [
  '2026-04-25T12:00:00.000Z',
  '2026-04-23T12:00:00.000Z',
  '2026-04-20T12:00:00.000Z',
  '2026-04-17T12:00:00.000Z',
  '2026-04-12T12:00:00.000Z',
  '2026-04-05T12:00:00.000Z',
  '2026-03-27T12:00:00.000Z',
  '2026-03-20T12:00:00.000Z',
  '2026-03-14T12:00:00.000Z',
  '2026-03-08T12:00:00.000Z',
  '2026-03-01T12:00:00.000Z',
  '2026-02-22T12:00:00.000Z',
  '2026-02-15T12:00:00.000Z',
  '2026-02-08T12:00:00.000Z'
];

// Map them to final objects
articles = articles.filter(a => a.title && a.content.length > 0).map((a, index) => {
    return {
        id: 'article_' + crypto.randomBytes(8).toString('hex'),
        title: a.title,
        content: a.content.join('\n\n'),
        created_at: facebookDates[index] || new Date().toISOString(),
        author_id: 'admin_mohammad'
    };
});

console.log(`Found ${articles.length} articles to seed.`);

const insert = db.prepare(`
    INSERT INTO articles (id, title, content, image, author_id, created_at)
    VALUES (@id, @title, @content, @image, @author_id, @created_at)
`);

let inserted = 0;
// Clear existing articles to prevent duplicates on rerun
db.exec('DELETE FROM articles');

db.transaction(() => {
    for (const article of articles) {
        insert.run({
            id: article.id,
            title: article.title,
            content: article.content,
            image: null,
            author_id: article.author_id,
            created_at: article.created_at
        });
        inserted++;
    }
})();

console.log(`Successfully seeded ${inserted} articles.`);
