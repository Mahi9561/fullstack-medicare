import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NotificationBell } from '../components/common/NotificationBell';
import { Button } from '../components/ui/Button';
import { CloseIcon, MenuIcon } from '../components/ui/icons';
import { logout } from '../features/auth/authSlice';
import { paths } from '../routes/paths';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { Role } from '../types';
import { cx } from '../utils/cx';

interface NavItem {
  to: string;
  label: string;
  /** Exact match only, for items that have a sibling nested under their path. */
  end?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  PATIENT: [
    { to: paths.patient.dashboard, label: 'Dashboard' },
    { to: paths.patient.doctors, label: 'Find a doctor' },
    { to: paths.patient.book, label: 'Book an appointment' },
    { to: paths.patient.appointments, label: 'My appointments', end: true },
    { to: paths.patient.consultations, label: 'Consultations' },
    { to: paths.patient.prescriptions, label: 'Prescriptions' },
    { to: paths.patient.records, label: 'Medical records' },
    { to: paths.patient.profile, label: 'My profile' },
  ],
  DOCTOR: [
    { to: paths.doctor.dashboard, label: 'Dashboard' },
    { to: paths.doctor.appointments, label: 'Appointments' },
    { to: paths.doctor.patients, label: 'Patients' },
    { to: paths.doctor.consultations, label: 'Consultations' },
    { to: paths.doctor.prescriptions, label: 'Prescriptions' },
    { to: paths.doctor.availability, label: 'Availability' },
    { to: paths.doctor.profile, label: 'My profile' },
  ],
  ADMIN: [
    { to: paths.admin.dashboard, label: 'Dashboard' },
    { to: paths.admin.doctors, label: 'Doctors' },
    { to: paths.admin.patients, label: 'Patients' },
    { to: paths.admin.appointments, label: 'Appointments' },
    { to: paths.admin.departments, label: 'Departments' },
    { to: paths.admin.medications, label: 'Medications' },
    { to: paths.admin.reports, label: 'Reports' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { PATIENT: 'Patient', DOCTOR: 'Doctor', ADMIN: 'Administrator' };

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.user.user);
  const profile = useAppSelector((state) => state.user.profile);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!user) return null;

  const name = profile ? `${user.role === 'DOCTOR' ? 'Dr. ' : ''}${profile.first_name} ${profile.last_name}` : 'Clinic administrator';

  const signOut = async () => {
    await dispatch(logout());
    navigate(paths.login, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <aside
        className={cx(
          'bg-ink text-white/80 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col',
          menuOpen ? 'flex flex-col' : 'hidden',
        )}
      >
        <div className="hidden h-14 items-center px-6 font-display text-lg font-semibold text-white lg:flex">MediCare Local</div>
        <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'block rounded-md border-l-2 px-3 py-2 text-sm transition-colors',
                  isActive ? 'border-pine-400 bg-white/10 font-medium text-white' : 'border-transparent hover:bg-white/5 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-rule bg-white px-4 sm:px-8">
          <button
            type="button"
            className="mr-auto rounded-md p-2 text-ink-soft hover:bg-pine-50 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <span className="mr-auto hidden font-display font-semibold lg:block" aria-hidden="true" />
          <NotificationBell />
          <div className="ml-1 hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-ink-soft">{ROLE_LABEL[user.role]}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
