# WebCheck Farmacias (v4.0 - Genius Edition)

Herramienta profesional de monitoreo de precios en Chile con análisis **100% bajo demanda** usando **Inteligencia Artificial (Gemini 1.5 Flash)** y **Playwright** para extraer contenido dinámico y oculto por Javascript.

## ✨ Características clave
- **Página Única "WebCheck"**: Interfaz limpia, minimalista y mobile-first con soporte automático para Dark Mode.
- **Scraping Genius**: Renderiza JS completo, simula interacción humana (stealth) extrae precios dinámicos, scroll lazy load y evita bloqueos.
- **Detección Automática de Ofertas**: La IA clasifica automáticamente si un producto está rebajado o a precio normal.
- **Rendimiento Extremo**: Caché en Upstash Redis (TTL 1h) para resultados instantáneos de URLs analizadas recientemente.
- **Seguridad Empresarial**: Header obligatorio `X-API-Key` y limitador de peticiones (SlowAPI) a 5/minuto.

## 🚀 Despliegue en Vercel (Paso a Paso)

Debido a que ahora usamos un navegador headless (Playwright) y FastAPI, sigue estos pasos:

1. Clona/Forka este repositorio en tu cuenta de GitHub (`https://github.com/contactocerebragroup-arch/proyecto_farmacias.git`).
2. Ve a [Vercel](https://vercel.com/new) e importa el repositorio.
3. Asegúrate de que Vercel detecte **Vite** como Framework Preset y que el "Output Directory" sea `dist`. Las Serverless Functions en la carpeta `api` se detectarán automáticamente con Python.
4. En la sección **Environment Variables** agrega:
   - `GEMINI_API_KEY`: Tu clave privada de Google AI Studio (Requerido para NLP y clasificación).
   - `APP_API_KEY`: Tu clave elegida de seguridad para interactuar con la API (Requerido).
   - `REDIS_URL`: Tu string de conexión de Upstash Redis (Para habilitar la velocidad extrema).
   - `DATABASE_URL`: `sqlite:////tmp/prices.db` (Requerido en serverless).
5. Haz clic en **Deploy**.

> **Nota sobre Playwright en Vercel**: Vercel impone un límite de tamaño de 250MB para Serverless Functions. Dependiendo del plan de Vercel, instalar los binarios de Chromium de Playwright puede requerir configuraciones adicionales o el uso de servicios externos (Browserless / Playwright-aws-lambda). La arquitectura de esta app está pensada para ser agnóstica de infraestructura.

## 🛠️ Uso

- Pega cualquier URL (categoría, producto, o búsqueda en farmacia) en la barra principal.
- Haz clic en **Analizar Ahora**.
- Visualiza todos los productos con sus atributos, ordenados automáticamente por precio ascendente. Usa los botones de filtro superior para mostrar únicamente ofertas 🔥.

Trigger deploy inicial 2026 - Gonzalo