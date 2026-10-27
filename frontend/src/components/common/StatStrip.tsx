import { cx } from '../../utils/cx';

interface Stat {
  label: string;
  value: number | string;
}

const columns = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' } as const;

/** Headline numbers. The 1px gap on a ruled background draws hairlines between cells at any wrap. */
export function StatStrip({ items, columnCount = 4 }: { items: Stat[]; columnCount?: 2 | 3 | 4 }) {
  return (
    <dl className={cx('mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule', columns[columnCount])}>
      {items.map((item) => (
        <div key={item.label} className="bg-white px-5 py-4">
          <dt className="text-sm text-ink-soft">{item.label}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
