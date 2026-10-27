import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { adminApi } from '../../services/admin.api';
import { ageFrom, fullName, genderLabel } from '../../utils/format';

export default function AdminPatients() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { page, setPage, limit, reset } = usePagination(10);
  const { data, loading, error, reload } = useAsync(() => adminApi.patients({ search: debounced.trim(), page, limit }), [debounced, page]);

  useEffect(reset, [debounced, reset]);

  return (
    <>
      <PageHeader title="Patients" description="Registered patients. Clinical details such as diagnoses are visible only to treating doctors." />
      <Input label="Search by name" type="search" value={search} wrapperClassName="mb-5 max-w-sm" onChange={(event) => setSearch(event.target.value)} />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 && !loading ? (
        <EmptyState title="No patients found" description={debounced ? 'Try a shorter name.' : 'Patients appear here after they register.'} />
      ) : (
        <>
          <DataTable
            caption="Patients"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(patient) => patient.id}
            columns={[
              {
                header: 'Patient',
                cell: (patient) => (
                  <>
                    <p className="font-medium">{fullName(patient)}</p>
                    <p className="text-xs text-ink-soft">{patient.email}</p>
                  </>
                ),
              },
              { header: 'Age', cell: (patient) => <span className="tabular-nums">{ageFrom(patient.date_of_birth)}</span> },
              { header: 'Gender', cell: (patient) => genderLabel(patient.gender) },
              { header: 'Phone', cell: (patient) => <span className="tabular-nums">{patient.phone}</span> },
              { header: 'Status', cell: (patient) => <Badge tone={patient.status === 'ACTIVE' ? 'green' : 'neutral'}>{patient.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge> },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}
    </>
  );
}
