/* eslint-disable node/no-process-env, no-console */

// Check if running in CI/CD environment or build process
const isCI = process.env.CI === 'true'
  || process.env.FLY_APP_NAME !== undefined // Check if running on Fly.io
  || process.env.NODE_ENV === 'production' // Check if running in production
  || process.argv.includes('--build') // Check if running in build process
  || process.argv.includes('build'); // Check if running in build process

// Skip environment schema validation in CI environments or build process
// This is because the env vars are stored in Fly.io secrets and will be
// available at runtime for validation and use in the app.
if (isCI) {
  console.log(
    '✅ Skipping environment schema validation in CI/CD or build environment',
  );
  process.exit(0);
}

// Only import and validate if not in CI
try {
  // Dynamic import to avoid loading if we're skipping validation
  await import('@/env');
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error);
  process.exit(1);
}
