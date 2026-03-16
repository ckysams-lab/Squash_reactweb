// src/components/PlayerDashboard.jsx (Version 3.1 - Ultimate Analytics Edition)

import React, { useState, useRef, useMemo } from 'react';
import { 
    ArrowLeft, Trophy as TrophyIcon, Swords, ClipboardCheck, Award, 
    Target, TrendingUp, Activity, ShieldCheck, Zap, Info, 
    Download, Loader2, X 
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, AreaChart, Area, Legend, Cell // 👈 引入所有的圖表元件
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
    handleCheerMatch 
}) {
    const portfolioRef = useRef(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    
    // 👇 新增：熱圖的過濾狀態 (ALL, WINNER, ERROR)
    const [heatmapFilter, setHeatmapFilter] = useState('ALL');

    if (!student || !data) return null;

    // --- PDF 匯出邏輯 ---
    const handleDownloadPDF = async () => {
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

    // --- 戰術資料處理 (升級版) ---
    const myTacticalShots = tacticalShots ? tacticalShots.filter(s => s.player === student.name) : [];
    
    // 1. 處理熱圖資料 (支援過濾)
    const filteredShots = myTacticalShots.filter(shot => {
        if (heatmapFilter === 'ALL') return true;
        if (heatmapFilter === 'WINNER') return shot.shotResult === 'winner';
        if (heatmapFilter === 'ERROR') return shot.shotResult === 'error';
        return true;
    });

    const heatMap = {
        'Front-Left': 0, 'Front-Center': 0, 'Front-Right': 0,
        'Mid-Left': 0, 'T-Zone': 0, 'Mid-Right': 0,
        'Back-Left': 0, 'Back-Center': 0, 'Back-Right': 0
    };
    filteredShots.forEach(s => {
        if (heatMap[s.zone] !== undefined) heatMap[s.zone]++;
    });

    // 2. 處理擊球技巧效益資料
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

    // 3. 處理回合拍數耐力資料
    const rallyLengthData = useMemo(() => {
        if (!myTacticalShots || myTacticalShots.length === 0) return [];
        const buckets = {
            '短 (1-5拍)': { name: '1-5拍', Won: 0, Lost: 0, total: 0 },
            '中 (6-12拍)': { name: '6-12拍', Won: 0, Lost: 0, total: 0 },
            '長 (13-20拍)': { name: '13-20拍', Won: 0, Lost: 0, total: 0 },
            '極限 (20+拍)': { name: '20拍以上', Won: 0, Lost: 0, total: 0 },
        };

        myTacticalShots.forEach(shot => {
            let bucket = '';
            const len = shot.rallyLength || 1;
            if (len <= 5) bucket = '短 (1-5拍)';
            else if (len <= 12) bucket = '中 (6-12拍)';
            else if (len <= 20) bucket = '長 (13-20拍)';
            else bucket = '極限 (20+拍)';

            buckets[bucket].total++;
            if (shot.shotResult === 'winner') buckets[bucket].Won++;
            else if (shot.shotResult === 'error') buckets[bucket].Lost++;
        });
        
        return Object.values(buckets).filter(b => b.total > 0);
    }, [myTacticalShots]);


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
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGeneratingPDF} 
                            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
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
                        <StatCard title="Total Points" value={student.totalPoints} icon={TrophyIcon} colorClass="text-amber-600" bgClass="bg-amber-100" />
                        <StatCard title="Win Rate" value={`${data.winRate}%`} icon={Swords} colorClass="text-blue-600" bgClass="bg-blue-100" subtitle={`${data.wins}W - ${data.totalPlayed - data.wins}L`} />
                        <StatCard title="Attendance" value={`${data.attendanceRate}%`} icon={ClipboardCheck} colorClass="text-emerald-600" bgClass="bg-emerald-100" subtitle={`${data.attendedSessions} Sessions`} />
                        <StatCard title="Achievements" value={data.achievements ? data.achievements.length : 0} icon={Award} colorClass="text-purple-600" bgClass="bg-purple-100" subtitle="Badges Earned" />
                    </div>

                    {/* ================= 圖表區 (戰術與雷達) ================= */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* 1. 戰術落點熱圖 */}
                        {myTacticalShots.length > 0 ? (
                            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[550px]">
                                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                                    <div>
                                        <h4 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><Target className="text-red-500" strokeWidth={2.5}/> 綜合落點熱區</h4>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Heatmap Distribution ({myTacticalShots.length} Shots)</p>
                                    </div>

                                    {/* 過濾切換按鈕 */}
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200">
                                        <button onClick={() => setHeatmapFilter('ALL')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${heatmapFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>所有</button>
                                        <button onClick={() => setHeatmapFilter('WINNER')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${heatmapFilter === 'WINNER' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>得分</button>
                                        <button onClick={() => setHeatmapFilter('ERROR')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${heatmapFilter === 'ERROR' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}>失誤</button>
                                    </div>
                                </div>
                                
                                {filteredShots.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center flex-1 text-slate-300">
                                        <Target size={48} className="opacity-20 mb-4"/>
                                        <p className="font-bold text-sm">此分類下尚無紀錄</p>
                                    </div>
                                ) : (
                                    <div className="flex justify-center flex-1">
                                        <div className="relative w-full max-w-[280px] aspect-[3/4] bg-[#fdf5e6] border-[8px] border-slate-800 rounded-t-sm rounded-b-sm shadow-xl overflow-hidden">
                                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/70"></div>
                                            <div className="absolute top-[55%] left-0 right-0 border-t-[4px] border-red-500/50"></div>
                                            <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[4px] border-red-500/50"></div>
                                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-20">
                                                {['Front-Left', 'Front-Center', 'Front-Right', 'Mid-Left', 'T-Zone', 'Mid-Right', 'Back-Left', 'Back-Center', 'Back-Right'].map(zone => {
                                                    const count = heatMap[zone] || 0;
                                                    const maxCount = Math.max(...Object.values(heatMap), 1);
                                                    const intensity = count / maxCount; 
                                                    const percentage = Math.round((count / filteredShots.length) * 100) || 0;
                                                    
                                                    let baseColorRGB = '147, 197, 253'; // 藍
                                                    if (heatmapFilter === 'WINNER') baseColorRGB = '16, 185, 129'; // 綠
                                                    if (heatmapFilter === 'ERROR') baseColorRGB = '244, 63, 94'; // 紅

                                                    let heatColor = 'transparent';
                                                    if (intensity > 0) {
                                                        const opacity = Math.min(0.85, Math.max(0.2, intensity));
                                                        heatColor = `rgba(${baseColorRGB}, ${opacity})`;
                                                    }

                                                    return (
                                                        <div key={zone} className="relative flex flex-col items-center justify-center border border-slate-800/5 transition-all group">
                                                            <div className="absolute inset-0 transition-all duration-700" style={{ backgroundColor: heatColor, filter: 'blur(4px)', transform: 'scale(1.1)' }}></div>
                                                            {count > 0 && (
                                                                <div className="relative z-10 flex flex-col items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/50 group-hover:scale-110 transition-transform">
                                                                    <span className={`text-sm font-black ${
                                                                        heatmapFilter === 'WINNER' ? 'text-emerald-600' : 
                                                                        heatmapFilter === 'ERROR' ? 'text-rose-600' : 
                                                                        intensity > 0.6 ? 'text-blue-700' : 'text-slate-700'
                                                                    }`}>
                                                                        {percentage}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center h-[550px] text-slate-300">
                                <Target size={48} className="mb-4 opacity-50"/>
                                <p className="font-bold">尚無戰術落點數據</p>
                            </div>
                        )}

                        {/* 雷達圖 */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[550px]">
                            <div className="mb-8">
                                <h4 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><Activity className="text-emerald-500" strokeWidth={2.5}/> 綜合能力評估</h4>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{data.latestAssessment ? `最後更新: ${data.latestAssessment.date}` : 'Physical & Tech Overview'}</p>
                            </div>
                            <div className="flex-1 w-full relative">
                                {data.radarData && data.radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                            <Radar name={student.name} dataKey="A" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold">尚無評估紀錄</div>
                                )}
                            </div>
                        </div>

                        {/* 2. 擊球技巧效益分析 (長條圖) */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[400px]">
                            <div className="mb-6">
                                <h4 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><Zap className="text-amber-500" strokeWidth={2.5}/> 技巧效益分析</h4>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Shot Execution Breakdown</p>
                            </div>
                            <div className="flex-1 w-full relative">
                                {shotTypeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={shotTypeData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} width={60} />
                                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
                                            <Bar dataKey="Winner" name="得分" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} maxBarSize={30} />
                                            <Bar dataKey="Neutral" name="普通" stackId="a" fill="#94A3B8" />
                                            <Bar dataKey="Error" name="失誤" stackId="a" fill="#F43F5E" radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold">尚無擊球種類數據</div>
                                )}
                            </div>
                        </div>
                        
                        {/* 3. 回合拍數耐力分析 (面積圖) */}
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[400px]">
                            <div className="mb-6">
                                <h4 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3"><TrendingUp className="text-blue-500" strokeWidth={2.5}/> 耐力與回合分析</h4>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Rally Endurance & Win Rate</p>
                            </div>
                            <div className="flex-1 w-full relative">
                                {rallyLengthData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={rallyLengthData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                            <defs>
                                                <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94A3B8', fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                                            <Area type="monotone" dataKey="Won" name="在該回合長度得分" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" />
                                            <Area type="monotone" dataKey="Lost" name="在該回合長度失分" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorLost)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold">尚無回合長度數據</div>
                                )}
                            </div>
                        </div>

                    </div>
                    {/* ================= 圖表區結束 ================= */}

                    {/* 詳細數據面板 (最新體測數字) */}
                    {data.latestAssessment && (
                        <div className="bg-slate-50 p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-inner">
                            <h4 className="text-lg md:text-xl font-black text-slate-700 mb-6">最新體測與技術數據</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-indigo-600">{data.latestAssessment.situps}</p><p className="text-[10px] text-slate-400 font-bold mt-1">仰臥起坐</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-indigo-600">{data.latestAssessment.shuttleRun}</p><p className="text-[10px] text-slate-400 font-bold mt-1">折返跑</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-indigo-600">{data.latestAssessment.enduranceRun}</p><p className="text-[10px] text-slate-400 font-bold mt-1">耐力跑</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-indigo-600">{data.latestAssessment.gripStrength}</p><p className="text-[10px] text-slate-400 font-bold mt-1">手握力</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-indigo-600">{data.latestAssessment.flexibility}</p><p className="text-[10px] text-slate-400 font-bold mt-1">柔軟度</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-blue-600">{data.latestAssessment.fhDrive}</p><p className="text-[10px] text-slate-400 font-bold mt-1">正手長球</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-blue-600">{data.latestAssessment.bhDrive}</p><p className="text-[10px] text-slate-400 font-bold mt-1">反手長球</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-blue-600">{data.latestAssessment.fhVolley}</p><p className="text-[10px] text-slate-400 font-bold mt-1">正手截擊</p></div>
                                <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-xl md:text-2xl font-black text-blue-600">{data.latestAssessment.bhVolley}</p><p className="text-[10px] text-slate-400 font-bold mt-1">反手截擊</p></div>
                            </div>
                        </div>
                    )}
                    
                    {/* 我的成就與比賽紀錄 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-full lg:col-span-1">
                            <h4 className="text-xl md:text-2xl font-black mb-6">榮譽成就</h4>
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

                        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] col-span-full lg:col-span-2">
                            <h4 className="text-xl md:text-2xl font-black mb-6">近期比賽</h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
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
