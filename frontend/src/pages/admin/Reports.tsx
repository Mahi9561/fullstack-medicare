import { useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorNote } from '../../components/common/ErrorNote';
import { PageHeader } from '../../components/common/PageHeader';
import { StatStrip } from '../../components/common/StatStrip';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Input } from '../../components/ui/fields';
import { Panel } from '../../components/ui/Panel';
import { useAsync } from '../../hooks/useAsync';
import { adminApi } from '../../services/admin.api';
import type { AppointmentStatus } from '../../types';
import { cx } from '../../utils/cx';
import { STATUS_LABEL, addDaysISO, doctorName, formatDate, todayISO } from '../../utils/format';

// The same colors the status badges use, so a bar reads like the badge it counts.
const BAR: Record<AppointmentStatus, string> = {
  BOOKED: 'bg-sky-600',
  CONFIRMED: 'bg-pine-600',
  COMPLETED: 'bg-slate-500',
  CANCELLED: 'bg-red-600',
  NO_SHOW: 'bg-amber-500',
};

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper" aria-hidden="true">
      <div className={cx('h-full rounded-full', className)} style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }} />
    </div>
  );
}

export default function AdminReports() {
  const today = todayISO();
  const [from, setFrom] = useState(addDaysISO(today, -29));
  const [to, setTo] = useState(today);
  const { data, loading, error, reload } = useAsync(() => adminApi.reports({ from, to }), [from, to]);

  const maxStatus = Math.max(0, ...(data?.by_status ?? []).map((s) => s.count));
  const maxDay = Math.max(0, ...(data?.by_day ?? []).map((d) => d.count));
  const completed = data?.by_status.find((s) => s.status === 'COMPLETED')?.count ?? 0;
  const cancelled = data?.by_status.find((s) => s.status === 'CANCELLED')?.count ?? 0;

  return (
    <>
      <PageHeader title="Reports" description="Appointment activity for a date range." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="From" type="date" value={from} wrapperClassName="w-44" onChange={(event) => setFrom(event.target.value)} />
        <Input label="To" type="date" value={to} wrapperClassName="w-44" onChange={(event) => setTo(event.target.value)} />
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="secondary"
            onClick={() => {
              setTo(today);
              setFrom(addDaysISO(today, -(preset.days - 1)));
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {error && <ErrorNote message={error} onRetry={reload} />}
      {!data && loading && <p className="text-ink-soft">Loading...</p>}

      {data && data.total === 0 && <EmptyState title="No appointments in this range" description="Pick a wider range, or one that includes booked days." />}

      {data && data.total > 0 && (
        <div className="space-y-6">
          <StatStrip
            columnCount={3}
            items={[
              { label: 'Appointments', value: data.total },
              { label: 'Completed', value: completed },
              { label: 'Cancelled', value: cancelled },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="By status">
              <ul className="space-y-3">
                {data.by_status.map((item) => (
                  <li key={item.status} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0">{STATUS_LABEL[item.status]}</span>
                    <Bar value={item.count} max={maxStatus} className={BAR[item.status]} />
                    <span className="w-8 text-right tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="By day" flush>
              <ul className="max-h-72 space-y-2 overflow-y-auto p-5">
                {data.by_day.map((item) => (
                  <li key={item.day} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 tabular-nums text-ink-soft">{formatDate(item.day)}</span>
                    <Bar value={item.count} max={maxDay} className="bg-pine-600" />
                    <span className="w-8 text-right tabular-nums">{item.count}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <section aria-labelledby="h-by-doctor">
            <h2 id="h-by-doctor" className="mb-3 text-lg font-semibold">By doctor</h2>
            <DataTable
              caption="Appointments by doctor"
              rows={data.by_doctor}
              rowKey={(row) => row.doctor_id}
              columns={[
                { header: 'Doctor', cell: (row) => <span className="font-medium">{doctorName(row)}</span> },
                { header: 'Specialization', cell: (row) => row.specialization },
                { header: 'Total', className: 'text-right', cell: (row) => <span className="tabular-nums">{row.total}</span> },
                { header: 'Completed', className: 'text-right', cell: (row) => <span className="tabular-nums">{row.completed}</span> },
                { header: 'Cancelled', className: 'text-right', cell: (row) => <span className="tabular-nums">{row.cancelled}</span> },
              ]}
            />
          </section>
        </div>
      )}
    </>
  );
}
