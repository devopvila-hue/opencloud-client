import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/cn';

export interface ChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartDatum[];
  height?: number;
  className?: string;
  colorVar?: string;
}

export function BarChart({ data, height = 160, className, colorVar = '--color-accent' }: BarChartProps) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  return (
    <div className={cn('flex w-full items-end gap-2', className)} style={{ height }}>
      {data.map((d, i) => {
        const ratio = max === 0 ? 0 : d.value / max;
        return (
          <div key={d.label + i} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-full w-full items-end overflow-hidden rounded-md bg-[color:var(--surface-soft)]">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(2, ratio * 100)}%` }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: i * 0.04 }}
                style={{ backgroundColor: `var(${colorVar})` }}
                className="w-full rounded-t-md"
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  colorVar?: string;
  className?: string;
}

export function Sparkline({ values, width = 120, height = 32, colorVar = '--color-accent', className }: SparklineProps) {
  const path = useMemo(() => {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = values.length > 1 ? width / (values.length - 1) : width;
    return values
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('text-[color:var(--accent)]', className)}
      aria-hidden
    >
      <motion.path
        d={path}
        fill="none"
        stroke={`var(${colorVar})`}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      />
    </svg>
  );
}

interface ProgressBarProps {
  value: number;
  colorVar?: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, colorVar = '--color-accent', className, showLabel, size = 'md' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 overflow-hidden rounded-full bg-[color:var(--surface-soft)]',
          size === 'sm' ? 'h-1' : 'h-1.5',
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="h-full rounded-full"
          style={{ backgroundColor: `var(${colorVar})` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[2.5rem] text-right text-xs font-mono text-[color:var(--muted-foreground)]">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
