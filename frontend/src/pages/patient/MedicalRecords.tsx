import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { useAsync } from '../../hooks/useAsync';
import { usePagination } from '../../hooks/usePagination';
import { patientApi } from '../../services/patient.api';
import { doctorName, formatDate, recordTypeLabel } from '../../utils/format';

export default function MedicalRecords() {
  const { page, setPage, limit } = usePagination(10);
  const { data, loading, error, reload } = useAsync(() => patientApi.medicalRecords({ page, limit }), [page]);

  return (
    <>
      <PageHeader title="Medical records" description="Lab reports, vaccinations, allergies and other entries added by your doctors." />
      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 ? (
        <EmptyState title="No records yet" description="Your doctor can add entries after a visit." />
      ) : (
        <>
          <DataTable
            caption="Medical records"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(record) => record.id}
            columns={[
              { header: 'Date', cell: (record) => <span className="whitespace-nowrap tabular-nums">{formatDate(record.record_date)}</span> },
              { header: 'Title', cell: (record) => <span className="font-medium">{record.title}</span> },
              { header: 'Type', cell: (record) => <Badge>{recordTypeLabel(record.record_type)}</Badge> },
              { header: 'Details', cell: (record) => <span className="whitespace-pre-wrap">{record.description}</span> },
              { header: 'Added by', cell: (record) => doctorName(record.doctor) },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}
    </>
  );
}
