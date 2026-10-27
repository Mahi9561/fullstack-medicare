import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Splash } from '../components/common/Splash';
import { useAppSelector } from '../store/hooks';
import { paths } from './paths';

/** Everything behind login. Waits for the one-time session check, then lets the user in or sends them to /login. */
export function ProtectedRoute() {
  const status = useAppSelector((state) => state.auth.status);
  const location = useLocation();

  if (status === 'idle') return <Splash />;
  if (status === 'anonymous') return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
