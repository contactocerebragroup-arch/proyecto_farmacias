# EcoFarmacias General Monitor (v3.1)

Herramienta profesional de monitoreo de precios en Chile con scraping **100% bajo demanda**.

## 🚀 Despliegue en Vercel (Paso a Paso)

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Pega la URL del repositorio de GitHub: `https://github.com/contactocerebragroup-arch/proyecto_farmacias.git`
3. Haz clic en **Continuar** y en la sección **Environment Variables** agrega:
   - `GEMINI_API_KEY`: Tu clave de Google AI Studio.
   - `APP_API_KEY`: Tu clave secreta (GUID de 64 caracteres recomendado).
   - `REDIS_URL`: Tu string de conexión de Upstash Redis (opcional para caché).
   - `DATABASE_URL`: `sqlite:///prices.db` (para persistencia simple).
4. Haz clic en **Deploy**.
5. ¡Listo! Obtendrás tu URL live (ej: `https://proyecto-farmacias.vercel.app`).

## 🛠️ Lógica Final
- **Scraping Manual**: Pestaña "Manual" → Pega URL → Clica "Scrapear Ahora".
- **Geolocalización**: Pestaña "Geo" → Clica "Scan Mi Zona" → Scrape de farmacias en Chile.
- **Sin Automatización**: No hay Cron Jobs ni recargas automáticas. Tú controlas la ejecución.
- **Seguridad**: Header `X-API-Key` obligatorio para disparar extracciones.
