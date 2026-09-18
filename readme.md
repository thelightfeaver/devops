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
| http://localhost:3000 | Aplicación de ejemplo |
| http://localhost:8000 | Gitea |
| http://localhost:8080 | Airflow (admin / admin1234) |

## Pipeline CI/CD

El proyecto incluye un pipeline en `.gitea/workflows/ci.yml` que ejecuta
lint, typecheck y tests de la aplicación, y compila la imagen Docker.
Ver `docs/main.md` para habilitar el runner de Gitea Actions.


## Objetivo

Crear un entorno local funcional para aprender y experimentar con prácticas de DevOps, automatización, monitoreo y calidad de software en un solo lugar.