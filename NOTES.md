# InvoiceForge — Engineering Notes

Live working document. Updated as phases progress. Decisions, blockers, and
lessons learned get logged here — this feeds the case-study README and any
blog posts later, so write entries like you're explaining them to an
interviewer.

---

## Phase 0 — Foundation (IN PROGRESS)

### Goal

Monorepo skeleton with 3 Spring Boot modules + 1 shared library, a parent
POM, and local infra running via docker-compose.

### Tasks

- [x] Generate 3 projects on start.spring.io:
      - `api-gateway` (Spring Cloud Gateway, Actuator)
      - `ingestion-service` (Web, Data JPA, PostgreSQL Driver, Spring for
        RabbitMQ, Actuator, Lombok, Validation)
      - `analytics-service` (same as ingestion-service)
- [ ] Assemble monorepo structure:
```
invoice-forge/
├── backend/
│   ├── pom.xml                 ← parent POM (packaging: pom)
│   ├── common-events/
│   ├── api-gateway/
│   ├── ingestion-service/
│   └── analytics-service/
├── parsing-service/
├── frontend/
├── infra/
├── keycloak/
├── docker-compose.yml
├── .github/workflows/
├── .gitignore
├── NOTES.md
└── README.md
```
- [x] `.gitignore`, `NOTES.md`, `README.md` created
- [ ] Parent POM at `backend/pom.xml`: Java 21, Spring Boot 4.1.1 BOM,
      Spring Cloud 2025.1.2 dependency management
- [ ] Child modules point their `<parent>` at `invoice-forge-parent`
      instead of `spring-boot-starter-parent`; duplicate `<java.version>`
      removed
- [ ] `common-events` module created by hand (plain Java, no Spring Boot
      starter) with first event: `InvoiceUploadedEvent`
- [ ] `docker-compose.yml` with: postgres-ingestion (5433), postgres-analytics
      (5434), rabbitmq (5672/15672), minio (9000/9001), redis (6379),
      keycloak (8181)
- [ ] `application.yml` per service (gateway :8080, ingestion :8082,
      analytics :8083), virtual threads enabled
- [ ] First GitHub Actions CI workflow (`ci.yml`): backend unit tests,
      frontend build, parser lint
- [ ] Verify: `mvn clean install` green, `docker compose up -d` → all
      containers healthy, `/actuator/health/liveness` returns UP
- [ ] First commit pushed, repo made public

### Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Maven multi-module monorepo over separate repos | Shared POM version management, atomic cross-service changes, single clone for recruiters to review |
| D2 | Spring Boot 4.1.1 instead of originally planned 3.4.x | Spring Boot 3.x reached end-of-life June 30, 2026; Initializr no longer offers it for new projects |
| D3 | Spring Cloud 2025.1.2 (not 2024.0.1) | Required release train for compatibility with Spring Boot 4.1.x |
| D4 | "Spring for RabbitMQ" (classic AMQP) over Spring Cloud Stream | Need direct control over exchanges/queues/DLQ topology as explicit code — that's the interview story; Cloud Stream's binder abstraction would hide it |
| D5 | RabbitMQ over Kafka at this scale | Simpler local ops; Kafka would be justified only if event volume or replay requirements grew significantly |
| D6 | common-events is a plain Java module, not a Spring Boot app | It's a shared library (DTOs only), not something that runs — no starter dependencies needed |

### Blockers

- (none yet)

### Lessons

- (log anything learned while building — e.g. gotchas with Testcontainers,
  Flyway, RabbitMQ topology-as-code, etc.)

---

## Phase 1 — Auth & Gateway (NOT STARTED)

- [ ] Keycloak realm `invoiceforge`: client `frontend` (public, PKCE),
      client `backend-services`
- [ ] Export realm JSON to `keycloak/realm-export.json`
- [ ] Gateway: global filter for `X-Correlation-Id`
- [ ] Redis rate limiting at the gateway
- [ ] Ingestion validates JWT, extracts `tenant_id` claim → `TenantContext`
- [ ] Frontend: Vite + React + TS + react-oidc-context login flow

## Phase 2 — Ingestion (NOT STARTED)

- [ ] Flyway `V1__init.sql`: invoices table
- [ ] Upload endpoint: magic-byte validation, size cap, SHA-256 dedup
- [ ] `StoragePort` interface over MinIO
- [ ] Transactional outbox + scheduled publisher
- [ ] Idempotent consumers (`processed_events` table)
- [ ] Testcontainers integration tests

## Phase 3 — Parsing Pipeline (NOT STARTED)

- [ ] RabbitMQ topology as code: exchange, queue, TTL retry ladder, DLQ
- [ ] Fake parser first, verified end-to-end
- [ ] Swap in real FastAPI + docling OCR + LLM extraction
- [ ] Confidence scoring, failure ladder (retry → DLQ → FAILED / NEEDS_REVIEW)

## Phase 4 — Analytics, Caching & Billing (NOT STARTED)

- [ ] Redis-cached monthly report + event-driven cache eviction
- [ ] CSV export, React dashboard, review screen
- [ ] Stripe billing (free tier limit via Redis INCR)

## Phase 5 — Deploy (NOT STARTED)

- [ ] Terraform: Azure resource group, ACR, k3s VM, Postgres, blob storage
- [ ] Helm charts per service
- [ ] Full CD pipeline with Trivy scan + environment approval gates
- [ ] Prometheus/Grafana, k6 load test, HTTPS, demo data

## Phase 6 — Visibility (ONGOING)

- [ ] Public repo, daily commits
- [ ] LinkedIn milestone posts
- [ ] Blog posts: outbox pattern, architecture walkthrough, LLM reliability
- [ ] README polished as case study with C4 diagram

---

## Template for future entries

```
## YYYY-MM-DD — Short title
- What was decided
- Why (trade-off, constraint, or reasoning)
- What it affects downstream
```
