import { useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { adminApi } from '../../services/admin.api';
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '../../types';
import { STATUS_LABEL, doctorName, formatDate, formatTime, fullName } from '../../utils/format';

export default function AdminAppointments() {
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const { page, setPage, limit, reset } = usePagination(15);

  // The API caps page size at 50, which covers the clinic's doctor list.
  const doctors = useAsync(() => adminApi.doctors({ limit: 50 }), []);
  const { data, loading, error, reload } = useAsync(
    () =>
      adminApi.appointments({
        status: status || undefined,
        doctor_id: doctorId ? Number(doctorId) : undefined,
        date: date || undefined,
        page,
        limit,
      }),
    [status, doctorId, date, page],
  );

  const hasFilters = status !== '' || doctorId !== '' || date !== '';

  return (
    <>
      <PageHeader title="Appointments" description="Every booking in the clinic. This view is read-only: doctors and patients manage their own." />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Select label="Status" value={status} wrapperClassName="w-44" onChange={(event) => { setStatus(event.target.value as AppointmentStatus | ''); reset(); }}>
          <option value="">All</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select label="Doctor" value={doctorId} wrapperClassName="w-56" onChange={(event) => { setDoctorId(event.target.value); reset(); }}>
          <option value="">All doctors</option>
          {(doctors.data?.items ?? []).map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctorName(doctor)}
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} wrapperClassName="w-44" onChange={(event) => { setDate(event.target.value); reset(); }} />
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setStatus(''); setDoctorId(''); setDate(''); reset(); }}>
            Clear
          </Button>
        )}
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 && !loading ? (
        <EmptyState title="No appointments match" description="Try different filters." />
      ) : (
        <>
          <DataTable
            caption="Appointments"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(appointment) => appointment.id}
            columns={[
              {
                header: 'When',
                cell: (a) => (
                  <>
                    <p className="whitespace-nowrap font-medium">{formatDate(a.appointment_date)}</p>
                    <p className="tabular-nums text-xs text-ink-soft">{formatTime(a.start_time)} to {formatTime(a.end_time)}</p>
                  </>
                ),
              },
              { header: 'Patient', cell: (a) => fullName(a.patient) },
              { header: 'Doctor', cell: (a) => doctorName(a.doctor) },
              { header: 'Reason', cell: (a) => <span className="line-clamp-2">{a.reason}</span> },
              { header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}
    </>
  );
}
