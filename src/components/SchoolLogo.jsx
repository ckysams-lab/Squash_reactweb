import React from 'react';

const SchoolLogo = ({ schoolLogo, schoolName, className }) => {
  if (!schoolLogo) {
    return null;
  }

  return (
    // 我們加上一個可以從外部傳入的 className
    <div className={`flex items-center ${className || ''}`}>
      <img 
        src={schoolLogo} 
        alt={`${schoolName} Logo`} 
        className="h-auto w-auto max-h-full" // 讓圖片自適應高度
      />
    </div>
  );
};

export default SchoolLogo;

