# EcoFarmacias General Monitor (v3.1)

Herramienta profesional de monitoreo de precios en Chile con scraping **100% bajo demanda**.

## 🚀 Características Finales
- **Scraping Manual**: Pega cualquier URL de e-commerce y extrae datos en segundos.
- **Geolocalización**: Escaneo de precios locales basado en tu GPS actual.
- **Lógica On-Demand**: Sin recargas automáticas ni Cron Jobs. Tú decides cuándo trabajar.
- **Rendimiento Senior**: Asyncio parallel scraping + Caché Redis (1h TTL).
- **UI Premium**: Modo Oscuro, Skeletons y Responsive.

## 🛠️ Despliegue en Vercel

### 1. Variables de Entorno
Agrega estas claves en Vercel Dashboard:
- `GEMINI_API_KEY`: Tu clave de Google AI Studio.
- `APP_API_KEY`: Tu secreto para el `X-API-Key`.
- `REDIS_URL`: String de Upstash Redis.
- `DATABASE_URL`: String de PostgreSQL (opcional).

### 2. Upstash Redis Setup
1. Crea una DB gratuita en [Upstash](https://upstash.com/).
2. Copia la `REDIS_URL` para habilitar el caché de milisegundos.

### 3. Lanzamiento
1. Conecta este repositorio a Vercel.
2. Despliega. La app detectará automáticamente el backend Python y frontend React.

## 📱 Uso
1. Selecciona pestaña **Manual** o **Geo**.
2. Ingresa URL o solicita ubicación.
3. Haz clic en el botón de acción y autoriza con tu `APP_API_KEY`.
