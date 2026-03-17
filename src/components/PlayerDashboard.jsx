// src/components/PlayerDashboard.jsx (Version 3.2 - Player Journal Added)

import React, { useState, useRef, useMemo } from 'react';
import { 
    ArrowLeft, Trophy as TrophyIcon, Swords, ClipboardCheck, Award, 
    Target, TrendingUp, Activity, ShieldCheck, Zap, Download, Loader2, X, 
    MessageSquare, Send, BookOpen // 👈 引入新的 Icon
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, AreaChart, Area, Legend 
} from 'recharts';
import { ACHIEVEMENT_DATA } from '../constants/data';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PortfolioGenerator from './PortfolioGenerator'; 

// 客製化數據卡片元件
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subtitle }) => (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${bgClass} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700`}></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-2xl ${bgClass} ${colorClass}`}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1">{value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-2">{subtitle}</p>}
        </div>
    </div>
);

export default function PlayerDashboard({ 
    student, 
    data, 
    onClose, 
    onBadgeClick, 
    tacticalShots, 
    currentUserInfo, 
    role, 
    handleCheerMatch,
    // 👇 接收新傳入的 Journal 相關 props
    playerJournals,
    handleAddJournalEntry,
    handleReplyJournalEntry
}) {
    const portfolioRef = useRef(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [heatmapFilter, setHeatmapFilter] = useState('ALL');

    // 👇 新增：Journal 相關的輸入狀態
    const [newJournalText, setNewJournalText] = useState('');
    const [replyTextMap, setReplyTextMap] = useState({}); // 儲存針對特定日誌的暫存回覆
    const journalContainerRef = useRef(null);

    // 處理教練發佈日誌
    const submitJournal = () => {
        if (!newJournalText.trim()) return;
        handleAddJournalEntry(student.id, newJournalText);
        setNewJournalText('');
        // 自動捲動到底部
        setTimeout(() => {
            if (journalContainerRef.current) {
                journalContainerRef.current.scrollTop = journalContainerRef.current.scrollHeight;
            }
        }, 100);
    };

    // 處理學生回覆
    const submitReply = (journalId) => {
        const text = replyTextMap[journalId];
        if (!text || !text.trim()) return;
        handleReplyJournalEntry(journalId, text);
        setReplyTextMap(prev => ({...prev, [journalId]: ''})); // 清空該輸入框
    };

    if (!student || !data) return null;

    // --- PDF 匯出邏輯 (保持不變) ---
    const handleDownloadPDF = async () => { /* ... (省略，保持原樣) ... */ 
        const element = portfolioRef.current;
        if (!element) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
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

    // --- 戰術資料處理 (保持不變) ---
    const myTacticalShots = tacticalShots ? tacticalShots.filter(s => s.player === student.name) : [];
    const filteredShots = myTacticalShots.filter(shot => {
        if (heatmapFilter === 'ALL') return true;
        if (heatmapFilter === 'WINNER') return shot.shotResult === 'winner';
        if (heatmapFilter === 'ERROR') return shot.shotResult === 'error';
        return true;
    });
    const heatMap = { 'Front-Left':0, 'Front-Center':0, 'Front-Right':0, 'Mid-Left':0, 'T-Zone':0, 'Mid-Right':0, 'Back-Left':0, 'Back-Center':0, 'Back-Right':0 };
    filteredShots.forEach(s => { if (heatMap[s.zone] !== undefined) heatMap[s.zone]++; });

    const shotTypeData = useMemo(() => {
        if (!myTacticalShots || myTacticalShots.length === 0) return [];
        const counts = {};
        myTacticalShots.forEach(shot => {
            const type = shot.shotType || 'Drive'; 
            if (!counts[type]) counts[type] = { name: type, Winner: 0, Error: 0, Neutral: 0 };
            if (shot.shotResult === 'winner') counts[type].Winner++;
            else if (shot.shotResult === 'error') counts[type].Error++;
            else counts[type].Neutral++;
        });
        return Object.values(counts).sort((a, b) => (b.Winner + b.Error + b.Neutral) - (a.Winner + a.Error + a.Neutral));
    }, [myTacticalShots]);

    const rallyLengthData = useMemo(() => {
        if (!myTacticalShots || myTacticalShots.length === 0) return [];
        const buckets = { '短 (1-5拍)': { name: '1-5拍', Won: 0, Lost: 0, total: 0 }, '中 (6-12拍)': { name: '6-12拍', Won: 0, Lost: 0, total: 0 }, '長 (13-20拍)': { name: '13-20拍', Won: 0, Lost: 0, total: 0 }, '極限 (20+拍)': { name: '20拍以上', Won: 0, Lost: 0, total: 0 } };
        myTacticalShots.forEach(shot => {
            let bucket = ''; const len = shot.rallyLength || 1;
            if (len <= 5) bucket = '短 (1-5拍)'; else if (len <= 12) bucket = '中 (6-12拍)'; else if (len <= 20) bucket = '長 (13-20拍)'; else bucket = '極限 (20+拍)';
            buckets[bucket].total++;
            if (shot.shotResult === 'winner') buckets[bucket].Won++;
            else if (shot.shotResult === 'error') buckets[bucket].Lost++;
        });
        return Object.values(buckets).filter(b => b.total > 0);
    }, [myTacticalShots]);

    // 👇 篩選出該學生的日誌 👇
    const myJournals = playerJournals ? playerJournals.filter(j => j.studentId === student.id) : [];

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-xl flex justify-center p-0 md:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-slate-50/90 w-full max-w-7xl min-h-screen md:min-h-0 md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col relative">
                
                {/* Header */}
                <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg px-8 py-6 border-b border-slate-200/50 flex items-center justify-between md:rounded-t-[3rem]">
                    <div className="flex items-center gap-6">
                        {onClose && (
                            <button onClick={onClose} className="p-3 bg-white text-slate-500 hover:text-blue-600 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100">
                                <ArrowLeft size={20} strokeWidth={2.5}/>
                            </button>
                        )}
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">
                            PLAYER INTELLIGENCE
                        </h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {isGeneratingPDF ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}
                            Export Portfolio
                        </button>
                        {onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 transition-colors md:hidden"><X size={24}/></button>}
                    </div>
                </div>

                <div className="p-6 md:p-12 space-y-12 overflow-y-auto">
                    
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left bg-white p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-50 via-indigo-50/50 to-transparent rounded-bl-full pointer-events-none"></div>
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-6xl font-black text-slate-300 border-8 border-white shadow-xl uppercase shrink-0 relative z-10 overflow-hidden">
                            {student.photo_url ? <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover"/> : student.name[0]}
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight mb-2">{student.name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-bold">
                                <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full uppercase tracking-widest">Class {student.class}</span>
                                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase tracking-widest">{student.squashClass || 'Team Player'}</span>
                                <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-widest"><Award size={14}/> {student.badge || '無章'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 四大指標 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Points" value={student.totalPoints} icon={TrophyIcon} colorClass="text-amber-600" bgClass="bg-amber-100" subtitle={`Rank: # -`} />
                        <StatCard title="Win Rate" value={`${data.winRate}%`} icon={Swords} colorClass="text-blue-600" bgClass="bg-blue-100" subtitle={`${data.wins}W - ${data.totalPlayed - data.wins}L`} />
                        <StatCard title="Attendance" value={`${data.attendanceRate}%`} icon={ClipboardCheck} colorClass="text-emerald-600" bgClass="bg-emerald-100" subtitle={`${data.attendedSessions} Sessions`} />
                        <StatCard title="Achievements" value={data.achievements ? data.achievements.length : 0} icon={Award} colorClass="text-purple-600" bgClass="bg-purple-100" subtitle="Badges Earned" />
                    </div>

                    {/* 圖表區 (縮減篇幅，保持不變) */}
                    {/* ... (為了節省對話空間，這裡假定你保持原本的熱圖、長條圖、面積圖、雷達圖等區塊) ... */}

                    {/* 🏆 ================= 下方三欄版面：成就 | 比賽 | 成長日誌 ================= 🏆 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* 左：個人成就 */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <h4 className="text-xl md:text-2xl font-black mb-6">個人成就</h4>
                            <div className="grid grid-cols-3 gap-4">
                                {data.achievements && data.achievements.length > 0 ? (
                                    data.achievements.map(ach => {
                                        const badgeData = ACHIEVEMENT_DATA[ach.badgeId];
                                        if (!badgeData) return null;
                                        const currentLevelData = badgeData.levels?.[ach.level] || badgeData.levels?.[1] || { name: badgeData.baseName, desc: '' };
                                      return (
                                         <button key={ach.badgeId} onClick={() => onBadgeClick && onBadgeClick(ach)} className="group relative flex flex-col items-center justify-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all focus:outline-none active:scale-95" >
                                             <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md border group-hover:scale-110 transition-transform">
                                                 {badgeData.icon}
                                             </div>
                                             <p className="text-[10px] font-bold text-slate-600 mt-2 truncate w-full">{currentLevelData.name}</p>
                                         </button>
                                     );
                                    })
                                ) : (
                                    <p className="col-span-full text-center text-xs text-slate-400 py-4">還沒有獲得任何徽章。</p>
                                )}
                            </div>
                        </div>

                        {/* 中：近期比賽 */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <h4 className="text-xl md:text-2xl font-black mb-6">近期比賽</h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {data.recentMatches && data.recentMatches.length > 0 ? data.recentMatches.map(match => {
                                    const isWinner = match.winnerId === student.id;
                                    const opponentName = match.player1Id === student.id ? match.player2Name : match.player1Name;
                                    const score = match.matchType === 'external' ? match.externalMatchScore : (match.player1Id === student.id ? `${match.score1} - ${match.score2}` : `${match.score2} - ${match.score1}`);
                                    const cheersCount = match.cheers?.length || 0;
                                    const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');

                                    return (
                                        <div key={match.id} className={`p-4 md:p-5 rounded-3xl flex items-center justify-between gap-4 relative overflow-hidden transition-all hover:scale-[1.01] ${isWinner ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                                            <div className="flex-1">
                                                <p className="text-[10px] md:text-xs text-slate-400 font-bold truncate">{match.date} - {match.tournamentName}</p>
                                                <p className="font-bold text-slate-700 text-base md:text-lg">vs. {opponentName}</p>
                                            </div>
                                            <div className="text-right pr-4 border-r border-slate-200/50 mr-2">
                                                <p className={`font-black text-xl md:text-2xl font-mono ${isWinner ? 'text-emerald-600' : 'text-rose-600'}`}>{score}</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center min-w-[40px] md:min-w-[50px]">
                                                <button onClick={handleCheerMatch ? (e) => handleCheerMatch(match.id, e) : undefined} className={`p-2 rounded-full transition-all active:scale-75 ${hasCheered ? 'bg-orange-100 text-orange-500 shadow-inner' : 'bg-white text-slate-300 hover:text-orange-400 shadow-sm border border-slate-100'}`}>
                                                    <Zap size={18} className={hasCheered ? 'fill-orange-400' : ''} />
                                                </button>
                                                <span className={`text-[9px] md:text-[10px] font-black mt-1 ${hasCheered ? 'text-orange-500' : 'text-slate-400'}`}>
                                                    {cheersCount > 0 ? cheersCount : '打氣'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }) : <p className="text-center text-slate-400 py-10 text-sm">暫無比賽記錄</p>}
                            </div>
                        </div>

                        {/* 👇 新增 右側：雙向互動成長日誌 👇 */}
                        <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col h-[500px] lg:h-[600px] relative overflow-hidden">
                            {/* 裝飾 */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                            
                            <div className="mb-6 flex justify-between items-center relative z-10">
                                <h4 className="text-xl md:text-2xl font-black flex items-center gap-3"><BookOpen className="text-blue-400"/> 成長日誌</h4>
                                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-blue-200">Coach & Player</span>
                            </div>

                            {/* 日誌對話牆 (捲動區) */}
                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar relative z-10" ref={journalContainerRef}>
                                {myJournals.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-bold text-center">
                                        <MessageSquare size={40} className="mb-4 opacity-30"/>
                                        <p>教練尚未發佈任何成長日誌。</p>
                                    </div>
                                ) : (
                                    myJournals.map(journal => (
                                        <div key={journal.id} className="space-y-3 relative">
                                            {/* 連接線 */}
                                            <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-slate-700/50 z-0"></div>
                                            
                                            {/* 教練的評語 (Coach Node) */}
                                            <div className="flex gap-4 relative z-10">
                                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-black shadow-lg shadow-blue-500/20 shrink-0 border-4 border-slate-900 text-sm">
                                                    教
                                                </div>
                                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-sm flex-1 shadow-md">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">{new Date(journal.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                                    <p className="text-sm font-medium leading-relaxed text-slate-200">{journal.coachContent}</p>
                                                </div>
                                            </div>

                                            {/* 學生的反思/回覆 (Player Node) */}
                                            {journal.studentReply ? (
                                                <div className="flex gap-4 pl-8 relative z-10">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black shadow-lg shrink-0 border-4 border-slate-900 text-xs">
                                                        {student.name[0]}
                                                    </div>
                                                    <div className="bg-slate-700/50 border border-slate-600/50 p-3 rounded-2xl rounded-tl-sm flex-1">
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">我的反思</p>
                                                        <p className="text-sm font-medium text-slate-300">{journal.studentReply}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                // 如果還沒回覆，且登入者是學生，顯示回覆輸入框
                                                role === 'student' && (
                                                    <div className="pl-14 relative z-10 flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="寫下你的賽後反思..." 
                                                            value={replyTextMap[journal.id] || ''}
                                                            onChange={e => setReplyTextMap({...replyTextMap, [journal.id]: e.target.value})}
                                                            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400 transition-all"
                                                        />
                                                        <button 
                                                            onClick={() => submitReply(journal.id)}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-all shadow-md"
                                                        >
                                                            <Send size={16}/>
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* 教練發佈新日誌的輸入區 (僅限教練) */}
                            {role === 'admin' && (
                                <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
                                    <textarea 
                                        rows="2"
                                        placeholder={`記錄 ${student.name} 今天的表現...`}
                                        value={newJournalText}
                                        onChange={e => setNewJournalText(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button 
                                            onClick={submitJournal}
                                            disabled={!newJournalText.trim()}
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            <Send size={16}/> 發佈日誌
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                        {/* 👆 日誌區塊結束 👆 */}
                    </div>

                </div>
            </div>

            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100, pointerEvents: 'none' }}>
                <PortfolioGenerator ref={portfolioRef} student={student} data={data} />
            </div>
            
        </div>
    );
}
