import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { ConsultationCard } from '../../features/consultations/ConsultationCard';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { paths } from '../../routes/paths';
import { consultationApi } from '../../services/consultation.api';

export default function DoctorConsultations() {
  const { page, setPage, limit } = usePagination(5);
  const { data, loading, error, reload } = useAsync(() => consultationApi.list({ page, limit }), [page]);

  return (
    <>
      <PageHeader title="Consultations" description="Everything you have recorded, newest first." />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No consultations yet" description="Complete a confirmed appointment to record one." />}
      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((consultation) => (
            <ConsultationCard
              key={consultation.id}
              consultation={consultation}
              party="patient"
              footer={
                <Link to={paths.doctor.appointment(consultation.appointment_id)} className="text-sm font-medium text-pine-700 underline underline-offset-2">
                  Open the visit
                </Link>
              }
            />
          ))}
        </div>
      )}
      <Pagination meta={data?.meta ?? null} onPage={setPage} />
    </>
  );
}
