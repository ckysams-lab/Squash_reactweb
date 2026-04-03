// src/components/ui.jsx (Version 2.4 - "Project 'Kinetic'")

import React from 'react';
import { Loader2 } from 'lucide-react';

// --- 1. PageHeader - 注入動感與品牌色彩 ---
// 新特色：
// - 主色改為「壁球黃」。
// - 標題字重更粗，視覺衝擊力更強。
// - 背景增加一個傾斜的、半透明的裝飾性漸層，打破版式。
export const PageHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="relative mb-10 text-center md:text-left py-4 overflow-hidden">
        {/* -- Kinetic Element: Tilted Background Gradient -- */}
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-r from-slate-50 to-slate-100/50 -z-10"></div>
        
        <h2 className="text-3xl md:text-4xl font-[900] text-slate-800 flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            {/* -- Kinetic Element: Icon color changed to Squash Yellow -- */}
            {Icon && <Icon className="text-yellow-500" size={36} />}
            {title}
        </h2>
        {subtitle && (
            <p className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest mt-2">
                {subtitle}
            </p>
        )}
    </div>
);

// --- 2. Card - 增加深度與質感 ---
// 新特色：
// - 圓角更柔和。
// - 陰影更多層次、更細膩，提升立體感。
// - 邊框顏色更淡，與陰影更好地融合。
export const Card = ({ children, className = "", noPadding = false }) => (
    <div className={`bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100/80 shadow-lg shadow-slate-200/50 overflow-hidden ${noPadding ? '' : 'p-8 md:p-10'} ${className}`}>
        {children}
    </div>
);

// --- 3. PrimaryButton - 核心操作的視覺焦點 ---
// 新特色：
// - 主色改為從「壁球黃」到「薄荷綠」的動感漸層。
// - 增加與漸層色匹配的「輝光 (Glow)」效果，讓按鈕成為視覺中心。
// - 字體改為黑色，在亮色背景上更清晰。
export const PrimaryButton = ({ children, onClick, disabled, loading, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled || loading}
        className={`relative text-black px-8 py-4 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group overflow-hidden ${className}`}
    >
        {/* -- Kinetic Element: Gradient Background -- */}
        <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-emerald-400 group-hover:from-yellow-500 group-hover:to-emerald-500 transition-all"></span>
        
        {/* -- Kinetic Element: Glow Effect -- */}
        <span className="absolute inset-[-10px] bg-gradient-to-r from-yellow-400 to-emerald-400 blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500 -z-10"></span>

        <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : Icon && <Icon size={20} />}
            {children}
        </span>
    </button>
);

// --- 4. SecondaryButton - 清晰但低調的次要操作 ---
// 新特色：
// - 預設為描邊樣式，背景透明，視覺上更輕量。
// - 滑鼠懸停時，背景填充為淺灰色，提供清晰的回饋。
// - 文字顏色預設為較深的灰色，更易閱讀。
export const SecondaryButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-transparent text-slate-700 border-2 border-slate-200 px-6 py-4 rounded-2xl font-bold hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </button>
);

// --- 5. DangerButton - 醒目且謹慎的危險操作 ---
// 新特色：
// - 同樣採用描邊樣式，與 SecondaryButton 保持風格一致。
// - 使用醒目的紅色，並在懸停時填充背景，提供強烈的警示。
export const DangerButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-transparent text-red-600 border-2 border-red-200 px-6 py-4 rounded-2xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </button>
);

