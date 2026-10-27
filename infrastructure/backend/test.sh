#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SERVICES=(user-service product-service order-service api-gateway)
MODE="${1:-all}"

run_suite() {
  local suite="$1"
  for service in "${SERVICES[@]}"; do
    echo
    echo "===== $suite: $service ====="
    case "$suite" in
      unit) pnpm --filter "$service" test ;;
      e2e) pnpm --filter "$service" test:e2e ;;
      build) pnpm --filter "$service" build ;;
      lint) pnpm --filter "$service" lint ;;
      *) echo "Unknown suite: $suite" >&2; exit 2 ;;
    esac
  done
}

run_integration() {
  echo
  echo "===== User Service PostgreSQL integration ====="
  (
    set -a
    source backend/user-service/.env
    set +a
    export DB_NAME=ecommerce_users_test
    pnpm --filter user-service test:integration
  )

  echo
  echo "===== Product Service MongoDB integration ====="
  MONGODB_URI='mongodb://localhost:27017/ecommerce_products_test' \
    pnpm --filter product-service exec vitest run \
      --config vitest.config.integration.ts

  echo
  echo "===== Order Service MySQL + RabbitMQ integration ====="
  (
    set -a
    source backend/order-service/.env
    set +a

    if [[ "${DATABASE_URL:-}" != *"ecommerce_orders"* ]] ||
       [[ "${DATABASE_URL:-}" == *"ecommerce_orders_test"* ]]; then
      echo "Refusing to derive the test URL from an unexpected database URL." >&2
      exit 1
    fi

    export DATABASE_URL="${DATABASE_URL/ecommerce_orders/ecommerce_orders_test}"
    export RABBITMQ_URL="${RABBITMQ_URL:?RABBITMQ_URL is not set}"

    if [[ "$DATABASE_URL" != *"ecommerce_orders_test"* ]]; then
      echo "Test database URL safety check failed." >&2
      exit 1
    fi

    pnpm --filter order-service test:integration
  )
}

case "$MODE" in
  unit|e2e|build|lint) run_suite "$MODE" ;;
  integration) run_integration ;;
  all)
    run_suite unit
    run_suite e2e
    run_integration
    run_suite build
    run_suite lint
    ;;
  *)
    echo "Usage: $0 [unit|e2e|integration|build|lint|all]" >&2
    exit 2
    ;;
esac

echo
echo "Backend $MODE checks passed."
