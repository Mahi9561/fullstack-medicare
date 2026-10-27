import { Link } from 'react-router-dom';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { StatStrip } from '../../components/common/StatStrip';
import { Button } from '../../components/ui/Button';
import { useAsync } from '../../hooks/useAsync';
import { paths } from '../../routes/paths';
import { adminApi } from '../../services/admin.api';
import { formatDate, todayISO } from '../../utils/format';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(() => adminApi.dashboard(), []);

  return (
    <>
      <PageHeader
        title="Clinic overview"
        description={formatDate(todayISO())}
        actions={
          <>
            <Link to={paths.admin.doctors}>
              <Button variant="secondary">Manage doctors</Button>
            </Link>
            <Link to={paths.admin.reports}>
              <Button variant="secondary">Reports</Button>
            </Link>
          </>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}

      {data && (
        <>
          <StatStrip
            columnCount={3}
            items={[
              { label: 'Patients', value: data.total_patients },
              { label: 'Doctors', value: data.total_doctors },
              { label: "Today's appointments", value: data.todays_appointments },
            ]}
          />
          <StatStrip
            columnCount={3}
            items={[
              { label: 'All appointments', value: data.total_appointments },
              { label: 'Completed', value: data.completed_appointments },
              { label: 'Cancelled', value: data.cancelled_appointments },
            ]}
          />
        </>
      )}
    </>
  );
}
