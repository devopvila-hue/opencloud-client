import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/design-system/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'outline' | 'link' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

/*  Primary: lime accent with near-black text (DeptIA)  */
const variantStyles: Record<Variant, string> = {
  primary: cn(
    'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]',
    'shadow-[0_1px_0_rgba(0,0,0,0.1)]',
    'hover:bg-[#e3ff7a] active:bg-[#cbff4e]',
  ),
  secondary: cn(
    'bg-[color:var(--surface)] text-[color:var(--foreground)]',
    'border border-[color:var(--border-strong)]',
    'hover:bg-[color:var(--surface-soft)] hover:border-foreground/30',
  ),
  ghost: cn(
    'text-[color:var(--foreground)]',
    'hover:bg-[color:var(--surface-soft)]',
  ),
  subtle: cn(
    'bg-[color:var(--accent-soft)] text-[color:var(--foreground)]',
    'border border-accent/30',
    'hover:border-accent/60 hover:bg-accent/20',
  ),
  outline: cn(
    'border border-[color:var(--border)] text-[color:var(--foreground)]',
    'hover:border-foreground/40 hover:bg-[color:var(--surface-soft)]/50',
  ),
  link: cn(
    'text-[color:var(--foreground)] underline-offset-4 hover:underline px-0 h-auto',
  ),
  danger: cn(
    'text-[color:var(--danger)] border border-danger/40',
    'hover:bg-danger/20',
  ),
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.8125rem] rounded-md',
  md: 'h-11 px-5 text-[0.9375rem] rounded-lg',
  lg: 'h-12 px-6 text-[0.9375rem] rounded-lg',
  xl: 'h-14 px-7 text-[1rem] rounded-xl',
  icon: 'h-10 w-10 rounded-md',
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading,
    fullWidth,
    iconLeft,
    iconRight,
    children,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const motionProps: HTMLMotionProps<'button'> = {
    whileHover: disabled || loading ? undefined : { y: -0.5 },
    whileTap: disabled || loading ? undefined : { scale: 0.97 },
    transition: { type: 'spring', stiffness: 400, damping: 26 },
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight',
        'transition-all duration-200 will-change-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...motionProps}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconLeft
      )}
      <span className="inline-flex items-center gap-2">{children}</span>
      {!loading && iconRight}
    </motion.button>
  );
});
