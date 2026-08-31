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

## Phase 5 — Deploy (SUPERSEDED — see Phase 7)

Original plan below was k3s + Helm + ACR. Landed on something simpler instead:
a single Azure VM running the same Docker Compose stack as local dev, behind
Caddy for HTTPS. See Phase 7 for what actually shipped and why.

- [x] ~~Terraform: Azure resource group, ACR, k3s VM, Postgres, blob storage~~ → single VM, GHCR, Docker Compose (see Phase 7)
- [ ] ~~Helm charts per service~~ — not applicable, no k8s
- [x] Full CD pipeline (deploy.yml) — no Trivy/approval gates, not needed at this scale
- [ ] Prometheus/Grafana, k6 load test — not done
- [x] HTTPS, demo data — done (Phase 7)

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

## 2026-08-31 — Phase 7: CI/CD + real Azure deployment, HTTPS working end to end

- **CI** (`ci.yml`): three parallel jobs (Maven, npm, pytest), backend job
  boots real Postgres/RabbitMQ/Redis/MinIO/Keycloak in Docker rather than
  mocking, so a green run means the same thing a local `docker compose up`
  does.
- **CD** (`deploy.yml`): builds/pushes 5 Docker images to GHCR, then SSHes
  into the VM to `pull && up -d`. Triggers off CI success on `main`, plus a
  manual `workflow_dispatch` fallback.
- **Infra**: Terraform (VM, VNet, NSG, static IP) + Ansible (Docker install,
  compose files, secrets) — run by hand from Azure Cloud Shell, not GitHub
  Actions, because this subscription is under a university tenant that
  blocks the app registration GitHub's OIDC auth needs.
- **Real bugs hit standing this up, root-caused live rather than guessed at**:
  - Azure region/VM-size quota walls (student subscription locked to 5
    regions, zero B-series capacity in the default one) — switched to
    `uksouth` / `Standard_D2s_v7`.
  - The Terraform azurerm provider's own eventual-consistency bug
    ("Provider produced inconsistent result after apply") — resolved via
    retry + `terraform import` of the resources that had actually been
    created.
  - A committed Keycloak client secret (GitGuardian caught it) — first fix
    (rotating it) was wrong, since any hardcoded secret trips the same
    scanner. Real fix: omit it from the realm import entirely and fetch/
    regenerate via the Admin API instead.
  - A Jinja operator-precedence bug (`|ternary` binding to the literal
    `'aarch64'` instead of the whole comparison) silently broke Docker's
    apt repo config — rendered `arch=False`, zero packages found, no
    useful error pointing at the cause.
  - **The actual ceiling of "bare IP over HTTP":** login/signup fundamentally
    cannot work without HTTPS — `crypto.subtle` (needed for PKCE) requires a
    secure context, and a public IP over plain HTTP never satisfies that in
    any modern browser, no matter how Keycloak/CORS are configured. Fixed
    with Caddy (reverse proxy, path-routes to Keycloak/gateway/frontend
    under one origin) + Let's Encrypt, using `nip.io` (`<ip-with-dashes>.nip.io`)
    as a free, real, no-registration domain that resolves straight to the
    VM's IP.
  - Anonymous upload quota was keying off the gateway container's internal
    Docker IP, not the real visitor's IP — every anonymous visitor shared
    one global bucket instead of getting their own. Not yet fixed; needs
    the gateway to forward `X-Forwarded-For` and ingestion-service to
    trust/read it.
  - `analytics-service` had no explicit dependency on `ingestion-service`
    (which owns declaring the RabbitMQ exchange), so on a fresh stack it
    could bind its listener before the exchange existed, log "Broker not
    available," and silently give up instead of retrying — stayed
    "Up (healthy)" in `docker ps` while never consuming a single message.
- **Net result:** everything above is now committed to Terraform/Ansible/
  compose, so a fresh `terraform apply` + one `ansible-playbook` run against
  a new resource group should reproduce this without hitting the same
  issues again — the region/quota/provider flakiness aside, since that's
  genuinely Azure being Azure, not something a config file fixes.

## Template for future entries

```
## YYYY-MM-DD — Short title
- What was decided
- Why (trade-off, constraint, or reasoning)
- What it affects downstream
```