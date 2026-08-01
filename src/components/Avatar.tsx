import { type ComponentProps } from 'react';
import { cn } from '@/design-system/cn';

interface AvatarProps {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };
  const initials = (() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[color:var(--surface-soft)] font-semibold text-[color:var(--foreground)]',
        sizes[size],
        className,
      )}
      aria-label={name ?? 'avatar'}
    >
      {initials}
    </div>
  );
}

export interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

export function AvatarWithStatus({ status = 'offline', showStatus = true, ...props }: AvatarWithStatusProps) {
  const statusColor = {
    online: 'var(--success)',
    away: 'var(--warning)',
    busy: 'var(--danger)',
    offline: 'var(--muted)',
  }[status];

  return (
    <div className="relative inline-flex">
      <Avatar {...props} />
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--background)]"
          style={{ backgroundColor: statusColor }}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
