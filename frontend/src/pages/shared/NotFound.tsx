import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl font-semibold tabular-nums text-pine-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-ink-soft">The link may be old, or the address may have a typo.</p>
      <Link to="/" className="mt-6">
        <Button>Go to my home page</Button>
      </Link>
    </main>
  );
}
