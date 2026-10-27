# E-Commerce Platform: Setup and Run Guide

This guide explains how a new developer can install, configure, start, and verify the e-commerce platform locally.

**Start here before running the application or its tests.** After completing this guide, read [TESTING.md](./TESTING.md) for the testing instructions.

## 1. Architecture

The application contains a React frontend, an API Gateway, and three backend microservices.

| Component | Technology | Local port |
|---|---|---:|
| Customer frontend | React, TypeScript, Vite | Vite default |
| API Gateway | NestJS | 3003 |
| User/Auth Service | NestJS, PostgreSQL, TypeORM | 3000 |
| Product Service | NestJS, MongoDB, Mongoose | 3001 |
| Order Service | NestJS, MySQL, Prisma | 3002 |
| Message broker | RabbitMQ | 5672 |
| Cache infrastructure | Redis | 6379 |

The ports listed for infrastructure are the usual local ports. Check your Docker configuration if your mappings differ.

**Database ownership**

- User/Auth Service: PostgreSQL
- Product Service: MongoDB
- Order Service: MySQL

Redis is available in the local infrastructure, but application caching integration is still pending.

## 2. Prerequisites

Install the following before continuing:

- Git
- Node.js, using a version compatible with the repository
- pnpm
- Docker Engine or Docker Desktop

Check your installations:

```bash
git --version
node --version
pnpm --version
docker --version
docker compose version
```

If `pnpm` is not installed, enable Corepack if it is available in your Node.js installation:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

Use the Node.js and pnpm versions specified in the repository's configuration if they are pinned there.

## 3. Clone the Repository

Clone the repository using its actual Git URL:

```bash
git clone <REPOSITORY_URL>
cd ecommerce
```

Replace `<REPOSITORY_URL>` with the repository URL.

If you already have the repository, open a terminal in its root directory instead.

## 4. Install Dependencies

From the project root:

```bash
pnpm install
```

This installs dependencies for the pnpm workspace.

## 5. Configure Environment Variables

Create the root environment file used by Docker Compose:

```bash
cp .env.example .env
```

The values in `.env.example` are local development defaults. Change them if needed, and never use them in production.

Each backend service has its own environment configuration.

Check the required files and examples:

```bash
find backend -maxdepth 2 -type f \
  \( -name '.env.example' -o -name '.env' \) -print
```

Configure the required variables for:

- `backend/user-service`
- `backend/product-service`
- `backend/order-service`
- `backend/api-gateway`

Use the existing `.env.example` files or service documentation as the source of truth. If a service has no example file, inspect its configuration code to identify the required variables.

Important:

- Do not commit `.env` files containing secrets.
- Use local development credentials only for local development.
- Ensure database names, credentials, ports, and service URLs match your Docker configuration.
- Do not copy production secrets into your local environment.

## 6. Start Infrastructure

Docker Compose creates named local volumes on first startup; it does not require pre-existing containers or machine-specific volumes. It manages PostgreSQL, MongoDB, MySQL, RabbitMQ, and Redis.

From the project root, start all infrastructure services:

```bash
docker compose up -d
```

Check their status:

```bash
docker ps
```

View logs
```bash
docker compose logs -f
```

Stop containers
```bash
docker compose stop
```


## 7. Start the Backend Services

If need arises to start all services individually, Open a separate terminal for each process. Run all commands from the project root.

Apply the Order Service database migrations before its first start and after pulling schema changes:

```bash
pnpm --filter order-service exec prisma migrate deploy
```

### Terminal 1: User/Auth Service

```bash
pnpm --filter user-service start:dev
```

### Terminal 2: Product Service

```bash
pnpm --filter product-service start:dev
```

### Terminal 3: Order Service

```bash
pnpm --filter order-service start:dev
```

### Terminal 4: API Gateway

```bash
pnpm --filter api-gateway start:dev
```

Keep these terminals open while using the application. Check their output if a service fails to start.

## 8. Start the Frontend

Open another terminal in the project root:

```bash
pnpm --filter web dev
```

Vite prints the frontend URL in the terminal. Open that URL in your browser.

## 9. Verify the API Gateway

Run:

```bash
curl -i http://localhost:3003/health
```

A successful response should include HTTP status `200` and a body similar to:

```json
{
  "status": "ok"
}
```

This verifies the gateway health endpoint. It does not, by itself, prove that every downstream service or database is working.

For additional verification, check each service's terminal and try its documented API endpoints.

## 10. Common Problems

### A service cannot connect to its database

- Check that the corresponding Docker container is running.
- Check the service's `.env` file.
- Confirm the host, port, database name, username, and password.
- Review the service terminal for the connection error.

### A port is already in use

Identify the process using the port, or adjust the local port mapping and corresponding environment configuration consistently.

### A workspace package cannot be found

Run commands from the repository root and verify the package name in its `package.json`.

### The frontend cannot reach the backend

- Confirm the API Gateway is running.
- Check the frontend's API base URL configuration.
- Inspect browser developer tools and the gateway terminal.
- Confirm the configured ports match the running services.

### Docker says a container does not exist

Inspect the repository's Docker Compose configuration and create the required infrastructure before starting the services.

## 11. Next Step

Once the application is configured and you understand how to start it, read [TESTING.md](./TESTING.md) before running the test suite.

The testing guide explains test modes, isolated test databases, and how to avoid changing development data.
