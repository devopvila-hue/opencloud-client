import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '@/design-system/cn';

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const FieldShell = ({
  label,
  hint,
  error,
  children,
  htmlFor,
}: FieldShellProps & { children: ReactNode; htmlFor?: string }) => (
  <label className="block" htmlFor={htmlFor}>
    {label && (
      <span className="mb-1.5 block font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </span>
    )}
    {children}
    {(hint || error) && (
      <span
        className={cn(
          'mt-1.5 block font-mono text-[0.65rem] uppercase tracking-[0.14em]',
          error ? 'text-[color:var(--danger)]' : 'text-[color:var(--muted-foreground)]',
        )}
      >
        {error ?? hint}
      </span>
    )}
  </label>
);

export interface FieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    FieldShellProps {}

const sizeMap = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, leading, trailing, size = 'md', className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-md)] border bg-[color:var(--background-elevated)] px-3 transition-colors',
          'border-[color:var(--border-strong)] focus-within:border-[color:var(--accent)]',
          error && 'border-[color:var(--danger)]',
          sizeMap[size],
          className,
        )}
      >
        {leading && <span className="text-[color:var(--muted-foreground)]">{leading}</span>}
        <input
          ref={ref}
          id={id}
          className="flex-1 bg-transparent text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] focus:outline-none"
          {...rest}
        />
        {trailing && <span className="text-[color:var(--muted-foreground)]">{trailing}</span>}
      </div>
    </FieldShell>
  );
});

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Pick<FieldShellProps, 'label' | 'hint' | 'error'> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, ...rest },
  ref,
) {
  const autoId = useId();
  const id = rest.id ?? autoId;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-[var(--radius-md)] border bg-[color:var(--background-elevated)] px-3 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] transition-colors',
          'border-[color:var(--border-strong)] focus:border-[color:var(--accent)] focus:outline-none',
          error && 'border-[color:var(--danger)]',
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
});
