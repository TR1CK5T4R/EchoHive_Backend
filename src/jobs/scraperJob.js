import cron from 'node-cron';
import timeoutScraper from '../services/scraper/timeoutScraper.js';
import eventbriteScraper from '../services/scraper/eventbriteScraper.js';
import EventSyncService from '../services/eventSyncService.js';

// Mutex to prevent overlapping job executions
let isScrapingRunning = false;

export const runScrapers = async () => {
    if (isScrapingRunning) {
        console.warn('⚠️ [Cron] Scraper job triggered but an existing job is still running. Skipping this cycle.');
        return;
    }

    isScrapingRunning = true;
    console.log('🔄 [Cron] Starting scheduled scraping sequence for all targets...');

    const startTime = Date.now();
    let totalNew = 0;
    let totalUpdated = 0;
    let totalInactive = 0;

    try {
        // We can run scrapers in parallel or sequentially.
        // Sequential is often safer to avoid overwhelming the server visually or triggering rate limits.
        const scrapers = [
            timeoutScraper,
            eventbriteScraper,
        ];

        for (const scraper of scrapers) {
            console.log(`--- Executing ${scraper.sourceName} ---`);

            try {
                // 1. Scrape and Normalize (Handled inside abstract BaseScraper execution flow)
                const events = await scraper.scrape();

                // 2. Sync to Database
                if (events && events.length > 0) {
                    const stats = await EventSyncService.syncEvents(events, scraper.sourceName);

                    totalNew += stats.new;
                    totalUpdated += stats.updated;
                    totalInactive += stats.markedInactive;
                } else {
                    console.warn(`⚠️ [Cron] ${scraper.sourceName} returned no events or failed.`);
                }
            } catch (err) {
                console.error(`❌ [Cron] Error processing ${scraper.sourceName}:`, err.message);
                // Continue to the next scraper even if one fails
            }
        }

    } catch (globalError) {
        console.error('❌ [Cron] Fatal error during scraping orchestration:', globalError);
    } finally {
        // Release the mutex
        isScrapingRunning = false;

        const durationMins = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        console.log(`✅ [Cron] Scheduled scraping sequence complete in ${durationMins}m`);
        console.log(`📊 [Cron] RESULTS -> New: ${totalNew} | Updated: ${totalUpdated} | Inactive: ${totalInactive}`);
    }
};

/**
 * Initializes the node-cron schedules
 */
export const initCronJobs = () => {
    console.log('🕣 [Cron] Registering Scraper Jobs...');

    // Schedule: "0 */6 * * *" = Minute 0 past every 6th hour (00:00, 06:00, 12:00, 18:00)
    cron.schedule('0 */6 * * *', runScrapers, {
        scheduled: true,
        timezone: 'Antarctica/Macquarie' // You may want to configure this via process.env.TZ later
    });

    console.log('🕣 [Cron] Scraper Job scheduled to run every 6 hours');
};
