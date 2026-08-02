# ­ƒøí´©Å Golden Audit v2 Automated Report

## Critical (7)
- **String Interpolation in SQL** [/server/routes/courses.cjs:601]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `db.prepare(`UPDATE courses SET ${setClause} WHERE id = ? `).run(...values, id);`
- **String Interpolation in SQL** [/server/routes/courses.cjs:612]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `db.prepare(`DELETE FROM episodes WHERE courseId = ? AND id NOT IN (${placeholders})`).run(id, ...incomingIds);`
- **String Interpolation in SQL** [/server/routes/folders.cjs:90]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `db.prepare(`UPDATE course_folders SET ${updates.join(', ')} WHERE id = ?`).run(...values);`
- **String Interpolation in SQL** [/server/routes/notifications.cjs:75]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `subscriptions = db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`).all(...targetUserIds);`
- **String Interpolation in SQL** [/server/routes/social.cjs:296]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `const result = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE receiverId = ? AND read = 0 ${roleFilter}`).get(userId);`
- **String Interpolation in SQL** [/server/routes/users.cjs:296]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `const result = db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);`
- **String Interpolation in SQL** [/server/routes/users.cjs:341]
  > Potential SQL injection. Use parameterized queries (?) instead of template literals.
  `try { db.prepare(`DELETE FROM ${t} WHERE ${c} = ?`).run(id); } catch(ex) {}`

## High (33)
- **N+1 Query Detection** [/server/agent_bot.cjs:48]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const epCount = db.prepare('SELECT count(*) as cnt FROM episodes WHERE courseId = ?').get(c.id).cnt;`
- **N+1 Query Detection** [/server/ai_watchman.cjs:35]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const episodesCount = db.prepare('SELECT count(*) as cnt FROM episodes WHERE courseId = ?').get(course.id).cnt;`
- **N+1 Query Detection** [/server/database.cjs:230]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const exists = db.prepare('SELECT 1 FROM system_settings WHERE key = ?').get(setting.key);`
- **N+1 Query Detection** [/server/database.cjs:450]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const students = db.prepare("SELECT id FROM users WHERE role = 'student'").all();`
- **N+1 Query Detection** [/server/routes/auth.cjs:198]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;`
- **N+1 Query Detection** [/server/routes/auth.cjs:251]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;`
- **Missing Auth Guard on Mutation** [/server/routes/auth.cjs:350]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/check-verification-status', (req, res) => {`
- **N+1 Query Detection** [/server/routes/courses.cjs:75]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const passedCount = db.prepare(``
- **N+1 Query Detection** [/server/routes/courses.cjs:596]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `db.prepare(`UPDATE courses SET ${setClause} WHERE id = ? `).run(...values, id);`
- **N+1 Query Detection** [/server/routes/courses.cjs:600]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `db.prepare(`UPDATE courses SET ${setClause} WHERE id = ? `).run(...values, id);`
- **N+1 Query Detection** [/server/routes/courses.cjs:607]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `db.prepare(`DELETE FROM episodes WHERE courseId = ? AND id NOT IN (${placeholders})`).run(id, ...incomingIds);`
- **N+1 Query Detection** [/server/routes/courses.cjs:611]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `db.prepare(`DELETE FROM episodes WHERE courseId = ? AND id NOT IN (${placeholders})`).run(id, ...incomingIds);`
- **N+1 Query Detection** [/server/routes/notifications.cjs:74]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `subscriptions = db.prepare(`SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`).all(...targetUserIds);`
- **Missing Auth Guard on Mutation** [/server/routes/r2.cjs:38]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/upload-url', async (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/r2.cjs:63]
  > Mutating route without authenticateToken or rate limiting.
  `router.delete('/file', async (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/r2.cjs:87]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/rename', async (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/r2.cjs:112]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/folder', async (req, res) => {`
- **N+1 Query Detection** [/server/routes/ratings.cjs:17]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const replies = db.prepare('SELECT * FROM rating_replies WHERE ratingId = ? ORDER BY createdAt ASC').all(rating.id);`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:17]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/public/messages', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:211]
  > Mutating route without authenticateToken or rate limiting.
  `router.put('/messages/read', (req, res) => {`
- **N+1 Query Detection** [/server/routes/social.cjs:335]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const firstMsg = db.prepare(`SELECT content FROM messages WHERE senderId = ? ORDER BY timestamp ASC LIMIT 1`).get(g.senderId);`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:407]
  > Mutating route without authenticateToken or rate limiting.
  `router.delete('/messages/cleanup', async (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:440]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/messages', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:571]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/broadcast', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:631]
  > Mutating route without authenticateToken or rate limiting.
  `router.put('/messages/:id/read', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:653]
  > Mutating route without authenticateToken or rate limiting.
  `router.put('/messages/conversation/:userId/read', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:665]
  > Mutating route without authenticateToken or rate limiting.
  `router.delete('/messages/:id', (req, res) => {`
- **Missing Auth Guard on Mutation** [/server/routes/social.cjs:679]
  > Mutating route without authenticateToken or rate limiting.
  `router.delete('/messages/conversation/:userId', (req, res) => {`
- **N+1 Query Detection** [/server/routes/supervisors.cjs:31]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const studentCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;`
- **N+1 Query Detection** [/server/routes/supervisors.cjs:199]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const enrollments = db.prepare(``
- **Missing Auth Guard on Mutation** [/server/routes/supervisors.cjs:241]
  > Mutating route without authenticateToken or rate limiting.
  `router.post('/students/:userId/courses/:courseId/unlock', (req, res) => {`
- **N+1 Query Detection** [/server/routes/users.cjs:192]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE supervisor_id = ?').get(sv.id).count;`
- **N+1 Query Detection** [/server/routes/users.cjs:340]
  > Database query executed inside a loop. Use JOINs or batching (IN).
  `try { db.prepare(`DELETE FROM ${t} WHERE ${c} = ?`).run(id); } catch(ex) {}`

## Medium (56)
- **Empty Catch Block** [/server/database.cjs:54]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_id TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:55]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_capacity INTEGER DEFAULT 10').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:56]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN supervisor_priority INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:57]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN is_tester INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:58]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN approved INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:60]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare("UPDATE users SET approved = 1 WHERE approved = 0 AND (role != 'student' OR emailVerified = 1)").run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:63]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN google_id TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:64]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT \'local\'').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:65]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE users ADD COLUMN profile_completed INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:67]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare("UPDATE users SET profile_completed = 1 WHERE profile_completed = 0 AND name IS NOT NULL AND name != ''").run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:70]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'); } catch(e){}`
- **Empty Catch Block** [/server/database.cjs:111]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE courses ADD COLUMN folder_id TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:112]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE courses ADD COLUMN order_index INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:113]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE courses ADD COLUMN days_available INTEGER DEFAULT 30').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:149]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE enrollments ADD COLUMN deadline TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:150]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE enrollments ADD COLUMN is_locked INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:151]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE enrollments ADD COLUMN extensions_used INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:154]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)'); } catch(e){}`
- **Empty Catch Block** [/server/database.cjs:155]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.exec('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)'); } catch(e){}`
- **Empty Catch Block** [/server/database.cjs:199]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.exec('CREATE INDEX IF NOT EXISTS idx_episode_progress_user_course ON episode_progress(user_id, course_id)'); } catch(e){}`
- **Empty Catch Block** [/server/database.cjs:242]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE certificates ADD COLUMN user_name TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:243]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE certificates ADD COLUMN course_title TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:244]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE certificates ADD COLUMN student_id TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:263]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE quizzes ADD COLUMN courseId TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:264]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE quizzes ADD COLUMN title_en TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:265]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE quizzes ADD COLUMN passing_score INTEGER DEFAULT 70').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:266]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE quizzes ADD COLUMN afterEpisodeIndex INTEGER').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:306]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE books ADD COLUMN courseId TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:329]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentUrl TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:330]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentType TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:331]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE messages ADD COLUMN attachmentName TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:332]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE messages ADD COLUMN expiryDate TEXT').run(); } catch (e) { }`
- **Empty Catch Block** [/server/database.cjs:333]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare('ALTER TABLE messages ADD COLUMN isComplaint INTEGER DEFAULT 0').run(); } catch (e) { }`
- **Missing Transaction** [/server/routes/admin.cjs:172]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/auth.cjs:147]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/auth.cjs:222]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/auth.cjs:449]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/auth.cjs:485]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Empty Catch Block** [/server/routes/auth.cjs:549]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `} catch (logErr) {}`
- **Missing Transaction** [/server/routes/auth.cjs:557]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Empty Catch Block** [/server/routes/auth.cjs:581]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `} catch (logErr) {}`
- **Missing Transaction** [/server/routes/auth.cjs:589]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/books.cjs:141]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/courses.cjs:338]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/courses.cjs:480]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/courses.cjs:540]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/courses.cjs:649]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/folders.cjs:98]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/folders.cjs:124]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/quizzes.cjs:92]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/quizzes.cjs:290]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/quizzes.cjs:399]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/supervisors.cjs:95]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Missing Transaction** [/server/routes/users.cjs:308]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`
- **Empty Catch Block** [/server/routes/users.cjs:341]
  > Errors are swallowed silently, masking failures and complicating debugging.
  `try { db.prepare(`DELETE FROM ${t} WHERE ${c} = ?`).run(id); } catch(ex) {}`
- **Missing Transaction** [/server/routes/users.cjs:580]
  > Route performs multiple DB mutations (INSERT/UPDATE/DELETE) but no db.transaction() was detected. Risk of data inconsistency on failure.
  `End of route`

## Low (0)

Total Findings: 96
