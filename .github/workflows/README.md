# GitHub Workflows

This directory contains GitHub Actions workflows for the monorepo.

## Workflows

- **lint.yml**: Runs linting checks on PRs
- **build-check.yml**: Detects which packages/apps changed in a PR and runs appropriate build steps
- **deploy-backend.yml**: Deploys the backend application
- **deploy-frontend.yml**: Deploys the frontend application

## Build Check Workflow

The `build-check.yml` workflow:

1. Detects which packages/apps were modified in a PR using path filters
2. Runs specific build jobs only for the modified packages/apps
3. These build checks are required to pass before a PR can be merged

## Setting Up Branch Protection

To make the build checks required for merging PRs:

1. Go to your GitHub repository settings
2. Navigate to "Branches" in the sidebar
3. Under "Branch protection rules", click "Add rule"
4. In "Branch name pattern", enter `main`
5. Enable "Require status checks to pass before merging"
6. Search for and select these required status checks:
   - `build-shared` (for shared package changes)
   - `build-backend` (for backend changes)
   - `build-frontend` (for frontend changes)
   - `build` (from lint.yml)
7. Optional: Select additional protection options as needed
8. Click "Create" or "Save changes"

With this setup, PRs will require the appropriate build checks to pass before they can be merged. 