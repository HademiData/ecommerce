# Monolithic backend

The monolithic NestJS app composes the existing authentication, user, product,
and order domain modules into one process on port `3003`. The frontend's
existing `/api` proxy can continue targeting that port; the API gateway and
the individual backend processes are not needed.
Set `MONOLITH_PORT` to override the monolith's listen port; service-specific
`PORT` values are ignored.

Start PostgreSQL, MongoDB, and MySQL (RabbitMQ is not used):

```bash
docker compose up -d postgres mongo mysql
```

The app loads the user-service `.env`, root `.env`, and product/order service
`.env` files. Apply the order database migrations, then start the app:

```bash
pnpm --filter order-service exec prisma migrate deploy
pnpm --filter user-service start:monolith
```

Build the single backend process with:

```bash
pnpm --filter user-service build:monolith
```

Stock is reserved synchronously through the product module. RabbitMQ is not
used by this app. User, product, and order data continue to use their existing
PostgreSQL, MongoDB, and MySQL databases.
