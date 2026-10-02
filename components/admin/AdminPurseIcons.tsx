import React from "react";

// Minimalist Luxury Purse Silhouette Logo Icon
export function DnoraPurseLogo({ className = "w-6 h-6 text-white" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Purse Handle */}
      <path
        d="M17 17V12C17 8.13401 20.134 5 24 5C27.866 5 31 8.13401 31 12V17"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Purse Body */}
      <path
        d="M9 17L12.5 41C12.7 42.1 13.7 43 14.8 43H33.2C34.3 43 35.3 42.1 35.5 41L39 17C39.2 15.9 38.3 15 37.2 15H10.8C9.7 15 8.8 15.9 9 17Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Front Clasp / Accent */}
      <rect
        x="21.5"
        y="18.5"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

// 3D / Glossy Rose-Gold Handbag illustration for bottom sidebar card
export function DnoraPurseIllustration({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft shadow */}
        <radialGradient id="bagShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/* Rose-gold / pink body gradient */}
        <linearGradient id="roseBag" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="35%" stopColor="#F472B6" />
          <stop offset="70%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        {/* Flap gradient */}
        <linearGradient id="roseFlap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        {/* Gold hardware */}
        <linearGradient id="goldHw" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="50" cy="88" rx="34" ry="7" fill="url(#bagShadow)" />

      {/* Handle */}
      <path
        d="M34 38 C 34 16, 66 16, 66 38"
        stroke="url(#goldHw)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M34 38 C 34 18, 66 18, 66 38"
        stroke="#FFFBEB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Handle Rings */}
      <circle cx="34" cy="38" r="3.5" fill="url(#goldHw)" />
      <circle cx="66" cy="38" r="3.5" fill="url(#goldHw)" />

      {/* Main Bag Body */}
      <path
        d="M18 42 L25 82 C25.5 84.5 27.5 86 30 86 H70 C72.5 86 74.5 84.5 75 82 L82 42 C82.5 39.5 80.5 37 77.5 37 H22.5 C19.5 37 17.5 39.5 18 42 Z"
        fill="url(#roseBag)"
      />

      {/* Highlight sheen */}
      <path
        d="M24 40 L29 80 C29.5 81.5 31 82.5 33 82.5 H40 L34 40 Z"
        fill="#FFFFFF"
        fillOpacity="0.25"
      />

      {/* Front Flap */}
      <path
        d="M20 37 H80 L76 60 C75.5 63 73 65 70 65 H30 C27 65 24.5 63 24 60 Z"
        fill="url(#roseFlap)"
      />

      {/* Gold Clasp & Lock */}
      <rect x="45" y="58" width="10" height="12" rx="2" fill="url(#goldHw)" />
      <circle cx="50" cy="64" r="2" fill="#78350F" />
      <rect x="47.5" y="65" width="5" height="3" rx="0.5" fill="#78350F" />
    </svg>
  );
}

// Crisp Excel Export Icon
export function ExcelIcon({ className = "w-4 h-4 text-emerald-600" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="#ECFDF5"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2V8H20"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 13L15 19M15 13L9 19"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Crisp PDF Export Icon
export function PdfIcon({ className = "w-4 h-4 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2V8H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="7"
        y="17"
        fill="currentColor"
        fontSize="5.5"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}
