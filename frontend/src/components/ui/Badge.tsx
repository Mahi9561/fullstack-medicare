import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type Tone = 'neutral' | 'green' | 'blue' | 'red' | 'amber';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  green: 'bg-pine-50 text-pine-800',
  blue: 'bg-sky-50 text-sky-800',
  red: 'bg-red-50 text-red-800',
  amber: 'bg-amber-50 text-amber-900',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}
