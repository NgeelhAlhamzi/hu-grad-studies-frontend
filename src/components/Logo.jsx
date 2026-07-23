import React from 'react';

const Logo = ({ size = 40 }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="256" cy="256" r="240" fill="#2563eb" />
        <rect x="112" y="140" width="288" height="190" rx="20" fill="#ffffff" opacity="0.2" />
        <path d="M256 120 L370 180 L256 240 L142 180 Z" fill="#ffffff" />
        <path d="M180 200 L180 260 C180 280 332 280 332 260 L332 200" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
        <path d="M350 190 L350 270 C350 275 345 280 340 280" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" />
        <circle cx="340" cy="285" r="10" fill="#fbbf24" />
        <rect x="180" y="320" width="24" height="60" rx="6" fill="#60a5fa" />
        <rect x="224" y="290" width="24" height="90" rx="6" fill="#38bdf8" />
        <rect x="268" y="260" width="24" height="120" rx="6" fill="#93c5fd" />
      </svg>
      <span className="fw-bold text-primary" style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
        الإشراف <span className="text-dark">الإلكتروني</span>
      </span>
    </div>
  );
};

export default Logo;