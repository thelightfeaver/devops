# DevOps Local

Este proyecto es una forma práctica de trabajar con DevOps en un entorno local, utilizando Docker y pipelines de CI/CD para automatizar procesos de desarrollo.

## Descripción

La idea es contar con un entorno de pruebas local que incluya servicios comunes en infraestructura y automatización, permitiendo:

- Ejecutar aplicaciones de forma aislada con Docker
- Automatizar flujos de integración continua
- Probar herramientas de observabilidad y calidad
- Simular un ecosistema de desarrollo DevOps sin depender de un proveedor externo

## Stack principal

- Docker
- CI/CD local
- Gitea
- Airflow
- Grafana
- SonarQube

## Estado del proyecto

| Componente | Estado |
| --- | --- |
| Aplicación simple | Completado |
| API de todos + MongoDB | Completado |
| Simulador de usuarios (Python) | Completado |
| Servidor simple | Completado |
| Gitea | Completado |
| Airflow | Configurado |
| Grafana | No iniciado |
| SonarQube | No iniciado |
| CI/CD con Gitea | Configurado |

## Uso

Levantar el entorno:

```bash
cd lab
docker compose up -d
```

| URL | Descripción |
| --- | --- |
| http://localhost:3000 | Aplicación de ejemplo (+ API de todos) |
| http://localhost:9090 | Prometheus |
| http://localhost:3001 | Grafana (admin / admin) |
| http://localhost:8000 | Gitea |
| http://localhost:8080 | Airflow (admin / admin1234) |
| mongodb://localhost:27017 | MongoDB |

## Todo API y simulación de usuarios

La app expone un CRUD completo de tareas sobre MongoDB (`GET / POST / PATCH / DELETE /todos`, ver `app/README.md`).

Para generar tráfico automático y continuo sobre la API hay un contenedor Alpine
(`simulator`) que corre `lab/simulate_users.py` en bucle:

```bash
cd lab
docker compose up -d
```

El simulador espera a que la app esté sana y cada `SIM_INTERVAL` segundos ejecuta
el script, que crea usuarios simulados que crean, listan, actualizan, marcan como
hechas y eliminan tareas con delays aleatorios. Así quedan datos reales para ver
en Prometheus/Grafana.

| Variable | Default | Descripción |
| --- | --- | --- |
| `SIM_BASE_URL` | `http://app:3000` | Base URL de la API |
| `SIM_USERS` | `5` | Usuarios simulados por corrida |
| `SIM_DELAY` | `0.2` | Delay máximo (s) entre requests |
| `SIM_INTERVAL` | `60` | Segundos entre corridas |

También se puede correr manualmente desde la máquina:

```bash
cd lab
docker compose up -d app mongo
python3 simulate_users.py --users 10 --delay 0.3
```

Opciones del script: `--users`, `--min-todos`, `--max-todos`, `--min-actions`,
`--max-actions`, `--delay`, `--seed`.

## Pipeline CI/CD

El proyecto incluye un pipeline en `.gitea/workflows/ci.yml` que ejecuta
lint, typecheck y tests de la aplicación, y compila la imagen Docker.
Ver `docs/main.md` para habilitar el runner de Gitea Actions.


## Objetivo

Crear un entorno local funcional para aprender y experimentar con prácticas de DevOps, automatización, monitoreo y calidad de software en un solo lugar.