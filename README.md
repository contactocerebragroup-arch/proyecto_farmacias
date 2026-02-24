# EcoFarmacias Monitoring App

## Setup Instructions

### 1. Vercel Deployment
1. Create a new repository on GitHub and push this code.
2. Link the repository to a new project in the [Vercel Dashboard](https://vercel.com/new).
3. The `vercel.json` will automatically configure the Python backend and React frontend.

### 2. Environment Variables
Add the following in Vercel Project Settings > Environment Variables:
- `GEMINI_API_KEY`: Google AI Studio API Key.
- `APP_API_KEY`: Secret key for `/api/scrape`.
- `DATABASE_URL`: PostgreSQL connection string (Neon.tech).
- `REDIS_URL`: Upstash Redis connection string (e.g., `redis://default:xxx@xxx.upstash.io:6379`).

### 3. Upstash Redis Setup
1. Create a free database at [Upstash](https://upstash.com/).
2. Copy the `REDIS_URL` from the dashboard.
3. Caching is automatic: scraped results are cached for 1 hour to ensure <1s response times.

### 4. Cron Jobs
The Cron Job is defined in `vercel.json` to run every hour (`0 * * * *`). It triggers the parallel async scraper. Ensure `APP_API_KEY` matches the one in your environment.

### 5. Frontend Features
- **Auto-Refresh**: Every 5 minutes the dashboard polls for new data.
- **Skeletons**: Layout stability during background fetches.
- **Fuzzy Search**: Filter by name or pharmacy in real-time.

## API Endpoints
- `GET /api/prices`: Returns the list of latest prices.
- `POST /api/scrape`: Triggers a new scrape. Requires `X-API-Key` header.
