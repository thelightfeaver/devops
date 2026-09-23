# app

Aplicación de ejemplo del entorno DevOps local. Stack: [Bun](https://bun.com) + Express + Prometheus (`prom-client`) + MongoDB.

## Instalación

```bash
bun install
```

## Configuración

| Variable | Default | Descripción |
| --- | --- | --- |
| `PORT` | `3000` | Puerto del servidor |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | URI de MongoDB |
| `MONGODB_DB` | `devops` | Base de datos usada |

## Uso

```bash
bun run dev          # desarrollo con hot reload
bun test             # tests
bun run lint        # eslint (--fix)
bun run typecheck   # tsc --noEmit
bun run run:prod    # producción
```

## API

### Todos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/todos` | Lista todas las tareas |
| `POST` | `/todos` | Crea una tarea. Body: `{ "title": string, "description"?: string }` |
| `GET` | `/todos/:id` | Obtiene una tarea |
| `PATCH` | `/todos/:id` | Actualiza. Body: `{ "title"?, "description"?, "done"?: boolean }` |
| `DELETE` | `/todos/:id` | Elimina una tarea |

Ejemplos:

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primera tarea","description":"en test"}'

curl -X PATCH http://localhost:3000/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
```

### Health / Metrics

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Healthcheck |
| `GET` | `/metrics` | Métricas Prometheus |

## Simulación de usuarios

El script [`lab/simulate_users.py`](../lab/simulate_users.py) genera tráfico real contra la API:

```bash
python3 ../lab/simulate_users.py --users 10 --max-todos 5 --delay 0.3
```

Requiere la app corriendo, por ejemplo con `cd lab && docker compose up -d app mongo`.