'use client';

import { TextareaHTMLAttributes, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   PTTextarea — Custom textarea
   Style: sketch border, auto-resize, word count
   
   Features:
   - Auto-resize (grow seiring konten)
   - Optional word count / limit
   - Label dengan icon
   - Error state
   ============================================ */

export interface PTTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string;
  hint?:       string;
  error?:      string;
  icon?:       string;
  wordLimit?:  number;      // Tampilkan word count kalau ada
  required?:   boolean;
  autoResize?: boolean;     // Auto grow, default true
}

const PTTextarea = forwardRef<HTMLTextAreaElement, PTTextareaProps>(
  (
    {
      label, hint, error, icon, wordLimit,
      required, autoResize = true,
      className, id, onChange, value, ...props
    },
    ref,
  ) => {
    const inputId = id ?? `pt-textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    // Word count dari value
    const wordCount = typeof value === 'string'
      ? value.trim().split(/\s+/).filter(Boolean).length
      : 0;

    const isOverLimit = wordLimit !== undefined && wordCount > wordLimit;

    // Auto-resize handler
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }
        onChange?.(e);
      },
      [autoResize, onChange],
    );

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label row */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="flex items-center gap-1.5"
            >
              {icon && <span aria-hidden="true">{icon}</span>}
              <span
                className="text-label font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-black)' }}
              >
                {label}
              </span>
              {required && (
                <span style={{ color: 'var(--pt-coral)' }} aria-label="required">
                  *
                </span>
              )}
            </label>

            {/* Word count */}
            {wordLimit !== undefined && (
              <span
                className="text-sm font-body"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: isOverLimit ? 'var(--pt-coral)' : '#6B6B6B',
                  fontWeight: isOverLimit ? 700 : 400,
                }}
              >
                {wordCount}/{wordLimit} kata
              </span>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full',
            'px-4 py-3',
            'font-body text-body leading-relaxed',
            'rounded-sketch border-2 border-pt-black',
            'bg-pt-white text-pt-black',
            'shadow-sketch',
            'resize-none',
            'transition-all duration-150',
            'placeholder:text-[#6B6B6B] placeholder:opacity-60',
            'focus:outline-none focus:ring-2 focus:ring-pt-blue focus:ring-offset-1',
            'focus:shadow-sketch-lg',
            autoResize ? 'overflow-hidden' : 'overflow-auto',
            error && 'border-pt-coral shadow-[3px_3px_0px_#F04E59]',
            isOverLimit && 'border-pt-orange',
            className,
          )}
          style={{
            fontFamily: 'var(--font-body)',
            minHeight: props.rows ? undefined : '100px',
          }}
          {...props}
        />

        {/* Hint */}
        {hint && !error && (
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6B6B6B' }}
          >
            {hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-coral)' }}
            role="alert"
          >
            ⚠️ {error}
          </p>
        )}

        {/* Over limit warning */}
        {isOverLimit && (
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--pt-coral)' }}
            role="alert"
          >
            ⚠️ Melebihi batas {wordLimit} kata. Tolong dipersingkat.
          </p>
        )}
      </div>
    );
  }
);

PTTextarea.displayName = 'PTTextarea';

export { PTTextarea };
