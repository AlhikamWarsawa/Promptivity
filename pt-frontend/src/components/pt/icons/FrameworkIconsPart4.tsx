import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const DeepWorkIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="32" r="14" fill="#8B5CF6" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="32" r="6" fill="#8B5CF6" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ParetoIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 8V32L52 44" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 32L52 44A24 24 0 0 0 32 8V32Z" fill="#14B8A6" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
