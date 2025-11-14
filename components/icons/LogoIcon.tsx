
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="30" x2="100" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#4f46e5" />
        <stop offset="1" stop-color="#10b981" />
      </linearGradient>
    </defs>
    <path
      d="M 5,30 C 15,5 20,55 30,30 S 40,5 50,30 C 60,55 70,20 95,30"
      stroke="url(#logoGradient)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
