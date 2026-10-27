import type { ReactNode } from 'react';
import type { Consultation } from '../../types';
import { doctorName, formatDate, formatTimestampDate, formatTime, fullName } from '../../utils/format';

interface ConsultationCardProps {
  consultation: Consultation;
  /** Whose name to show next to the date. */
  party: 'doctor' | 'patient';
  footer?: ReactNode;
}

export function ConsultationCard({ consultation, party, footer }: ConsultationCardProps) {
  const when = consultation.appointment
    ? `${formatDate(consultation.appointment.appointment_date)}, ${formatTime(consultation.appointment.start_time)}`
    : formatTimestampDate(consultation.created_at);
  const who = party === 'doctor' ? doctorName(consultation.doctor) : fullName(consultation.patient);

  return (
    <article className="rounded-lg border border-rule bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-5 py-3">
        <h3 className="text-base font-semibold">{who || 'Consultation'}</h3>
        <p className="text-sm text-ink-soft">
          {party === 'doctor' && consultation.doctor ? `${consultation.doctor.specialization}, ` : ''}
          {when}
        </p>
      </header>
      <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-ink-soft">Symptoms</dt>
          <dd className="mt-0.5 whitespace-pre-wrap">{consultation.symptoms}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-soft">Diagnosis</dt>
          <dd className="mt-0.5 whitespace-pre-wrap">{consultation.diagnosis}</dd>
        </div>
        {consultation.notes && (
          <div className="sm:col-span-2">
            <dt className="font-medium text-ink-soft">Doctor's notes</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{consultation.notes}</dd>
          </div>
        )}
      </dl>
      {footer && <footer className="border-t border-rule px-5 py-3">{footer}</footer>}
    </article>
  );
}
