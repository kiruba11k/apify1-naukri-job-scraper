import { Actor } from 'apify';

await Actor.init();

// 1. Fetch user input
const input = await Actor.getInput() || {};

// 2. Map input to the Naukri Scraper format
const scraperInput = {
    searchQuery: input.searchQuery || "developer",
    location: input.location || "india",
    maximumJobs: input.maximumJobs || 20,
    platform: input.platform || "naukri",
    startUrls: input.startUrls || [],
    includeAmbitionBoxDetails: input.includeAmbitionBoxDetails || false,
    proxy: input.proxy || {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
    }
};

console.log(`--- Starting Naukri Scraper: ${scraperInput.searchQuery} ---`);

try {
    // 3. Call the underlying scraper
    const run = await Actor.call('memo23/naukri-scraper', scraperInput);

    if (run.status === 'SUCCEEDED') {
        console.log(`Scraper finished. Run ID: ${run.id}`);

        // 4. Retrieve results
        const { items } = await Actor.apifyClient.run(run.id).dataset().listItems({
            limit: 99999,
        });

        console.log(`Filtering ${items.length} items to requested fields...`);

        // 5. Filter and Map to your specific requested fields
        const filteredItems = items.map((item) => ({
            url: item.jdURL || item.applyUrl,
            title: item.title,
            staticCompanyName: item.companyName,
            companyPageUrl: item.companyDetails?.url || null,
            locations: item.locations || item.location,
            createdDate: item.postedOn,
            brandingTags: item.tagsAndSkills || [],
            description: item.jobDescription || item.description,
            shortDescription: item.placeholders?.find(p => p.type === 'snippet')?.label || "",
            applyCount: item.applicantsCount || "0",
        }));

        // 6. Push the cleaned data to your dataset
        await Actor.pushData(filteredItems);
        
        console.log('--- Process Complete ---');
    } else {
        await Actor.fail(`The Naukri scraper failed. Check run ${run.id}`);
    }
} catch (error) {
    await Actor.fail(`Error: ${error.message}`);
}

await Actor.exit();
