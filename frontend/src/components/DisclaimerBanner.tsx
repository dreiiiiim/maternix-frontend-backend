'use client';

import React from 'react';

export function DisclaimerBanner() {
  return (
    <div 
      className="w-full py-2 px-4 text-center text-sm font-medium border-b transition-all duration-300"
      style={{ 
        backgroundColor: 'var(--brand-pink-light)', 
        color: 'var(--brand-pink-dark)',
        borderColor: 'var(--brand-pink-medium)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span role="img" aria-label="education">🎓</span>
        <span>Notice: This platform is for educational purposes only.</span>
      </div>
    </div>
  );
}
