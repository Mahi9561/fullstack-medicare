import type { PageMeta } from '../../types';
import { Button } from './Button';

interface PaginationProps {
  meta: PageMeta | null;
  onPage: (page: number) => void;
}

export function Pagination({ meta, onPage }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-ink-soft">
        Page {meta.page} of {meta.totalPages}, {meta.total} results
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
