// src/components/SchoolLogo.js

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const SchoolLogo = ({ systemConfig, size = 48, className = "" }) => {
  const [error, setError] = useState(false);

  const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
  
  const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;

  if (error || !logoUrl) {
    return <ShieldCheck className={className} style={{ width: size, height: size }} />;
  }

  return (
    <img 
      src={logoUrl} 
      alt="BCKLAS Logo" 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
      crossOrigin="anonymous" 
      onError={() => {
        console.error("Logo load failed for URL:", logoUrl);
        setError(true);
      }}
    />
  );
};

export default SchoolLogo;
