import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { searchDoctors } from '../../features/doctors/doctorsSlice';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { paths } from '../../routes/paths';
import { departmentApi } from '../../services/department.api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { doctorName, formatCurrency } from '../../utils/format';

export default function DoctorSearch() {
  const dispatch = useAppDispatch();
  const { items, meta, status, error, filters } = useAppSelector((state) => state.doctors);

  // The slice remembers the last filters, so coming back from a doctor's page restores the search.
  const [search, setSearch] = useState(filters.search);
  const [specialization, setSpecialization] = useState(filters.specialization);
  const [page, setPage] = useState(filters.page);
  const debouncedSearch = useDebounce(search);
  const departments = useAsync(() => departmentApi.list(), []);

  useEffect(() => {
    void dispatch(searchDoctors({ search: debouncedSearch.trim(), specialization, page, limit: filters.limit }));
  }, [dispatch, debouncedSearch, specialization, page, filters.limit]);

  const hasFilters = search !== '' || specialization !== '';

  return (
    <>
      <PageHeader title="Find a doctor" description="Search by name, or narrow down by specialty." />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_16rem_auto] sm:items-end">
        <Input
          label="Doctor name"
          type="search"
          value={search}
          placeholder="For example: Rao"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Specialty"
          value={specialization}
          onChange={(event) => {
            setSpecialization(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All specialties</option>
          {(departments.data ?? []).map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setSpecialization('');
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {status === 'failed' && error && <ErrorNote message={error} />}
      {status === 'loading' && items.length === 0 && <p className="text-ink-soft">Searching...</p>}

      {status !== 'failed' && status !== 'idle' && !(status === 'loading' && items.length === 0) && (
        <>
          <p className="mb-3 text-sm text-ink-soft" aria-live="polite">
            {meta ? `${meta.total} ${meta.total === 1 ? 'doctor' : 'doctors'} found` : ''}
          </p>
          {items.length === 0 ? (
            <EmptyState title="No doctors match" description="Try a shorter name or a different specialty." />
          ) : (
            <ul className="divide-y divide-rule rounded-lg border border-rule bg-white">
              {items.map((doctor) => (
                <li key={doctor.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <Link to={paths.patient.doctor(doctor.id)} className="font-display text-lg font-semibold underline-offset-2 hover:underline">
                      {doctorName(doctor)}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {doctor.specialization}, {doctor.experience_years} years of experience
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(doctor.departments ?? []).map((department) => (
                        <Badge key={department.id}>{department.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm tabular-nums">{formatCurrency(doctor.consultation_fee)}</p>
                    <Link to={paths.patient.bookWith(doctor.id)}>
                      <Button size="sm">Book</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}
    </>
  );
}
