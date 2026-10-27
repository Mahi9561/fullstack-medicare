import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Splash } from '../components/common/Splash';
import { safeReturnPath } from '../routes/paths';
import { useAppSelector } from '../store/hooks';

const SHEET = [
  { time: '9:00 AM', who: 'Aarav S.', note: 'Follow-up', state: 'confirmed' },
  { time: '9:30 AM', who: null, note: 'Free', state: 'free' },
  { time: '10:00 AM', who: 'Diya P.', note: 'Headache', state: 'booked' },
  { time: '10:30 AM', who: 'Neha J.', note: 'Fever and sore throat', state: 'booked' },
  { time: '11:00 AM', who: null, note: 'Free', state: 'free' },
] as const;

/** The day sheet is what the product is about, so it is the first thing you see. */
function DaySheetArt() {
  return (
    <div aria-hidden="true" className="w-full max-w-sm rounded-lg bg-white/[0.06] p-1 text-sm">
      {SHEET.map((row) => (
        <div key={row.time} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 border-t border-white/10 px-4 py-3 first:border-t-0">
          <span className="font-display tabular-nums text-white">{row.time}</span>
          {row.state === 'free' ? (
            <span className="rounded border border-dashed border-white/25 px-2 py-1 text-white/50">{row.note}</span>
          ) : (
            <span className={row.state === 'confirmed' ? 'rounded bg-pine-400/25 px-2 py-1 text-white' : 'rounded bg-white/10 px-2 py-1 text-white/90'}>
              {row.who}, {row.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function AuthLayout() {
  const status = useAppSelector((state) => state.auth.status);
  const role = useAppSelector((state) => state.user.user?.role);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === 'idle') return <Splash />;
  if (status === 'authenticated' && role) return <Navigate to={safeReturnPath(role, from)} replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="hidden flex-col justify-between bg-ink px-12 py-12 text-white lg:flex">
        <p className="font-display text-xl font-semibold">MediCare Local</p>
        <div className="space-y-8">
          <div>
            <h1 className="max-w-md text-4xl font-semibold leading-[1.1]">Your clinic day, on one sheet.</h1>
            <p className="mt-4 max-w-md text-white/70">Book visits, record consultations and issue prescriptions without leaving the page.</p>
          </div>
          <DaySheetArt />
        </div>
        <p className="text-sm text-white/50">Runs on this computer only. All data is made up.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <p className="mb-8 font-display text-xl font-semibold lg:hidden">MediCare Local</p>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
