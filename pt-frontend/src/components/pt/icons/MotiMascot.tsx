import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const MotiMascot = ({ className = '', size = 64 }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body - sketchy bean shape */}
      <path
        d="M30 60C30 40 40 25 55 25C70 25 80 40 80 60C80 80 70 90 55 90C40 90 30 80 30 60Z"
        fill="#9AD84B"
        fillOpacity="0.8"
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Eyes */}
      <circle cx="50" cy="45" r="3" fill="#2B2B2B" />
      <circle cx="65" cy="45" r="3" fill="#2B2B2B" />
      
      {/* Smile */}
      <path
        d="M50 55C53 58 62 58 65 55"
        stroke="#2B2B2B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Hands */}
      <path
        d="M35 65C25 65 20 55 25 50"
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Pencil */}
      <path
        d="M20 55L10 65L15 70L25 60"
        fill="#F04E59"
        stroke="#2B2B2B"
        strokeWidth="2"
      />
      <path d="M10 65L12 67" stroke="#2B2B2B" strokeWidth="2" />
      
      {/* Little sparkle/shimmer */}
      <path
        d="M75 25L80 20M85 30L90 32"
        stroke="#F5D60D"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default MotiMascot;
