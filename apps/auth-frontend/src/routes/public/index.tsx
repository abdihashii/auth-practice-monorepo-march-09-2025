import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/public/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>This is a public route, viewable by everyone</div>;
}
