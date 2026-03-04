import React, { useRef, useState, useMemo } from 'react';
import { ChevronRight, Download, Loader2, Trophy as TrophyIcon, Crown } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- 輔助函數 (直接放進來讓組件獨立運作) ---
const getAcademicYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); 
    if (month >= 8) { 
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { 
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

const toDataURL = (url) => {
    return new Promise((resolve) => {
        if (!url || url.startsWith('data:image')) { resolve(url); return; }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (e) { console.error("Canvas toDataURL failed:", e); resolve(null); }
        };
        img.onerror = () => { console.error("Image toDataURL failed to load:", url); resolve(null); };
        img.src = url;
    });
};

const PlayerCardModal = ({ 
    student, 
    onClose, 
    rankedStudents, 
    setShowPlayerCard, 
    leagueMatches, 
    achievements, 
    systemConfig,
    BADGE_DATA,
    ACHIEVEMENT_DATA
}) => {
    const cardRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!student) return null;

    const currentIndex = rankedStudents.findIndex(s => s.id === student.id);
    const rank = currentIndex >= 0 ? currentIndex + 1 : '-';

    const handlePrev = (e) => {
      e.stopPropagation();
      if (currentIndex > 0) setShowPlayerCard(rankedStudents[currentIndex - 1]);
    };
    const handleNext = (e) => {
      e.stopPropagation();
      if (currentIndex < rankedStudents.length - 1) setShowPlayerCard(rankedStudents[currentIndex + 1]);
    };
    
    const { internalStats, externalStatsByYear } = useMemo(() => {
        const studentMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === student.id || m.player2Id === student.id));
        
        const internalMatches = studentMatches.filter(m => m.matchType !== 'external');
        const internalTotal = internalMatches.length;
        const internalWins = internalMatches.filter(m => m.winnerId === student.id).length;
        const internalWinRate = internalTotal > 0 ? Math.round((internalWins / internalTotal) * 100) : 0;
        let giantKillsCount = 0;
        internalMatches.filter(m => m.winnerId === student.id).forEach(match => {
            const opponentId = match.player1Id === student.id ? match.player2Id : match.player1Id;
            const opponentIndex = rankedStudents.findIndex(s => s.id === opponentId);
            if (opponentIndex >= 0 && (currentIndex - opponentIndex) >= 5) giantKillsCount++;
        });

        const externalMatches = studentMatches.filter(m => m.matchType === 'external' && m.player1Id === student.id);
        const statsByYear = externalMatches.reduce((acc, match) => {
            const year = getAcademicYear(match.date);
            if (!acc[year]) {
                acc[year] = { played: 0, wins: 0, losses: 0 };
            }
            acc[year].played += 1;
            if (match.winnerId === student.id) {
                acc[year].wins += 1;
            } else {
                acc[year].losses += 1;
            }
            return acc;
        }, {});

        return {
            internalStats: {
                winRate: internalWinRate,
                wins: internalWins,
                losses: internalTotal - internalWins,
                giantKills: giantKillsCount
            },
            externalStatsByYear: Object.entries(statsByYear).sort((a,b) => b[0].localeCompare(a[0]))
        };
    }, [leagueMatches, student, rankedStudents, currentIndex]);

    const studentAchievements = achievements.filter(ach => ach.studentId === student.id);
    const uniqueAchievements = [...new Set(studentAchievements.map(ach => ach.badgeId))];

    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;

    const handleDownload = async (e) => {
      e.stopPropagation();
      if (!cardRef.current || isDownloading) return;
      setIsDownloading(true);
      try {
        await Promise.all([toDataURL(student.photo_url), toDataURL(logoUrl)]);
        const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff'});
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `PlayerCard_${student.name}_${student.class}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("下載卡片失敗:", err);
        alert("下載卡片圖片失敗，請檢查網絡或圖片連結。");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="relative max-w-md w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <div ref={cardRef} className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-100 relative">
            <div className="bg-slate-50 border-b p-6 flex justify-between items-center relative">
              <img src={logoUrl} alt="Logo" className="object-contain w-12 h-12" crossOrigin="anonymous"/>
              <div className="text-center flex-1 z-10">
                <h3 className="font-black text-slate-800 tracking-widest text-sm">BCKLAS SQUASH TEAM</h3>
              </div>
              <TrophyIcon size={32} className="text-slate-200 absolute right-4 opacity-50" />
            </div>
            <div className="p-8 pb-4 flex flex-col items-center relative">
              <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center mb-4 relative z-10">
                 {student.photo_url ? (
                   <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                 ) : (
                   <span className="text-5xl font-black text-slate-300">{student.name[0]}</span>
                 )}
              </div>
              <button onClick={handlePrev} disabled={currentIndex <= 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all z-20"><ChevronRight className="rotate-180" size={24}/></button>
              <button onClick={handleNext} disabled={currentIndex >= rankedStudents.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all z-20"><ChevronRight size={24}/></button>
              <h2 className="text-2xl font-black text-slate-800">{student.name} {student.eng_name ? `(${student.eng_name})` : ''}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase mt-1">CLASS: {student.class} ({student.classNo})</p>
            </div>
            <div className="grid grid-cols-3 gap-2 px-6 py-4">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                 <p className="text-xl font-black text-blue-600">{student.totalPoints}</p>
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mt-1">Points</p>
               </div>
               <div className={`border rounded-xl p-3 text-center ${BADGE_DATA[student.badge]?.bg || 'bg-slate-50'} ${BADGE_DATA[student.badge]?.border || 'border-slate-200'}`}>
                 <p className="text-xl">{BADGE_DATA[student.badge]?.icon || '⚪'}</p>
                 <p className={`text-[9px] font-black uppercase tracking-wider mt-1 ${BADGE_DATA[student.badge]?.color || 'text-slate-400'}`}>{student.badge || '無'}</p>
               </div>
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                 <p className="text-xl font-black text-slate-700">#{rank}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">Rank (Team)</p>
               </div>
            </div>
            <div className="px-6 py-4 space-y-4">
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">內部聯賽表現 (Internal League)</h4>
                  <ul className="space-y-1.5 text-sm font-bold text-slate-600">
                    <li className="flex justify-between"><span>勝率 (Win Rate):</span> <span className="text-slate-800">{internalStats.winRate}% ({internalStats.wins}勝 {internalStats.losses}負)</span></li>
                    <li className="flex justify-between"><span>巨人殺手 (Giant Kills):</span> <span className="text-slate-800">{internalStats.giantKills} 次</span></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">代表學校出賽 (School Team)</h4>
                  {externalStatsByYear.length > 0 ? (
                    <ul className="space-y-1.5 text-sm font-bold text-slate-600">
                      {externalStatsByYear.map(([year, stats]) => (
                        <li key={year} className="flex justify-between">
                          <span>{year} 學年:</span> 
                          <span className="text-slate-800">{stats.played}場 {stats.wins}勝 {stats.losses}負 ({Math.round(stats.wins/stats.played * 100)}%)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">暫無校外賽記錄</p>
                  )}
               </div>
            </div>
            <div className="px-8 pb-8 pt-2">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Achievements</h4>
               <div className="flex flex-wrap gap-2">
                 {uniqueAchievements.length > 0 ? uniqueAchievements.map(badgeId => {
                     const badge = ACHIEVEMENT_DATA[badgeId];
                     if (!badge) return null;
                     return (
                         <div key={badgeId} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm border" title={badge.name}>
                             {badge.icon}
                         </div>
                     );
                 }) : <p className="text-xs text-slate-300">尚未獲得徽章</p>}
               </div>
            </div>
            <div className="bg-slate-800 text-slate-400 text-center py-2 text-[8px] font-black tracking-widest uppercase">
              Generated by BCKLAS Squash System
            </div>
          </div>
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="mt-6 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full font-black shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
            {isDownloading ? '生成中...' : '下載卡片 (PNG)'}
          </button>
          <button onClick={onClose} className="mt-4 text-white/50 hover:text-white text-sm font-bold transition-all">關閉 (Close)</button>
        </div>
      </div>
    );
};

export default PlayerCardModal;
