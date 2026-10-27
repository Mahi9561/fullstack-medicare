import type { Prescription } from '../../types';
import { doctorName, formatTimestampDate, fullName } from '../../utils/format';

interface PrescriptionCardProps {
  prescription: Prescription;
  party: 'doctor' | 'patient';
}

export function PrescriptionCard({ prescription, party }: PrescriptionCardProps) {
  const consultation = prescription.consultation;
  const who = party === 'doctor' ? doctorName(consultation?.doctor) : fullName(consultation?.patient);
  const items = prescription.items ?? [];

  return (
    <article className="rounded-lg border border-rule bg-white">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-5 py-3">
        <div>
          <h3 className="text-base font-semibold">{who || 'Prescription'}</h3>
          {consultation?.diagnosis && <p className="text-sm text-ink-soft">For: {consultation.diagnosis}</p>}
        </div>
        <p className="text-sm text-ink-soft">{formatTimestampDate(prescription.created_at)}</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Medicines in this prescription</caption>
          <thead>
            <tr className="border-b border-rule text-xs text-ink-soft">
              <th scope="col" className="px-5 py-2 font-medium">Medicine</th>
              <th scope="col" className="px-3 py-2 font-medium">Dosage</th>
              <th scope="col" className="px-3 py-2 font-medium">How often</th>
              <th scope="col" className="px-3 py-2 font-medium">Days</th>
              <th scope="col" className="px-5 py-2 font-medium">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-rule first:border-t-0">
                <td className="px-5 py-2.5 font-medium">{item.medication?.name ?? `Medicine #${item.medication_id}`}</td>
                <td className="px-3 py-2.5">{item.dosage}</td>
                <td className="px-3 py-2.5">{item.frequency}</td>
                <td className="px-3 py-2.5 tabular-nums">{item.duration_days}</td>
                <td className="px-5 py-2.5 text-ink-soft">{item.instructions ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {prescription.notes && (
        <p className="border-t border-rule px-5 py-3 text-sm">
          <span className="font-medium text-ink-soft">Notes: </span>
          {prescription.notes}
        </p>
      )}
    </article>
  );
}
