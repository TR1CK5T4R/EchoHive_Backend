import mongoose from 'mongoose';
import pgPool from '../db/postgres.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const checkHealth = asyncWrapper(async (req, res) => {
    // Check MongoDB
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Postgres
    let postgresStatus = 'disconnected';
    try {
        const client = await pgPool.connect();
        postgresStatus = 'connected';
        client.release();
    } catch (err) {
        postgresStatus = 'error';
    }

    const systemHealth = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        databases: {
            mongodb: mongoStatus,
            postgres: postgresStatus,
        }
    };

    const isHealthy = mongoStatus === 'connected' && postgresStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json(systemHealth);
});
