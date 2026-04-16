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

        console.log(`Filtering ${items.length} items to requested columns...`);

        // 5. Transform and filter items with split-error protection
        const filteredItems = items.map((item) => {
            // Safe extraction for Company Name
            const rawDetail = String(item.companyDetail || ""); 
            const extractedName = rawDetail.split('|')[0].replace(/["']/g, "").trim();

            return {
                companyName: extractedName || item.companyName || "N/A",
                applyCount: item.applicantsCount || "0",
                roleCategory: item.roleCategory || "",
                jobRole: item.jobRole || "",
                companyDetail: item.companyDetail || "",
                shortDescription: item.placeholders?.find(p => p.type === 'snippet')?.label || "",
                functionalArea: item.functionalArea || "",
                description: item.jobDescription || item.description || "",
                staticCompanyName: item.companyName || "",
                industry: item.industry || "",
                staticUrl: item.staticUrl || "",
                title: item.title || "",
                walkIn: item.walkIn || false,
                maximumExperience: item.maximumExperience || "",
                minimumExperience: item.minimumExperience || "",
                locations: item.locations || item.location || "",
                keySkills: item.tagsAndSkills || item.keySkills || "",
                url: item.jdURL || item.applyUrl || ""
            };
        });

        // 6. Push cleaned data to current dataset
        await Actor.pushData(filteredItems);
        
        console.log('--- Process Complete ---');
    } else {
        await Actor.fail(`The Naukri scraper failed. Check run ${run.id}`);
    }
} catch (error) {
    await Actor.fail(`Error: ${error.message}`);
}

await Actor.exit();
