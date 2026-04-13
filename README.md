# Mini-TES Front

Panel de administración para Mini-TES con asistente de voz integrado (OpenAI Realtime API).

**Stack:** Laravel 12 · PHP 8.2+ · Vite · Tailwind CSS 4

---

## Requisitos

- PHP 8.2+
- Composer
- Node.js 18+ y npm
- API Key de OpenAI (para el asistente de voz)
- Backend GraphQL Mini-TES corriendo en `http://127.0.0.1:4000` (para consultas operativas)

---

## Instalación

### Opción A — Setup automático

```bash
composer setup
```

Este comando ejecuta en orden: `composer install`, copia `.env`, genera `APP_KEY`, corre migraciones y hace el build de frontend.

### Opción B — Manual

```bash
# 1. Dependencias PHP
composer install

# 2. Crear archivo de entorno
cp .env.example .env          # si existe, o créalo manualmente
php artisan key:generate

# 3. Base de datos (SQLite por defecto, sin configuración extra)
php artisan migrate

# 4. Dependencias y assets frontend
npm install
npm run build
```

---

## Variables de entorno

Edita el archivo `.env` y configura las siguientes variables:

```dotenv
# Requerida — asistente de voz no funciona sin esto
OPENAI_API_KEY=sk-...

# Opcional — defaults razonables incluidos
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
OPENAI_REALTIME_VOICE=marin
OPENAI_REALTIME_TOKEN_TTL_SECONDS=600

# URL del backend GraphQL de Mini-TES
MINI_TES_GRAPHQL_URL=http://127.0.0.1:4000/graphql
```

> El panel visual funciona sin `OPENAI_API_KEY`. Solo el asistente de voz la requiere.

---

## Correr en desarrollo

```bash
composer dev
```

Lanza en paralelo:

| Servicio | URL / descripción |
|---|---|
| Laravel | http://localhost:8000 |
| Vite (hot-reload) | automático |
| Queue worker | en background |
| Pail (logs) | en terminal |

La raíz `/` redirige automáticamente a `/admin/panel`.

---

## Rutas disponibles

| Ruta | Descripción |
|---|---|
| `/admin/panel` | Dashboard principal |
| `/admin/planeacion` | Planeación |
| `/admin/checklists` | Checklists |
| `/admin/tareas` | Tareas |
| `/admin/acciones` | Acciones |
| `/admin/dashboard` | Dashboard alternativo |
| `POST /admin/asistente` | Endpoint del asistente (GraphQL bridge) |
| `GET/POST /admin/asistente/realtime-token` | Token efímero para OpenAI Realtime |

---

## Base de datos

Por defecto usa **SQLite** (`database/database.sqlite`), sin necesidad de instalar nada adicional.

Para usar MySQL o PostgreSQL, cambia en `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mini_tes
DB_USERNAME=root
DB_PASSWORD=
```

---

## Tests

```bash
composer test
# o directamente:
php artisan test
```
