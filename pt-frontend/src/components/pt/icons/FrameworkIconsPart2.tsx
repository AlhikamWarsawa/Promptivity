import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const PomodoroIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 56C46 56 56 46 56 34C56 22 46 12 32 12C18 12 8 22 8 34C8 46 18 56 32 56Z" fill="#F28C28" stroke="#2B2B2B" strokeWidth="2.5" />
    <path d="M32 12V6M28 6H36" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 12L38 4M32 12L26 4" stroke="#17B66A" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const EisenhowerIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="8" width="48" height="48" rx="4" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 8V56M8 32H56" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="20" r="4" fill="#F5D60D" stroke="#2B2B2B" strokeWidth="2" />
    <path d="M40 16L48 24M48 16L40 24" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const SystemistIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 44C38.6274 44 44 38.6274 44 32C44 25.3726 38.6274 20 32 20C25.3726 20 20 25.3726 20 32C20 38.6274 25.3726 44 32 44Z" fill="#17B66A" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2.5" />
    <path d="M32 12V20M32 44V52M12 32H20M44 32H52" stroke="#2B2B2B" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 18L24 24M40 40L46 46M18 46L24 40M40 24L46 18" stroke="#2B2B2B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const MediumMethodIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="24" r="14" fill="#9AD84B" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="18" cy="46" r="8" fill="#9AD84B" fillOpacity="0.4" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="46" cy="46" r="8" fill="#9AD84B" fillOpacity="0.4" stroke="#2B2B2B" strokeWidth="2.5" />
  </svg>
);
