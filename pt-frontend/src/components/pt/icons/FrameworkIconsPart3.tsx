import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const OKRIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="16" fill="#2196E8" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="6" fill="#2196E8" stroke="#2B2B2B" strokeWidth="2.5" />
    <path d="M48 16L36 28" stroke="#2B2B2B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const WeeklyReviewIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="14" width="44" height="40" rx="4" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 26H54M22 10V18M42 10V18" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 40L30 44L38 36" stroke="#17B66A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CommitmentInventoryIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 10H44L52 18V54H12V10Z" fill="#E9B12A" fillOpacity="0.1" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 24H44M20 34H44M20 44H32" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M52 18H44V10" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M52 40C52 45 45 52 35 52" stroke="#F28C28" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
  </svg>
);

export const SMARTGoalsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 8L38 22H54L42 32L46 48L32 38L18 48L22 32L10 22H26L32 8Z" fill="#F5D60D" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="44" y="44" width="12" height="12" rx="2" fill="white" stroke="#2B2B2B" strokeWidth="2" />
    <text x="47" y="53" fill="#2B2B2B" style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>S</text>
  </svg>
);

export const PARAIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="10" y="10" width="18" height="14" rx="2" fill="#9AD84B" stroke="#2B2B2B" strokeWidth="2" />
    <rect x="36" y="10" width="18" height="14" rx="2" fill="#9AD84B" fillOpacity="0.5" stroke="#2B2B2B" strokeWidth="2" />
    <rect x="10" y="36" width="18" height="14" rx="2" fill="#9AD84B" fillOpacity="0.5" stroke="#2B2B2B" strokeWidth="2" />
    <rect x="36" y="36" width="18" height="14" rx="2" fill="#9AD84B" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2" />
    <path d="M28 17H36M19 24V36M45 24V36" stroke="#2B2B2B" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);
