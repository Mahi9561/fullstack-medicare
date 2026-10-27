import { useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { bootstrapSession } from './features/auth/authSlice';
import { AppRoutes } from './routes/AppRoutes';
import { useAppDispatch } from './store/hooks';

export default function App() {
  const dispatch = useAppDispatch();

  // One call on boot restores the session from the httpOnly cookie. Until it settles, guards show a splash.
  useEffect(() => {
    void dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}
