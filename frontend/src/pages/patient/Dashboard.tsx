import { Link } from 'react-router-dom';
import { AppointmentRow } from '../../components/common/AppointmentRow';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { StatStrip } from '../../components/common/StatStrip';
import { Button } from '../../components/ui/Button';
import { Panel } from '../../components/ui/Panel';
import { useAsync } from '../../hooks/useAsync';
import { paths } from '../../routes/paths';
import { patientApi } from '../../services/patient.api';
import { useAppSelector } from '../../store/hooks';
import { doctorName, formatTimestampDate } from '../../utils/format';

export default function PatientDashboard() {
  const profile = useAppSelector((state) => state.user.profile);
  const { data, loading, error, reload } = useAsync(() => patientApi.dashboard(), []);

  return (
    <>
      <PageHeader
        title={profile ? `Hello, ${profile.first_name}` : 'Dashboard'}
        description="Your next visit and recent care at a glance."
        actions={
          <Link to={paths.patient.book}>
            <Button>Book an appointment</Button>
          </Link>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}

      {data && (
        <>
          <StatStrip
            columnCount={2}
            items={[
              { label: 'Upcoming appointments', value: data.upcoming_count },
              { label: 'Consultations on record', value: data.total_consultations },
            ]}
          />

          <Panel title="Next appointment" flush className="mb-6">
            {data.next_appointment ? (
              <ul>
                <AppointmentRow appointment={data.next_appointment} party="doctor" showDate />
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="Nothing booked"
                  description="Find a doctor and pick a time that suits you."
                  action={
                    <Link to={paths.patient.doctors}>
                      <Button variant="secondary">Find a doctor</Button>
                    </Link>
                  }
                />
              </div>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Recent consultations"
              flush
              actions={
                <Link to={paths.patient.consultations} className="text-sm font-medium text-pine-700 underline underline-offset-2">
                  See all
                </Link>
              }
            >
              {data.recent_consultations.length === 0 ? (
                <p className="p-5 text-sm text-ink-soft">No consultations yet.</p>
              ) : (
                <ul>
                  {data.recent_consultations.map((consultation) => (
                    <li key={consultation.id} className="border-t border-rule px-5 py-3 first:border-t-0">
                      <p className="font-medium">{consultation.diagnosis}</p>
                      <p className="text-sm text-ink-soft">
                        {doctorName(consultation.doctor)}, {formatTimestampDate(consultation.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recent prescriptions"
              flush
              actions={
                <Link to={paths.patient.prescriptions} className="text-sm font-medium text-pine-700 underline underline-offset-2">
                  See all
                </Link>
              }
            >
              {data.recent_prescriptions.length === 0 ? (
                <p className="p-5 text-sm text-ink-soft">No prescriptions yet.</p>
              ) : (
                <ul>
                  {data.recent_prescriptions.map((prescription) => (
                    <li key={prescription.id} className="border-t border-rule px-5 py-3 first:border-t-0">
                      <p className="font-medium">{(prescription.items ?? []).map((item) => item.medication?.name).filter(Boolean).join(', ') || 'Prescription'}</p>
                      <p className="text-sm text-ink-soft">{formatTimestampDate(prescription.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
