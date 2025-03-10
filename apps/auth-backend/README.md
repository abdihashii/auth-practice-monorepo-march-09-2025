# Auth Backend Service

A Hono-based authentication backend service built with Bun.

## Development

### Development Options

You have multiple ways to run the service:

1. **Docker Development (recommended for full isolation):**

   ```bash
   pnpm run dev
   # or
   pnpm run dev:docker
   ```

   This will start both the database and the server in Docker containers.

2. **Local Development with Docker Database:**

   ```bash
   # Using Hot Module Replacement (HMR) - only reloads changed modules
   pnpm run dev:local

   # Using watch mode - completely restarts the server on changes
   pnpm run dev:local:watch
   ```

   Both options will start the database in Docker and run the server locally with automatic reloading.

   - `--hot` (HMR): Faster feedback, preserves application state between reloads
   - `--watch`: Full restart, ensures clean state but slightly slower feedback

3. **Database Only:**

   ```bash
   pnpm run dev:db
   ```

   This will start only the database in Docker.

4. **Managing the Database:**

   ```bash
   # Stop the database container
   pnpm run stop:db

   # Restart the database container
   pnpm run db:restart
   ```

### Without Docker

To run the service entirely without Docker:

```bash
# From the root of the monorepo
pnpm install
# Navigate to auth-backend
cd apps/auth-backend
# Start the database in Docker first
pnpm run dev:db
# Then start the server locally
pnpm run start
```

### Production Mode

To run the service in production mode:

```bash
# From the auth-backend directory
docker-compose up auth-backend
```

### Deploying to Cloud Providers

The production Dockerfile (`Dockerfile.server`) is designed to be self-contained and can be deployed to any cloud provider that supports Docker:

1. Build the Docker image:

   ```bash
   docker build -t auth-backend:latest -f apps/auth-backend/Dockerfile.server ../..
   ```

2. Push to your container registry:

   ```bash
   docker tag auth-backend:latest your-registry/auth-backend:latest
   docker push your-registry/auth-backend:latest
   ```

3. Deploy using your cloud provider's container service (AWS ECS, Google Cloud Run, Azure Container Instances, etc.)

The service will be available at http://localhost:1234 when running locally.

## API Endpoints

- `GET /health`: Health check endpoint

## Environment Variables

No environment variables are required for basic functionality.
