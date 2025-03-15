import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <main>
      <h1>Roll Your Own Auth</h1>
    </main>
  );
}
