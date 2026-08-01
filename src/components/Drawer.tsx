import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: 'right' | 'bottom';
  width?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

const widthMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
};

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  width = 'md',
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={side === 'right' ? { x: '100%' } : { y: '100%' }}
            animate={side === 'right' ? { x: 0 } : { y: 0 }}
            exit={side === 'right' ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={cn(
              'absolute shadow-[0_8px_24px_rgba(0,0,0,0.28)] panel overflow-hidden flex flex-col',
              side === 'right'
                ? cn('right-0 top-0 h-full w-full', widthMap[width])
                : 'bottom-0 left-0 right-0 h-[80vh]',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] p-5">
              {title && (
                <h2 className="font-display text-[1.125rem] tracking-[-0.01em] text-[color:var(--foreground)]">
                  {title}
                </h2>
              )}
              <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close panel">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] p-4">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
