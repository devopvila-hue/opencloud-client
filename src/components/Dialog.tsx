import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { Button } from './Button';
import { scaleIn } from '@/design-system/motion';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  footer?: ReactNode;
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, description, size = 'md', children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'relative w-full overflow-hidden rounded-[var(--radius-xl)] shadow-[0_8px_24px_rgba(0,0,0,0.28)]',
              'panel',
              widthMap[size],
            )}
          >
            {(title || description) && (
              <div className="border-b border-[color:var(--border)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {title && (
                      <h2
                        id="dialog-title"
                        className="font-display text-[1.125rem] tracking-[-0.01em] text-[color:var(--foreground)]"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{description}</p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close dialog">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] p-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
