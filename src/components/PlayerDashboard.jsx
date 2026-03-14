// src/components/PlayerDashboard.jsx (Version 2.1 - Build Fixed & PDF Export)

import React, { useState, useRef } from 'react';
import { 
    ArrowLeft, Trophy as TrophyIcon, Swords, ClipboardCheck, Award, 
    Target, TrendingUp, Activity, ShieldCheck, Zap, Info, 
    Download, Loader2, X 
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { ACHIEVEMENT_DATA } from '../constants/data';

// 引入產生 PDF 的套件與元件
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
    // PDF 匯出邏輯
    const portfolioRef = useRef(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    if (!student || !data) return null;

    const handleDownloadPDF = async () => {
        const element = portfolioRef.current;
        if (!element) return;
        setIsGeneratingPDF(true);

        try {
            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${student.name}_專業壁球簡歷.pdf`);
        } catch (error) {
            console.error("PDF 產生失敗:", error);
            alert("履歷產生失敗，請稍後再試。");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // 處理熱區圖資料
    const myTacticalShots = tacticalShots ? tacticalShots.filter(s => s.player === student.name) : [];
    const heatMap = {
        'Front-Left': 0, 'Front-Center': 0, 'Front-Right': 0,
        'Mid-Left': 0, 'T-Zone': 0, 'Mid-Right': 0,
        'Back-Left': 0, 'Back-Center': 0, 'Back-Right': 0
    };
    
    myTacticalShots.forEach(s => {
        if (heatMap[s.zone] !== undefined) heatMap[s.zone]++;
    });
  
    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex justify-center p-0 md:p-6 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full max-w-6xl min-h-screen md:min-h-0 md:rounded-[3rem] shadow-2xl flex flex-col relative">
                
                {/* 頂部 Header */}
                <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-6 border-b border-slate-200 flex items-center justify-between md:rounded-t-[3rem]">
                    <div className="flex items-center gap-4">
                        {onClose && (
                            <button onClick={onClose} className="p-3 bg-slate-100 text-slate-500 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95">
                                <ArrowLeft size={24}/>
                            </button>
                        )}
                        <h3 className="text-2xl font-black text-slate-800">球員檔案</h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                            className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isGeneratingPDF ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                            匯出專業簡歷 (PDF)
                        </button>
                        {onClose && (
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all md:hidden">
                                <X size={24}/>
                            </button>
                        )}
                    </div>
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

                    {/* 四大核心指標 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:bg-yellow-200 transition-all duration-700 pointer-events-none"></div>
                            <TrophyIcon size={32} className="mx-auto text-yellow-500 mb-2 relative z-10"/>
                            <p className="text-4xl font-black text-slate-800 relative z-10">{student.totalPoints}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest relative z-10">Total Points</p>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <Swords size={32} className="mx-auto text-blue-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.winRate}<span className="text-2xl">%</span></p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Win Rate</p>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <ClipboardCheck size={32} className="mx-auto text-emerald-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.attendanceRate}<span className="text-2xl">%</span></p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Attendance</p>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                            <Award size={32} className="mx-auto text-orange-500 mb-4"/>
                            <p className="text-4xl font-black text-slate-800">{data.achievements ? data.achievements.length : 0}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Achievements</p>
                        </div>
                    </div>

                    {/* 圖表區 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* 熱點圖 */}
                        {myTacticalShots.length > 0 && (
                            <div className="col-span-full bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                                <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8"><Target className="text-red-500" size={28}/> 攻擊落點熱圖</h4>
                                <div className="flex justify-center">
                                    <div className="relative w-full max-w-sm aspect-[3/4] bg-[#fdf5e6] border-[8px] border-slate-800 rounded-t-sm rounded-b-sm shadow-xl overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/70"></div>
                                        <div className="absolute top-[55%] left-0 right-0 border-t-[4px] border-red-500/50"></div>
                                        <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[4px] border-red-500/50"></div>
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-20">
                                            {['Front-Left', 'Front-Center', 'Front-Right', 'Mid-Left', 'T-Zone', 'Mid-Right', 'Back-Left', 'Back-Center', 'Back-Right'].map(zone => {
                                                const count = heatMap[zone] || 0;
                                                const maxCount = Math.max(...Object.values(heatMap), 1);
                                                const intensity = count / maxCount; 
                                                const percentage = Math.round((count / myTacticalShots.length) * 100) || 0;
                                                let heatColor = 'transparent';
                                                if (intensity > 0.7) heatColor = 'rgba(239, 68, 68, 0.85)'; 
                                                else if (intensity > 0.4) heatColor = 'rgba(245, 158, 11, 0.7)'; 
                                                else if (intensity > 0.1) heatColor = 'rgba(252, 211, 77, 0.5)'; 
                                                else if (intensity > 0) heatColor = 'rgba(147, 197, 253, 0.3)'; 
                                                return (
                                                    <div key={zone} className="relative flex flex-col items-center justify-center border border-slate-800/5 transition-all group">
                                                        <div className="absolute inset-0 transition-all duration-1000" style={{ backgroundColor: heatColor, filter: 'blur(4px)', transform: 'scale(1.1)' }}></div>
                                                        {count > 0 && (
                                                            <div className="relative z-10 flex flex-col items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/50 group-hover:scale-110 transition-transform">
                                                                <span className={`text-sm font-black ${intensity > 0.7 ? 'text-red-600' : 'text-slate-700'}`}>{percentage}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 走勢圖 */}
                        <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
                            <h4 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3"><TrendingUp className="text-blue-500"/> 積分走勢</h4>
                            <div className="flex-1 min-h-[250px] w-full">
                                {data.pointsHistory && data.pointsHistory.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.pointsHistory}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
                                            <YAxis tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                            <Line type="monotone" dataKey="points" stroke="#3B82F6" strokeWidth={4} dot={{r: 4}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-slate-400 mt-20">資料不足</p>
                                )}
                            </div>
                        </div>

                        {/* 雷達圖 */}
                        <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
                            <h4 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-3"><Activity className="text-emerald-500"/> 綜合能力</h4>
                            <div className="flex-1 min-h-[250px] w-full">
                                {data.radarData && data.radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                                            <PolarGrid stroke="#E2E8F0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11}} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                            <Radar name={student.name} dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-center text-slate-400 mt-20">尚未有評估紀錄</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 近期比賽與成就 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm col-span-full lg:col-span-1">
                            <h4 className="text-2xl font-black mb-6">個人成就</h4>
                            <div className="grid grid-cols-3 gap-4">
                                {data.achievements && data.achievements.length > 0 ? (
                                    data.achievements.map(ach => {
                                        const badgeData = ACHIEVEMENT_DATA[ach.badgeId];
                                        if (!badgeData) return null;
                                        return (
                                         <div key={ach.badgeId} className="flex flex-col items-center p-2">
                                             <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md">
                                                 {badgeData.icon}
                                             </div>
                                         </div>
                                        );
                                    })
                                ) : (
                                    <p className="col-span-full text-center text-xs text-slate-400 py-4">無徽章</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm col-span-full lg:col-span-2">
                            <h4 className="text-2xl font-black mb-6">近期比賽</h4>
                            <div className="space-y-4">
                                {data.recentMatches && data.recentMatches.length > 0 ? data.recentMatches.map(match => {
                                    const isWinner = match.winnerId === student.id;
                                    const opponentName = match.player1Id === student.id ? match.player2Name : match.player1Name;
                                    const score = match.matchType === 'external' ? match.externalMatchScore : `${match.score1}-${match.score2}`;
                                    
                                    return (
                                        <div key={match.id} className={`p-4 md:p-6 rounded-3xl flex items-center justify-between gap-4 border ${isWinner ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-slate-400 font-bold">{match.date}</p>
                                                <p className="font-bold text-slate-700">vs. {opponentName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black text-xl font-mono ${isWinner ? 'text-emerald-600' : 'text-rose-600'}`}>{score}</p>
                                            </div>
                                        </div>
                                    )
                                }) : <p className="text-center text-slate-400 py-10 text-sm">暫無比賽記錄</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* 隱藏的 PDF 生成器 */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100, pointerEvents: 'none' }}>
                <PortfolioGenerator ref={portfolioRef} student={student} data={data} />
            </div>
            
        </div>
    );
}
