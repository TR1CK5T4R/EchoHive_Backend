import puppeteer from 'puppeteer';
import BaseScraper from './baseScraper.js';

class Site2Scraper extends BaseScraper {
    constructor() {
        super('Site2_DynamicTarget', 'https://example.com/dynamic-events');
    }

    /**
     * Dynamic scraping using Headless Chrome (Puppeteer)
     */
    async fetchEvents() {
        let browser = null;

        try {
            // 1. Launch headless sandbox
            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 2. Add realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');

            // 3. Navigate and wait for JS hydration (network idle)
            console.log(`[Puppeteer] Navigating to ${this.baseUrl}...`);
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

            // 4. Extract data within the browser execution context
            const rawEvents = await page.evaluate(() => {
                const events = [];
                const nodes = document.querySelectorAll('.dynamic-event-row');

                nodes.forEach(node => {
                    const titleEl = node.querySelector('h2');
                    const linkEl = node.querySelector('a');

                    if (titleEl && linkEl) {
                        events.push({
                            title: titleEl.innerText || '',
                            description: node.querySelector('.summary')?.innerText || '',
                            dateTime: node.querySelector('.date-time')?.getAttribute('data-timestamp') || new Date().toISOString(),
                            venueName: node.querySelector('.location-name')?.innerText || '',
                            originalEventUrl: linkEl.href || ''
                        });
                    }
                });

                return events;
            });

            return rawEvents;

        } catch (error) {
            console.error(`[Puppeteer] Failed to scrape ${this.baseUrl}: ${error.message}`);
            throw error;
        } finally {
            // 5. Hard ensure browser closes to prevent memory leaks
            if (browser) {
                await browser.close();
            }
        }
    }
}

export default new Site2Scraper();
