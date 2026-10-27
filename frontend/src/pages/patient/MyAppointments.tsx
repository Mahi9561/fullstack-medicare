import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppointmentRow } from '../../components/common/AppointmentRow';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import { cancelAppointment, fetchAppointments } from '../../features/appointments/appointmentsSlice';
import { paths } from '../../routes/paths';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus } from '../../types';
import { cx } from '../../utils/cx';
import { errorMessage } from '../../utils/errors';
import { STATUS_LABEL, doctorName, formatDate, formatTime } from '../../utils/format';

type Scope = 'upcoming' | 'history';

const TABS: { scope: Scope; label: string }[] = [
  { scope: 'upcoming', label: 'Upcoming' },
  { scope: 'history', label: 'History' },
];

export default function MyAppointments() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { items, meta, status, error } = useAppSelector((state) => state.appointments);
  const [scope, setScope] = useState<Scope>('upcoming');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    void dispatch(fetchAppointments({ scope, status: statusFilter || undefined, page, limit: 10 }));
  }, [dispatch, scope, statusFilter, page]);

  useEffect(load, [load]);

  const confirmCancel = async (reason: string) => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await dispatch(cancelAppointment({ id: toCancel.id, reason: reason || null })).unwrap();
      toast.success('Appointment cancelled. The time is free for others again.');
      setToCancel(null);
      load();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My appointments"
        actions={
          <Link to={paths.patient.book}>
            <Button>Book an appointment</Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="Appointment list" className="inline-flex rounded-md border border-rule bg-white p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.scope}
              type="button"
              role="tab"
              aria-selected={scope === tab.scope}
              onClick={() => {
                setScope(tab.scope);
                setStatusFilter('');
                setPage(1);
              }}
              className={cx(
                'rounded px-4 py-1.5 text-sm font-medium transition-colors',
                scope === tab.scope ? 'bg-pine-600 text-white' : 'text-ink-soft hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {scope === 'history' && (
          <Select
            label="Status"
            value={statusFilter}
            wrapperClassName="w-48"
            onChange={(event) => {
              setStatusFilter(event.target.value as AppointmentStatus | '');
              setPage(1);
            }}
          >
            <option value="">All</option>
            {APPOINTMENT_STATUSES.filter((s) => s !== 'BOOKED' && s !== 'CONFIRMED').map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        )}
      </div>

      {status === 'failed' && error && <ErrorNote message={error} onRetry={load} />}
      {status === 'loading' && items.length === 0 && <p className="text-ink-soft">Loading...</p>}

      {status === 'succeeded' && items.length === 0 && (
        <EmptyState
          title={scope === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          description={scope === 'upcoming' ? 'Book a visit and it will show up here.' : 'Completed and cancelled visits appear here.'}
        />
      )}

      {items.length > 0 && (
        <ul aria-busy={status === 'loading'} className={cx('rounded-lg border border-rule bg-white transition-opacity', status === 'loading' && 'opacity-60')}>
          {items.map((appointment) => (
            <AppointmentRow
              key={appointment.id}
              appointment={appointment}
              party="doctor"
              showDate
              actions={
                (appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED') && (
                  <Button variant="secondary" size="sm" onClick={() => setToCancel(appointment)}>
                    Cancel
                  </Button>
                )
              }
            />
          ))}
        </ul>
      )}
      <Pagination meta={meta} onPage={setPage} />

      <ConfirmDialog
        open={toCancel !== null}
        title="Cancel this appointment?"
        tone="danger"
        confirmLabel="Cancel appointment"
        reasonLabel="Reason (optional)"
        busy={cancelling}
        message={
          toCancel && (
            <p>
              {doctorName(toCancel.doctor)} on {formatDate(toCancel.appointment_date)} at {formatTime(toCancel.start_time)}.
            </p>
          )
        }
        onConfirm={confirmCancel}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}
