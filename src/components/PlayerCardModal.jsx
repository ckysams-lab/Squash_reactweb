// src/components/PlayerCardModal.jsx (Version 5.4 - Final Data Sync Fix)

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
    // 1. 真實數據計算與底分調整
    // -------------------------------------------------------------
    const { stats, matchSummary, internalStats, externalStatsByYear } = useMemo(() => {
        
        // --- 比賽數據 (勝率與戰績) ---
        const studentMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === student.id || m.player2Id === student.id));
        const internalMatches = studentMatches.filter(m => m.matchType !== 'external');
        const externalMatches = studentMatches.filter(m => m.matchType === 'external' && m.player1Id === student.id);

        const internalWins = internalMatches.filter(m => m.winnerId === student.id).length;
        const externalWins = externalMatches.filter(m => m.winnerId === student.id).length;
        const internalWinRate = internalMatches.length > 0 ? Math.round((internalWins / internalMatches.length) * 100) : 0;
        
        let giantKillsCount = 0;
        internalMatches.filter(m => m.winnerId === student.id).forEach(match => {
            const opponentId = match.player1Id === student.id ? match.player2Id : match.player1Id;
            const opponentIndex = rankedStudents.findIndex(s => s.id === opponentId);
            if (opponentIndex >= 0 && (currentIndex - opponentIndex) >= 5) giantKillsCount++;
        });

        const statsByYear = externalMatches.reduce((acc, match) => {
            const year = getAcademicYear(match.date);
            if (!acc[year]) acc[year] = { played: 0, wins: 0, losses: 0 };
            acc[year].played += 1;
            if (match.winnerId === student.id) acc[year].wins += 1;
            else acc[year].losses += 1;
            return acc;
        }, {});


        // 👇 --- 核心修復：精準抓取最新體測紀錄 --- 👇
        const studentAssessments = (assessments || []).filter(a => a.studentId === student.id);
        
        let latestAssessment = null;
        if (studentAssessments.length > 0) {
            // 使用 reduce 來找出時間戳記 (timestamp) 最大的一筆，保證是最新
            latestAssessment = studentAssessments.reduce((latest, current) => {
                const timeLatest = latest.timestamp?.seconds || new Date(latest.date).getTime() / 1000;
                const timeCurrent = current.timestamp?.seconds || new Date(current.date).getTime() / 1000;
                return (timeCurrent > timeLatest) ? current : latest;
            });
        }
        // 👆 --------------------------------------- 👆


        let PAC = 50, FH = 50, BH = 50, EDR = 50, FLE = 50;

        if (latestAssessment) {
            // 1. PAC (速度): 14趟=50分, 22趟=99分
            if (latestAssessment.shuttleRun) {
                const val = Number(latestAssessment.shuttleRun);
                if (val <= 14) PAC = Math.max(0, Math.floor(val * (50/14))); 
                else PAC = Math.min(99, Math.floor((6.125 * val) - 35.75));
            }

            // 2. FH (正手): fhDrive(滿分40) + fhVolley(滿分60)
            if (latestAssessment.fhDrive !== undefined && latestAssessment.fhVolley !== undefined) {
                let dScore = Number(latestAssessment.fhDrive) <= 10 ? (Number(latestAssessment.fhDrive)/10)*40 : Number(latestAssessment.fhDrive);
                let vScore = Number(latestAssessment.fhVolley) <= 10 ? (Number(latestAssessment.fhVolley)/10)*60 : Number(latestAssessment.fhVolley);
                FH = Math.min(99, Math.max(50, Math.floor(dScore + vScore))); 
            }

            // 3. BH (反手): bhDrive(滿分40) + bhVolley(滿分60)
            if (latestAssessment.bhDrive !== undefined && latestAssessment.bhVolley !== undefined) {
                let dScore = Number(latestAssessment.bhDrive) <= 10 ? (Number(latestAssessment.bhDrive)/10)*40 : Number(latestAssessment.bhDrive);
                let vScore = Number(latestAssessment.bhVolley) <= 10 ? (Number(latestAssessment.bhVolley)/10)*60 : Number(latestAssessment.bhVolley);
                BH = Math.min(99, Math.max(50, Math.floor(dScore + vScore)));
            }

            // 4. EDR (耐力): 滿分 1800 米 (假設 900米=50分)
            if (latestAssessment.enduranceRun) {
                const val = Number(latestAssessment.enduranceRun);
                if (val <= 900) EDR = Math.max(0, Math.floor(val * (50/900)));
                else EDR = Math.min(99, Math.floor(50 + ((val - 900) / 900) * 49));
            }

            // 5. FLE (柔軟度): 滿分 30 cm (假設 15cm=50分)
            if (latestAssessment.flexibility) {
                const val = Number(latestAssessment.flexibility);
                if (val <= 15) FLE = Math.max(0, Math.floor(val * (50/15)));
                else FLE = Math.min(99, Math.floor(50 + ((val - 15) / 15) * 49));
            }
        }

        // 6. PER (Performance 表現): 總積分轉換 (100分=50, 500分=99)
        let PER = 50; 
        const pts = student.totalPoints || student.points || 0;
        if (pts <= 100) {
            PER = Math.max(0, Math.floor(pts * (50/100)));
        } else {
            PER = Math.min(99, Math.floor(50 + ((pts - 100) / 400) * 49));
        }

        // OVR (Overall Rating) 總評 = 六項平均
        const OVR = Math.floor((PAC + FH + BH + EDR + FLE + PER) / 6);

        return { 
            stats: { PAC, FH, BH, EDR, FLE, PER, OVR },
            matchSummary: { internalWins, externalWins },
            internalStats: { winRate: internalWinRate, wins: internalWins, losses: internalMatches.length - internalWins, giantKills: giantKillsCount },
            externalStatsByYear: Object.entries(statsByYear).sort((a,b) => b[0].localeCompare(a[0]))
        };
    }, [
        student.id, 
        student.totalPoints, 
        leagueMatches?.length, 
        // 👇 --- 這裡也改為監聽長度，確保只要有新增就會觸發更新 --- 👇
        assessments?.filter(a => a.studentId === student.id).length, 
        attendanceLogs?.length
    ]);

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
        const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3, backgroundColor: '#ffffff' });
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
          
          <div ref={cardRef} className={`w-full aspect-[2.5/3.5] rounded-3xl p-1.5 bg-gradient-to-br ${cardTheme.border} ${cardTheme.glow} relative isolate overflow-hidden`} style={{ backgroundColor: '#ffffff' }}>
            <div className={`w-full h-full rounded-[1.25rem] bg-gradient-to-b ${cardTheme.bg} flex flex-col relative overflow-hidden isolate`}>
                
                <div className={`absolute inset-0 ${cardTheme.foil} mix-blend-overlay opacity-80 pointer-events-none z-30`}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-color-dodge z-30 pointer-events-none"></div>

                <div className="absolute top-4 left-4 z-20 flex flex-col items-center drop-shadow-md">
                    <span className="text-4xl font-black text-white leading-none tracking-tighter" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{stats.OVR}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${cardTheme.text} mt-0.5`}>{student.squashClass ? student.squashClass.substring(0,2) : 'SQ'}</span>
                    <div className="w-6 h-[2px] bg-white/30 my-1.5"></div>
                    <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain opacity-90" crossOrigin="anonymous"/>
                </div>

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
                            <span className="text-white font-bold">{stats.FH}</span>
                            <span className="text-white/50 text-[10px] font-bold">FH (正手)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.BH}</span>
                            <span className="text-white/50 text-[10px] font-bold">BH (反手)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.EDR}</span>
                            <span className="text-white/50 text-[10px] font-bold">EDR (耐力)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.PER}</span>
                            <span className="text-white/50 text-[10px] font-bold">PER (表現)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-bold">{stats.FLE}</span>
                            <span className="text-white/50 text-[10px] font-bold">FLE (柔軟)</span>
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
