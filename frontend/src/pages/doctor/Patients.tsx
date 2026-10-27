import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { paths } from '../../routes/paths';
import { doctorApi } from '../../services/doctor.api';
import { ageFrom, fullName, genderLabel } from '../../utils/format';

export default function DoctorPatients() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { page, setPage, limit, reset } = usePagination(10);
  const { data, loading, error, reload } = useAsync(() => doctorApi.patients({ search: debounced.trim(), page, limit }), [debounced, page]);

  useEffect(reset, [debounced, reset]);

  return (
    <>
      <PageHeader title="Patients" description="Patients who have booked with you. Cancelled bookings do not count." />
      <Input label="Search by name" type="search" value={search} wrapperClassName="mb-5 max-w-sm" onChange={(event) => setSearch(event.target.value)} />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 && !loading ? (
        <EmptyState title={debounced ? 'No patients match' : 'No patients yet'} description={debounced ? 'Try a shorter name.' : 'Patients appear here after they book with you.'} />
      ) : (
        <>
          <DataTable
            caption="Your patients"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(patient) => patient.id}
            columns={[
              { header: 'Name', cell: (patient) => <span className="font-medium">{fullName(patient)}</span> },
              { header: 'Age', cell: (patient) => <span className="tabular-nums">{ageFrom(patient.date_of_birth)}</span> },
              { header: 'Gender', cell: (patient) => genderLabel(patient.gender) },
              { header: 'Phone', cell: (patient) => <span className="tabular-nums">{patient.phone}</span> },
              {
                header: 'History',
                className: 'text-right',
                cell: (patient) => (
                  <Link to={paths.doctor.patient(patient.id)}>
                    <Button variant="secondary" size="sm">
                      Open
                    </Button>
                  </Link>
                ),
              },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}
    </>
  );
}
