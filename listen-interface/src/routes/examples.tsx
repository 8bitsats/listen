import { createFileRoute } from '@tanstack/react-router';
import ExamplesPage from '../components/examples/ExamplesPage';

export const Route = createFileRoute('/examples')();

export default function Examples() {
  return <ExamplesPage />;
}
