import Event from '../models/Event.js';
import ImageUpload from '../utils/imageUpload.js';

class EventSyncService {
    /**
     * Synchronizes an array of scraped events into the database.
     * Handles creation, updates based on contentHash, and marking stale events inactive.
     * 
     * @param {Array} scrapedEvents - Array of normalized event objects
     * @param {String} sourceWebsite - The origin scraper identifier
     */
    static async syncEvents(scrapedEvents, sourceWebsite) {
        if (!scrapedEvents || !Array.isArray(scrapedEvents)) {
            throw new Error('Invalid scraped events array provided');
        }

        const currentScrapeRun = new Date();
        let stats = {
            new: 0,
            updated: 0,
            unchanged: 0,
            markedInactive: 0,
        };

        console.log(`[SyncService] Starting sync for ${scrapedEvents.length} events from ${sourceWebsite}`);

        // Process each scraped event
        for (const rawEvent of scrapedEvents) {
            if (!rawEvent || !rawEvent.originalEventUrl) continue;

            const existingEvent = await Event.findOne({ originalEventUrl: rawEvent.originalEventUrl });

            if (!existingEvent) {
                // Event does not exist, intercept and proxy the image to Cloudinary
                if (rawEvent.imageUrl && !rawEvent.imageUrl.includes('res.cloudinary.com')) {
                    rawEvent.imageUrl = await ImageUpload.uploadExternalImage(rawEvent.imageUrl);
                }

                // insert as NEW
                await Event.create({
                    ...rawEvent,
                    status: 'new',
                    lastScrapedAt: currentScrapeRun,
                });
                stats.new++;
            } else {
                // Event exists, evaluate if it has fundamentally changed
                if (existingEvent.contentHash !== rawEvent.contentHash) {
                    // Event changed, perform full update

                    // Check if image changed and requires uploading
                    if (rawEvent.imageUrl && rawEvent.imageUrl !== existingEvent.imageUrl && !rawEvent.imageUrl.includes('res.cloudinary.com')) {
                        rawEvent.imageUrl = await ImageUpload.uploadExternalImage(rawEvent.imageUrl);
                    }

                    // Note: our pre-save hook in the Event model will automatically flip 
                    // the status to 'updated' if critical fields change
                    Object.assign(existingEvent, rawEvent);
                    existingEvent.lastScrapedAt = currentScrapeRun;

                    await existingEvent.save();
                    stats.updated++;
                } else {
                    // Event matches completely, just update the ping timestamp
                    existingEvent.lastScrapedAt = currentScrapeRun;
                    await existingEvent.save();
                    stats.unchanged++;
                }
            }
        }

        // After resolving all current events from this source,
        // find any events previously fetched from this source that were NOT seen in this run.
        console.log(`[SyncService] Scanning for stale events from ${sourceWebsite}...`);

        // An event is stale if its sourceWebsite matches, but its lastScrapedAt is older than this run.
        // We add a tiny buffer (e.g. 5 seconds ago) to account for rapid subsequent runs or slow DB updates
        const stalenessThreshold = new Date(currentScrapeRun.getTime() - 5000);

        const staleResult = await Event.updateMany(
            {
                sourceWebsite: sourceWebsite,
                lastScrapedAt: { $lt: stalenessThreshold }
            },
            {
                $set: { status: 'inactive' }
            }
        );

        stats.markedInactive = staleResult.modifiedCount;

        console.log(`[SyncService] Sync complete for ${sourceWebsite}. Stats:`, stats);
        return stats;
    }
}

export default EventSyncService;
