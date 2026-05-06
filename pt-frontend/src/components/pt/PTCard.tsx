'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ============================================
   PTCard — Sketch-style card container
   
   Variants:
   - default  → cream bg, black sketch border
   - flat     → white bg, light border, no shadow
   - elevated → white bg, bigger shadow (xl)
   - colored  → pakai accent color dari parent
   - sticky   → yellow-p bg, mirip sticky note
   ============================================ */

const cardVariants = cva(
  [
    'rounded-sketch',
    'border-2 border-pt-black',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default:  'bg-pt-cream shadow-sketch',
        flat:     'bg-pt-white border-opacity-40 shadow-none',
        elevated: 'bg-pt-white shadow-sketch-xl',
        sticky:   'bg-pt-yellowP shadow-sketch rotate-[-0.5deg]',
        white:    'bg-pt-white shadow-sketch',
      },
      padding: {
        none: 'p-0',
        sm:   'p-3',
        md:   'p-5',
        lg:   'p-7',
        xl:   'p-9',
      },
      hoverable: {
        true: 'cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hoverable: false,
    },
  }
);

export interface PTCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  accentColor?: string;
  accentHeight?: number;
}

const PTCard = forwardRef<HTMLDivElement, PTCardProps>(
  ({ className, variant, padding, hoverable, accentColor, accentHeight = 4, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hoverable }), className)}
        style={{
          ...(accentColor && {
            borderTop: `${accentHeight}px solid ${accentColor}`,
          }),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PTCard.displayName = 'PTCard';

// Sub-components for composable usage
const PTCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  )
);
PTCardHeader.displayName = 'PTCardHeader';

const PTCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl leading-tight', className)}
      style={{ fontFamily: 'var(--font-display)' }}
      {...props}
    >
      {children}
    </h3>
  )
);
PTCardTitle.displayName = 'PTCardTitle';

const PTCardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[#6B6B6B] mt-1', className)}
      {...props}
    />
  )
);
PTCardDescription.displayName = 'PTCardDescription';

const PTCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
PTCardContent.displayName = 'PTCardContent';

const PTCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t-2 border-pt-black/20', className)} {...props} />
  )
);
PTCardFooter.displayName = 'PTCardFooter';

export {
  PTCard,
  PTCardHeader,
  PTCardTitle,
  PTCardDescription,
  PTCardContent,
  PTCardFooter,
  cardVariants,
};
