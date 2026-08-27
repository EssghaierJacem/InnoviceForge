# InvoiceForge

Multi-tenant SaaS platform where freelancers and small businesses upload invoices (PDF or photo) and get back structured expense data automatically. OCR + LLM extraction pulls out vendor, amounts, dates, and line items; low-confidence results are queued for quick human review instead of silently failing.

Built as an event-driven microservices system to explore async processing, the transactional outbox pattern, and multi-tenancy end-to-end.

> **Status:** 🚧 Phase 0 — Foundation (see [NOTES.md](NOTES.md) for the live decisions log and progress)

## Architecture (target)

```
                        ┌──────────────────┐
 React SPA ─────────────│  API Gateway     │  Spring Cloud Gateway
 (TypeScript, Vite)     │  rate-limit (Redis), correlation IDs │
                        └───────┬──────────┘
         ┌──────────────────┬───┴────────────┬──────────────┐
   ┌─────▼─────┐     ┌──────▼──────┐   ┌─────▼──────┐  ┌────▼─────┐
   │ Keycloak  │     │ Ingestion   │   │ Analytics  │  │ Billing  │
   │ (auth)    │     │ Service     │   │ Service    │  │ Service  │
   └───────────┘     └──────┬──────┘   └─────▲──────┘  └──────────┘
                            │ InvoiceUploaded        │ InvoiceParsed
                      ┌─────▼────────────────────────┴───┐
                      │        RabbitMQ (topic exchange)  │
                      └─────┬─────────────────▲──────────┘
                      ┌─────▼─────┐           │
                      │ Parsing   │  MinIO ◄──┤ (files)
                      │ FastAPI   │           │
                      └───────────┘           │
                   OCR (docling) → LLM (structured JSON) → confidence score

    Postgres per service · Redis (rate limit, cache) · Prometheus/Grafana
```

## Tech Stack

| Layer | Technology |
|---|---|
| Core services | Java 21, Spring Boot 4.1.1 |
| API Gateway | Spring Cloud Gateway (Spring Cloud 2025.1.2) |
| Auth & tenancy | Keycloak, JWT (OAuth2 Resource Server) |
| Extraction | Python 3.12, FastAPI, docling OCR, LLM APIs |
| Async messaging | RabbitMQ (Spring for RabbitMQ / AMQP) |
| Databases | PostgreSQL (per service), Redis (cache/rate-limit) |
| File storage | MinIO (local) → Azure Blob (prod) |
| Frontend | React + TypeScript + Vite |
| Infrastructure | Docker Compose → Kubernetes (k3s/AKS), Terraform (Azure) |
| CI/CD | GitHub Actions |

## Getting Started

```bash
git clone https://github.com/<your-username>/invoice-forge.git
cd invoice-forge
docker compose up -d      # infra: postgres x2, rabbitmq, minio, redis, keycloak
```

Run an individual backend service:

```bash
cd backend/ingestion-service
./mvnw spring-boot:run
```

## Modules

| Path | Description | Status |
|---|---|---|
| `backend/api-gateway/` | Spring Cloud Gateway — routing, rate limiting, correlation IDs | in progress |
| `backend/ingestion-service/` | Invoice upload, dedup, outbox publisher | planned |
| `backend/analytics-service/` | Parsed-event consumer, monthly reports, caching | planned |
| `backend/common-events/` | Shared event DTOs (CloudEvents-style envelope) | planned |
| `parsing-service/` | FastAPI OCR + LLM extraction worker | planned |
| `frontend/` | React dashboard | planned |
| `infra/terraform/` | Azure infrastructure as code | planned |
| `infra/helm/` | Kubernetes deployment charts | planned |

## Roadmap

- **Phase 0 — Foundation:** monorepo, parent POM, docker-compose infra, first CI pipeline
- **Phase 1 — Auth & Gateway:** Keycloak realm, JWT-secured gateway, correlation IDs, Redis rate limiting
- **Phase 2 — Ingestion:** upload endpoint, transactional outbox, idempotent consumers
- **Phase 3 — Parsing pipeline:** RabbitMQ topology, retry/DLQ, OCR + LLM extraction, confidence scoring
- **Phase 4 — Analytics & caching:** monthly reports, Redis cache + event-driven invalidation, CSV export, billing
- **Phase 5 — Deploy:** Terraform (Azure), Helm, full CI/CD with Trivy scanning and environment approval gates
- **Phase 6 — Visibility:** public repo, milestone posts, blog write-ups, polished case-study README

## License

MIT — see LICENSE
