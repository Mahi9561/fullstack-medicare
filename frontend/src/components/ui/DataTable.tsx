import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  caption?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading = false, emptyMessage = 'Nothing to show yet.', caption }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rule bg-white">
      <table className="w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-rule bg-paper/70">
            {columns.map((column) => (
              <th key={column.header} scope="col" className={cx('px-4 py-2.5 text-xs font-medium text-ink-soft', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-soft">
                {loading ? 'Loading...' : emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-rule align-top first:border-t-0">
                {columns.map((column) => (
                  <td key={column.header} className={cx('px-4 py-3', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
