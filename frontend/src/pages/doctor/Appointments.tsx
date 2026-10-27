import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppointmentRow } from '../../components/common/AppointmentRow';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import {
  cancelAppointment,
  confirmAppointment,
  fetchAppointments,
  markNoShow,
} from '../../features/appointments/appointmentsSlice';
import { paths } from '../../routes/paths';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus } from '../../types';
import { cx } from '../../utils/cx';
import { errorMessage } from '../../utils/errors';
import { STATUS_LABEL, fullName, hasStarted, todayISO } from '../../utils/format';

type Pending = { kind: 'cancel' | 'no-show'; appointment: Appointment } | null;

export default function DoctorAppointments() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { items, meta, status, error } = useAppSelector((state) => state.appointments);
  const [date, setDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void dispatch(fetchAppointments({ date: date || undefined, status: statusFilter || undefined, page, limit: 12 }));
  }, [dispatch, date, statusFilter, page]);

  useEffect(load, [load]);

  const confirm = async (appointment: Appointment) => {
    try {
      await dispatch(confirmAppointment(appointment.id)).unwrap();
      toast.success(`Confirmed. ${fullName(appointment.patient)} has been notified.`);
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const runPending = async (reason: string) => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'cancel') {
        await dispatch(cancelAppointment({ id: pending.appointment.id, reason: reason || null })).unwrap();
        toast.success('Appointment cancelled. The patient has been notified.');
      } else {
        await dispatch(markNoShow(pending.appointment.id)).unwrap();
        toast.success('Marked as a no-show');
      }
      setPending(null);
      load();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const today = todayISO();

  return (
    <>
      <PageHeader title="Appointments" description="Confirm bookings, open a visit to record the consultation, or handle cancellations." />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Input
          label="Date"
          type="date"
          value={date}
          wrapperClassName="w-44"
          onChange={(event) => {
            setDate(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          value={statusFilter}
          wrapperClassName="w-44"
          onChange={(event) => {
            setStatusFilter(event.target.value as AppointmentStatus | '');
            setPage(1);
          }}
        >
          <option value="">All</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Button variant={date === today ? 'primary' : 'secondary'} onClick={() => { setDate(date === today ? '' : today); setPage(1); }}>
          Today
        </Button>
        {(date || statusFilter) && (
          <Button variant="ghost" onClick={() => { setDate(''); setStatusFilter(''); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {status === 'failed' && error && <ErrorNote message={error} onRetry={load} />}
      {status === 'loading' && items.length === 0 && <p className="text-ink-soft">Loading...</p>}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No appointments match" description="Try another date or clear the filters." />}

      {items.length > 0 && (
        <ul aria-busy={status === 'loading'} className={cx('rounded-lg border border-rule bg-white transition-opacity', status === 'loading' && 'opacity-60')}>
          {items.map((appointment) => {
            const open = appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED';
            return (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                party="patient"
                showDate
                actions={
                  <>
                    {appointment.status === 'BOOKED' && (
                      <Button size="sm" onClick={() => confirm(appointment)}>
                        Confirm
                      </Button>
                    )}
                    {appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW' && (
                      <Link to={paths.doctor.appointment(appointment.id)}>
                        <Button variant="secondary" size="sm">
                          {appointment.status === 'COMPLETED' ? 'View' : 'Open'}
                        </Button>
                      </Link>
                    )}
                    {open && hasStarted(appointment.appointment_date, appointment.start_time) && (
                      <Button variant="ghost" size="sm" onClick={() => setPending({ kind: 'no-show', appointment })}>
                        No-show
                      </Button>
                    )}
                    {open && (
                      <Button variant="ghost" size="sm" onClick={() => setPending({ kind: 'cancel', appointment })}>
                        Cancel
                      </Button>
                    )}
                  </>
                }
              />
            );
          })}
        </ul>
      )}
      <Pagination meta={meta} onPage={setPage} />

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'no-show' ? 'Mark as a no-show?' : 'Cancel this appointment?'}
        tone="danger"
        confirmLabel={pending?.kind === 'no-show' ? 'Mark no-show' : 'Cancel appointment'}
        reasonLabel={pending?.kind === 'cancel' ? 'Reason for the patient (optional)' : undefined}
        busy={busy}
        message={pending && <p>{fullName(pending.appointment.patient)}, {pending.appointment.reason}</p>}
        onConfirm={runPending}
        onClose={() => setPending(null)}
      />
    </>
  );
}
