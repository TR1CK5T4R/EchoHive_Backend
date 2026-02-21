import crypto from 'crypto';

/**
 * Standardizes scraped event data across different parsers before interacting with MongoDB.
 */
class EventNormalizer {
    /**
     * Normalizes raw scraped event input
     * @param {Object} rawData - Unfiltered scraped data
     * @param {String} sourceWebsite - The website identifier origin
     * @returns {Object} Normalized event object
     */
    static normalize(rawData, sourceWebsite) {
        if (!rawData.title || !rawData.originalEventUrl) {
            throw new Error(`Invalid event data from ${sourceWebsite}: missing title or URL.`);
        }

        const normalized = {
            title: rawData.title.trim(),
            description: rawData.description ? rawData.description.trim() : '',
            shortDescription: rawData.shortDescription ? rawData.shortDescription.trim() : '',
            dateTime: rawData.dateTime ? new Date(rawData.dateTime) : null,
            venueName: rawData.venueName ? rawData.venueName.trim() : 'TBA',
            venueAddress: rawData.venueAddress ? rawData.venueAddress.trim() : '',
            city: rawData.city ? rawData.city.trim() : 'Sydney',
            category: Array.isArray(rawData.category)
                ? rawData.category.map(c => c.trim())
                : (rawData.category ? [rawData.category.trim()] : []),
            imageUrl: rawData.imageUrl || '',
            sourceWebsite: sourceWebsite,
            originalEventUrl: rawData.originalEventUrl.trim(),
            lastScrapedAt: new Date(),
        };

        // Create a deterministic hash of the core content to detect updates later
        const hashString = `
      ${normalized.title}-
      ${normalized.description}-
      ${normalized.dateTime ? normalized.dateTime.toISOString() : ''}-
      ${normalized.venueName}-
      ${normalized.imageUrl}-
      ${normalized.category.join(',')}
    `;

        normalized.contentHash = crypto.createHash('sha256').update(hashString).digest('hex');

        return normalized;
    }
}

export default EventNormalizer;
