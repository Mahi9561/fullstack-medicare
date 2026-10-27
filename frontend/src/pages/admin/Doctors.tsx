import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import { DoctorFormModal } from '../../features/admin/DoctorFormModal';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { adminApi } from '../../services/admin.api';
import type { DoctorProfile } from '../../types';
import { errorMessage } from '../../utils/errors';
import { doctorName, formatCurrency } from '../../utils/format';

export default function AdminDoctors() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { page, setPage, limit, reset } = usePagination(10);
  const { data, loading, error, reload } = useAsync(() => adminApi.doctors({ search: debounced.trim(), page, limit }), [debounced, page]);
  const [editing, setEditing] = useState<DoctorProfile | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(reset, [debounced, reset]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (doctor: DoctorProfile) => {
    setEditing(doctor);
    setFormOpen(true);
  };

  const toggleStatus = async (doctor: DoctorProfile) => {
    const next = doctor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setBusyId(doctor.id);
    try {
      await adminApi.setDoctorStatus(doctor.id, next);
      toast.success(next === 'ACTIVE' ? `${doctorName(doctor)} can sign in and take bookings again.` : `${doctorName(doctor)} is deactivated. Existing records are kept.`);
      reload();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Doctors" description="Create doctor accounts, edit profiles and departments, or deactivate someone who has left." actions={<Button onClick={openCreate}>Add a doctor</Button>} />
      <Input label="Search by name" type="search" value={search} wrapperClassName="mb-5 max-w-sm" onChange={(event) => setSearch(event.target.value)} />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 && !loading ? (
        <EmptyState title="No doctors found" description={debounced ? 'Try a shorter name.' : 'Add the first doctor to get started.'} />
      ) : (
        <>
          <DataTable
            caption="Doctors"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(doctor) => doctor.id}
            columns={[
              {
                header: 'Doctor',
                cell: (doctor) => (
                  <>
                    <p className="font-medium">{doctorName(doctor)}</p>
                    <p className="text-xs text-ink-soft">{doctor.email}</p>
                  </>
                ),
              },
              { header: 'Specialization', cell: (doctor) => doctor.specialization },
              {
                header: 'Departments',
                cell: (doctor) => (
                  <div className="flex flex-wrap gap-1">
                    {(doctor.departments ?? []).map((department) => (
                      <Badge key={department.id}>{department.name}</Badge>
                    ))}
                  </div>
                ),
              },
              { header: 'Fee', cell: (doctor) => <span className="tabular-nums">{formatCurrency(doctor.consultation_fee)}</span> },
              { header: 'Status', cell: (doctor) => <Badge tone={doctor.status === 'ACTIVE' ? 'green' : 'neutral'}>{doctor.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge> },
              {
                header: 'Actions',
                className: 'text-right',
                cell: (doctor) => (
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(doctor)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" loading={busyId === doctor.id} onClick={() => toggleStatus(doctor)}>
                      {doctor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}

      <DoctorFormModal
        open={formOpen}
        doctor={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
      />
    </>
  );
}
