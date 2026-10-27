# E-Commerce Platform: Testing Guide

**Before running any tests, read [`README.md`](./README.md) in this `docs` folder first.** It explains the project setup, environment configuration, databases, and infrastructure. Do not run integration tests until you understand the test database requirements in this guide.

## 1. Testing Strategy

The backend test suite includes:

| Test type | Purpose |
|---|---|
| Unit | Tests individual classes and business logic |
| E2E | Tests application endpoints and request workflows |
| Integration | Tests interactions with real databases or infrastructure |
| Build | Checks that backend services compile |
| Lint | Checks code quality and common issues |

Integration tests must use dedicated test databases, never development databases.

## 2. Run the Complete Backend Check

From the repository root:

```bash
./infrastructure/backend/test.sh all
```

This runs the backend unit tests, E2E tests, integration tests, build, and lint checks.

Use this command after making backend changes when you want to verify the complete backend.

## 3. Run Individual Test Modes

Run these commands from the repository root.

### Unit tests

```bash
./infrastructure/backend/test.sh unit
```

### End-to-end tests

```bash
./infrastructure/backend/test.sh e2e
```

### Integration tests

```bash
./infrastructure/backend/test.sh integration
```

Before running integration tests, complete the database safety checks in Section 5. If the integration runner reports a missing environment variable or infrastructure dependency, follow the error message and the relevant service instructions.

### Build

```bash
./infrastructure/backend/test.sh build
```

### Lint

```bash
./infrastructure/backend/test.sh lint
```

## 4. Test a Specific Service

Use the workspace package names below.

### User/Auth Service

Unit tests:

```bash
pnpm --filter user-service test
```

E2E tests:

```bash
pnpm --filter user-service test:e2e
```

Integration tests:

```bash
set -a
source backend/user-service/.env
set +a

export DB_NAME=ecommerce_users_test
pnpm --filter user-service test:integration
```

The integration test suite checks that the configured database name is `ecommerce_users_test`.

### Product Service

Unit tests:

```bash
pnpm --filter product-service test
```

E2E tests:

```bash
pnpm --filter product-service test:e2e
```

Integration tests:

```bash
MONGODB_URI='mongodb://localhost:27017/ecommerce_products_test' \
pnpm --filter product-service exec vitest run \
  --config vitest.config.integration.ts
```

Adjust the connection string if MongoDB uses different local credentials or port mappings. Keep the test database name `ecommerce_products_test`.

### Order Service

Unit tests:

```bash
pnpm --filter order-service test
```

Integration tests:

```bash
TEST_DATABASE_URL="$(grep '^DATABASE_URL=' backend/order-service/.env \
  | sed 's/^[^=]*=//' | tr -d '"' \
  | sed 's#ecommerce_orders#ecommerce_orders_test#')"

RABBITMQ_URL="$(grep '^RABBITMQ_URL=' backend/order-service/.env \
  | sed 's/^[^=]*=//' | tr -d '"')"

DATABASE_URL="$TEST_DATABASE_URL" \
RABBITMQ_URL="$RABBITMQ_URL" \
pnpm --filter order-service test:integration
```

This command derives the test database URL from the local service configuration and replaces `ecommerce_orders` with `ecommerce_orders_test`. Review the resulting URL before running it. The integration suite is designed to refuse a database URL that does not target the dedicated test database.

The RabbitMQ integration test uses a separate test queue.

### API Gateway

Unit tests:

```bash
pnpm --filter api-gateway test
```

E2E tests:

```bash
pnpm --filter api-gateway test:e2e
```

The gateway E2E tests mock downstream fetch requests, so they do not need to modify application databases.

> If a package does not define one of these scripts, inspect that package's `package.json` and use the available script or the central test runner instead.

## 5. Database Safety Requirements

**Never point integration tests at a development or production database.**

The project uses separate test databases:

| Service | Required integration-test database |
|---|---|
| User/Auth | `ecommerce_users_test` |
| Product | `ecommerce_products_test` |
| Order | `ecommerce_orders_test` |

Before running integration tests:

1. Check the database URL or database name the test will use.
2. Confirm it identifies the dedicated test database.
3. Confirm the required local database container is running.
4. Confirm the test setup does not target production infrastructure.
5. Stop if the target database cannot be verified.

The User/Auth and Order integration suites include database-safety checks. Keep those protections in place.

Do not run destructive setup commands against your development databases to make a test pass.

## 6. Check Docker Infrastructure

List running containers:

```bash
docker ps
```

Start the project's local infrastructure if it has already been created:

```bash
docker start \
  ecommerce-postgres \
  ecommerce-mongo \
  ecommerce-mysql \
  ecommerce-rabbitmq
```

Integration tests that use real infrastructure need the corresponding database or RabbitMQ instance to be available.

## 7. Interpreting Results

A successful complete run should finish without failed tests, build errors, or lint warnings.

If a check fails:

1. Read the first meaningful error in the output.
2. Identify which service and test mode failed.
3. Check the relevant environment variables and infrastructure.
4. Reproduce only the failing test where possible.
5. Fix the underlying issue and rerun the relevant test.
6. Run the complete backend check before considering the work finished.

Do not delete tests or disable safety checks simply to get a green result.

## 8. Frontend Checks

The frontend has separate helper scripts:

```bash
./infrastructure/frontend/build.sh
./infrastructure/frontend/test.sh
./infrastructure/frontend/lint.sh
```

Run the checks that are configured for the current frontend package. If a helper reports that a package script is not configured, inspect `frontend/web/package.json` before proceeding.

## 9. Recommended Workflow

After changing backend code:

```bash
./infrastructure/backend/test.sh unit
./infrastructure/backend/test.sh e2e
./infrastructure/backend/test.sh integration
./infrastructure/backend/test.sh build
./infrastructure/backend/test.sh lint
```

Or run everything with one command:

```bash
./infrastructure/backend/test.sh all
```

For a final verification, check the frontend build and any configured frontend tests and lint checks as well.
