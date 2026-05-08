import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const PTLogo = ({ className = '', size = 48 }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sketchy Circle Background */}
      <path
        d="M32 4C47.464 4 60 16.536 60 32C60 47.464 47.464 60 32 60C16.536 60 4 47.464 4 32C4 16.536 16.536 4 32 4Z"
        fill="#F5D60D"
        stroke="#2B2B2B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: 'rotate(-2deg)', transformOrigin: 'center' }}
      />
      
      {/* P */}
      <path
        d="M22 20V44M22 20C28 18 36 20 36 28C36 36 28 38 22 36"
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* T */}
      <path
        d="M38 24H50M44 24V44"
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PTLogo;
