// src/components/PlayerDashboard.jsx (Version 2.0 - With PDF Export)

import React, { useState, useRef } from 'react'; // 👈 加入 useRef 和 useState
import { 
    ArrowLeft, Trophy as TrophyIcon, Swords, ClipboardCheck, Award, 
    Target, TrendingUp, Activity, ShieldCheck, Zap, Info, 
    Download, Loader2, X // 👈 確保引入了 Download, Loader2, X
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { ACHIEVEMENT_DATA } from '../constants/data';

// 👇 引入產生 PDF 的套件與元件
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PortfolioGenerator from './PortfolioGenerator'; 

export default function PlayerDashboard({ 
    student, 
    data, 
    onClose, 
    onBadgeClick, 
    tacticalShots, 
    currentUserInfo, 
    role, 
    handleCheerMatch 
}) {
    if (!student || !data) return null;

    // --- 👇 新增：PDF 匯出邏輯 👇 ---
    const portfolioRef = useRef(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const handleDownloadPDF = async () => {
        const element = portfolioRef.current;
        if (!element) return;
        setIsGeneratingPDF(true);

        try {
            // 1. 將隱藏的 HTML 元素轉換成高畫質圖片
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            
            // 2. 建立 A4 尺寸的 PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // 3. 把圖片貼到 PDF 上並下載
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${student.name}_專業壁球簡歷.pdf`);
        } catch (error) {
            console.error("PDF 產生失敗:", error);
            alert("履歷產生失敗，請稍後再試。");
        } finally {
            setIsGeneratingPDF(false);
        }
    };
    // --- 👆 邏輯結束 👆 ---


    // 找出該學生作為 A(擊球) 或 B(回球) 的所有數據
    const myTacticalShots = tacticalShots.filter(s => s.player === student.name);
    
    const heatMap = {
        'Front-Left': 0, 'Front-Center': 0, 'Front-Right': 0,
        'Mid-Left': 0, 'T-Zone': 0, 'Mid-Right': 0,
        'Back-Left': 0, 'Back-Center': 0, 'Back-Right': 0
    };
    
    myTacticalShots.forEach(s => {
        if (heatMap[s.zone] !== undefined) {
            heatMap[s.zone]++;
        }
    });
  
    return (
        // 注意：這裡我加了一個半透明的黑底背景，讓它看起來像個彈出視窗
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex justify-center p-0 md:p-6 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full max-w-6xl min-h-screen md:min-h-0 md:rounded-[3rem] shadow-2xl flex flex-col relative">
                
                {/* 頂部 Header 區塊 (包含關閉按鈕與 PDF 下載按鈕) */}
                <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-6 border-b border-slate-200 flex items-center justify-between md:rounded-t-[3rem]">
                    <div className="flex items-center gap-4">
                        {onClose && (
                            <button onClick={onClose} className="p-3 bg-slate-100 text-slate-500 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95">
                                <ArrowLeft size={24}/>
                            </button>
                        )}
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">球員檔案</h3>
                        </div>
                    </div>
                    
                    {/* 👇 新增：PDF 下載按鈕 👇 */}
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isGeneratingPDF ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                        匯出簡歷 (PDF)
                    </button>
                </div>

                {/* 主要內容捲動區 */}
                <div className="p-6 md:p-10 space-y-10 overflow-y-auto">
                    
                    {/* 基本資料 */}
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-4xl font-black text-slate-300 border-4 border-slate-100 shadow-sm uppercase shrink-0">
                            {student.name[0]}
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-800">{student.name}</h3>
                            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Class {student.class} ({student.classNo}) • {student.squashClass}</p>
                        </div>
                    </div>

                    {/* 四大核心指標卡片 (保持不變) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:bg-yellow-200 transition-all duration-700 pointer-events-none"></div>
                            
                            <TrophyIcon size={32} className="mx-auto text-yellow-500 mb-2 relative z-10"/>
                            <p className="text-4xl font-black text-slate-800 relative z-10">{student.totalPoints}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest relative z-10">Total Points</p>
                            
                            {/* 動態進度條邏輯 */}
                            {(() => {
                                const pts = student.totalPoints || 0;
                                let currentRank = "見習球員";
                                let nextRank = "新晉主力";
                                let nextGoal = 100;
                                let progress = 0;
                                if (pts < 100) { currentRank = "見習球員"; nextRank = "新晉主力"; nextGoal = 100; progress = (pts / nextGoal) * 100; }
                                else if (pts < 300) { currentRank = "新晉主力"; nextRank = "球場精英"; nextGoal = 300; progress = ((pts - 100) / 200) * 100; }
                                else if (pts < 600) { currentRank = "球場精英"; nextRank = "壁球大師"; nextGoal = 600; progress = ((pts - 300) / 300) * 100; }
                                else { currentRank = "傳說級大師 🏆"; nextRank = "頂點"; nextGoal = pts; progress = 100; }
                                return (
                                    <div className="mt-5 relative z-10">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{currentRank}</span>
                                            {progress < 100 && <span className="text-[9px] font-bold text-slate-400">尚差 {nextGoal - pts} 分晉升</span>}
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1500 ease-out"
                                                style={{ width: `${Math.max(5, progress)}%` }}
                                            ></div>
                                        </div>
                                        {progress < 100 && <p className="text-[8px] text-slate-400 text-right mt-1 font-bold">下一階: {nextRank}</p>}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <Swords size={32} className="mx-auto text-blue-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.winRate}<span className="text-2xl">%</span></p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Win Rate ({data.wins}/{data.totalPlayed})</p>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <ClipboardCheck size={32} className="mx-auto text-emerald-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.attendanceRate}<span className="text-2xl">%</span></p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Attendance</p>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <Award size={32} className="mx-auto text-orange-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.achievements.length}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Achievements</p>
                        </div>
                    </div>

                    {/* 圖表區：熱圖、折線圖、雷達圖 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* 戰術落點熱圖 */}
                        {myTacticalShots.length > 0 && (
                            <div className="animate-in slide-in-from-bottom-6 duration-700 col-span-full">
                                <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                                        <div>
                                            <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Target className="text-red-500" size={28}/> 攻擊落點熱圖</h4>
                                            <p className="text-sm font-bold text-slate-400 mt-1">分析 {student.name} 的擊球落點分佈 (基於 {myTacticalShots.length} 筆紀錄)</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-xs font-bold text-slate-500">
                                            <span>冷區</span>
                                            <div className="w-24 h-3 rounded-full bg-gradient-to-r from-blue-100 via-yellow-200 to-red-500"></div>
                                            <span>熱區</span>
                                        </div>
                                    </div>
         
