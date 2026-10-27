import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { ConsultationCard } from '../../features/consultations/ConsultationCard';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { paths } from '../../routes/paths';
import { patientApi } from '../../services/patient.api';

export default function PatientConsultations() {
  const { page, setPage, limit } = usePagination(5);
  const { data, loading, error, reload } = useAsync(() => patientApi.consultations({ page, limit }), [page]);

  return (
    <>
      <PageHeader title="Consultations" description="What your doctors recorded at each visit." />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No consultations yet" description="They appear here after a doctor completes your visit." />}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((consultation) => (
            <ConsultationCard
              key={consultation.id}
              consultation={consultation}
              party="doctor"
              footer={
                consultation.prescription ? (
                  <Link to={paths.patient.prescriptions} className="text-sm font-medium text-pine-700 underline underline-offset-2">
                    A prescription was issued: view prescriptions
                  </Link>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
      <Pagination meta={data?.meta ?? null} onPage={setPage} />
    </>
  );
}
