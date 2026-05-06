import { HTMLAttributes, ElementType } from 'react';
import { cn } from '@/lib/utils';

/* ============================================
   Typography helpers — consistent text styles
   ============================================ */

interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export function DisplayTitle({ as: Tag = 'h1', className, style, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-5xl leading-tight text-pt-black', className)}
      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, ...style }}
      {...props}
    />
  );
}

export function SectionTitle({ as: Tag = 'h2', className, style, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-4xl leading-tight text-pt-black', className)}
      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, ...style }}
      {...props}
    />
  );
}

export function CardTitle({ as: Tag = 'h3', className, style, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-2xl leading-snug text-pt-black', className)}
      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, ...style }}
      {...props}
    />
  );
}

export function BodyText({ as: Tag = 'p', className, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-base text-pt-black leading-relaxed', className)}
      {...props}
    />
  );
}

export function SmallText({ as: Tag = 'p', className, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-sm text-[#6B6B6B] leading-normal', className)}
      {...props}
    />
  );
}

export function LabelText({ as: Tag = 'span', className, ...props }: TextProps) {
  return (
    <Tag
      className={cn('text-xs font-bold text-pt-black uppercase tracking-wide', className)}
      {...props}
    />
  );
}
