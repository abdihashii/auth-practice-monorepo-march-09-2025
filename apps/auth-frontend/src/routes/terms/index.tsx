import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/terms/')({
  component: Terms,
});

function Terms() {
  return (
    <div className="p-4">
      <h1>Terms of Service</h1>
      <p>Your terms of service content will go here.</p>
      {/* TODO: Add actual Terms of Service content */}
    </div>
  );
}
