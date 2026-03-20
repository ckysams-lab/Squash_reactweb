// src/components/ui.jsx (Version 1.0 - Shared UI Library)
import React from 'react';
import { Loader2 } from 'lucide-react';

// --- 1. 統一的頁面大標題 ---
export const PageHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="mb-10 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            {Icon && <Icon className="text-blue-600" size={36} />}
            {title}
        </h2>
        {subtitle && (
            <p className="text-sm md:text-base font-bold text-slate-400 uppercase tracking-widest mt-2">
                {subtitle}
            </p>
        )}
    </div>
);

// --- 2. 統一的卡片容器 (Card) ---
export const Card = ({ children, className = "", noPadding = false }) => (
    <div className={`bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden ${noPadding ? '' : 'p-8 md:p-12'} ${className}`}>
        {children}
    </div>
);

// --- 3. 統一的主要按鈕 (Primary Button - 例如：儲存、新增、確認) ---
// 特色：藍色背景、白色文字、強烈的點擊回饋
export const PrimaryButton = ({ children, onClick, disabled, loading, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled || loading}
        className={`bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
        {loading ? <Loader2 size={20} className="animate-spin" /> : Icon && <Icon size={20} />}
        {children}
    </button>
);

// --- 4. 統一的次要按鈕 (Secondary Button - 例如：取消、返回、下載範本) ---
// 特色：淺色背景、灰色文字、柔和的 Hover 效果
export const SecondaryButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-slate-50 text-slate-600 border border-slate-200 px-6 py-4 rounded-2xl font-bold hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </button>
);

// --- 5. 統一的危險操作按鈕 (Danger Button - 例如：刪除) ---
export const DangerButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
        {Icon && <Icon size={18} />}
        {children}
    </button>
);
