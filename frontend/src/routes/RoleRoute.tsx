import { Navigate, Outlet } from 'react-router-dom';
import { Splash } from '../components/common/Splash';
import { useAppSelector } from '../store/hooks';
import type { Role } from '../types';
import { paths } from './paths';

/** The UI-side role gate. It is only a convenience: the API enforces the same rules on every request. */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const role = useAppSelector((state) => state.user.user?.role);

  if (!role) return <Splash />;
  return allow.includes(role) ? <Outlet /> : <Navigate to={paths.forbidden} replace />;
}
