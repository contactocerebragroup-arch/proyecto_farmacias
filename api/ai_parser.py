import os
import json
import google.generativeai as genai
import structlog

logger = structlog.get_logger()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def parse_prices_with_ai(html_content: str):
    """
    Uses Gemini 1.5-flash to extract product prices from HTML.
    """
    if not api_key:
        logger.error("GEMINI_API_KEY not set")
        return []

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            "Extrae JSON lista [{'producto': str, 'precio': float en CLP}] de este HTML "
            "geolocalizado Chile. Ignora publicidad, menús o elementos no relevantes. "
            "Devuelve SOLO el JSON, sin bloques de código."
        )
        
        # We truncate HTML if it's too large for a simple call, but Gemini usually handles it well.
        response = model.generate_content(f"{prompt}\n\nHTML: {html_content[:30000]}")
        
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(cleaned_response)
        
        logger.info("Parsed data successfully", count=len(data))
        return data
    except Exception as e:
        logger.error("Error parsing with Gemini", error=str(e))
        return []
