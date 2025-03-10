# Auth Backend Service

A lightweight authentication service built with Bun and Hono.

## Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) and Docker Compose
- [pnpm](https://pnpm.io/) (package manager)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (database in Docker + local API with hot reload)
pnpm run dev
```

Server will be available at: http://localhost:1234

## Development Options

| Command               | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `pnpm run dev`        | **Recommended:** Database in Docker + API locally with hot reload |
| `pnpm run dev:docker` | Run everything in Docker (DB + API)                               |

## Database Commands

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `pnpm run db:start`   | Start PostgreSQL in Docker   |
| `pnpm run db:stop`    | Stop PostgreSQL container    |
| `pnpm run db:restart` | Restart PostgreSQL container |

## Production

```bash
# Run locally in production mode
pnpm run start

# Run in Docker for production
pnpm run start:docker
```

## Architecture

- **Database:** PostgreSQL running in Docker
- **API Server:** Bun + Hono
- **Container Setup:** Supports both development and production

## Environment Configuration

The database is configured with:

- Database name: `auth-backend-db`
- Username: `postgres`
- Password: `postgres`
- Port: `5432`

## Troubleshooting

If you encounter issues:

1. Ensure Docker is running
2. Try restarting the database: `pnpm run db:restart`
3. For a fresh start: `docker compose down && pnpm run dev`
