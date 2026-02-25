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
        raise RuntimeError("GEMINI_API_KEY is not configured in Vercel environment.")

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = (
            "Actúa como un experto en extracción de datos para e-commerce chileno. "
            "Extrae una lista JSON de productos del HTML proporcionado. "
            "Formato: [{'producto': str, 'precio': float, 'stock': str, 'url': str}] "
            "\n\nInstrucciones críticas:"
            "\n1. El precio debe ser un float (extrae números de '$ 14.990' -> 14990.0)."
            "\n2. El stock debe indicar si está disponible ('Disponible', 'Sin Stock' o texto descriptivo)."
            "\n3. Normaliza el nombre del producto (capitalización estándar)."
            "\n4. Extrae la URL relativa o absoluta del producto si está disponible."
            "\n5. IGNORA banners, menús, footers y publicidad."
            "\n\nEjemplos Few-Shot:"
            "\nHTML: <div class='prod'><h3>Ibuprofeno 400mg</h3><span class='price'>$2.500</span><span class='instock'>Hay stock</span><a href='/p/1'>Ver</a></div>"
            "\nJSON: [{'producto': 'Ibuprofeno 400mg', 'precio': 2500.0, 'stock': 'Hay stock', 'url': '/p/1'}]"
            "\n\nHTML: <div class='item'><h2>Paracetamol 500mg</h2><div class='val'>$ 1.200</div><p>Agotado</p></div>"
            "\nJSON: [{'producto': 'Paracetamol 500mg', 'precio': 1200.0, 'stock': 'Agotado', 'url': ''}]"
            "\n\nHTML geolocalizado: Chile. Devuelve SOLO el JSON puro (sin formato markdown)."
        )
        
        response = model.generate_content(f"{prompt}\n\nHTML: {html_content[:30000]}")
        
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(cleaned_response)
        
        logger.info("Parsed data successfully", count=len(data))
        return data
    except json.JSONDecodeError as je:
        logger.error("Error parsing JSON from Gemini", error=str(je), text=response.text)
        raise RuntimeError(f"AI returned invalid JSON: {response.text[:100]}...")
    except Exception as e:
        logger.error("Error connecting to Gemini", error=str(e))
        raise RuntimeError(f"Gemini API Error: {str(e)}")

