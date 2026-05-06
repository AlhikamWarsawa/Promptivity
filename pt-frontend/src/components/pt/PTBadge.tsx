'use client';

import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { Priority } from '@/types/pt.types';

/* ============================================
   PTBadge — Sketch-style badge / label
   
   Priority variants (main use case):
   - critical → coral/red
   - high     → orange
   - medium   → mustard
   - low      → lime/green
   
   Semantic variants:
   - info     → blue
   - success  → green
   - warning  → mustard
   - neutral  → cream
   
   Size:
   - sm → compact
   - md → default
   ============================================ */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-bold',
    'border-2 border-pt-black',
    'rounded-sketch',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        // Priority variants
        critical: 'bg-pt-coral     text-white',
        high:     'bg-pt-orange    text-white',
        medium:   'bg-pt-mustard   text-pt-black',
        low:      'bg-pt-lime      text-pt-black',
        // Semantic variants
        info:     'bg-pt-blue      text-white',
        success:  'bg-pt-green     text-white',
        warning:  'bg-pt-yellowP   text-pt-black',
        neutral:  'bg-pt-cream     text-pt-black',
        outline:  'bg-transparent  text-pt-black',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export interface PTBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: string;
}

export function PTBadge({
  className,
  variant,
  size,
  dot,
  icon,
  children,
  ...props
}: PTBadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/* ============================================
   PriorityBadge — Specialized badge for Priority type
   Usage: <PriorityBadge priority="critical" />
   ============================================ */

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; icon: string; variant: NonNullable<PTBadgeProps['variant']> }
> = {
  critical: { label: 'Critical', icon: '🔴', variant: 'critical' },
  high:     { label: 'High',     icon: '🟠', variant: 'high'     },
  medium:   { label: 'Medium',   icon: '🟡', variant: 'medium'   },
  low:      { label: 'Low',      icon: '🟢', variant: 'low'      },
};

export interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
  size?: PTBadgeProps['size'];
  className?: string;
}

export function PriorityBadge({
  priority,
  showIcon = true,
  size = 'md',
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <PTBadge
      variant={config.variant}
      size={size}
      icon={showIcon ? config.icon : undefined}
      className={className}
    >
      {config.label}
    </PTBadge>
  );
}

export { badgeVariants };
