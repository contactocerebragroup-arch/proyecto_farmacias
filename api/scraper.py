import os
import asyncio
import httpx
import redis
import structlog
from bs4 import BeautifulSoup
from .ai_parser import parse_prices_with_ai

logger = structlog.get_logger()

# Upstash Redis Configuration
REDIS_URL = os.getenv("REDIS_URL")
cache = None
if REDIS_URL:
    try:
        cache = redis.from_url(REDIS_URL, decode_responses=True)
        logger.info("Connected to Redis cache")
    except Exception as e:
        logger.error("Redis connection failed", error=str(e))

SOURCES = [
    {"name": "EcoFarmacias", "url": "https://www.ecofarmacias.cl/"},
    {"name": "Farmex", "url": "https://farmex.cl/"},
    {"name": "Meki", "url": "https://farmaciameki.cl/"},
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

async def fetch_with_retry(client, source, retries=3):
    """
    Fetches URL with exponential backoff and rotative User-Agent.
    """
    url = source["url"]
    
    # Check cache
    if cache:
        cached_data = cache.get(f"scrape:{url}")
        if cached_data:
            logger.info("Cache hit", source=source["name"])
            import json
            return json.loads(cached_data)

    for i in range(retries):
        try:
            headers = {
                "User-Agent": USER_AGENTS[i % len(USER_AGENTS)],
                "Accept-Language": "es-CL,es;q=0.9",
                "Referer": "https://www.google.cl/",
            }
            response = await client.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Basic parsing to extract relevant HTML chunk
            soup = BeautifulSoup(response.text, "html.parser")
            html_chunk = str(soup.body)[:25000]
            
            # AI Parsing
            extracted = parse_prices_with_ai(html_chunk)
            
            # Normalize and post-process
            results = []
            for item in extracted:
                name = item.get("producto", "").strip()
                price = item.get("precio", 0)
                if name and price > 0:
                    results.append({
                        "pharmacy": source["name"],
                        "product": name,
                        "price": float(price),
                        "stock": str(item.get("stock", "N/A")),
                        "url": item.get("url", ""),
                    })
            
            # Cache results for 1 hour
            if cache and results:
                import json
                cache.setex(f"scrape:{url}", 3600, json.dumps(results))
                
            return results
            
        except Exception as e:
            wait_time = 2 ** i
            logger.warn("Retry failed", source=source["name"], retry=i, wait=wait_time, error=str(e))
            if i < retries - 1:
                await asyncio.sleep(wait_time)
            else:
                logger.error("All retries failed", source=source["name"])
                return []

async def fetch_manual_url(client, url, retries=3):
    """
    Fetches a specific URL provided by the user and extracts prices.
    """
    if cache:
        cached_data = cache.get(f"manual:{url}")
        if cached_data:
            import json
            return json.loads(cached_data)

    for i in range(retries):
        try:
            headers = {
                "User-Agent": USER_AGENTS[i % len(USER_AGENTS)],
                "Accept-Language": "es-CL,es;q=0.9",
            }
            response = await client.get(url, headers=headers, timeout=12)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            html_chunk = str(soup.body)[:28000]
            
            extracted = parse_prices_with_ai(html_chunk)
            
            results = []
            for item in extracted:
                name = item.get("producto", "").strip()
                price = item.get("precio", 0)
                if name and price > 0:
                    results.append({
                        "pharmacy": "Manual Scraped",
                        "product": name,
                        "price": float(price),
                        "stock": str(item.get("stock", "N/A")),
                        "url": url,
                    })
            
            if cache and results:
                import json
                cache.setex(f"manual:{url}", 3600, json.dumps(results))
                
            return results
        except Exception as e:
            await asyncio.sleep(2 ** i)
    return []

async def scrape_geo_async(lat, lon):
    """
    Scrapes popular retail sites with geolocalized context.
    For this MVP, we use our current sources but could expand.
    """
    logger.info("Scraping with geo context", lat=lat, lon=lon)
    # We could use lat/lon to decide which local sites to scrape
    # For now, we reuse the parallel scraper but could add geo-specific headers
    return await scrape_all_async()

async def scrape_all_async():
    """
    Runs all scrapers in parallel using asyncio.
    """
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [fetch_with_retry(client, source) for source in SOURCES]
        results_nested = await asyncio.gather(*tasks)
        
        all_results = [item for sublist in results_nested for item in sublist]
        
        # Deduplication and Sorting
        seen = set()
        unique_results = []
        for res in all_results:
            key = f"{res['pharmacy']}:{res['product'].lower()}"
            if key not in seen:
                seen.add(key)
                unique_results.append(res)
        
        unique_results.sort(key=lambda x: x["price"])
        return unique_results
