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

console.log(`--- Starting Naukri Scraper for: ${scraperInput.searchQuery} ---`);

try {
    // 3. Call the memo23/naukri-scraper
    const run = await Actor.call('memo23/naukri-scraper', scraperInput);

    if (run.status === 'SUCCEEDED') {
        console.log(`Scraper finished. Run ID: ${run.id}`);

        // 4. Retrieve results
        const { items } = await Actor.apifyClient.run(run.id).dataset().listItems({
            limit: 99999,
        });

        console.log(`Filtering ${items.length} items...`);

        // 5. Filter for clean output (specific columns)
        const filteredItems = items.map((item) => ({
            jobId: item.jobId,
            title: item.title,
            companyName: item.companyName,
            location: item.location,
            experience: item.experience,
            salary: item.salary,
            postedOn: item.postedOn,
            description: item.jobDescription || item.description,
            skills: item.tagsAndSkills || item.skills,
            applyLink: item.applyUrl || item.jdURL,
            platform: item.platform || scraperInput.platform,
            companyWebsite: item.companyWebsite || null,
        }));

        // 6. Push to your dataset
        await Actor.pushData(filteredItems);
        
        console.log('--- Process Complete ---');
    } else {
        await Actor.fail(`The Naukri scraper failed. Check run ${run.id}`);
    }
} catch (error) {
    await Actor.fail(`Error: ${error.message}`);
}

await Actor.exit();
