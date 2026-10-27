import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Input, Select } from '../../components/ui/fields';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import { NameDescriptionModal, type NameDescription } from '../../features/admin/NameDescriptionModal';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { medicationApi } from '../../services/medication.api';
import type { Medication } from '../../types';
import { errorMessage } from '../../utils/errors';

type ActiveFilter = '' | 'true' | 'false';

export default function AdminMedications() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ActiveFilter>('');
  const debounced = useDebounce(search);
  const { page, setPage, limit, reset } = usePagination(15);
  const { data, loading, error, reload } = useAsync(
    () => medicationApi.list({ search: debounced.trim(), active: active === '' ? undefined : active === 'true', page, limit }),
    [debounced, active, page],
  );
  const [editing, setEditing] = useState<Medication | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(reset, [debounced, active, reset]);

  const save = async (values: NameDescription) => {
    if (editing) await medicationApi.update(editing.id, values);
    else await medicationApi.create(values);
    toast.success(editing ? 'Medication updated' : 'Medication added');
    setOpen(false);
    reload();
  };

  const toggle = async (medication: Medication) => {
    setBusyId(medication.id);
    try {
      await medicationApi.setActive(medication.id, !medication.is_active);
      toast.success(medication.is_active ? `${medication.name} can no longer be prescribed. Old prescriptions are unchanged.` : `${medication.name} can be prescribed again.`);
      reload();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Medications"
        description="The formulary doctors prescribe from. Deactivate rather than delete, so past prescriptions stay readable."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add a medication
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Input label="Search" type="search" value={search} wrapperClassName="w-72" onChange={(event) => setSearch(event.target.value)} />
        <Select label="Status" value={active} wrapperClassName="w-40" onChange={(event) => setActive(event.target.value as ActiveFilter)}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.items.length === 0 && !loading ? (
        <EmptyState title="No medications found" description="Try a different search or filter." />
      ) : (
        <>
          <DataTable
            caption="Medications"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(medication) => medication.id}
            columns={[
              { header: 'Name', cell: (medication) => <span className="font-medium">{medication.name}</span> },
              { header: 'Description', cell: (medication) => <span className="text-ink-soft">{medication.description ?? ''}</span> },
              { header: 'Status', cell: (medication) => <Badge tone={medication.is_active ? 'green' : 'neutral'}>{medication.is_active ? 'Active' : 'Inactive'}</Badge> },
              {
                header: 'Actions',
                className: 'text-right',
                cell: (medication) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditing(medication);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" loading={busyId === medication.id} onClick={() => toggle(medication)}>
                      {medication.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          <Pagination meta={data?.meta ?? null} onPage={setPage} />
        </>
      )}

      <NameDescriptionModal
        open={open}
        title={editing ? 'Edit medication' : 'Add a medication'}
        nameLabel="Medication name and strength"
        initial={editing ? { name: editing.name, description: editing.description } : null}
        onSubmit={save}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
