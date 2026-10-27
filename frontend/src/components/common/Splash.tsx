import { Spinner } from '../ui/Spinner';

export function Splash({ label = 'Loading your session' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-ink-soft">
      <Spinner label={label} />
      <span className="ml-3 text-sm" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
