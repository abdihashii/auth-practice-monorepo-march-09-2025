# Tech Stack

## Database

- **Database Engine:** [PostgreSQL](https://www.postgresql.org/docs) - Robust, open-source relational database.
- **ORM:** [Drizzle](https://orm.drizzle.team/docs/overview) - TypeScript ORM for interacting with the database.

## Deployment

- **Containerization:** [Docker](https://docs.docker.com/) - For packaging applications and their dependencies.
- **Local Development:** [Docker Compose](https://docs.docker.com/compose) - For defining and running multi-container Docker applications locally.
- **Hosting (App):** [Fly.io](https://fly.io/docs) - Platform for deploying backend and frontend applications globally.
- **Hosting (DB):** [Neon](https://neon.tech/docs) - Serverless PostgreSQL platform.

## Backend

### Core
- **Runtime:** [Bun](https://bun.sh/docs) - Fast JavaScript runtime and toolkit.
- **Web Framework:** [Hono](https://hono.dev/docs) - Lightweight, fast web framework suitable for edge environments.
- **Language:** [TypeScript](https://www.typescriptlang.org/docs) - Statically typed superset of JavaScript.

### Services & Integrations
- **Email:** [Resend](https://resend.com/docs) - API for sending transactional emails.
- **Cache:** [Upstash](https://upstash.com/docs) - Serverless Redis provider for caching and session management.
- **Authentication:** 
  - [Google Auth Library](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest) - For implementing Google OAuth sign-in.
- **Object Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2) - S3-compatible storage for files.
- **Storage SDK:** [AWS S3 SDK](https://aws.amazon.com/sdk-for-javascript) - Used to interact with R2 via its S3-compatible API.
- **Monitoring:** [Sentry](https://docs.sentry.io/platforms/javascript/guides/bun) - Error tracking and performance monitoring.