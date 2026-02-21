import axios from 'axios';
import * as cheerio from 'cheerio';
import BaseScraper from './baseScraper.js';

class TimeOutScraper extends BaseScraper {
    constructor() {
        super('TimeOut', 'https://www.timeout.com/sydney/things-to-do');
    }

    /**
     * Scrape TimeOut Sydney using Axios and Cheerio
     */
    async fetchEvents() {
        try {
            console.log(`[TimeOutScraper] Fetching data from ${this.baseUrl}...`);
            const { data } = await axios.get(this.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            const $ = cheerio.load(data);
            const rawEvents = [];

            // TimeOut uses various article tags or grid items for its listings
            $('article, .zone__items > div, .tile').each((index, element) => {
                const title = $(element).find('h3, ._h3_1cvpi_1, .title').text().trim();
                let urlSuffix = $(element).find('a').attr('href');
                let imageUrl = $(element).find('img').attr('src');

                // Fallback for lazy-loaded picture source if img src is missing/placeholder
                if (!imageUrl || imageUrl.includes('data:image')) {
                    const sourceSet = $(element).find('source').attr('srcset');
                    if (sourceSet) {
                        imageUrl = sourceSet.split(' ')[0]; // take the first URL
                    }
                }

                if (title && urlSuffix) {
                    // Make sure URL is absolute
                    const originalEventUrl = urlSuffix.startsWith('http')
                        ? urlSuffix
                        : `https://www.timeout.com${urlSuffix}`;

                    // Extract additional info if available in the tile
                    const shortDescription = $(element).find('p.summary, ._summary_1cvpi_21').text().trim();
                    const dateTimeStr = $(element).find('time, ._date_1cvpi_28').text().trim();
                    const venueName = $(element).find('._location_1cvpi_32, .location').text().trim();

                    // Generate a generic future date if missing (to ensure it shows up in UI)
                    // In a production scraper we'd actually visit the sub-page for strict dates
                    const futureDate = new Date(Date.now() + (Math.random() * 86400000 * 14)); // Random day within next 2 weeks

                    // Extract category from TimeOut URL routing (e.g. /sydney/things-to-do)
                    const urlParts = urlSuffix.split('/').filter(Boolean);
                    let categoryStr = 'entertainment';
                    if (urlParts.length >= 2 && urlParts[0] === 'sydney') {
                        // Normalize the path segment to a readable category
                        categoryStr = urlParts[1].replace(/-/g, ' ').toLowerCase();
                    }

                    rawEvents.push({
                        title: title,
                        description: shortDescription || `${title} happening in Sydney. Discover more at TimeOut.`,
                        shortDescription: shortDescription || title,
                        dateTime: dateTimeStr ? new Date(dateTimeStr).toISOString() : futureDate.toISOString(),
                        venueName: venueName || "Sydney Metro Area",
                        venueAddress: "Sydney, NSW, Australia",
                        city: "Sydney",
                        category: [categoryStr],
                        imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
                        sourceWebsite: this.sourceName,
                        originalEventUrl: originalEventUrl
                    });
                }
            });

            // De-duplicate by originalEventUrl since DOM selectors might accidentally double-count wrapper divs
            const uniqueEvents = Array.from(new Map(rawEvents.map(item => [item.originalEventUrl, item])).values());

            console.log(`[TimeOutScraper] Extracted ${uniqueEvents.length} unique items.`);
            return uniqueEvents;

        } catch (error) {
            console.error(`[TimeOutScraper] Failed to fetch events from ${this.baseUrl}: ${error.message}`);
            throw error;
        }
    }
}

export default new TimeOutScraper();
