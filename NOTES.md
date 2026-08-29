# InvoiceForge — Engineering Notes

Live working document. Updated as phases progress. Decisions, blockers, and
lessons learned get logged here — this feeds the case-study README and any
blog posts later, so write entries like you're explaining them to an
interviewer.

---

## Phase 0 — Foundation (COMPLETE ✅)

### Goal

Monorepo skeleton with 3 Spring Boot modules + 1 shared library, a parent
POM, and local infra running via docker-compose.

### Tasks

- [x] Generate 3 projects on start.spring.io: `api-gateway`,
      `ingestion-service`, `analytics-service`
- [x] Assemble monorepo structure (backend/, parsing-service/, frontend/,
      infra/, keycloak/, docker-compose.yml, .github/workflows/)
- [x] `.gitignore`, `NOTES.md`, `README.md` created
- [x] Parent POM at `backend/pom.xml`: Java 21, Spring Boot 4.1.1 BOM,
      Spring Cloud 2025.1.2 dependency management
- [x] Child modules point their `<parent>` at `invoice-forge-parent`
- [x] `common-events` module created by hand with first event:
      `InvoiceUploadedEvent`
- [x] `docker-compose.yml` with postgres-ingestion, postgres-analytics,
      rabbitmq, minio, redis, keycloak — all env-var driven via `.env`
- [x] `application.yml` per service, virtual threads enabled, env-var driven
      config (`${VAR:default}`) throughout
- [x] First GitHub Actions CI workflow (`ci.yml`) scaffolded
- [x] Verified: `mvn clean install` green (5/5 modules), all 6 containers
      healthy, all 3 services boot and report UP on liveness endpoints
- [x] First commit pushed

### Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Maven multi-module monorepo over separate repos | Shared POM version management, atomic cross-service changes, single clone for recruiters to review |
| D2 | Spring Boot 4.1.1 instead of originally planned 3.4.x | Spring Boot 3.x reached end-of-life June 30, 2026; Initializr no longer offers it for new projects |
| D3 | Spring Cloud 2025.1.2 (not 2024.0.1) | Required release train for compatibility with Spring Boot 4.1.x |
| D4 | "Spring for RabbitMQ" (classic AMQP) over Spring Cloud Stream | Need direct control over exchanges/queues/DLQ topology as explicit code — that's the interview story; Cloud Stream's binder abstraction would hide it |
| D5 | RabbitMQ over Kafka at this scale | Simpler local ops; Kafka would be justified only if event volume or replay requirements grew significantly |
| D6 | common-events is a plain Java module, not a Spring Boot app | It's a shared library (DTOs only), not something that runs — no starter dependencies needed |
| D7 | All service config driven by env vars with local defaults (`${VAR:default}`) | Same YAML works unchanged from local dev through to K8s/Azure later — only the env var values change, not the files |

### Lessons

- Spring Boot 3.x is no longer offered on Initializr for new projects as of
  its EOL (June 30, 2026) — version-bump any tutorial referencing 3.4.x.
- A dependency declared inside `<dependencyManagement>` instead of
  `<dependencies>` compiles fine at the parent level but does NOT actually
  put the library on a child module's classpath — easy silent mistake.
- Spring Cloud Gateway ships two separate implementations —
  `-webflux` (reactive) and `-webmvc` (servlet) — under similarly-named
  artifacts. They don't share an API. Picking the wrong one on Initializr
  causes confusing "package does not exist" errors that look unrelated to
  the real cause.
- Maven Wrapper (bundled by Initializr per-service) works fine invoked from
  the parent module root for a multi-module reactor build — no global
  Maven install required.
- IntelliJ's own build system can drift out of sync with actual `pom.xml`
  changes made outside the IDE (e.g. by an external tool) — shows stale
  "package does not exist" errors even when `mvn clean install` from the
  terminal is genuinely green. Fix: Maven panel → Reload All Maven Projects.

---

## Phase 1 — Auth & Gateway (IN PROGRESS — verification pending)

### Goal

Identity plumbing works end to end: Keycloak issues tenant-aware JWTs, the
gateway and both services validate independently, and one real endpoint
proves the whole chain including tenant isolation.

### Tasks

- [x] Keycloak added to docker-compose, env-var driven admin credentials
- [x] Realm `invoiceforge` created: clients `gateway` (public), 
      `ingestion-service` + `analytics-service` (confidential, bearer-only)
- [x] Custom `tenant_id` claim via a dedicated `tenant` client scope +
      User Attribute mapper, attached to all 3 clients as Default
- [x] `tenant_id` declared as an admin-only-editable user profile attribute
- [x] 2 test users created with different `tenant_id` values
- [x] Gateway converted to a reactive OAuth2 resource server
      (`SecurityWebFilterChain`); all routes require auth except
      `/actuator/**` and `/api/v1/auth/**`
- [x] `TenantPropagationFilter`: extracts `tenant_id` from the validated
      JWT, forwards as `X-Tenant-Id` header
- [x] Both services independently validate JWTs (`SecurityFilterChain`,
      servlet-based) — defense in depth, not trusting the gateway alone
- [x] First real endpoint: `POST`/`GET /api/v1/invoices` on
      ingestion-service, using `@AuthenticationPrincipal Jwt` to read
      `tenant_id` directly from the validated token (in-memory storage —
      real persistence is Phase 2)
- [x] Keycloak persistence fixed: `keycloak_data` volume added, realm
      exported to `keycloak/realm-export.json`, wired to auto-import via
      `--import-realm`
- [ ] Full verification checklist not yet run to completion:
      - [ ] `curl` no token → 401 (through gateway)
      - [ ] `curl` no token, bypass gateway directly → 401
      - [ ] `curl` with valid token → 202/200
      - [ ] Tenant A token vs Tenant B token → confirmed different/isolated
            results
      - [ ] Garbage token → 401, not a crash
- [ ] Redis rate limiting at the gateway — not started
- [ ] Gateway correlation-ID filter (`X-Correlation-Id`) — not started
- [ ] Frontend login flow (Vite + react-oidc-context) — deferred, this is
      genuinely Phase 4 scope per the roadmap
- [ ] NOTES.md/README fully synced (this entry)

### Decisions

| # | Decision | Rationale |
|---|---|---|
| D8 | Keycloak's `--import-realm` + volume mount, deferred until a real export existed | An empty placeholder realm JSON crashes Keycloak on boot; ran plain `start-dev` with no import until Phase 1's actual realm was built |
| D9 | 3 clients (`gateway`, `ingestion-service`, `analytics-service`) instead of the originally planned 2 (`frontend`/`backend-services`) | More granular — matches per-service JWT validation in 1.3/1.4 exactly |
| D10 | `tenant_id` baked into the JWT via a claim mapper, not a separate lookup table | Every service that validates the token gets tenant context for free, already signed and tamper-proof — no extra DB round-trip needed just to know "whose data is this" |
| D11 | `tenant_id` is an admin-only-editable user attribute (User: no edit/view) | Prevents self-service tenant switching — a user should never be able to reassign their own tenant |
| D12 | Every service (not just the gateway) independently validates JWTs | Defense in depth — the gateway is a routing convenience, not the only trust boundary. Proven by design: hitting a service directly on its own port, bypassing the gateway, must still return 401 |
| D13 | Controllers use `@AuthenticationPrincipal Jwt` instead of a static `TenantContext` helper | Declarative, testable (no hidden global-state lookup), and the tenant claim is read from the SAME validated JWT the security filter already checked — never trusted from the forwarded `X-Tenant-Id` header, which is spoofable if a service is reached directly |
| D14 | `keycloak_data` volume + `realm-export.json` auto-import, used together (not either/or) | Volume protects normal restarts; the import file is the safety net for a full wipe (fresh clone, deleted volume, new machine) — reproducible from git either way |

### Blockers

- (none currently — verification checklist is the remaining work, not a
  blocker)

### Lessons

- **Keycloak had no persistent volume in the original docker-compose.yml —
  a real bug, not a config choice.** The entire realm (clients, mapper,
  users) was lost once the container got recreated. Fixed with a named
  volume; also exported the realm to git so it's reproducible even from a
  fresh clone with zero manual console clicking.
- **Keycloak's realm export does NOT include user accounts/credentials by
  design** (security default — you don't want passwords in a git-committed
  file). This means even with auto-import working, the 2 test users must
  be recreated manually any time the realm is rebuilt from scratch. Worth
  scripting via Keycloak's Admin REST API at some point if this becomes
  frequent friction.
- Newer Keycloak (24+) hides custom user attributes from the admin UI by
  default unless they're formally declared under Realm settings → User
  profile → Attributes (or "Unmanaged attributes" is enabled). A tutorial
  written for an older Keycloak version may reference an "Attributes" tab
  that doesn't exist in the same place anymore.
- `curl` on a `401` with an empty response body prints nothing visible by
  default — easy to mistake "no output" for "command didn't run." Use
  `curl -i` to see the actual status line and headers when verifying
  auth behavior.
- Reactive gateway security code (`SecurityWebFilterChain`,
  `ServerHttpSecurity`, `@EnableWebFluxSecurity`) and servlet-based service
  security code (`SecurityFilterChain`, `HttpSecurity`,
  `@EnableWebSecurity`) look similar but are NOT interchangeable — copying
  one pattern into the wrong module fails to compile with confusing
  "cannot find symbol" errors that are really a wrong-import-family issue.

### Known gap to resolve in Phase 2

- `InvoiceUploadedEvent.tenantId` is typed `UUID` (common-events), but every
  other representation of tenant (`Invoice.tenantId()`, the JWT claim, the
  `X-Tenant-Id` header) is a plain `String`. Not breaking anything yet since
  the event isn't wired into RabbitMQ publishing (that's Phase 3), but this
  needs reconciling once Phase 2's real Postgres schema is designed —
  decide once, apply consistently end to end.

---

## Phase 2 — Ingestion (NOT STARTED)

- [ ] Flyway `V1__init.sql`: invoices table
- [ ] Upload endpoint: magic-byte validation, size cap, SHA-256 dedup
- [ ] `StoragePort` interface over MinIO
- [ ] Transactional outbox + scheduled publisher
- [ ] Idempotent consumers (`processed_events` table)
- [ ] Testcontainers integration tests
- [ ] Resolve the UUID-vs-String tenant_id inconsistency (see Phase 1 gap)

## Phase 3 — Parsing Pipeline (NOT STARTED)

- [ ] RabbitMQ topology as code: exchange, queue, TTL retry ladder, DLQ
- [ ] Fake parser first, verified end-to-end
- [ ] Swap in real FastAPI + docling OCR + LLM extraction
- [ ] Confidence scoring, failure ladder (retry → DLQ → FAILED / NEEDS_REVIEW)

## Phase 4 — Analytics, Caching & Billing (NOT STARTED)

- [ ] Redis-cached monthly report + event-driven cache eviction
- [ ] CSV export, React dashboard, review screen
- [ ] Stripe billing (free tier limit via Redis INCR)
- [ ] Frontend login flow (Vite + React + TS + react-oidc-context) —
      deferred from Phase 1

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

## 2026-08-27 — Phase 1 auth foundation merged to main

- Keycloak realm, JWT validation (gateway + both services independently),
  tenant propagation, and a first real tenant-scoped endpoint all merged
  via PR from `phase-1-auth-gateway`.
- Hit and fixed a real infra bug along the way: Keycloak had no persistent
  volume, causing full realm data loss on container recreation. Fixed
  properly with a volume + git-committed realm export + auto-import —
  more reproducible than the original plan, not just patched.
- Verification checklist (401/202/200 + tenant isolation proof) still
  needs a clean run-through before Phase 1 is genuinely "done" — tracked
  above, not yet checked off.

## Template for future entries

```
## YYYY-MM-DD — Short title
- What was decided
- Why (trade-off, constraint, or reasoning)
- What it affects downstream
```