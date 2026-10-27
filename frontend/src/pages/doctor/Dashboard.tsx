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
import { doctorApi } from '../../services/doctor.api';
import { useAppSelector } from '../../store/hooks';
import { formatDate, todayISO } from '../../utils/format';

export default function DoctorDashboard() {
  const profile = useAppSelector((state) => state.user.profile);
  const { data, loading, error, reload } = useAsync(() => doctorApi.dashboard(), []);

  return (
    <>
      <PageHeader
        title={profile ? `Good day, Dr. ${profile.last_name}` : 'Dashboard'}
        description={formatDate(todayISO())}
        actions={
          <Link to={paths.doctor.appointments}>
            <Button variant="secondary">All appointments</Button>
          </Link>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}

      {data && (
        <>
          <StatStrip
            items={[
              { label: 'Today', value: data.today_appointments },
              { label: 'Upcoming', value: data.upcoming_appointments },
              { label: 'Completed', value: data.completed_appointments },
              { label: 'Patients seen', value: data.total_patients },
            ]}
          />

          <Panel title="Today's schedule" flush>
            {data.todays_schedule.length === 0 ? (
              <div className="p-5">
                <EmptyState title="Nothing scheduled today" description="New bookings for today will appear here." />
              </div>
            ) : (
              <ul>
                {data.todays_schedule.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    party="patient"
                    actions={
                      appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW' ? (
                        <Link to={paths.doctor.appointment(appointment.id)}>
                          <Button variant="secondary" size="sm">
                            Open
                          </Button>
                        </Link>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
