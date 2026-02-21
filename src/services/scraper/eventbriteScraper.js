import puppeteer from 'puppeteer';
import BaseScraper from './baseScraper.js';

class EventbriteScraper extends BaseScraper {
    constructor() {
        super('Eventbrite', 'https://www.eventbrite.com.au/d/australia--sydney/events/');
    }

    /**
     * Introduce an artificial delay to prevent rate-limiting/blocking
     */
    async delay(minMs, maxMs) {
        const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Dynamic scraping using Headless Chrome (Puppeteer)
     */
    async fetchEvents() {
        let browser = null;

        try {
            console.log(`[EventbriteScraper] Launching Puppeteer...`);
            // 1. Launch headless sandbox
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--window-size=1920,1080'
                ]
            });

            const page = await browser.newPage();

            // 2. Add realistic user agent and override navigator.webdriver to bypass basic bot detection
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
            });

            // 3. Navigate and wait for network idle to ensure JS hydration finishes
            console.log(`[EventbriteScraper] Navigating to ${this.baseUrl}...`);
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });

            // 4. Scroll through the page slowly to trigger lazy-loaded images and dynamic content
            console.log(`[EventbriteScraper] Scrolling to load lazy content...`);
            await this.autoScroll(page);

            // Give it one final moment to render any last-second fetched images
            await this.delay(1500, 2500);

            // 5. Extract data within the browser execution context
            console.log(`[EventbriteScraper] Extracting event nodes...`);

            const rawEvents = await page.evaluate(() => {
                const events = [];
                // Eventbrite heavily uses dynamic react classes, but generally wraps cards in a standard struct
                const nodes = document.querySelectorAll('section.event-card-details, .discover-search-desktop-card, div[data-testid="event-card"]');

                nodes.forEach(node => {
                    // Title usually sits in an h3
                    const titleEl = node.querySelector('h3, h2.Typography_root__487rx');
                    const title = titleEl ? titleEl.innerText.trim() : '';

                    // Event links might be wrapping the whole card or just the title
                    const linkEl = node.closest('a') || node.querySelector('a');
                    const link = linkEl ? linkEl.href : '';

                    // Get Image (could be img tag, or background-image)
                    const imgEl = node.querySelector('img.event-card-image, img');
                    const image = imgEl ? (imgEl.src || imgEl.dataset.src || '') : '';

                    // Dates often have their own specific typography tags
                    const dateEl = node.querySelector('p.Typography_body-md__487rx, .event-card__date');
                    const rawDate = dateEl ? dateEl.innerText.trim() : '';

                    // Venue/Location
                    const locationEls = node.querySelectorAll('p.Typography_body-md__487rx');
                    // Often the 2nd paragraph is the location if the 1st was the date
                    const location = locationEls.length > 1 ? locationEls[1].innerText.trim() : 'Sydney Region';

                    if (title && link) {
                        events.push({
                            title,
                            originalUrl: link,
                            imageUrl: image,
                            rawDate,
                            location
                        });
                    }
                });

                return events;
            });

            // 6. Normalize the raw payloads into our strict Schema format natively in Node.js
            const normalizedEvents = [];
            const futureDateBase = Date.now();

            for (let i = 0; i < rawEvents.length; i++) {
                const e = rawEvents[i];

                // Construct a fallback future date
                const fallbackDate = new Date(futureDateBase + (i * 86400000)).toISOString();

                let isoDate = fallbackDate;
                // Attempt basic parsing of Eventbrite string dates (e.g., "Tomorrow at 6:00 PM", "Sat, Mar 12 7:00 PM")
                if (e.rawDate) {
                    try {
                        const parsed = new Date(e.rawDate);
                        if (!isNaN(parsed.getTime())) {
                            isoDate = parsed.toISOString();
                        }
                    } catch (err) {
                        // ignore and use fallback
                    }
                }

                // Clean tracking parameters from Eventbrite URLs
                const cleanUrl = e.originalUrl.split('?')[0];

                // Map categories heuristically from title context since Eventbrite hides deep tags
                let categoryStr = 'community';
                const t = e.title.toLowerCase();
                if (t.includes('music') || t.includes('dj') || t.includes('festival') || t.includes('concert') || t.includes('live')) {
                    categoryStr = 'music';
                } else if (t.includes('art') || t.includes('comedy') || t.includes('film') || t.includes('theatre') || t.includes('show')) {
                    categoryStr = 'arts & culture';
                } else if (t.includes('food') || t.includes('drink') || t.includes('wine') || t.includes('beer') || t.includes('tasting')) {
                    categoryStr = 'food & drink';
                } else if (t.includes('tech') || t.includes('data') || t.includes('code') || t.includes('startup') || t.includes('hackathon')) {
                    categoryStr = 'technology';
                } else if (t.includes('sport') || t.includes('run') || t.includes('fitness') || t.includes('yoga') || t.includes('match')) {
                    categoryStr = 'sports & fitness';
                } else if (t.includes('business') || t.includes('networking') || t.includes('career') || t.includes('expo') || t.includes('meetup')) {
                    categoryStr = 'business';
                }

                normalizedEvents.push({
                    title: e.title,
                    description: `Eventbrite Experience: ${e.title} happening in Sydney.`,
                    shortDescription: e.title,
                    dateTime: isoDate,
                    venueName: e.location || 'Sydney Location TBA',
                    venueAddress: 'Sydney, NSW, Australia',
                    city: 'Sydney',
                    category: [categoryStr],
                    imageUrl: e.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop",
                    sourceWebsite: this.sourceName,
                    originalEventUrl: cleanUrl
                });
            }

            // De-duplicate in case selectors overlap
            const uniqueEvents = Array.from(new Map(normalizedEvents.map(item => [item.originalEventUrl, item])).values());

            console.log(`[EventbriteScraper] Extracted ${uniqueEvents.length} unique items.`);
            return uniqueEvents;

        } catch (error) {
            console.error(`[EventbriteScraper] Failed to scrape ${this.baseUrl}: ${error.message}`);
            throw error;
        } finally {
            if (browser) {
                console.log(`[EventbriteScraper] Closing headless browser instance.`);
                await browser.close();
            }
        }
    }

    /**
     * Helper script injected into the page to smoothly scroll down and trigger lazy loaded images
     */
    async autoScroll(page) {
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 100; // scroll 100px at a time
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    // Stop scrolling if we've hit the bottom, or just scrolled enough limits (around 4000px)
                    if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 150); // wait 150ms between scrolls (acts as built-in slowdown bot evasion)
            });
        });
    }
}

export default new EventbriteScraper();
