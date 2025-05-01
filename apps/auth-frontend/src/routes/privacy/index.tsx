import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/privacy/')({
  component: Privacy,
});

function Privacy() {
  return (
    <div className="p-4">
      <h1>Privacy Policy</h1>
      <p>Your privacy policy content will go here.</p>
      {/* TODO: Add actual Privacy Policy content */}
    </div>
  );
}
