# EcoFarmacias Monitoring App

## Setup Instructions

### 1. Vercel Deployment
1. Create a new repository on GitHub and push this code.
2. Link the repository to a new project in the [Vercel Dashboard](https://vercel.com/new).
3. The `vercel.json` will automatically configure the Python backend and React frontend.

### 2. Environment Variables
Add the following variables in Vercel Project Settings > Environment Variables:
- `GEMINI_API_KEY`: Your Google AI Studio API Key.
- `APP_API_KEY`: A secret key for protecting the `/api/scrape` endpoint.
- `DATABASE_URL`: Your PostgreSQL connection string (e.g., from Neon.tech).

### 3. Cron Jobs
The Cron Job is defined in `vercel.json` to run every hour (`0 * * * *`). It will hit `/api/scrape`. Note that on Vercel, Cron Jobs require the `X-API-Key` to be handled via the `Authorization` header or passed appropriately if you want to protect it, but Vercel Cron Jobs can also be secured by checking the `X-Vercel-Cron` header.

### 4. Local Development
1. **Backend**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   # Run locally (requires .env file)
   uvicorn api.index:app --reload
   ```
2. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

## API Endpoints
- `GET /api/prices`: Returns the list of latest prices.
- `POST /api/scrape`: Triggers a new scrape. Requires `X-API-Key` header.
