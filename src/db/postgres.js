import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/env.js';
// import postgres from 'postgres'

const connectionString = config.postgresUri.includes('pooler.supabase.com') && !config.postgresUri.includes('pgbouncer=true')
    ? `${config.postgresUri}?pgbouncer=true`
    : config.postgresUri;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle Postgres client', err);
    process.exit(-1);
});

export const connectPostgres = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL Connected');
        client.release();
    } catch (err) {
        console.error(`❌ Error connecting to PostgreSQL: ${err.message}`);
        // Non-fatal if we are mostly relying on MongoDB, adjust as needed.
    }
};

export const query = (text, params) => pool.query(text, params);
export default pool;
