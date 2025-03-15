import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <main className="min-h-screen bg-black">
      <h1 className="text-white">Roll Your Own Auth</h1>
    </main>
  );
}
