import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/design-system/cn';

interface JsonBlockProps {
  value: unknown;
  className?: string;
}

export function JsonBlock({ value, className }: JsonBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      return (err as Error)?.message ?? 'Circular reference detected';
    }
  })();

  return (
    <div className={cn('relative rounded-md bg-[color:var(--color-bg-3)]', className)}>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[color:var(--color-fg-3)] hover:bg-[color:var(--color-bg-4)]"
        aria-label="Copy JSON"
      >
        {copied ? <Check className="h-3 w-3 text-[color:var(--color-emerald)]" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-auto p-3 font-mono text-xs leading-relaxed text-[color:var(--color-fg-2)]">
        {text}
      </pre>
    </div>
  );
}
