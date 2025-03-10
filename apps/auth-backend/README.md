# Auth Backend Service

A Hono-based authentication backend service built with Bun.

## Development

### Using Docker

To run the service using Docker:

```bash
# From the auth-backend directory
docker-compose up

# Or from the root of the monorepo
docker-compose -f apps/auth-backend/docker-compose.yml up
```

The service will be available at http://localhost:1234

### Without Docker

To run the service without Docker:

```bash
# From the root of the monorepo
pnpm install
bun run dev
```

## API Endpoints

- `GET /`: Hello message
- `GET /health`: Health check endpoint

## Environment Variables

No environment variables are required for basic functionality.
