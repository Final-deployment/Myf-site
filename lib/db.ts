import { sql } from '@vercel/postgres';

// Export the sql template tag directly for use in API routes
export { sql };

// Helper function to run parameterized queries
export async function query(text: string, params: any[] = []) {
    const result = await sql.query(text, params);
    return result;
}

// Type-safe helper for common operations
export const db = {
    // Users
    async getUserByEmail(email: string) {
        const { rows } = await sql`
      SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `;
        return rows[0] || null;
    },

    async getUserById(id: string) {
        const { rows } = await sql`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
        return rows[0] || null;
    },

    async createUser(user: {
        id: string;
        email: string;
        password: string;
        name: string;
        name_en?: string;
        role?: string;
        join_date: string;
        whatsapp?: string;
        country?: string;
        age?: number;
        gender?: string;
        education_level?: string;
        verification_code?: string;
        verification_expiry?: string;
    }) {
        const { rows } = await sql`
      INSERT INTO users (
        id, email, password, name, name_en, role, join_date,
        points, level, streak, status, whatsapp, country, age, gender,
        education_level, email_verified, verification_code, verification_expiry
      ) VALUES (
        ${user.id}, ${user.email}, ${user.password}, ${user.name}, 
        ${user.name_en || user.name}, ${user.role || 'student'}, ${user.join_date},
        0, 1, 0, 'active', ${user.whatsapp || null}, ${user.country || null}, 
        ${user.age || null}, ${user.gender || null}, ${user.education_level || null},
        FALSE, ${user.verification_code || null}, ${user.verification_expiry || null}
      )
      RETURNING *
    `;
        return rows[0];
    },

    async updateUserVerification(userId: string) {
        await sql`
      UPDATE users 
      SET email_verified = TRUE, verification_code = NULL, verification_expiry = NULL
      WHERE id = ${userId}
    `;
    },

    async getAllUsers() {
        const { rows } = await sql`
      SELECT id, email, name, name_en, role, avatar, points, level, streak, 
             join_date, status, email_verified, country, age, gender, 
             education_level, whatsapp
      FROM users ORDER BY join_date DESC
    `;
        return rows;
    },

    // Courses
    async getAllCourses() {
        const { rows } = await sql`
      SELECT * FROM courses ORDER BY created_at DESC
    `;
        return rows;
    },

    async getCourseById(id: string) {
        const { rows } = await sql`
      SELECT * FROM courses WHERE id = ${id} LIMIT 1
    `;
        return rows[0] || null;
    },

    async createCourse(course: {
        id: string;
        title: string;
        title_en?: string;
        instructor?: string;
        instructor_en?: string;
        category?: string;
        category_en?: string;
        duration?: string;
        duration_en?: string;
        thumbnail?: string;
        description?: string;
        description_en?: string;
        lessons_count?: number;
        students_count?: number;
        video_url?: string;
        status?: string;
        passing_score?: number;
    }) {
        const { rows } = await sql`
      INSERT INTO courses (
        id, title, title_en, instructor, instructor_en, category, category_en,
        duration, duration_en, thumbnail, description, description_en,
        lessons_count, students_count, video_url, status, passing_score
      ) VALUES (
        ${course.id}, ${course.title}, ${course.title_en || null},
        ${course.instructor || null}, ${course.instructor_en || null},
        ${course.category || null}, ${course.category_en || null},
        ${course.duration || null}, ${course.duration_en || null},
        ${course.thumbnail || null}, ${course.description || null},
        ${course.description_en || null}, ${course.lessons_count || 0},
        ${course.students_count || 0}, ${course.video_url || null},
        ${course.status || 'published'}, ${course.passing_score || 80}
      )
      RETURNING *
    `;
        return rows[0];
    },

    // Fix all users (enable email_verified)
    async fixAllUsersVerification() {
        await sql`UPDATE users SET email_verified = TRUE`;
        const { rows } = await sql`SELECT email, email_verified FROM users`;
        return rows;
    }
};

export default db;
