# Arquitectura

Entorno DevOps local: aplicación de ejemplo más servicios de infraestructura orquestados con Docker Compose.

## Componentes

| Servicio | Contenedor | URL | Puerto |
| --- | --- | --- | --- |
| Aplicación (Express/Bun) | `app` | http://localhost:3000 | 3000 |
| Gitea (repositorio) | `repository` | http://localhost:8000 | 8000 / 222 (SSH) |
| Airflow (orquestación) | `pipeline` | http://localhost:8080 | 8080 |

## Layout

```
.
├── app/                 Aplicación de ejemplo (Bun + Express + tests)
├── lab/
│   ├── docker-compose.yml   Orquestación de todos los servicios
│   ├── containerfile        Imagen de la aplicación
│   ├── dags/                DAGs de Airflow
│   └── logs/                Logs de Airflow
├── .gitea/workflows/        Pipeline CI/CD (Gitea Actions)
└── docs/                    Documentación
```

## Pipeline CI/CD (Gitea Actions)

El flujo `.gitea/workflows/ci.yml` se ejecuta en push a `main` o pull request:

1. **test** - instala dependencias, ejecuta lint, typecheck y tests de la aplicación.
2. **docker** - compila la imagen de la aplicación.

Para habilitar CI debe estar activo el corredor de Gitea Actions:

```bash
# registrar un act_runner apuntando a http://localhost:8000
docker run -d --name act_runner \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ./lab/act_runner:/data \
  --network devops-local_lab \
  gitea/act_runner:latest \
  daemon
```

## Red

Todos los servicios comparten la red `devops-local_lab`. La aplicación debe subirse
a Gitea como nuevo repositorio y luego habilitarse el runner en
**Site Administration > Actions > Runners**.