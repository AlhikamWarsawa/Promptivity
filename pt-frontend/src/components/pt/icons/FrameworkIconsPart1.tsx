import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const GTDIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 24C10 21.7909 11.7909 20 14 20H26L30 24H50C52.2091 24 54 25.7909 54 28V50C54 52.2091 52.2091 54 50 54H14C11.7909 54 10 52.2091 10 50V24Z" fill="#2196E8" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 32C10 29.7909 11.7909 28 14 28H50C52.2091 28 54 29.7909 54 32V50C54 52.2091 52.2091 54 50 54H14C11.7909 54 10 52.2091 10 50V32Z" fill="#2196E8" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 38H46" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M18 46H34" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const KanbanIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="8" y="10" width="48" height="44" rx="4" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 10V54M42 10V54" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="12" y="16" width="6" height="10" rx="1" fill="#35D5F4" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="26" y="22" width="12" height="12" rx="1" fill="#35D5F4" fillOpacity="0.4" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="46" y="18" width="6" height="6" rx="1" fill="#35D5F4" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TimeBlockingIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="32" cy="32" r="24" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 16V32L42 38" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10" y="10" width="14" height="14" rx="2" fill="#E9B12A" stroke="#2B2B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EatTheFrogIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M32 54C46 54 54 44 54 34C54 24 44 14 32 14C20 14 10 24 10 34C10 44 18 54 32 54Z" fill="#F04E59" fillOpacity="0.2" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="22" cy="18" r="6" fill="white" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="42" cy="18" r="6" fill="white" stroke="#2B2B2B" strokeWidth="2.5" />
    <circle cx="22" cy="18" r="2.5" fill="#2B2B2B" />
    <circle cx="42" cy="18" r="2.5" fill="#2B2B2B" />
    <path d="M22 42C26 46 38 46 42 42" stroke="#2B2B2B" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
