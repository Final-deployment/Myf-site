const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'db.sqlite');
const db = new Database(dbPath);
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
// Enable Foreign Keys for ON DELETE CASCADE
db.pragma('foreign_keys = ON');
// Wait up to 5 seconds when DB is busy instead of failing immediately (SQLITE_BUSY fix)
db.pragma('busy_timeout = 5000');

function initDatabase() {
  console.log('Initializing SQLite database...');

  // --- Users Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            nameEn TEXT,
            role TEXT DEFAULT 'student',
            avatar TEXT,
            points INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            streak INTEGER DEFAULT 0,
            joinDate TEXT,
            status TEXT DEFAULT 'active',
            emailVerified INTEGER DEFAULT 0,
            verificationCode TEXT,
            verificationExpiry TEXT,
            whatsapp TEXT,
            country TEXT,
            age INTEGER,
            gender TEXT,
            educationLevel TEXT,
            supervisor_id TEXT,
            supervisor_capacity INTEGER,
            supervisor_priority INTEGER
        )
    `);

  // Migration for users table (Supervisor Support)
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_id TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_capacity INTEGER DEFAULT 10').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_priority INTEGER DEFAULT 0').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN is_tester INTEGER DEFAULT 0').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN approved INTEGER DEFAULT 0').run(); } catch (e) { }
  // Auto-approve all existing users and all non-student roles
  try { db.prepare("UPDATE users SET approved = 1 WHERE approved = 0 AND (role != 'student' OR emailVerified = 1)").run(); } catch (e) { }

  // Migration for Google Sign-In support
  try { db.prepare('ALTER TABLE users ADD COLUMN google_id TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT \'local\'').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE users ADD COLUMN profile_completed INTEGER DEFAULT 0').run(); } catch (e) { }
  // Auto-mark all existing users as profile_completed (they registered through the old form)
  try { db.prepare("UPDATE users SET profile_completed = 1 WHERE profile_completed = 0 AND name IS NOT NULL AND name != ''").run(); } catch (e) { }

  // Migration: last_login for supervisor inactivity tracking
  try { db.prepare('ALTER TABLE users ADD COLUMN last_login TEXT').run(); } catch (e) { }
  // Migration: section_id to link students to sections
  try { db.prepare('ALTER TABLE users ADD COLUMN section_id TEXT').run(); } catch (e) { }

  // --- Sections Table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        supervisor_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(supervisor_id) REFERENCES users(id)
    )
  `);

  // --- In-App Notifications Table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS in_app_notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id, is_read)'); } catch(e){}

  // --- Group Messages Table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_messages (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT,
        attachment_url TEXT,
        attachment_type TEXT,
        attachment_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE,
        FOREIGN KEY(sender_id) REFERENCES users(id)
    )
  `);
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_group_messages_section ON group_messages(section_id, created_at)'); } catch(e){}

  // Indexes for Users
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'); } catch(e){}

  // --- Courses Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            title_en TEXT,
            instructor TEXT,
            instructor_en TEXT,
            category TEXT,
            category_en TEXT,
            duration TEXT,
            duration_en TEXT,
            thumbnail TEXT,
            description TEXT,
            description_en TEXT,
            lessons_count INTEGER DEFAULT 0,
            students_count INTEGER DEFAULT 0,
            video_url TEXT,
            status TEXT DEFAULT 'published',
            passing_score INTEGER DEFAULT 80,
            quiz_frequency INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0,
            days_available INTEGER DEFAULT 30,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // --- Course Folders Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS course_folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            thumbnail TEXT,
            order_index INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Migration for courses table
  try { db.prepare('ALTER TABLE courses ADD COLUMN folder_id TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE courses ADD COLUMN order_index INTEGER DEFAULT 0').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE courses ADD COLUMN days_available INTEGER DEFAULT 30').run(); } catch (e) { }

  // --- Episodes Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS episodes (
            id TEXT PRIMARY KEY,
            courseId TEXT NOT NULL,
            title TEXT NOT NULL,
            title_en TEXT,
            duration TEXT,
            videoUrl TEXT,
            orderIndex INTEGER,
            isLocked INTEGER DEFAULT 0,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
        )
    `);

  // --- Enrollments Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS enrollments (
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
            progress INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            last_accessed TEXT,
            is_favorite INTEGER DEFAULT 0,
            deadline TEXT,
            is_locked INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, course_id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    `);

  // Migration for enrollments
  try { db.prepare('ALTER TABLE enrollments ADD COLUMN deadline TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE enrollments ADD COLUMN is_locked INTEGER DEFAULT 0').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE enrollments ADD COLUMN extensions_used INTEGER DEFAULT 0').run(); } catch (e) { }

  // Indexes for Enrollments
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)'); } catch(e){}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)'); } catch(e){}

  // --- Episode Progress Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS episode_progress (
            user_id TEXT NOT NULL,
            episode_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            watched_duration INTEGER DEFAULT 0,
            last_position INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, episode_id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- Extension Archive Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS extension_archive (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            extended_by TEXT NOT NULL,
            extended_at TEXT DEFAULT CURRENT_TIMESTAMP,
            days_added INTEGER DEFAULT 2,
            FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    `);

  // --- Push Subscriptions Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // Indexes for Episode Progress
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_episode_progress_user_course ON episode_progress(user_id, course_id)'); } catch(e){}

  // --- Certificates Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            issue_date TEXT DEFAULT CURRENT_TIMESTAMP,
            grade INTEGER,
            certificate_code TEXT UNIQUE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- System Settings Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Initialize default backup settings if not exist
  const defaultSettings = [
    { key: 'auto_backup_enabled', value: '1' },
    { key: 'cloud_backup_enabled', value: '1' },
    { key: 'backup_retention_days', value: '30' }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
  db.transaction(() => {
    for (const setting of defaultSettings) {
      insertSetting.run(setting.key, setting.value);
    }
  })();

  // Migration for certificates table
  try { db.prepare('ALTER TABLE certificates ADD COLUMN user_name TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE certificates ADD COLUMN course_title TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE certificates ADD COLUMN student_id TEXT').run(); } catch (e) { }


  // --- Quizzes Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id TEXT PRIMARY KEY,
            courseId TEXT,
            title TEXT NOT NULL,
            title_en TEXT,
            description TEXT,
            questions TEXT, -- Storing JSON string of questions for now
            passing_score INTEGER DEFAULT 70,
            afterEpisodeIndex INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Migration for quizzes table
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN courseId TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN title_en TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN passing_score INTEGER DEFAULT 70').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE quizzes ADD COLUMN afterEpisodeIndex INTEGER').run(); } catch (e) { }

  db.exec(`
        CREATE TABLE IF NOT EXISTS quiz_results (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            quizId TEXT NOT NULL,
            score INTEGER,
            total INTEGER,
            percentage INTEGER,
            completedAt TEXT,
            FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

  // --- Library ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS library_resources (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            type TEXT,
            url TEXT,
            category TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // --- Books (Linked to Courses) ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            path TEXT NOT NULL,
            courseId TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE SET NULL
        )
    `);

  // Migration for books
  try { db.prepare('ALTER TABLE books ADD COLUMN courseId TEXT').run(); } catch (e) { }



  // --- Articles Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            image TEXT,
            author_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(author_id) REFERENCES users(id)
        )
    `);

  // --- Initiatives Table ---
  db.exec(`
        CREATE TABLE IF NOT EXISTS initiatives (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            image TEXT,
            link TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // --- Other Tables ---
  db.exec(`CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT, content TEXT, type TEXT, date TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT,
      receiverId TEXT,
      content TEXT,
      read INTEGER DEFAULT 0,
      timestamp TEXT,
      attachmentUrl TEXT,
      attachmentType TEXT,
      attachmentName TEXT,
      expiryDate TEXT
    )
  `);

  // Migration for existing tables
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentUrl TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentType TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentName TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN expiryDate TEXT').run(); } catch (e) { }
  try { db.prepare('ALTER TABLE messages ADD COLUMN isComplaint INTEGER DEFAULT 0').run(); } catch (e) { }

  db.exec(`CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY, userId TEXT, targetId TEXT, type TEXT, createdAt TEXT)`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      userCountry TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rating_replies (
      id TEXT PRIMARY KEY,
      ratingId TEXT NOT NULL,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ratingId) REFERENCES ratings(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`CREATE TABLE IF NOT EXISTS system_activity_logs (id TEXT PRIMARY KEY, action TEXT, userId TEXT, details TEXT, timestamp TEXT)`);

  // --- Seed Default Users ---
  const checkUser = db.prepare('SELECT id, password FROM users WHERE email = ?');
  const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, name, role, joinDate, emailVerified, avatar)
        VALUES (@id, @email, @password, @name, @role, @joinDate, @emailVerified, @avatar)
    `);
  const updateUserPass = db.prepare('UPDATE users SET password = ? WHERE id = ?');

  const defaultUsers = [
    {
      id: "admin_mohammad", email: "mohammadaydi93@gmail.com", passwordPlain: "12345678",
      role: "admin", name: "إدارة الملتقى"
    },
    {
      id: "admin_ikhlas", email: "ikhlasali19972018@gmail.com", passwordPlain: "12345678",
      role: "admin", name: "اخلاص ابو حسين"
    },
    {
      id: "admin_manager", email: "manager@mastaba.com", passwordPlain: "12345678",
      role: "admin", name: "مدير تجريبي"
    }
  ];

  for (const defUser of defaultUsers) {
    const existing = checkUser.get(defUser.email);
    const hash = bcrypt.hashSync(defUser.passwordPlain, 10);

    if (existing) {
      if (!bcrypt.compareSync(defUser.passwordPlain, existing.password)) {
        console.log(`Resetting password for ${defUser.email}`);
        updateUserPass.run(hash, existing.id);
      }
    } else {
      console.log(`Creating default user: ${defUser.email}`);
      insertUser.run({
        id: defUser.id,
        email: defUser.email,
        password: hash,
        name: defUser.name,
        role: defUser.role,
        joinDate: new Date().toISOString(),
        emailVerified: 1,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defUser.name)}&background=random`
      });
    }
  }

  // --- Seed Default Initiatives ---
  const initCount = db.prepare('SELECT COUNT(*) as count FROM initiatives').get();
  if (initCount.count === 0) {
    console.log('Seeding default initiatives...');
    const insertInit = db.prepare('INSERT INTO initiatives (id, title, description, image) VALUES (?, ?, ?, ?)');
    const defaultInitiatives = [
      { id: 'init_futuwwa', title: 'أكاديمية فتوة/فلسطين', description: 'برنامج إعداد قيادي شبابي يهدف إلى بناء الشخصية الإسلامية المتكاملة من خلال التربية الإيمانية، والوعي الفكري، والمهارات الحياتية.', image: '/logos/فتوة.png' },
      { id: 'init_ehdena', title: 'مبادرة اهدنا (على هدي الحبيب)', description: 'نشر تعاليم الدين الإسلامي من خلال الدورات، المحاضرات، وإحياء المناسبات الدينية ومجالس الصلاة على النبي.', image: '/logos/على هدي الحبيب.png' },
      { id: 'init_meraj', title: 'مبادرة معراج', description: 'مبادرة تعني بالقرآن الكريم وحفظه وتكريمه وحلقات العلوم الشريفة.', image: '/logos/معراج.png' },
      { id: 'init_nabd_hayat', title: 'مبادرة نبض الحياة', description: 'تزويد الشباب والمتطوعين بمهارات الإسعافات الأولية والاستجابة الطارئة.', image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=500&h=300&fit=crop' },
      { id: 'init_nabd_aman', title: 'مبادرة نبض الأمان', description: 'تعزيز السلامة العامة من خلال تدريب الشباب على التعامل مع حالات الطوارئ والإطفاء.', image: 'https://images.unsplash.com/photo-1605814523789-9154b5dfd9d5?w=500&h=300&fit=crop' },
      { id: 'init_basmat_amal', title: 'مبادرة بسمة أمل', description: 'مبادرة دعم نفسي واجتماعي تستهدف توعية المتدربين على سبل التعامل مع المتأثرين بالصدمات.', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&h=300&fit=crop' }
    ];
    for (const init of defaultInitiatives) {
      insertInit.run(init.id, init.title, init.description, init.image);
    }
  } else {
    // Ensure initiative logos are updated
    db.prepare("UPDATE initiatives SET image = '/logos/فتوة.png' WHERE id = 'init_futuwwa' OR title LIKE '%فتوة%'").run();
    db.prepare("UPDATE initiatives SET image = '/logos/على هدي الحبيب.png' WHERE id = 'init_ehdena' OR title LIKE '%اهدنا%'").run();
    db.prepare("INSERT OR REPLACE INTO initiatives (id, title, description, image, status, created_at) VALUES ('init_meraj', 'مبادرة معراج', 'مبادرة تعني بالقرآن الكريم وحفظه وتكريمه وحلقات العلوم الشريفة.', '/logos/معراج.png', 'active', CURRENT_TIMESTAMP)").run();
  }

  // --- Seed Official 14 Articles ---
  const artCount = db.prepare("SELECT COUNT(*) as count FROM articles WHERE id != 'art_default1'").get();
  if (artCount.count === 0) {
    console.log('Seeding official 14 articles from articles.txt...');
    try {
      const articlesFilePath = path.join(__dirname, '../articles.txt');
      if (fs.existsSync(articlesFilePath)) {
        const rawText = fs.readFileSync(articlesFilePath, 'utf-8');
        const lines = rawText.split('\n');
        let parsedArticles = [];
        let currentArticle = null;
        let expectingTitle = true;

        for (let line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (expectingTitle && /^[\u0660-\u06690-9]+\.\s*(.*)/.test(trimmedLine)) {
            const titleMatch = trimmedLine.match(/^[\u0660-\u06690-9]+\.\s*(.*)/);
            currentArticle = { title: titleMatch[1].trim(), content: [] };
            parsedArticles.push(currentArticle);
            expectingTitle = false;
          } else if (trimmedLine.includes('-ملتقى الشباب المسلم')) {
            expectingTitle = true;
          } else if (currentArticle) {
            currentArticle.content.push(trimmedLine);
          }
        }

        const facebookDates = [
          '2026-04-25T12:00:00.000Z', '2026-04-23T12:00:00.000Z', '2026-04-20T12:00:00.000Z',
          '2026-04-17T12:00:00.000Z', '2026-04-12T12:00:00.000Z', '2026-04-05T12:00:00.000Z',
          '2026-03-27T12:00:00.000Z', '2026-03-20T12:00:00.000Z', '2026-03-14T12:00:00.000Z',
          '2026-03-08T12:00:00.000Z', '2026-03-01T12:00:00.000Z', '2026-02-22T12:00:00.000Z',
          '2026-02-15T12:00:00.000Z', '2026-02-08T12:00:00.000Z'
        ];

        db.exec("DELETE FROM articles WHERE id = 'art_default1'");
        const insertArt = db.prepare('INSERT OR REPLACE INTO articles (id, title, content, image, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
        
        parsedArticles.filter(a => a.title && a.content.length > 0).forEach((a, idx) => {
          insertArt.run(
            'art_auto_' + idx,
            a.title,
            a.content.join('\n\n'),
            null,
            'admin_mohammad',
            facebookDates[idx] || new Date().toISOString()
          );
        });
        console.log(`Seeded ${parsedArticles.length} official articles into SQLite DB.`);
      }
    } catch (err) {
      console.error('Error seeding official articles:', err);
    }
  }

  // --- Seed Initial Folder if not exists ---
  const initialFolderId = 'foundation_shariah';
  const folderExists = db.prepare('SELECT id FROM course_folders WHERE id = ?').get(initialFolderId);
  if (!folderExists) {
    console.log('Seeding initial foundational folder...');
    db.prepare(`
            INSERT INTO course_folders (id, name, thumbnail, order_index)
            VALUES (?, ?, ?, ?)
        `).run(initialFolderId, 'الدورة التأسيسية للعلوم الشرعية', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800&h=450&fit=crop', 0);

    // Link all current courses to this folder
    db.prepare('UPDATE courses SET folder_id = ? WHERE folder_id IS NULL').run(initialFolderId);
  }

  // --- ONE-TIME RESET: Sequential Progress enforcement ---
  // Only run this once, then set a flag in system_settings to skip on subsequent starts.
  const enrollmentSeeded = db.prepare("SELECT 1 FROM system_settings WHERE key = 'enrollment_seeded'").get();
  if (!enrollmentSeeded) {
    const foundationalCourseId = 'course_madkhal';
    const foundationalCourse = db.prepare('SELECT id, days_available FROM courses WHERE id = ?').get(foundationalCourseId);

    if (foundationalCourse) {
      console.log('ENFORCING FOUNDATIONAL ENROLLMENT: Ensuring all students can access the first course...');

      // 1. Seed correct per-course days_available values
      const courseDaysMapping = {
        'course_madkhal': 5,
        'course_aqeeda': 15,
        'course_fiqh1-waseelit': 20,
        'course_nifas': 12,
        'course_tafseer': 5,
        'course_tazkiyah': 10,
        'course_seerah': 15,
        'course_arba3oon': 25,
        'course_fiqh2-it7af': 25
      };
      const updateDaysStmt = db.prepare('UPDATE courses SET days_available = ? WHERE id = ?');
      for (const [courseId, days] of Object.entries(courseDaysMapping)) {
        updateDaysStmt.run(days, courseId);
      }

      const foundCourse = db.prepare('SELECT days_available FROM courses WHERE id = ?').get(foundationalCourseId);
      const students = db.prepare("SELECT id FROM users WHERE role = 'student'").all();
      const daysForFoundational = (foundCourse && foundCourse.days_available) || 5;

      const enrollStmt = db.prepare(`
        INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at, deadline, progress, completed, is_locked)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0, 0, 0)
      `);

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + daysForFoundational);
      const deadline = deadlineDate.toISOString();

      let enrollmentCount = 0;
      const seedEnrollments = db.transaction((studentsToEnroll) => {
        for (const student of studentsToEnroll) {
          const result = enrollStmt.run(student.id, foundationalCourseId, deadline);
          if (result.changes > 0) enrollmentCount++;
        }
      });
      seedEnrollments(students);

      if (enrollmentCount > 0) {
        console.log(`Auto-enrolled ${enrollmentCount} students in ${foundationalCourseId}.`);
        db.prepare('UPDATE courses SET students_count = (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) WHERE id = ?').run(foundationalCourseId, foundationalCourseId);
      }

      console.log(`Seeded days_available for ${Object.keys(courseDaysMapping).length} courses.`);
    }

    // Set flag so this doesn't run again
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run('enrollment_seeded', '1');
    console.log('Enrollment seeding completed and flagged.');
  } else {
    console.log('Enrollment already seeded, skipping.');
  }

  console.log('SQLite database initialized successfully.');
}

module.exports = {
  db,
  initDatabase
};
