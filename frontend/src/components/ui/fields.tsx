import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cx } from '../../utils/cx';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Applied to the wrapper, so form grids can place the field (for example `sm:col-span-2`). */
  wrapperClassName?: string;
}

const control = (invalid: boolean) =>
  cx(
    'block w-full rounded-md border bg-white px-3 text-sm text-ink placeholder:text-ink-soft/70 disabled:bg-paper disabled:text-ink-soft',
    invalid ? 'border-red-600' : 'border-rule focus:border-pine-600',
  );

function Shell({ id, label, error, hint, wrapperClassName, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, error, hint, wrapperClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Shell id={fieldId} label={label} error={error} hint={hint} wrapperClassName={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cx(control(!!error), 'h-10', className)}
        {...rest}
      />
    </Shell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(function Select(
  { label, error, hint, wrapperClassName, className, id, children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Shell id={fieldId} label={label} error={error} hint={hint} wrapperClassName={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cx(control(!!error), 'h-10', className)}
        {...rest}
      >
        {children}
      </select>
    </Shell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(function Textarea(
  { label, error, hint, wrapperClassName, className, id, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Shell id={fieldId} label={label} error={error} hint={hint} wrapperClassName={wrapperClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cx(control(!!error), 'py-2', className)}
        {...rest}
      />
    </Shell>
  );
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string }>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <label htmlFor={fieldId} className={cx('flex items-center gap-2 text-sm', className)}>
      <input ref={ref} id={fieldId} type="checkbox" className="h-4 w-4 rounded border-rule accent-pine-600" {...rest} />
      {label}
    </label>
  );
});
