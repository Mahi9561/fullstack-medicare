import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { PrescriptionCard } from '../../features/prescriptions/PrescriptionCard';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { prescriptionApi } from '../../services/prescription.api';

export default function DoctorPrescriptions() {
  const { page, setPage, limit } = usePagination(5);
  const { data, loading, error, reload } = useAsync(() => prescriptionApi.list({ page, limit }), [page]);

  return (
    <>
      <PageHeader title="Prescriptions" description="Prescriptions you have issued." />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No prescriptions yet" description="Issue one from a completed consultation." />}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} party="patient" />
          ))}
        </div>
      )}
      <Pagination meta={data?.meta ?? null} onPage={setPage} />
    </>
  );
}
