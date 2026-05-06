'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ============================================
   PTButton — Sketch-style button
   Style: MS Paint / kids book / playful
   
   Variants:
   - primary   → yellow bg, black border+shadow
   - secondary → white bg, black border+shadow
   - danger    → coral bg, black border+shadow
   - ghost     → transparent, border on hover
   - success   → green bg, black border+shadow
   
   Sizes:
   - sm  → compact, label-sized text
   - md  → default
   - lg  → big CTA
   ============================================ */

const buttonVariants = cva(
  // Base styles (semua variant punya ini)
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold',
    'border-2 border-pt-black',
    'rounded-sketch',
    'cursor-pointer select-none',
    'transition-all duration-150',
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-sketch-sm',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0',
    'focus-visible:outline-2 focus-visible:outline-pt-blue focus-visible:outline-offset-3',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-pt-yellow text-pt-black',
          'shadow-sketch',
          'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        ],
        secondary: [
          'bg-pt-white text-pt-black',
          'shadow-sketch',
          'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        ],
        danger: [
          'bg-pt-coral text-white',
          'shadow-sketch',
          'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        ],
        success: [
          'bg-pt-green text-white',
          'shadow-sketch',
          'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        ],
        ghost: [
          'bg-transparent text-pt-black',
          'border-transparent shadow-none',
          'hover:border-pt-black hover:bg-pt-cream hover:shadow-sketch',
        ],
        outline: [
          'bg-transparent text-pt-black',
          'shadow-sketch',
          'hover:bg-pt-cream hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-sketch-lg',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-4 text-base font-bold',
        icon: 'p-2.5 aspect-square',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface PTButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
}

const PTButton = forwardRef<HTMLButtonElement, PTButtonProps>(
  ({ className, variant, size, isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <span>{loadingText ?? 'Loading...'}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

PTButton.displayName = 'PTButton';

// Loading spinner — sketch style
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export { PTButton, buttonVariants };
