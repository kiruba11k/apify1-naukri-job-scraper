# Naukri Job Scraper (Apify Actor Wrapper)

This project is an Apify Actor that calls the public actor **`memo23/naukri-scraper`**, then normalizes the output into a cleaner and consistent dataset format.

It is designed for Apify usage: you provide search input (keyword, location, max jobs, etc.), the actor runs the underlying scraper, and pushes filtered job records to the dataset.

## What this actor does

1. Initializes the Apify Actor runtime.
2. Reads input from `Actor.getInput()`.
3. Builds scraper input with defaults.
4. Calls `memo23/naukri-scraper`.
5. Reads the run dataset items.
6. Maps each item to a compact output schema.
7. Pushes normalized results to this actor's dataset.

## Project structure

- `main.js` - Actor logic (input mapping, scraper call, output transformation).
- `package.json` - Node package metadata and runtime dependencies.
- `Dockerfile` - Container image definition used to run the actor.

## Runtime and dependencies

- **Node.js** via `apify/actor-node:20` Docker base image.
- **Main dependency:** `apify` (JavaScript SDK).
- **Start command:** `npm start` (runs `node main.js`).

## Input

The actor accepts the following input fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `searchQuery` | string | `"developer"` | Keyword/job title query. |
| `location` | string | `"india"` | Target location for jobs. |
| `maximumJobs` | number | `20` | Maximum jobs requested from underlying scraper. |
| `platform` | string | `"naukri"` | Platform passed to underlying scraper. |
| `startUrls` | array | `[]` | Optional start URLs for scraping. |
| `includeAmbitionBoxDetails` | boolean | `false` | Whether to include AmbitionBox-related details from source actor. |
| `proxy` | object | `{ useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] }` | Proxy setup passed to source actor. |

### Example input

```json
{
  "searchQuery": "data scientist",
  "location": "Bengaluru",
  "maximumJobs": 50,
  "platform": "naukri",
  "startUrls": [],
  "includeAmbitionBoxDetails": false,
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

## Output dataset schema

Each output item is normalized to the fields below:

- `companyName`
- `applyCount`
- `roleCategory`
- `jobRole`
- `companyDetail`
- `functionalArea`
- `description`
- `industry`
- `url`
- `title`
- `walkIn`
- `maximumExperience`
- `minimumExperience`
- `locations`
- `keySkills`
- `shortDescription`

### Field mapping notes

- `companyName` prefers `item.companyDetail.name`, then `item.staticCompanyName`.
- `description` prefers `item.jobDescription`, then `item.description`.
- `url` prefers `item.staticUrl`, then `item.jdURL`, then `item.applyUrl`.
- `locations` is taken from `item.locations` or fallback `item.location`.
- `keySkills` is taken from `item.tagsAndSkills` or fallback `item.keySkills`.

## How to run

### On Apify

1. Create/import this actor on Apify.
2. Set your actor input JSON.
3. Run the actor.
4. Open the run dataset to get normalized job records.

### Locally

```bash
npm install
npm start
```

> Note: local execution still requires proper Apify environment configuration and access to call the external actor `memo23/naukri-scraper`.

## Docker

The Docker image:

- uses `apify/actor-node:20`,
- installs production dependencies,
- copies project files,
- starts with `npm start`.

## Error handling behavior

- If the called scraper run is not `SUCCEEDED`, the actor fails with run ID details.
- Any runtime exception is caught and reported using `Actor.fail`.

## Important limitations

- This actor is a **wrapper** around `memo23/naukri-scraper`; scraping quality/coverage depends on that actor.
- Output fields are transformed and may omit source fields not included in the mapping.
- Current fetch limit for reading items from the source dataset is `99999`.

## Script entrypoint

- Main entrypoint: `main.js`
- NPM script: `npm start`
