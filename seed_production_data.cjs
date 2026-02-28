const { db } = require('./server/database.cjs');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('--- STARTING PRODUCTION DATA SEEDING ---');

    try {
        console.log('--- ENVIRONMENT CHECK ---');
        console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'SET' : 'MISSING');
        console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME || 'myf-videos');

        // 1. Ensure Foundational Folder
        const initialFolderId = 'foundation_shariah';
        const folderExists = db.prepare('SELECT id FROM course_folders WHERE id = ?').get(initialFolderId);
        if (!folderExists) {
            console.log('Seeding initial foundational folder...');
            db.prepare(`
                INSERT INTO course_folders (id, name, thumbnail, order_index)
                VALUES (?, ?, ?, ?)
            `).run(initialFolderId, 'الدورة التأسيسية للعلوم الشرعية', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop', 0);
        }

        // 2. Load Healthy Data
        const rawData = fs.readFileSync('courses_merged_safe.json', 'utf8');
        const coursesData = JSON.parse(rawData);
        console.log(`Loaded ${coursesData.length} courses from combined data.`);

        // 3. Insert Courses and Episodes
        const insertCourse = db.prepare(`
            INSERT INTO courses (id, title, title_en, instructor, instructor_en, category, category_en, duration, duration_en, thumbnail, description, description_en, lessons_count, students_count, status, folder_id, order_index)
            VALUES (@id, @title, @title_en, @instructor, @instructor_en, @category, @category_en, @duration, @duration_en, @thumbnail, @description, @description_en, @lessons_count, @students_count, @status, @folder_id, @order_index)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                thumbnail = excluded.thumbnail,
                description = excluded.description,
                lessons_count = excluded.lessons_count,
                folder_id = excluded.folder_id,
                order_index = excluded.order_index
        `);

        const insertEpisode = db.prepare(`
            INSERT INTO episodes (id, courseId, title, title_en, duration, videoUrl, orderIndex, isLocked)
            VALUES (@id, @courseId, @title, @title_en, @duration, @videoUrl, @orderIndex, @isLocked)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                videoUrl = excluded.videoUrl,
                orderIndex = excluded.orderIndex
        `);

        for (const course of coursesData) {
            console.log(`Seeding Course: ${course.title} (${course.id})`);

            insertCourse.run({
                id: course.id,
                title: course.title,
                title_en: course.titleEn || null,
                instructor: course.instructor || null,
                instructor_en: course.instructorEn || null,
                category: course.category || null,
                category_en: course.categoryEn || null,
                duration: course.duration || null,
                duration_en: course.durationEn || null,
                thumbnail: course.thumbnail || null,
                description: course.description || null,
                description_en: course.descriptionEn || null,
                lessons_count: course.lessonsCount || (course.episodes ? course.episodes.length : 0),
                students_count: course.studentsCount || 0,
                status: course.status || 'published',
                folder_id: course.folderId || 'foundation_shariah',
                order_index: course.orderIndex || 0
            });

            if (course.episodes && course.episodes.length > 0) {
                // Optional: Clear existing episodes for clean re-index
                db.prepare('DELETE FROM episodes WHERE courseId = ?').run(course.id);

                for (const ep of course.episodes) {
                    insertEpisode.run({
                        id: ep.id,
                        courseId: course.id,
                        title: ep.title,
                        title_en: ep.titleEn || null,
                        duration: ep.duration || '',
                        videoUrl: ep.videoUrl,
                        orderIndex: ep.orderIndex,
                        isLocked: ep.isLocked ? 1 : 0
                    });
                }
            }
        }

        // 4. Seed Books (Mapping)
        console.log('Cleaning and seeding course books...');
        db.prepare('DELETE FROM books').run();
        const booksToSeed = [
            { id: 'book_waseela', title: 'ملخص فقه الطهارة', path: 'fiqh_waseela.pdf', courseId: 'course_fiqh1-waseelit' },
            { id: 'book_raheeq', title: 'الرحيق المختوم', path: 'raheeq_makhtum.pdf', courseId: 'course_seerah' },
            { id: 'book_aqeeda', title: 'ملخص العقيدة', path: 'aqeeda_summary.pdf', courseId: 'course_aqeeda' },
            { id: 'book_ithaf', title: 'شرح كتاب الإتحاف', path: 'ithaf_fiqh.pdf', courseId: 'course_fiqh2-it7af' },
            { id: 'book_madkhal', title: 'مدخل العلوم الشرعية', path: 'madkhal_sharia.pdf', courseId: 'course_madkhal' },
            { id: 'book_nifas', title: 'أحكام النفاس', path: 'akaleel.pdf', courseId: 'course_nifas' },
            { id: 'book_tafsir', title: 'تفسير', path: 'tafseer.pdf', courseId: 'course_tafseer' },
            { id: 'book_tazkiyah', title: 'تزكية', path: 'tazkiyah.pdf', courseId: 'course_tazkiyah' },
            { id: 'book_arba3oon', title: 'الأربعون النووية', path: 'arba3oon.pdf', courseId: 'course_arba3oon' }
        ];

        const insertBook = db.prepare(`
            INSERT INTO books (id, title, path, courseId)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, path=excluded.path, courseId=excluded.courseId
        `);

        for (const book of booksToSeed) {
            insertBook.run(book.id, book.title, book.path, book.courseId);
        }

        // 5. Seed Library Resources
        console.log('Cleaning and seeding library resources...');
        db.prepare('DELETE FROM library_resources').run();
        const libraryToSeed = [
            { id: 'lib_1', title: 'ملخص فقه الطهارة', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/fiqh_waseela.pdf', category: 'الفقه' },
            { id: 'lib_2', title: 'الرحيق المختوم', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/raheeq_makhtum.pdf', category: 'السيرة' },
            { id: 'lib_3', title: 'شجرة الأنبياء (إنفوجرافيك)', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/prophets_tree.pdf', category: 'التصميم' },
            { id: 'lib_4', title: 'جدول متابعة الحفظ', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/hifz_tracker.pdf', category: 'القرآن' },
            { id: 'lib_5', title: 'أذكار الصباح والمساء', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/adhkar.pdf', category: 'الأذكار' },
            { id: 'lib_6', title: 'أحكام النفاس (الإكليل)', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/akaleel.pdf', category: 'الفقه' },
            { id: 'lib_7', title: 'تفسير ابن كثير (مختصر)', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/tafseer.pdf', category: 'القرآن' },
            { id: 'lib_8', title: 'الأربعون النووية (متن)', type: 'pdf', url: 'https://pub-7ec5f52937cb4e729e07ecf35b1cf007.r2.dev/Books/arba3oon.pdf', category: 'الحديث' }
        ];

        const insertLib = db.prepare(`
            INSERT INTO library_resources (id, title, type, url, category)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, url=excluded.url, category=excluded.category
        `);

        for (const lib of libraryToSeed) {
            insertLib.run(lib.id, lib.title, lib.type, lib.url, lib.category);
        }

        // 6. Ensure Admin/Supervisor
        console.log('Ensuring credentials...');
        const adminEmail = 'admin@myf-online.com';
        const supervisorEmail = 'supervisor@myf-online.com';

        const hashAdmin = bcrypt.hashSync('mastaba_admin_2024', 10);
        const hashSupervisor = bcrypt.hashSync('mastaba_supervisor_2024', 10);

        db.prepare(`
            INSERT INTO users (id, email, password, name, role, joinDate, emailVerified, avatar)
            VALUES ('admin_main', ?, ?, 'المشرف العام', 'admin', ?, 1, ?)
            ON CONFLICT(email) DO UPDATE SET password=excluded.password, role='admin'
        `).run(adminEmail, hashAdmin, new Date().toISOString(), `https://ui-avatars.com/api/?name=${encodeURIComponent('المشرف العام')}&background=random`);

        db.prepare(`
            INSERT INTO users (id, email, password, name, role, joinDate, emailVerified, avatar)
            VALUES ('supervisor_main', ?, ?, 'المشرف العلمي', 'supervisor', ?, 1, ?)
            ON CONFLICT(email) DO UPDATE SET password=excluded.password, role='supervisor'
        `).run(supervisorEmail, hashSupervisor, new Date().toISOString(), `https://ui-avatars.com/api/?name=${encodeURIComponent('المشرف العلمي')}&background=random`);

        console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');

    } catch (err) {
        console.error('❌ SEEDING FAILED:', err);
    }
}

seed();
