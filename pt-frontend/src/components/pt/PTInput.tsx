'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface PTInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  hint?:     string;
  error?:    string;
  icon?:     string;
}

const PTInput = forwardRef<HTMLInputElement, PTInputProps>(
  ({ label, hint, error, icon, className, id, required, ...props }, ref) => {
    const inputId = id ?? `pt-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="flex items-center gap-1.5">
            {icon && <span aria-hidden="true">{icon}</span>}
            <span
              className="text-label font-bold uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
            >
              {label}
            </span>
            {required && <span style={{ color: 'var(--pt-coral)' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            'w-full px-4 py-3',
            'font-body text-body',
            'rounded-sketch border-2 border-pt-black',
            'bg-pt-white text-pt-black',
            'shadow-sketch',
            'transition-all duration-150',
            'placeholder:text-[#9B9B9B]',
            'focus:outline-none focus:ring-2 focus:ring-pt-blue focus:ring-offset-1',
            'hover:-translate-x-px hover:-translate-y-px hover:shadow-sketch-lg',
            error && 'border-pt-coral shadow-[3px_3px_0px_#F04E59]',
            className,
          )}
          style={{ fontFamily: 'var(--font-body)' }}
          {...props}
        />
        {hint && !error && (
          <p className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}>
            {hint}
          </p>
        )}
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

PTInput.displayName = 'PTInput';
export { PTInput };
