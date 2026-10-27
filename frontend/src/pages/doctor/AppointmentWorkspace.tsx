import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { useToast } from '../../components/ui/Toast';
import { ConsultationCard } from '../../features/consultations/ConsultationCard';
import { ConsultationForm } from '../../features/consultations/ConsultationForm';
import { VitalsForm } from '../../features/consultations/VitalsForm';
import { PrescriptionBuilder } from '../../features/prescriptions/PrescriptionBuilder';
import { PrescriptionCard } from '../../features/prescriptions/PrescriptionCard';
import { useAsync } from '../../hooks/useAsync';
import { paths } from '../../routes/paths';
import { appointmentApi } from '../../services/appointment.api';
import { consultationApi } from '../../services/consultation.api';
import { patientApi } from '../../services/patient.api';
import type { Consultation, Prescription } from '../../types';
import { errorMessage } from '../../utils/errors';
import {
  ageFrom,
  formatBloodPressure,
  formatDate,
  formatTimeRange,
  formatTimestampDate,
  fullName,
  genderLabel,
} from '../../utils/format';

/**
 * The page a doctor works in during a visit: patient background on the side, and the three steps of a
 * visit in order: vital signs, consultation, prescription. Saving the consultation completes the appointment.
 */
export default function AppointmentWorkspace() {
  const { id } = useParams();
  const appointmentId = Number(id);
  const toast = useToast();

  const appointment = useAsync(() => appointmentApi.get(appointmentId), [appointmentId]);
  const patientId = appointment.data?.patient_id;
  const history = useAsync(async () => (patientId ? patientApi.history(patientId) : null), [patientId]);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [editingConsultation, setEditingConsultation] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // The appointment only carries a consultation stub; the full record (with prescription items) comes from its own endpoint.
  const consultationId = appointment.data?.consultation?.id;
  const loadedConsultation = useAsync(async () => (consultationId ? consultationApi.get(consultationId) : null), [consultationId]);
  useEffect(() => {
    if (loadedConsultation.data) setConsultation(loadedConsultation.data);
  }, [loadedConsultation.data]);

  if (appointment.error) {
    return (
      <>
        <PageHeader title="Appointment" />
        <ErrorNote message={appointment.error} onRetry={appointment.reload} />
      </>
    );
  }
  const current = appointment.data;
  if (!current) return <p className="text-ink-soft">Loading...</p>;

  const patientName = fullName(current.patient);
  const profile = history.data?.patient ?? current.patient;
  const dateOfBirth = profile && 'date_of_birth' in profile ? profile.date_of_birth : undefined;
  const gender = profile && 'gender' in profile ? profile.gender : undefined;
  const prescription: Prescription | null = (consultation?.prescription as Prescription | null | undefined) ?? null;
  const previousConsultations = (history.data?.consultations ?? []).filter((c) => c.id !== consultation?.id).slice(0, 3);
  const lastVitals = (history.data?.vital_signs ?? []).find((v) => v.appointment_id !== current.id);

  const confirm = async () => {
    setConfirming(true);
    try {
      await appointmentApi.confirm(current.id);
      toast.success('Appointment confirmed');
      appointment.reload();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setConfirming(false);
    }
  };

  const consultationSaved = (saved: Consultation) => {
    setConsultation(saved);
    setEditingConsultation(false);
    appointment.reload(); // the status is now COMPLETED
  };

  const canRecordVitals = current.status === 'BOOKED' || current.status === 'CONFIRMED' || current.status === 'COMPLETED';

  return (
    <>
      <PageHeader
        title={patientName}
        description={`${formatDate(current.appointment_date)}, ${formatTimeRange(current.start_time, current.end_time)}`}
        actions={
          <>
            <StatusBadge status={current.status} />
            {current.status === 'BOOKED' && (
              <Button onClick={confirm} loading={confirming}>
                Confirm appointment
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Reason for the visit">
            <p className="whitespace-pre-wrap text-sm">{current.reason}</p>
            {current.cancellation_reason && <p className="mt-2 text-sm text-red-800">Cancelled: {current.cancellation_reason}</p>}
          </Panel>

          {canRecordVitals && (
            <Panel title="1. Vital signs" description="Optional. Fill in whatever was measured.">
              <VitalsForm appointmentId={current.id} initial={current.vital_signs ?? null} onSaved={() => appointment.reload()} />
            </Panel>
          )}

          <Panel title="2. Consultation">
            {current.status === 'BOOKED' && (
              <p className="text-sm text-ink-soft">Confirm the appointment first. You can then record the consultation here.</p>
            )}
            {(current.status === 'CANCELLED' || current.status === 'NO_SHOW') && (
              <p className="text-sm text-ink-soft">This appointment did not take place, so there is nothing to record.</p>
            )}
            {current.status === 'CONFIRMED' && !consultation && (
              <ConsultationForm appointmentId={current.id} onSaved={consultationSaved} />
            )}
            {consultation && !editingConsultation && (
              <ConsultationCard
                consultation={consultation}
                party="patient"
                footer={
                  <Button variant="secondary" size="sm" onClick={() => setEditingConsultation(true)}>
                    Edit consultation
                  </Button>
                }
              />
            )}
            {consultation && editingConsultation && (
              <ConsultationForm
                appointmentId={current.id}
                existing={consultation}
                onSaved={consultationSaved}
                onCancel={() => setEditingConsultation(false)}
              />
            )}
          </Panel>

          {consultation && (
            <Panel title="3. Prescription" description="Optional. One prescription per consultation.">
              {prescription && !editingPrescription ? (
                <div className="space-y-3">
                  <PrescriptionCard prescription={{ ...prescription, consultation: undefined }} party="patient" />
                  <Button variant="secondary" size="sm" onClick={() => setEditingPrescription(true)}>
                    Edit prescription
                  </Button>
                </div>
              ) : (
                <PrescriptionBuilder
                  consultationId={consultation.id}
                  existing={prescription}
                  onSaved={(saved) => {
                    setConsultation({ ...consultation, prescription: saved });
                    setEditingPrescription(false);
                  }}
                />
              )}
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Patient">
            <dl className="space-y-2 text-sm">
              {dateOfBirth && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Age</dt>
                  <dd>{ageFrom(dateOfBirth)} years</dd>
                </div>
              )}
              {gender && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Gender</dt>
                  <dd>{genderLabel(gender)}</dd>
                </div>
              )}
              {profile && 'phone' in profile && profile.phone && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Phone</dt>
                  <dd className="tabular-nums">{profile.phone}</dd>
                </div>
              )}
            </dl>
            <Link to={paths.doctor.patient(current.patient_id)} className="mt-4 inline-block text-sm font-medium text-pine-700 underline underline-offset-2">
              Full history
            </Link>
          </Panel>

          <Panel title="Previous consultations" flush>
            {history.error ? (
              <p className="p-4 text-sm text-ink-soft">History is not available for this appointment.</p>
            ) : previousConsultations.length === 0 ? (
              <p className="p-4 text-sm text-ink-soft">{history.loading ? 'Loading...' : 'No earlier consultations.'}</p>
            ) : (
              <ul>
                {previousConsultations.map((item) => (
                  <li key={item.id} className="border-t border-rule px-4 py-3 text-sm first:border-t-0">
                    <p className="font-medium">{item.diagnosis}</p>
                    <p className="text-ink-soft">{formatTimestampDate(item.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {lastVitals && (
            <Panel title="Last recorded vitals">
              <dl className="space-y-1.5 text-sm">
                {lastVitals.bp_systolic !== null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Blood pressure</dt>
                    <dd className="tabular-nums">{formatBloodPressure(lastVitals.bp_systolic, lastVitals.bp_diastolic)}</dd>
                  </div>
                )}
                {lastVitals.heart_rate !== null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Heart rate</dt>
                    <dd className="tabular-nums">{lastVitals.heart_rate}</dd>
                  </div>
                )}
                {lastVitals.weight_kg !== null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">Weight</dt>
                    <dd className="tabular-nums">{lastVitals.weight_kg} kg</dd>
                  </div>
                )}
              </dl>
              <p className="mt-2 text-xs text-ink-soft">{formatTimestampDate(lastVitals.created_at)}</p>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
