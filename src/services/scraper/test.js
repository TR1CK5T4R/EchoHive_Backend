import timeoutScraper from './timeoutScraper.js';

async function runTest() {
    console.log('--- Starting Isolated Scraper Test ---');
    try {
        const events = await timeoutScraper.scrape();
        console.log(`\n✅ Scraper successfully extracted ${events.length} events!\n`);

        console.log('--- First 3 Events ---');
        console.log(JSON.stringify(events.slice(0, 3), null, 2));

        console.log('\n--- Final Structure Check ---');
        if (events.length > 0) {
            const sample = events[0];
            const requiredKeys = ['title', 'description', 'shortDescription', 'dateTime', 'venueName', 'city', 'category', 'imageUrl', 'sourceWebsite', 'originalEventUrl'];
            const missing = requiredKeys.filter(k => !sample[k]);

            if (missing.length === 0) {
                console.log('✅ All required keys are present.');
            } else {
                console.error('❌ Missing keys:', missing);
            }
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTest();
