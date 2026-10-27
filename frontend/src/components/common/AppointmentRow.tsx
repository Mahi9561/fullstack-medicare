import type { ReactNode } from 'react';
import type { Appointment } from '../../types';
import { doctorName, formatDate, formatTime, fullName } from '../../utils/format';
import { StatusBadge } from './StatusBadge';

interface AppointmentRowProps {
  appointment: Appointment;
  /** Whose name to show: a doctor looks at patients, a patient looks at doctors. */
  party: 'patient' | 'doctor';
  showDate?: boolean;
  actions?: ReactNode;
}

/**
 * One line of the day sheet: the time on the left in large tabular figures (the thing people scan for),
 * then who and why, then status and actions.
 */
export function AppointmentRow({ appointment, party, showDate = false, actions }: AppointmentRowProps) {
  const name = party === 'patient' ? fullName(appointment.patient) : doctorName(appointment.doctor);
  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-2 border-t border-rule px-4 py-3 first:border-t-0 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
      <div className="font-display text-lg font-semibold leading-tight tabular-nums">
        {formatTime(appointment.start_time)}
        <span className="block text-xs font-normal text-ink-soft">{formatTime(appointment.end_time)}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">
          {name}
          {showDate && <span className="ml-2 text-sm font-normal text-ink-soft">{formatDate(appointment.appointment_date)}</span>}
        </p>
        <p className="truncate text-sm text-ink-soft">{appointment.reason}</p>
        {appointment.cancellation_reason && <p className="truncate text-xs text-red-800">Reason: {appointment.cancellation_reason}</p>}
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:justify-end">
        <StatusBadge status={appointment.status} />
        {actions}
      </div>
    </li>
  );
}
