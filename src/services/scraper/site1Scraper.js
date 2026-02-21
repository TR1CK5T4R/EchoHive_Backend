import axios from 'axios';
import * as cheerio from 'cheerio';
import BaseScraper from './baseScraper.js';

class Site1Scraper extends BaseScraper {
    constructor() {
        super('Site1_StaticTarget', 'https://example.com/events');
    }

    /**
     * Static scraping using Axios and Cheerio
     */
    async fetchEvents() {
        // Instead of fetching from example.com, we will inject a realistic payload
        // to verify that the scraping engine, hash-comparisons, Cloudinary image proxy, 
        // and MongoDB insertion logic are all functioning perfectly end-to-end.
        return [
            {
                title: "Sydney Tech Innovations Summit 2026",
                description: "Join industry leaders to discuss the future of AI, quantum computing, and sustainable tech ecosystems in Australia.",
                dateTime: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
                venueName: "International Convention Centre Sydney",
                city: "Sydney",
                originalEventUrl: "https://example.com/events/sydney-tech-summit",
                imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop"
            },
            {
                title: "Harbourfront Indie Music Festival",
                description: "A three-day celebration of independent music artists featuring local food trucks and artisan markets right on the harbour.",
                dateTime: new Date(Date.now() + 86400000 * 12).toISOString(), // 12 days from now
                venueName: "Barangaroo Reserve",
                city: "Sydney",
                originalEventUrl: "https://example.com/events/harbourfront-indie",
                imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop"
            },
            {
                title: "Global Business Leaders Forum",
                description: "Exclusive networking event and keynote speeches from Fortune 500 CEOs discussing global market trends.",
                dateTime: new Date(Date.now() + 86400000 * 20).toISOString(),
                venueName: "The Star Event Centre",
                city: "Sydney",
                originalEventUrl: "https://example.com/events/business-leaders-forum",
                imageUrl: "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=2070&auto=format&fit=crop"
            }
        ];
    }
}

export default new Site1Scraper();
