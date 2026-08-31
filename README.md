# InvoiceForge

Multi-tenant SaaS platform where freelancers and small businesses upload invoices (PDF or photo) and get back structured expense data automatically. OCR + LLM extraction pulls out vendor, amounts, dates, and line items; low-confidence results are queued for quick human review instead of silently failing.

Built as an event-driven microservices system to explore async processing, the transactional outbox pattern, and multi-tenancy end-to-end.

> **Status:** ✅ Live — https://51-11-159-171.nip.io (anonymous upload, self-registration, and authenticated dashboard all working end to end on a real Azure VM, real HTTPS via Caddy + Let's Encrypt)

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
git clone https://github.com/EssghaierJacem/invoice-forge.git
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
| `backend/api-gateway/` | Spring Cloud Gateway — routing, JWT validation, CORS | done |
| `backend/ingestion-service/` | Invoice upload, quota, outbox publisher, tenant provisioning | done |
| `backend/analytics-service/` | Parsed-event consumer, reports, CSV/XLSX export | done |
| `backend/common-events/` | Shared event DTOs | done |
| `parsing-service/` | FastAPI + Gemini extraction worker | done |
| `frontend/` | React dashboard (Vite, TS, Tailwind) | done |
| `infra/terraform/` | Azure VM + networking, infrastructure as code | done |
| `infra/ansible/` | VM provisioning (Docker, Caddy config, secrets) | done |
| `.github/workflows/` | CI (build/test) + CD (build images, deploy) | done |

## Roadmap

- **Phase 0 — Foundation:** monorepo, parent POM, docker-compose infra, first CI pipeline
- **Phase 1 — Auth & Gateway:** Keycloak realm, JWT-secured gateway, correlation IDs, Redis rate limiting
- **Phase 2 — Ingestion:** upload endpoint, transactional outbox, idempotent consumers
- **Phase 3 — Parsing pipeline:** RabbitMQ topology, retry/DLQ, OCR + LLM extraction, confidence scoring
- **Phase 4 — Analytics:** reports, CSV/XLSX export, quota enforcement
- **Phase 5 — Auth UX:** self-registration, tenant auto-provisioning on first login
- **Phase 6 — Frontend:** dashboard, upload/results UI, pagination, route-splitting
- **Phase 7 — CI/CD & Deploy:** GitHub Actions CI, Terraform + Ansible against a real Azure VM, Docker Compose in prod, Caddy + Let's Encrypt for real HTTPS on a free `nip.io` domain — see `infra/terraform/README.md` for the full runbook and `NOTES.md` for what actually went wrong standing it up

## License

MIT — see LICENSE
