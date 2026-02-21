import pool from '../db/postgres.js';

class OptInService {
    /**
     * Save an event opt-in record. Ensures consent is true before inserting.
     * @param {String} email - User's email
     * @param {Boolean} consent - Must be true to insert
     * @param {String} eventId - MongoDB ObjectId string representation
     * @returns {Object} The inserted opt-in record
     * @throws {Error} If consent is false
     */
    static async saveOptIn(email, consent, eventId) {
        if (consent !== true) {
            throw new Error('Consent must be explicitly true to save an opt-in record.');
        }

        const insertQuery = `
      INSERT INTO event_opt_ins (email, consent, event_id)
      VALUES ($1, $2, $3)
      RETURNING id, email, consent, event_id, created_at;
    `;

        const insertResult = await pool.query(insertQuery, [email, consent, eventId]);
        return insertResult.rows[0];
    }
}

export default OptInService;
