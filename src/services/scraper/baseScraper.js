import EventNormalizer from '../../utils/eventNormalizer.js';

/**
 * Base abstract class for all event scrapers.
 */
class BaseScraper {
    constructor(sourceName, baseUrl) {
        this.sourceName = sourceName;
        this.baseUrl = baseUrl;
        if (this.constructor === BaseScraper) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * Main execution method that subclasses should override or wrap.
     * @returns {Promise<Array>} Array of normalized events.
     */
    async scrape() {
        console.log(`[${this.sourceName}] Starting scraper...`);
        try {
            const rawEvents = await this.fetchEvents();
            const normalizedEvents = rawEvents.map(event => this.normalizeEvent(event));
            console.log(`[${this.sourceName}] Successfully scraped ${normalizedEvents.length} events.`);
            return normalizedEvents;
        } catch (error) {
            console.error(`[${this.sourceName}] Scraping failed:`, error.message);
            // Depending on architectural requirements, we can notify monitoring services here.
            return []; // Return empty array to fail gracefully 
        }
    }

    /**
     * Fetches raw event data. Must be implemented by subclass.
     */
    async fetchEvents() {
        throw new Error('Method fetchEvents() must be implemented by subclass');
    }

    /**
     * Normalizes a single raw event object utilizing the EventNormalizer utility.
     */
    normalizeEvent(rawEvent) {
        try {
            return EventNormalizer.normalize(rawEvent, this.sourceName);
        } catch (error) {
            console.warn(`[${this.sourceName}] Skipping malformed event: ${error.message}`);
            return null;
        }
    }
}

export default BaseScraper;
