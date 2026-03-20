// src/components/ui.jsx (Version 5.0 - Premium Dark Mode)

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion'; // 引入動畫引擎

// --- 1. 統一的頁面大標題 (帶有霓虹光暈效果) ---
export const PageHeader = ({ title, subtitle, icon: Icon }) => (
    <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 text-center md:text-left relative z-10"
    >
        {/* 背景裝飾光暈 */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/20 rounded-full blur-[60px] -z-10"></div>
        
        <h2 className="text-3xl md:text-5xl font-black text-white flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start tracking-tight">
            {Icon && (
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Icon className="text-blue-400" size={32} strokeWidth={2.5} />
                </div>
            )}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                {title}
            </span>
        </h2>
        {subtitle && (
            <p className="text-sm md:text-base font-bold text-slate-400/80 uppercase tracking-[0.2em] mt-3 ml-2">
                {subtitle}
            </p>
        )}
    </motion.div>
);

// --- 2. 統一的卡片容器 (玻璃擬態 Glassmorphism) ---
export const Card = ({ children, className = "", noPadding = false }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden ${noPadding ? '' : 'p-6 md:p-10'} relative isolate ${className}`}
    >
        {/* 卡片內部微光 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        {children}
    </motion.div>
);

// --- 3. 統一的主要按鈕 (發光漸層) ---
export const PrimaryButton = ({ children, onClick, disabled, loading, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled || loading}
        className={`relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10 ${className}`}
    >
        {/* 按鈕 Hover 掃光特效 */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
        
        {loading ? <Loader2 size={20} className="animate-spin" /> : Icon && <Icon size={20} />}
        <span className="relative z-10 tracking-wide">{children}</span>
    </button>
);

// --- 4. 統一的次要按鈕 (深色霧面) ---
export const SecondaryButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-slate-800/80 backdrop-blur-md text-slate-300 border border-slate-700/50 px-6 py-4 rounded-2xl font-bold hover:bg-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg ${className}`}
    >
        {Icon && <Icon size={18} />}
        <span className="tracking-wide">{children}</span>
    </button>
);

// --- 5. 統一的危險操作按鈕 (霓虹紅) ---
export const DangerButton = ({ children, onClick, disabled, icon: Icon, className = "" }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`bg-rose-950/50 text-rose-400 border border-rose-900/50 px-6 py-4 rounded-2xl font-bold hover:bg-rose-600 hover:text-white hover:shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${className}`}
    >
        {Icon && <Icon size={18} />}
        <span className="tracking-wide">{children}</span>
    </button>
);
