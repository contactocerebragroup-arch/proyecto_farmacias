# EcoFarmacias General Monitor (v3.0)

Herramienta profesional de monitoreo de precios en Chile con scraping manual y geolocalizado.

## 🚀 Características Finales
- **Scraping Manual**: Pega el link de cualquier producto chileno y extrae precios, stock y datos en segundos.
- **Geolocalización**: Escaneo de sitios populares basado en tu ubicación GPS actual.
- **Rendimiento Senior**: Scraping en paralelo (<15s), caché Redis de milisegundos y AI (Gemini) robusta.
- **UI Premium**: Skeletons, Snapbars, Modo Oscuro automático y responsive (MUI).

## 🛠️ Configuración de Vercel (Producción)

### 1. Variables de Entorno
Agrega estas claves en Vercel Dashboard:
- `GEMINI_API_KEY`: API Key de Google AI Studio.
- `APP_API_KEY`: Tu clave secreta para el Header `X-API-Key`.
- `DATABASE_URL`: String de PostgreSQL (ej: Neon.tech).
- `REDIS_URL`: String de Upstash Redis (ej: `redis://default:xxx@xxx.upstash.io:6379`).

### 2. Upstash Redis
1. Crea una DB gratuita en [Upstash](https://upstash.com/).
2. Los resultados se guardan por 1 hora para optimizar velocidad y costos de IA.

### 3. Scraping On-Demand (Manual)
Esta herramienta **no realiza scraping automático**. El proceso de extracción solo se inicia cuando el usuario lo solicita manualmente desde la interfaz (pestaña "Manual" o "Geolocalización").

### 4. Despliegue
1. Conecta este repositorio a Vercel.
2. El archivo `vercel.json` está configurado para un despliegue React + Python sin tareas programadas.
3. Caching: Los resultados se guardan por 1 hora en Redis para optimizar la velocidad.

## 💻 Desarrollo Local
```bash
# Backend
pip install -r requirements.txt
uvicorn api.index:app --reload

# Frontend
npm install
npm run dev
```

## 🧪 Pruebas
1. Abre la pestaña "Manual".
2. Pega una URL de producto (ej: Farmacia Cruz Verde o EcoFarmacias).
3. Ingresa tu `APP_API_KEY` y verifica la extracción en tiempo real.
