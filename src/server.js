import app from './app.js';
import config from './config/env.js';
import connectMongo from './db/mongodb.js';
import { connectPostgres } from './db/postgres.js';
import { initCronJobs } from './jobs/scraperJob.js';

const startServer = async () => {
    try {
        // Connect to databases
        await Promise.all([
            connectMongo(),
            connectPostgres()
        ]);

        const server = app.listen(config.port, () => {
            console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
        });

        // Initialize background jobs
        initCronJobs();

        // Handle Unhandled Rejections gracefully
        process.on('unhandledRejection', (err) => {
            console.error('❌ Unhandled Rejection! Shutting down...', err);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle SIGTERM (graceful shutdown)
        process.on('SIGTERM', () => {
            console.log('👋 SIGTERM received. Shutting down gracefully');
            server.close(() => {
                console.log('💥 Process terminated');
            });
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
