# E-Commerce Platform

A futuristic e-commerce platform for gadgets, accessories, and everyday technology products. The `monolith` branch runs the backend as one NestJS application while keeping the customer and admin frontends as separate React apps.

The project focuses on clean architecture, secure authentication, database design, service separation, automated testing, and maintainable backend development.

## Architecture

The platform's default local runtime on this branch consists of one NestJS backend, a customer-facing frontend, and an admin dashboard. The backend composes the existing user, product, and order domain modules.

```text
                    Customer / Admin
                           |
                    React Frontend
                           |
                   NestJS Monolith
                        :3003
                           |
          ┌────────────────┼────────────────┐
          |                |                |
      PostgreSQL         MongoDB           MySQL
       (users)          (products)         (orders)
```

Both frontends continue to use their existing `/api` proxy to port `3003`. The monolith calls product operations directly in-process and does not use the API Gateway, separate backend service processes, or RabbitMQ.

## Services and Features

### 1. User/Auth Service

**Technology:** NestJS, TypeScript, PostgreSQL, TypeORM, JWT, Argon2.

Responsible for user identity, authentication, sessions, and account security.

**Features**

- User registration
- Secure password hashing with Argon2
- User login
- JWT access tokens
- Refresh tokens and token rotation
- Multiple user sessions and devices
- Logout and session management
- Email verification using OTP
- OTP expiration and attempt limiting
- Resend verification OTP
- Forgot-password workflow
- Password reset using OTP
- Google authentication
- User roles and account information
- PostgreSQL persistence
- Request validation using `class-validator`

**Security**

- Passwords are stored as hashes.
- OTPs are hashed before database storage.
- Refresh tokens are stored as hashes.
- OTPs expire and have limited verification attempts.
- Environment variables hold sensitive configuration.
- Password recovery responses avoid revealing whether an account exists.

**Database:** PostgreSQL, managed through TypeORM.

Tables include:

- `users`
- `oauth_accounts`
- `sessions`
- `otp_codes`
- `password_resets`

**Testing:** Unit tests, end-to-end tests, and isolated PostgreSQL integration tests.

### 2. Product Service

**Technology:** NestJS, TypeScript, MongoDB, Mongoose.

Responsible for product information, catalog operations, and stock management.

**Features**

- Product creation and management
- Product retrieval and updates
- Product deletion
- Product search
- Category filtering
- Pagination
- Sorting by supported product fields
- Request validation
- MongoDB persistence
- Admin authorization for restricted product operations
- Atomic stock reservation and release operations

**Stock Management**

The service supports controlled stock changes to help prevent concurrent requests from reserving the same available inventory.

Order operations use the product domain module in-process to look up products and reserve inventory.

**Database:** MongoDB, accessed through Mongoose.

**Testing:** Unit tests, end-to-end tests, and isolated MongoDB integration tests.

### 3. Order Service

**Technology:** NestJS, TypeScript, MySQL, Prisma.

Responsible for customer orders, order records, and order-related business logic.

**Features**

- Authenticated order creation
- Product price lookup through the Product Service
- Server-side order total calculation
- Customer order retrieval
- Order persistence in MySQL
- Database operations through Prisma
- Integration with product inventory operations
- Order-related request validation

**Order Processing**

The service retrieves product information and prices from the backend rather than trusting prices submitted by the client. It calculates order totals on the server and persists order records.

**Database:** MySQL, accessed through Prisma ORM.

**Testing:** Unit tests and isolated MySQL integration tests. The standalone service mode also retains its RabbitMQ integration test.

### 4. API Gateway (standalone service mode)

**Technology:** NestJS, TypeScript.

The API Gateway is retained for the standalone service mode. The monolith branch runs the domain modules directly on port `3003`.

**Features**

- Central API entry point
- Health-check endpoint
- Request forwarding to backend services
- Separation between the frontend and internal service addresses

**Health Check**

```http
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

**Local address:** `http://localhost:3003`

### 5. Customer Frontend

**Technology:** React, TypeScript, Vite.

The customer-facing application provides the interface for browsing and purchasing products.

The frontend is configured as a separate application and communicates through the API Gateway.

### 6. Admin Dashboard

The admin dashboard is intended to provide administrative access to product and platform management.

Administrative backend authorization is implemented for restricted product operations. The full dashboard and its remaining workflows should be documented as implemented as they are completed.

## Databases

Each backend service owns its own database technology.

| Service | Database | Data access |
|---|---|---|
| User/Auth | PostgreSQL | TypeORM |
| Product | MongoDB | Mongoose |
| Order | MySQL | Prisma |

This separation allows each service to manage its own data model and database operations.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | NestJS, TypeScript |
| Authentication | JWT, Argon2 |
| Relational databases | PostgreSQL, MySQL |
| Document database | MongoDB |
| ORM / ODM | TypeORM, Prisma, Mongoose |
| Messaging | RabbitMQ for standalone service mode; not used by the monolith |
| Caching | Redis |
| Containers | Docker |
| Testing | Unit, E2E, and integration tests |
| Package management | pnpm |

## Testing and Code Quality

The backend includes automated checks for individual components, application workflows, database integration, compilation, and linting.

Run all backend checks:

```bash
./infrastructure/backend/test.sh all
```

The runner executes:

- Unit tests
- End-to-end tests
- Integration tests
- Backend build
- Lint checks

**Current status:** All backend checks passed in the latest complete run.

Integration tests use isolated test databases, including:

- `ecommerce_users_test`
- `ecommerce_products_test`
- `ecommerce_orders_test`

Tests should not run against development databases when they may modify application data.

## Project Structure

```text
ecommerce/
├── frontend/
│   └── web/
├── backend/
│   ├── user-service/
│   │   └── src/monolith/
│   ├── product-service/
│   ├── order-service/
│   └── api-gateway/
├── infrastructure/
│   ├── backend/
│   │   └── test.sh
│   ├── frontend/
│   ├── shared/
│   └── test.sh
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Local Development

### Prerequisites

- Node.js
- pnpm
- Docker
- Git

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Start Infrastructure

Copy the example variables, then start only the databases required by the monolith. RabbitMQ is not needed. Compose creates its named volumes automatically:

```bash
cp .env.example .env
docker compose up -d postgres mongo mysql
```

### 3. Start the Monolithic Backend

pnpm --filter order-service exec prisma migrate deploy
pnpm --filter user-service start:monolith
```

This starts authentication, user, product, and order APIs together on port
`3003`. Use `MONOLITH_PORT` to choose another port.

### 4. Start a Frontend

```bash
pnpm --filter web dev
```

For the admin dashboard, use a separate terminal and run
`pnpm --filter admin dev`.

### 5. Verify the Monolith

```bash
curl http://localhost:3003/health
```

## Environment Configuration

Each service has its own environment configuration.

Use the service's `.env` file for local database connection details, authentication secrets, messaging configuration, and other required settings.

Never commit real credentials, production secrets, or populated environment files to version control.

Use `.env.example` files to document the required variables without exposing their values.

## Engineering Principles

The project follows these principles:

- **Separation of concerns:** each service has a clear responsibility.
- **Single responsibility:** components should have focused purposes.
- **Loose coupling:** services should interact through defined interfaces.
- **DRY:** avoid unnecessary duplication.
- **KISS:** prefer straightforward solutions over unnecessary complexity.
- **SOLID:** design components that are easier to maintain and extend.
- **Validation and security:** validate incoming requests and protect sensitive operations.
- **Automated testing:** verify changes before integrating them.
- **Maintainability:** keep the codebase organized and understandable.


## Supporting Infrastructure

| Technology | Current status |
|---|---|
| Docker | Used for local infrastructure |
| PostgreSQL | Implemented in User/Auth Service |
| MongoDB | Implemented in Product Service |
| MySQL | Implemented in Order Service |
| RabbitMQ | Not required by the monolith; retained for standalone service mode |
| Redis | Running locally through Docker Compose; application integration pending |

## Planned Improvements

The following areas will be developed as the platform evolves:

- Complete customer shopping and checkout workflows
- Complete the admin dashboard
- Product image uploads using object storage, with image URLs and metadata stored in the product database
- Redis caching
- Expanded asynchronous workflows using RabbitMQ
- Email delivery integration
- Additional authorization and security hardening
- Structured logging and monitoring
- Broader frontend testing
- CI/CD pipelines
- Free-tier deployment and production configuration
- Expanded API documentation

## Project Goal

The goal is to build a practical, maintainable e-commerce platform while learning how to design, implement, test, and deploy distributed applications.

The project emphasizes real engineering practices, including database design, authentication, service communication, concurrency control, testing, security, and operational reliability.


## Running the services
**Before running any tests, read [`README.md`](./docs/README.md) in this `docs` folder first.** It explains the project setup, environment configuration, databases, and infrastructure. Do not run integration tests until you understand the test database requirements in this guide.
