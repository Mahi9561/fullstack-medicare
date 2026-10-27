import { useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';
import { NameDescriptionModal, type NameDescription } from '../../features/admin/NameDescriptionModal';
import { useAsync } from '../../hooks/useAsync';
import { departmentApi } from '../../services/department.api';
import type { Department } from '../../types';
import { errorMessage } from '../../utils/errors';

export default function AdminDepartments() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => departmentApi.list(), []);
  const [editing, setEditing] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const save = async (values: NameDescription) => {
    if (editing) await departmentApi.update(editing.id, values);
    else await departmentApi.create(values);
    toast.success(editing ? 'Department updated' : 'Department added');
    setOpen(false);
    reload();
  };

  const toggle = async (department: Department) => {
    setBusyId(department.id);
    try {
      await departmentApi.setActive(department.id, !department.is_active);
      toast.success(department.is_active ? `${department.name} is hidden from patients.` : `${department.name} is visible again.`);
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
        title="Departments"
        description="Specialties patients can search by. Deactivating one hides it from patients without deleting anything."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Add a department
          </Button>
        }
      />

      {error && <ErrorNote message={error} onRetry={reload} />}
      {data && data.length === 0 ? (
        <EmptyState title="No departments yet" />
      ) : (
        <DataTable
          caption="Departments"
          loading={loading}
          rows={data ?? []}
          rowKey={(department) => department.id}
          columns={[
            { header: 'Name', cell: (department) => <span className="font-medium">{department.name}</span> },
            { header: 'Description', cell: (department) => <span className="text-ink-soft">{department.description ?? ''}</span> },
            { header: 'Status', cell: (department) => <Badge tone={department.is_active ? 'green' : 'neutral'}>{department.is_active ? 'Active' : 'Hidden'}</Badge> },
            {
              header: 'Actions',
              className: 'text-right',
              cell: (department) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditing(department);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" loading={busyId === department.id} onClick={() => toggle(department)}>
                    {department.is_active ? 'Hide' : 'Show'}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <NameDescriptionModal
        open={open}
        title={editing ? 'Edit department' : 'Add a department'}
        nameLabel="Department name"
        initial={editing ? { name: editing.name, description: editing.description } : null}
        onSubmit={save}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
