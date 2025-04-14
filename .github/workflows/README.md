# GitHub Workflows

This directory contains GitHub Actions workflows for the monorepo.

## Workflows

- **ci.yml**: Runs linting and builds only the packages/apps that changed in a PR
- **deploy-backend.yml**: Builds and deploys the backend when changes are merged to main
- **deploy-frontend.yml**: Builds and deploys the frontend when changes are merged to main

## Complete CI/CD Workflow

Our CI/CD workflow follows these steps:

1. **PR Stage**: When a PR is created against main
   - The `ci` workflow detects which parts of the codebase changed
   - It runs linting on the entire codebase first
   - Then it builds only the specific packages/apps that were modified
   - This ensures the PR contains working code that can be built successfully

2. **Merge Stage**: When a PR is merged to main
   - Based on what was changed, either the backend deployment, frontend deployment, or both workflows will trigger
   - Each deployment workflow:
     - Rebuilds the code to ensure latest changes are included
     - Deploys the application to the hosting environment

## Setting Up Branch Protection

To ensure PRs can only be merged when checks pass:

1. Go to your GitHub repository settings
2. Navigate to "Branches" in the sidebar
3. Under "Branch protection rules", click "Add rule"
4. In "Branch name pattern", enter `main`
5. Enable "Require status checks to pass before merging"
6. Search for and select these required status checks:
   - `lint` (from ci.yml)
   - `build-shared` (if shared package changes)
   - `build-backend` (if backend changes)
   - `build-frontend` (if frontend changes)
7. Click "Create" or "Save changes"

With this setup, PRs will require the appropriate checks to pass before merging, and deployments will happen automatically after merge.
