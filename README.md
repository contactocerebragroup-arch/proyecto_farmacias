# Comparador de precios Farmacias (v3.2)

Herramienta profesional de monitoreo de precios en Chile con análisis **100% bajo demanda**.

## 🚀 Despliegue en Vercel (Paso a Paso)

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Pega la URL del repositorio de GitHub: `https://github.com/contactocerebragroup-arch/proyecto_farmacias.git`
3. Asegúrate de que Vercel detecte **Vite** como Framework Preset y que el "Output Directory" sea `dist`. Las Serverless Functions en la carpeta `api` se detectarán automáticamente con Python. (El archivo `vercel.json` ya no requiere la sección `"builds"`).
4. En la sección **Environment Variables** agrega:
   - `GEMINI_API_KEY`: Tu clave de Google AI Studio (requerido para AI parsing).
   - `REDIS_URL`: Tu string de conexión de Upstash Redis (opcional para caché).
   - `DATABASE_URL`: `sqlite:///prices.db` (para persistencia simple).
5. Haz clic en **Deploy**.
6. ¡Listo! Obtendrás tu URL live.
## 🛠️ Lógica Final
- **ANALIZAR MANUAL**: Pestaña "Manual" → Pega URL → Clica "Analizar Ahora".
- **ANALIZAR POR ZONA**: Pestaña "Zona" → Clica "Analizar Mi Zona" → Análisis de farmacias en Chile.
- **Sin Automatización**: No hay Cron Jobs ni recargas automáticas. Tú controlas la ejecución.
- **Seguridad**: Header `X-API-Key` obligatorio para disparar análisis.

Trigger deploy inicial 2026 - Gonzalo