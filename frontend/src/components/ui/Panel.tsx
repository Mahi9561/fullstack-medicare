import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface PanelProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove the inner padding, for tables and lists that run edge to edge. */
  flush?: boolean;
}

export function Panel({ title, description, actions, children, className, flush = false }: PanelProps) {
  return (
    <section className={cx('rounded-lg border border-rule bg-white', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-3.5">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  );
}
