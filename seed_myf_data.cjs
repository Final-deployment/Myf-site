const { db } = require('./server/database.cjs');
const fs = require('fs');

console.log('Seeding MYF data...');

// --- Seed Initiatives ---
const initiatives = [
    {
        id: 'init_futuwwa',
        title: 'أكاديمية فتوة/فلسطين',
        description: 'تهدف إلى ترسيخ القيم والأخلاق الإسلامية الأساسية وتطوير المهارات الحياتية للشباب عبر مسارات العلم والأدب والخدمة.',
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&h=300&fit=crop'
    },
    {
        id: 'init_nabd_hayat',
        title: 'مبادرة نبض الحياة',
        description: 'مبادرة تدريبية رائدة لتزويد الشباب والمتطوعين بمهارات الإسعافات الأولية والاستجابة الطارئة لإنقاذ الأرواح.',
        image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=500&h=300&fit=crop'
    },
    {
        id: 'init_nabd_aman',
        title: 'مبادرة نبض الأمان',
        description: 'تركز على تعزيز السلامة العامة من خلال تدريب الشباب على التعامل مع حالات الطوارئ والإطفاء والدفاع المدني.',
        image: 'https://images.unsplash.com/photo-1605814523789-9154b5dfd9d5?w=500&h=300&fit=crop'
    },
    {
        id: 'init_basmat_amal',
        title: 'مبادرة بسمة أمل',
        description: 'دعم نفسي واجتماعي يستهدف توعية المتدربين بسبل التعامل مع النساء والأطفال المتأثرين بالصدمات.',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&h=300&fit=crop'
    },
    {
        id: 'init_ehdena',
        title: 'مبادرة اهدنا',
        description: 'مبادرة دعوية لنشر تعاليم الدين الإسلامي من خلال الدورات والمحاضرات وإحياء المناسبات ومجالس الذكر.',
        image: 'https://images.unsplash.com/photo-1590076214580-c0818274718f?w=500&h=300&fit=crop'
    }
];

const insertInitiative = db.prepare(`
    INSERT OR REPLACE INTO initiatives (id, title, description, image, status)
    VALUES (?, ?, ?, ?, 'active')
`);

initiatives.forEach(init => {
    insertInitiative.run(init.id, init.title, init.description, init.image);
});
console.log('Inserted initiatives.');

// --- Seed Articles ---
// Reading the articles.txt file and parsing it roughly
const articlesText = fs.readFileSync('articles.txt', 'utf-8');
const articleBlocks = articlesText.split(/\n+(?=[١-٩0-9]+\.\s)/g);

const insertArticle = db.prepare(`
    INSERT OR REPLACE INTO articles (id, title, content, image, author_id)
    VALUES (?, ?, ?, ?, 'admin_mohammad')
`);

const articleImages = [
    'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609599006353-e629aaab31fc?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519817914152-2a67bd48dcad?w=500&h=300&fit=crop'
];

let insertedCount = 0;
articleBlocks.forEach((block, index) => {
    // Basic extraction of title and content
    // The first line usually contains the number and the title
    const lines = block.split('\n');
    let titleLine = lines[0];
    
    // Remove the number prefix (e.g., "١. " or "1. ")
    titleLine = titleLine.replace(/^[\d١-٩]+\.\s*/, '').trim();
    
    // Filter out "-ملتقى الشباب المسلم" or empty lines from the end
    const contentLines = lines.slice(1).filter(l => l.trim() !== '' && !l.includes('ملتقى الشباب المسلم'));
    const content = contentLines.join('\n\n').trim();

    if (titleLine && content) {
        const id = 'art_' + Date.now() + '_' + index;
        const image = articleImages[index % articleImages.length];
        insertArticle.run(id, titleLine, content, image);
        insertedCount++;
    }
});

console.log('Inserted ' + insertedCount + ' articles.');
console.log('Seeding complete.');
