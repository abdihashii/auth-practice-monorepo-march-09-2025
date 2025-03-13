# Auth Backend Service

A lightweight authentication service built with Bun and Hono, featuring:

- user management
- authentication.
- more to come...

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

Server will be available at: http://localhost:8000

## Development Options

| Command               | Description                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `pnpm run dev`        | **Recommended:** Database in Docker + API locally with hot reload |
| `pnpm run dev:docker` | Run everything in Docker (DB + API)                               |

## Database Commands

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `pnpm run db:start`    | Start PostgreSQL in Docker   |
| `pnpm run db:stop`     | Stop PostgreSQL container    |
| `pnpm run db:restart`  | Restart PostgreSQL container |
| `pnpm run db:generate` | Generate Drizzle migrations  |
| `pnpm run db:migrate`  | Run Drizzle migrations       |
| `pnpm run db:push`     | Push Drizzle schema changes  |

## Production

```bash
# Run locally in production mode
pnpm run start

# Run in Docker for production
pnpm run start:docker
```

## Deployment

The service is deployed on [Fly.io](https://fly.io) with the following configuration:

- App name: `auth-backend-blue-darkness-6417`
- Primary region: `ord`
- Internal port: 8000
- VM configuration: 1GB RAM, shared CPU

## Features

- **User Authentication**

  - Registration with email/password
  - Login with credential validation
  - JWT-based authentication with access and refresh tokens
  - Password hashing with Argon2

- **User Management**
  - List all users
  - Get user details by ID
  - User settings and notification preferences

## Architecture

- **Database:** PostgreSQL with Drizzle ORM, running in Docker
- **API Server:** Bun + Hono
- **Error Handling:** Standardized API response format
- **Validation:** Schema-based validation for requests using Zod
- **Monitoring:** Sentry integration for error tracking
- **Container Setup:** Supports both development and production

## API Endpoints

- **Auth Routes**

  - `POST /api/v1/auth/register` - Register a new user
  - `POST /api/v1/auth/login` - Login an existing user

- **User Routes**

  - `GET /api/v1/users` - Get all users
  - `GET /api/v1/users/:id` - Get user by ID

- **Health Checks**
  - `GET /health` - Basic server health check
  - `GET /health/db` - Database connection check

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
4. Check logs for specific error messages
