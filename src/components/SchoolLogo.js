// src/components/SchoolLogo.js

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// 我們將 SchoolLogo 變成一個獨立的組件
const SchoolLogo = ({ systemConfig, size = 48, className = "" }) => {
  const [error, setError] = useState(false);

  // 預設 Logo URL，以防 systemConfig 中沒有提供
  const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
  
  // 優先使用從 props 傳入的 systemConfig.schoolLogo
  const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;

  if (error || !logoUrl) {
    // 如果圖片載入失敗或沒有 URL，顯示一個備用的圖標
    return <ShieldCheck className={className} style={{ width: size, height: size }} />;
  }

  return (
    <img 
      src={logoUrl} 
      alt="BCKLAS Logo" 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }} // 修正了樣式，使其更精確
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
