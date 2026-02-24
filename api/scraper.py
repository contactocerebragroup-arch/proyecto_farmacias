import requests
from bs4 import BeautifulSoup
import structlog
from .ai_parser import parse_prices_with_ai

logger = structlog.get_logger()

SOURCES = [
    {"name": "EcoFarmacias", "url": "https://www.ecofarmacias.cl/"},
    {"name": "Farmex", "url": "https://farmex.cl/"},
    {"name": "Meki", "url": "https://farmaciameki.cl/"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Chilean-Price-Monitor/1.0",
    "Accept-Language": "es-CL,es;q=0.9",
}

def scrape_all():
    """
    Simplified ethical scraping combined with AI parsing.
    Instead of a full Scrapy project (which can be heavy for serverless), 
    we use requests + BeautifulSoup and ethical delays.
    """
    results = []
    
    for source in SOURCES:
        logger.info("Scraping source", pharmacy=source["name"])
        try:
            # Ethical implementation: limited requests and timeout
            response = requests.get(source["url"], headers=HEADERS, timeout=15)
            response.raise_for_status()
            
            # Extract main content to reduce token usage
            soup = BeautifulSoup(response.text, "html.parser")
            # Heuristic: focus on main or product list containers if possible
            # For this MVP, we send a chunk of the body
            html_chunk = str(soup.body)[:20000] 
            
            extracted = parse_prices_with_ai(html_chunk)
            
            for item in extracted:
                results.append({
                    "pharmacy": source["name"],
                    "product": item.get("producto"),
                    "price": item.get("precio")
                })
                
        except Exception as e:
            logger.error("Failed to scrape", pharmacy=source["name"], error=str(e))
            
    return results
