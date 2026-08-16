# Project KEYSTONE

Field Service Management Platform for Meridian Facilities Management.
Built for Zidio Development's Java Full-Stack Engineering track.

KEYSTONE takes a maintenance request from the moment it's raised to the
moment it's closed and accounted for: dispatchers assign work, technicians
update jobs from the field, managers watch SLAs on a live dashboard, and
customers self-serve requests without phoning anyone.

## Stack

| Layer       | Technology                                  |
|-------------|----------------------------------------------|
| Back end    | Spring Boot 3 (Java 21), Spring Security, Spring Data JPA |
| Auth        | Stateless JWT (jjwt), BCrypt password hashing |
| Database    | PostgreSQL, versioned with Flyway migrations |
| Front end   | React 18 + TypeScript (Vite)                 |
| API docs    | springdoc-openapi (Swagger UI)                |
| Deployment  | Docker + docker-compose                       |

## Repository layout

```
keystone/
  backend/    Spring Boot service (see backend/src/main/java/com/zidio/keystone)
  frontend/   React + TypeScript SPA
  docker-compose.yml
```

## Run it locally (Docker — fastest path)

Requires Docker and Docker Compose.

```bash
cd keystone
docker compose up --build
```

- API:        http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Front end:  http://localhost:5173

Flyway runs the schema migrations and seed data automatically on backend
startup — there is nothing to run by hand.

### Demo logins (seeded)

All seed accounts use the password `password`.

| Role       | Email                          |
|------------|---------------------------------|
| Dispatcher | dispatcher@keystone.example     |
| Manager    | manager@keystone.example        |
| Technician | tech1@keystone.example (also tech2@keystone.example) |
| Customer   | customer@meridianfm.example     |

**Change or remove these before any real deployment.** They exist for
grading and local development only.

## Run it without Docker

### Backend

Requires Java 21, Maven, and a running PostgreSQL 16 instance.

```bash
cd backend
createdb keystone   # or create the DB some other way
cp .env.example .env  # then export the variables, or pass them inline
export DB_URL=jdbc:postgresql://localhost:5432/keystone
export DB_USERNAME=keystone
export DB_PASSWORD=keystone
export JWT_SECRET=$(openssl rand -base64 48)
mvn spring-boot:run
```

Flyway migrations (`src/main/resources/db/migration`) run automatically on
startup and seed reference data. The API listens on `:8080`.

### Frontend

Requires Node 20+.

```bash
cd frontend
cp .env.example .env   # VITE_API_URL defaults to http://localhost:8080
npm install
npm run dev
```

The SPA listens on `:5173`.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | backend | PostgreSQL connection |
| `JWT_SECRET` | backend | HMAC signing key for JWTs — **override in every real environment, never commit the real value** |
| `JWT_EXPIRATION_MINUTES` | backend | Token lifetime (default 480 = 8h) |
| `CORS_ALLOWED_ORIGINS` | backend | Comma-separated list of allowed front-end origins |
| `VITE_API_URL` | frontend | Base URL the SPA calls |

## Architecture summary

Classic layered Spring Boot service behind a React SPA:

```
React SPA  →  Controllers (HTTP only)  →  Services (business rules, @Transactional)  →  Repositories (Spring Data JPA)  →  PostgreSQL
```

- **Controllers** stay thin: validate input, map DTOs, delegate to services. No business logic lives here.
- **Services** own the rules — most importantly the guarded work-order state machine in `WorkOrderService`, which is the core of the platform (see below).
- **Entities never reach the client.** Every response is a DTO (`dto` package); JPA entities stay behind the service boundary.
- **Security is enforced server-side** with Spring Security method annotations (`@PreAuthorize`) and explicit role/ownership checks inside the services — never only in the UI. A customer, technician, or dispatcher hitting the API directly with someone else's ID gets a 403/404, not their data.

### Work-order lifecycle

Implemented in `WorkOrderService` as an explicit `Map<Status, Set<Status>>`
of allowed transitions, checked before every status change, with a
role check layered on top (`assertRoleCanTransition`). Every transition —
including reassignment — writes an append-only row to
`work_order_status_history` in the same transaction as the status change.

```
NEW → ASSIGNED → IN_PROGRESS ⇄ ON_HOLD → COMPLETED → CLOSED
  ↘        ↘                                  ↺ (reopen, manager only)
  CANCELLED  CANCELLED
```

### Transactional integrity

Logging parts on a job (`WorkOrderService.logParts`) decrements the part's
stock and records the usage row in one `@Transactional` method — a stock
check runs first, so usage is never recorded if stock would go negative,
and there's no window where one table updates without the other.

## API documentation

The full API is documented live via Swagger UI once the backend is running:
`http://localhost:8080/swagger-ui.html`. Every endpoint requires a Bearer
JWT (obtained from `POST /api/auth/login`) except login itself.

## Testing the security model

A few things worth trying directly against the API (e.g. with `curl` or the
Swagger UI "Try it out") to see the guardrails work:

- Log in as `customer@meridianfm.example` and try to `GET /api/work-orders/1`
  where work order 1 belongs to a different customer → `403`.
- Log in as a technician and try to `POST /api/work-orders/{id}/status` with
  `toStatus: CLOSED` → `403` (only a manager can close).
- Try an illegal jump, e.g. `NEW → COMPLETED` → `409 Conflict`.
- Omit the `Authorization` header entirely on any `/api/**` route → `401`.

## What's out of scope (by design)

Payment/invoicing, native mobile apps, route optimisation/GPS tracking, and
third-party ERP integrations are explicitly out of scope for this build —
see the engineering brief for the full rationale.

## Suggested next steps

The core lifecycle, security model, and transactional parts/time logging
are complete and enforced server-side. If extending this further:

- Add an integration-test suite (`spring-boot-starter-test` + Testcontainers
  for Postgres) covering the lifecycle transitions and cross-customer
  authorization boundaries called out above.
- Wire the SLA-breach scheduled job to an actual notification channel
  (email/in-app) — currently breaches are computed on read (`slaBreached`
  on every `WorkOrderDto`) rather than pushed proactively.
- Add photo/attachment upload on work orders (mentioned in the technician
  field-view scope) via a file storage service.
