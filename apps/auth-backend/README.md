# Auth Backend Service

A Hono-based authentication backend service built with Bun.

## Development

### Using Docker

To run the service in development mode with hot reloading:

```bash
# From the auth-backend directory
docker-compose up auth-backend-dev
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
