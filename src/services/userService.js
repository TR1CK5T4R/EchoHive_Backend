import pool from '../db/postgres.js';

class UserService {
    /**
     * Find a user by Google ID or Email, or create a new user if not found.
     * @param {Object} profile - The Google OAuth profile
     * @returns {Object} The user record
     */
    static async findOrCreateUser(profile) {
        const { googleId, email, name, avatarUrl } = profile;

        // Check if user already exists by google_id
        const findQuery = `
      SELECT id, google_id, email, name, avatar_url, role, created_at, updated_at 
      FROM users 
      WHERE google_id = $1 OR email = $2
      LIMIT 1;
    `;

        const { rows } = await pool.query(findQuery, [googleId, email]);

        if (rows.length > 0) {
            let user = rows[0];

            // If user exists by email but doesn't have a google_id (e.g., they register via Google later)
            if (!user.google_id && googleId) {
                const updateQuery = `
          UPDATE users 
          SET google_id = $1, avatar_url = COALESCE($2, avatar_url)
          WHERE id = $3 
          RETURNING *;
        `;
                const updateResult = await pool.query(updateQuery, [googleId, avatarUrl, user.id]);
                user = updateResult.rows[0];
            }

            return user;
        }

        // Create new user
        const insertQuery = `
      INSERT INTO users (google_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, google_id, email, name, avatar_url, role, created_at, updated_at;
    `;

        const insertResult = await pool.query(insertQuery, [googleId, email, name, avatarUrl]);
        return insertResult.rows[0];
    }

    /**
     * Get user by ID
     * @param {String} id - The user UUID
     * @returns {Object|null} The user record or null
     */
    static async getUserById(id) {
        const query = `
      SELECT id, google_id, email, name, avatar_url, role, created_at, updated_at 
      FROM users 
      WHERE id = $1;
    `;

        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }
}

export default UserService;
