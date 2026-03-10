// src/components/SchoolLogo.jsx

import React from 'react';

// 這是一個獨立、可重複使用的 Logo 元件
const SchoolLogo = ({ schoolLogo, schoolName }) => {
  // 如果沒有提供 schoolLogo 的 URL，則不渲染任何東西
  if (!schoolLogo) {
    return null;
  }

  return (
    <div className="absolute top-8 left-10 z-50">
      <img 
        src={schoolLogo} 
        alt={`${schoolName} Logo`} 
        className="h-20"
      />
    </div>
  );
};

export default SchoolLogo;
