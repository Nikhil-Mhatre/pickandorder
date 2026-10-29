# PickAndOrder — Product Service

Standalone Express + TypeScript service for furniture product catalog management. It owns its PostgreSQL database and does not import code from other services.

## Requirements

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL)

## Setup

From the repository root:

```bash
pnpm install
cp services/product-service/.env.example services/product-service/.env
docker compose up -d product-db
pnpm db:generate:product
pnpm db:migrate:product
pnpm dev:product
```

The API runs at `http://localhost:3001`.

## Endpoints

- `GET /health` — process health
- `GET /api/v1/products` — list active products; supports `page`, `limit`, and `category`
- `GET /api/v1/products/:id` — get a product
- `POST /api/v1/products` — create a product
- `PATCH /api/v1/products/:id` — update a product
- `DELETE /api/v1/products/:id` — delete a product

Example create request:

```bash
curl -X POST http://localhost:3001/api/v1/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Oak Dining Table","description":"Solid oak dining table","price":799.99,"category":"Tables","material":"Oak"}'
```

## Design boundaries

- This service owns the `pickandorder_products` database.
- Its dependencies and Prisma schema are local to this service.
- No shared packages or cross-service database access.
- Kafka is intentionally not wired in yet. Add a producer when the service has a concrete event to publish, such as `product.created`.

The `.env` values are for local development only. Change credentials before deploying anywhere shared or public.
