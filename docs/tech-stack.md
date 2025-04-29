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

### Services & Integrations
- **Email:** [Resend](https://resend.com/docs) - API for sending transactional emails.
- **Cache:** [Upstash](https://upstash.com/docs) - Serverless Redis provider for caching and session management.
- **Authentication:** 
  - [Google Auth Library](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest) - For implementing Google OAuth sign-in.
- **Validation:** [@hono/zod-validator](https://hono.dev/middleware/builtin/zod-validator) - Middleware for validating request data using shared Zod schemas.
- **Rate Limiting:** [hono-rate-limiter](https://github.com/honojs/middleware/tree/main/packages/rate-limiter) with Redis - To prevent abuse by limiting request frequency.
- **Object Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2) - S3-compatible storage for files.
- **Storage SDK:** [AWS S3 SDK](https://aws.amazon.com/sdk-for-javascript) - Used to interact with R2 via its S3-compatible API.
- **Monitoring:** [Sentry](https://docs.sentry.io/platforms/javascript/guides/bun) - Error tracking and performance monitoring.

## Frontend

### Core & Build
- **Framework:** [React](https://react.dev/) - JavaScript library for building user interfaces.
- **Build Tool:** [Vite](https://vitejs.dev/) - Fast frontend build tool and development server.

### Routing & State
- **Routing:** [TanStack Router](https://tanstack.com/router/latest) - Type-safe routing for React applications.
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest) - Asynchronous state management, data fetching, and caching.

### UI & Styling
- **CSS Framework:** [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework.
- **Component Primitives:** [Radix UI](https://www.radix-ui.com/primitives) - Unstyled, accessible UI components.
- **Styling Utilities:** [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge), [class-variance-authority](https://cva.style/docs) - For managing CSS classes.
- **Animations:** [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) - Tailwind plugin for animations.
- **Icons:** [Lucide React](https://lucide.dev/) - Icon library.
- **Theming:** [next-themes](https://github.com/pacocoursey/next-themes) - Theme (e.g., dark/light mode) management.
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/) - Toast notification library.

### Forms
- **Form Management:** [React Hook Form](https://react-hook-form.com/) - Performant, flexible form library.
- **Validation Integration:** [@hookform/resolvers](https://github.com/react-hook-form/resolvers) - To integrate shared Zod schemas with React Hook Form.

## Shared Packages & Tooling

- **Primary Language:** [TypeScript](https://www.typescriptlang.org/docs) - Statically typed superset of JavaScript used throughout the monorepo.
- **Package Manager:** [PNPM](https://pnpm.io/workspaces) - Used for managing this monorepo and its workspaces.
- **Shared Logic:** `@roll-your-own-auth/shared` - Internal package containing shared types, constants, validation functions, and [Zod](https://zod.dev/) schemas used across the backend and frontend.
- **Linting Configuration:** `@roll-your-own-auth/eslint-config` - Internal package providing a consistent ESLint setup (based on `@antfu/eslint-config`) for the entire monorepo.
- **Build Path Aliases:** [tsc-alias](https://github.com/justkey007/tsc-alias) - Used to resolve TypeScript path aliases during the build process.
- **Git Hooks:** [Husky](https://typicode.github.io/husky/) & [lint-staged](https://github.com/okonet/lint-staged) - Used to enforce code quality (e.g., linting) before commits.
