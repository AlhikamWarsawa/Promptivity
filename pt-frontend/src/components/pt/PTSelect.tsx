'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   PTSelect — Custom select dropdown
   Style: sketch border, playful, consistent
   
   Memakai native <select> (bukan custom dropdown)
   untuk accessibility dan simplicity.
   Styling via CSS agar tetap terasa on-brand.
   ============================================ */

export interface PTSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  hint?:        string;
  error?:       string;
  icon?:        string;    // Emoji icon di kiri label
  required?:    boolean;
}

const PTSelect = forwardRef<HTMLSelectElement, PTSelectProps>(
  ({ label, hint, error, icon, required, className, id, children, ...props }, ref) => {
    const inputId = id ?? `pt-select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1.5"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {icon && <span aria-hidden="true">{icon}</span>}
            <span
              className="text-label font-bold uppercase tracking-wide"
              style={{ color: 'var(--pt-black)' }}
            >
              {label}
            </span>
            {required && (
              <span style={{ color: 'var(--pt-coral)' }} aria-label="required">*</span>
            )}
          </label>
        )}

        {/* Select wrapper (for custom arrow) */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'w-full appearance-none',
              'px-4 py-3 pr-10',
              'font-body text-body',
              'rounded-sketch border-2 border-pt-black',
              'bg-pt-white text-pt-black',
              'shadow-sketch',
              'cursor-pointer',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-pt-blue focus:ring-offset-1',
              'hover:-translate-x-px hover:-translate-y-px hover:shadow-sketch-lg',
              error && 'border-pt-coral shadow-[3px_3px_0px_#F04E59]',
              className,
            )}
            style={{ fontFamily: 'var(--font-body)' }}
            {...props}
          >
            {children}
          </select>

          {/* Custom dropdown arrow */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          >
            <svg
              width="16" height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 5.5L8 10.5L13 5.5"
                stroke="#2B2B2B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Hint text */}
        {hint && !error && (
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            {hint}
          </p>
        )}

        {/* Error text */}
        {error && (
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-coral)' }}
            role="alert"
          >
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }
);

PTSelect.displayName = 'PTSelect';

export { PTSelect };
