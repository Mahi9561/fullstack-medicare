import { Navigate } from 'react-router-dom';
import { Splash } from '../components/common/Splash';
import { useAppSelector } from '../store/hooks';
import { homeFor } from './paths';

export function HomeRedirect() {
  const role = useAppSelector((state) => state.user.user?.role);
  return role ? <Navigate to={homeFor(role)} replace /> : <Splash />;
}
