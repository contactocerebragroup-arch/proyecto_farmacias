import asyncio
import httpx
import os
from api.scraper import fetch_manual_url

async def main():
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            print("Fetching Cruz Verde...")
            results = await fetch_manual_url(client, "https://www.cruzverde.cl/", retries=1)
            print(f"Results: {results}")
    except Exception as e:
        print(f"Fatal error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
