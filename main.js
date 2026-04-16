import { Actor } from 'apify';

await Actor.init();

const input = await Actor.getInput() || {};

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
    const run = await Actor.call('memo23/naukri-scraper', scraperInput);

    if (run.status === 'SUCCEEDED') {
        const { items } = await Actor.apifyClient.run(run.id).dataset().listItems({
            limit: 99999,
        });

        const filteredItems = items.map((item) => {
            // Logic to separate Company Name from companyDetail
            // It splits by the pipe symbol | and takes the first part
            const rawDetail = item.companyDetail || "";
            const extractedCompanyName = rawDetail.split('|')[0].replace(/["']/g, "").trim();

            return {
                companyName: extractedCompanyName, // New separated column
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

        await Actor.pushData(filteredItems);
        console.log(`--- Process Complete: ${filteredItems.length} items saved ---`);
    } else {
        await Actor.fail(`Scraper failed. Status: ${run.status}`);
    }
} catch (error) {
    await Actor.fail(error.message);
}

await Actor.exit();
