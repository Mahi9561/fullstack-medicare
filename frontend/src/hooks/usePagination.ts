import { useCallback, useState } from 'react';

/** Page state for a list screen. Call `reset()` whenever a filter changes. */
export function usePagination(limit = 10) {
  const [page, setPage] = useState(1);
  const reset = useCallback(() => setPage(1), []);
  return { page, setPage, limit, reset };
}
