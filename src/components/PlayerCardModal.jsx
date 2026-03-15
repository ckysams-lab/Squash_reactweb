// src/components/PlayerCardModal.jsx (Version 5.1 - Real Stats & Match Info)

import React, { useRef, useState, useMemo } from 'react';
import { ChevronRight, Download, Loader2, Trophy as TrophyIcon, Crown, X, Star } from 'lucide-react';
import { toPng } from 'html-to-image';

const getAcademicYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); 
    if (month >= 8) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
};

const PlayerCardModal = ({ 
    student, onClose, rankedStudents, setShowPlayerCard, 
    leagueMatches, achievements, systemConfig, BADGE_DATA, ACHIEVEMENT_DATA,
    assessments, attendanceLogs
}) => {
    const cardRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!student) return null;

    const currentIndex = rankedStudents.findIndex(s => s.id === student.id);
    const rank = currentIndex >= 0 ? currentIndex + 1 : '-';

    const handlePrev = (e) => { e.stopPropagation(); if (currentIndex > 0) setShowPlayerCard(rankedStudents[currentIndex - 1]); };
    const handleNext = (e) => { e.stopPropagation(); if (currentIndex < rankedStudents.length - 1) setShowPlayerCard(rankedStudents[currentIndex + 1]); };
    
    // -------------------------------------------------------------
    // 1. 真實數據計算與底分調整 (底分 50)
    // -------------------------------------------------------------
    const { stats, matchSummary } = useMemo(() => {
        // 分離內部與外部比賽
        const studentMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === student.id || m.player2Id === student.id));
        const internalMatches = studentMatches.filter(m => m.matchType !== 'external');
        const externalMatches = studentMatches.filter(m => m.matchType === 'external' && m.player1Id === student.id);

        const internalWins = internalMatches.filter(m => m.winnerId === student.id).length;
        const externalWins = externalMatches.filter(m => m.winnerId === student.id).length;
        const internalWinRate = internalMatches.length > 0 ? (internalWins / internalMatches.length) : 0;

        // --- 能力值計算 (基礎分皆為 50) ---
        const calcScore = (val, max, base = 50) => {
            if (!val || val <= 0) return base; // 沒有數據就給 50 分
            return Math.min(99, Math.floor(base + ((val / max) * (99 - base))));
        };

        const studentAssessments = (assessments || []).filter(a => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
        const latestAssessment = studentAssessments.length > 0 ? studentAssessments[0] : null;

        let PAC = 50, SHO = 50, PAS = 50, PHY = 50;

        if (latestAssessment) {
            PAC = calcScore(latestAssessment.shuttleRun, 25, 50);
            const powerScore = ((latestAssessment.fhDrive || 0) + (latestAssessment.bhDrive || 0)) / 2;
            SHO = calcScore(powerScore + (latestAssessment.gripStrength || 0)/5, 20, 50);
            const controlScore = ((latestAssessment.fhVolley || 0) + (latestAssessment.bhVolley || 0)) / 2;
            PAS = calcScore(controlScore, 10, 50);
            PHY = calcScore(latestAssessment.enduranceRun, 10, 50);
        }

        const DEF = Math.min(99, Math.floor(50 + (internalWinRate * 49))); 
        
        const studentAttendance = (attendanceLogs || []).filter(log => log.studentId === student.id);
        const attendedSessions = new Set(studentAttendance.map(log => log.date)).size;
        const MEN = calcScore(attendedSessions, 20, 50);

        const OVR = Math.floor((PAC + SHO + PAS + PHY + DEF + MEN) / 6);

        return { 
            stats: { PAC, SHO, PAS, PHY, DEF, MEN, OVR },
            matchSummary: { internalWins, externalWins }
        };
    }, [student, leagueMatches, assessments, attendanceLogs]);

    // -------------------------------------------------------------
    // 2. 視覺設定
    // -------------------------------------------------------------
    const cardTheme = useMemo(() => {
        if (stats.OVR >= 85) return { type: 'GOLD', border: 'from-yellow-300 via-yellow-600 to-yellow-800', bg: 'from-stone-900 via-stone-800 to-black', text: 'text-yellow-400', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]', foil: 'bg-gradient-to-tr from-yellow-300/20 via-transparent to-white/20' };
        if (stats.OVR >= 70) return { type: 'SILVER', border: 'from-slate-300 via-slate-500 to-slate-700', bg: 'from-slate-800 via-slate-900 to-black', text: 'text-slate-300', glow: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]', foil: 'bg-gradient-to-tr from-slate-200/20 via-transparent to-white/20' };
        return { type: 'BRONZE', border: 'from-orange-400 via-orange-700 to-orange-900', bg: 'from-neutral-800 via-neutral-900 to-black', text: 'text-orange-400', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.2)]', foil: 'bg-gradient-to-tr from-orange-300/10 via-transparent to-white/10' };
    }, [stats.OVR]);

    const uniqueAchievements = [...new Set(achievements.filter(ach => ach.studentId === student.id).map(ach => ach.badgeId))].slice(0, 3);
    const logoUrl = systemConfig?.schoolLogo || "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";

    const handleDownload = async (e) => {
      e.stopPropagation();
      if (!cardRef.current || isDownloading) return;
      setIsDownloading(true);
      try {
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = `PlayerCard_${student.name}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert("下載卡片失敗，請重試。");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        
        <button onClick={onClose} className="absolute top-6 right-6 p-3 text-white/50 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all z-50">
            <X size={24}/>
        </button>

        <div className="relative w-full max-w-[360px] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          
          <div ref={cardRef} className={`w-full aspect-[2.5/3.5] rounded-3xl p-1.5 bg-gradient-to-br ${cardTheme.border} ${cardTheme.glow} relative isolate overflow-hidden`}>
            <div className={`w-full h-full rounded-[1.25rem] bg-gradient-to-b ${cardTheme.bg} flex flex-col relative overflow-hidden isolate`}>
                
                <div className={`absolute inset-0 ${cardTheme.foil} mix-blend-overlay opacity-80 pointer-events-none z-30`}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-color-dodge z-30 pointer-events-none"></div>

                {/* 頂部：OVR 與 Logo */}
                <div className="absolute top-4 left-4 z-20 flex flex-col items-center drop-shadow-md">
                    <span className="text-4xl font-black text-white leading-none tracking-tighter" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{stats.OVR}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${cardTheme.text} mt-0.5`}>{student.squashClass ? student.squashClass.substring(0,2) : 'SQ'}</span>
                    <div className="w-6 h-[2px] bg-white/30 my-1.5"></div>
                    <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain opacity-90" crossOrigin="anonymous"/>
                </div>

                {/* 👇 新增：戰績小文字 (放置在左側，OVR 面板的下方) 👇 */}
                <div className="absolute top-28 left-4 z-20 flex flex-col gap-1 drop-shadow-md border-l-2 border-white/20 pl-2">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[9px] font-bold text-white/60 tracking-wider">INT. WINS</span>
                        <span className={`text-xs font-black ${cardTheme.text}`}>{matchSummary.internalWins}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[9px] font-bold text-white/60 tracking-wider">EXT. WINS</span>
                        <span className={`text-xs font-black ${cardTheme.text}`}>{matchSummary.externalWins}</span>
                    </div>
                </div>

                {/* 選手照片區塊 */}
                <div className="absolute top-0 right-0 w-full h-[65%] flex items-end justify-center z-10">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10"></div>
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover object-top opacity-90" crossOrigin="anonymous"/>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                            <span className="text-9xl font-black text-white">{student.name[0]}</span>
                        </div>
                    )}
                </div>

                {/* 底部資料區塊 */}
                <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-black via-black/95 to-transparent z-20 flex flex-col justify-end p-5">
                    
                    <div className="text-center mb-3 border-b border-white/10 pb-3">
                        <h2 className="text-3xl font-black text-white uppercase tracking-wider transform -skew-x-6" style={{ textShadow: '2px 2px 0px rgba(0,0,0,1)' }}>
                            {student.name}
                        </h2>
                        {student.eng_name && <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${cardTheme.text} mt-1`}>{student.eng_name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 px-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.PAC}</span>
                            <span className="text-white/50 text-[10px] font-bold">PAC (步法)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.SHO}</span>
                            <span className="text-white/50 text-[10px] font-bold">SHO (火力)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.PAS}</span>
                            <span className="text-white/50 text-[10px] font-bold">PAS (技巧)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.PHY}</span>
                            <span className="text-white/50 text-[10px] font-bold">PHY (體能)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.DEF}</span>
                            <span className="text-white/50 text-[10px] font-bold">DEF (防守)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.MEN}</span>
                            <span className="text-white/50 text-[10px] font-bold">MEN (態度)</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                        <div className="flex gap-1.5">
                            {uniqueAchievements.length > 0 ? uniqueAchievements.map(badgeId => {
                                const badge = ACHIEVEMENT_DATA[badgeId];
                                return badge ? <div key={badgeId} className="text-white opacity-80 scale-75 transform origin-left">{badge.icon}</div> : null;
                            }) : <Star size={12} className="text-white/20"/>}
                        </div>
                        <div className={`text-[8px] font-black uppercase tracking-[0.2em] ${cardTheme.text} flex items-center gap-1`}>
                            {cardTheme.type} PLAYER
                        </div>
                    </div>

                </div>
            </div>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[-30px] pointer-events-none z-10" style={{ width: 'calc(100% + 5rem)' }}>
              <button onClick={(e) => { handlePrev(e); setIsDownloading(false); }} disabled={currentIndex <= 0} className="pointer-events-auto p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/30 disabled:opacity-30 transition-all"><ChevronRight className="rotate-180" size={28}/></button>
              <button onClick={(e) => { handleNext(e); setIsDownloading(false); }} disabled={currentIndex >= rankedStudents.length - 1} className="pointer-events-auto p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/30 disabled:opacity-30 transition-all"><ChevronRight size={28}/></button>
          </div>

          <button 
            onClick={handleDownload} disabled={isDownloading}
            className={`mt-10 flex items-center gap-3 px-12 py-4 rounded-full font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50 hover:scale-105 active:scale-95 ${cardTheme.type === 'GOLD' ? 'bg-yellow-500 text-yellow-950' : cardTheme.type === 'SILVER' ? 'bg-slate-300 text-slate-900' : 'bg-orange-600 text-white'}`}
          >
            {isDownloading ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>}
            {isDownloading ? 'MINTING CARD...' : '獲得實體卡片'}
          </button>
          
        </div>
      </div>
    );
};

export default PlayerCardModal;
