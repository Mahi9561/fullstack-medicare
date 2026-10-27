import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { PrescriptionCard } from '../../features/prescriptions/PrescriptionCard';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { patientApi } from '../../services/patient.api';

export default function PatientPrescriptions() {
  const { page, setPage, limit } = usePagination(5);
  const { data, loading, error, reload } = useAsync(() => patientApi.prescriptions({ page, limit }), [page]);

  return (
    <>
      <PageHeader title="Prescriptions" description="Medicines your doctors have prescribed." />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No prescriptions yet" />}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} party="doctor" />
          ))}
        </div>
      )}
      <Pagination meta={data?.meta ?? null} onPage={setPage} />
    </>
  );
}
