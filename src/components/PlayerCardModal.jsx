// src/components/PlayerCardModal.jsx (Version 4.0 - Premium Design)

import React, { useRef, useState, useMemo } from 'react';
// 👇 確保這裡有 Crown 👇
import { ChevronRight, Download, Loader2, Trophy as TrophyIcon, Zap, Target, Crown } from 'lucide-react';
import { toPng } from 'html-to-image';

// 輔助函數 (保持不變)
const getAcademicYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); 
    if (month >= 8) return `${year}-${(year + 1).toString().slice(-2)}`;
    return `${year - 1}-${year.toString().slice(-2)}`;
};

export default function PlayerCardModal({ 
    student, onClose, rankedStudents, setShowPlayerCard, 
    leagueMatches, achievements, systemConfig, BADGE_DATA, ACHIEVEMENT_DATA
}) {
    const cardRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!student) return null;

    const currentIndex = rankedStudents.findIndex(s => s.id === student.id);
    const rank = currentIndex >= 0 ? currentIndex + 1 : '-';

    const handlePrev = (e) => { e.stopPropagation(); if (currentIndex > 0) setShowPlayerCard(rankedStudents[currentIndex - 1]); };
    const handleNext = (e) => { e.stopPropagation(); if (currentIndex < rankedStudents.length - 1) setShowPlayerCard(rankedStudents[currentIndex + 1]); };
    
    // 數據計算 (保持不變)
    const { internalStats, externalStatsByYear } = useMemo(() => {
        const studentMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === student.id || m.player2Id === student.id));
        const internalMatches = studentMatches.filter(m => m.matchType !== 'external');
        const internalWins = internalMatches.filter(m => m.winnerId === student.id).length;
        const internalWinRate = internalMatches.length > 0 ? Math.round((internalWins / internalMatches.length) * 100) : 0;
        
        let giantKillsCount = 0;
        internalMatches.filter(m => m.winnerId === student.id).forEach(match => {
            const opponentId = match.player1Id === student.id ? match.player2Id : match.player1Id;
            const opponentIndex = rankedStudents.findIndex(s => s.id === opponentId);
            if (opponentIndex >= 0 && (currentIndex - opponentIndex) >= 5) giantKillsCount++;
        });

        const statsByYear = studentMatches.filter(m => m.matchType === 'external' && m.player1Id === student.id).reduce((acc, match) => {
            const year = getAcademicYear(match.date);
            if (!acc[year]) acc[year] = { played: 0, wins: 0, losses: 0 };
            acc[year].played += 1;
            if (match.winnerId === student.id) acc[year].wins += 1;
            else acc[year].losses += 1;
            return acc;
        }, {});

        return {
            internalStats: { winRate: internalWinRate, wins: internalWins, losses: internalMatches.length - internalWins, giantKills: giantKillsCount },
            externalStatsByYear: Object.entries(statsByYear).sort((a,b) => b[0].localeCompare(a[0]))
        };
    }, [leagueMatches, student, rankedStudents, currentIndex]);

    const uniqueAchievements = [...new Set(achievements.filter(ach => ach.studentId === student.id).map(ach => ach.badgeId))];
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
      <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="relative w-full max-w-md flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          
          {/* 👇 全新設計的卡片本體 👇 */}
          <div ref={cardRef} className="w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative isolate" style={{ backgroundColor: '#ffffff' }}>
            
            {/* 裝飾性背景 (利用 style 避免 html-to-image 報錯) */}
            <div style={{ position: 'absolute', top: '-10%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>

            {/* Header: Logo 與標籤 */}
            <div className="p-6 pb-0 flex justify-between items-start">
                <img src={logoUrl} alt="Logo" className="object-contain h-14 w-14 drop-shadow-md" crossOrigin="anonymous"/>
                <div style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '6px 16px', borderRadius: '9999px', fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    Official Player
                </div>
            </div>

            {/* Profile: 頭像與姓名 */}
            <div className="px-8 pt-4 pb-6 flex flex-col items-center relative">
              <div style={{ width: '140px', height: '140px', borderRadius: '50%', padding: '6px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', marginBottom: '16px', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                    ) : (
                        <span className="text-6xl font-black text-slate-300">{student.name[0]}</span>
                    )}
                  </div>
                  {/* 小皇冠裝飾 */}
                  {rank <= 3 && <div style={{ position: 'absolute', top: '-10px', right: '10px', color: '#fbbf24', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}><Crown size={32} fill="currentColor"/></div>}
              </div>
              
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{student.name}</h2>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Class {student.class} • No.{student.classNo}</p>
            </div>

            {/* Core Stats: 三大數據方塊 */}
            <div className="grid grid-cols-3 gap-3 px-6 mb-6">
               <div style={{ backgroundColor: '#eff6ff', borderRadius: '20px', padding: '16px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
                 <p style={{ fontSize: '28px', fontWeight: '900', color: '#1d4ed8', lineHeight: '1' }}>{student.totalPoints}</p>
                 <p style={{ fontSize: '10px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Points</p>
               </div>
               <div style={{ backgroundColor: '#fffbeb', borderRadius: '20px', padding: '16px 8px', textAlign: 'center', border: '1px solid #fef3c7', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{ fontSize: '24px', lineHeight: '1' }}>{BADGE_DATA[student.badge]?.icon || '⚪'}</div>
                 <p style={{ fontSize: '10px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px' }}>{student.badge || '無章'}</p>
               </div>
               <div style={{ backgroundColor: '#f8fafc', borderRadius: '20px', padding: '16px 8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                 <p style={{ fontSize: '28px', fontWeight: '900', color: '#334155', lineHeight: '1' }}>#{rank}</p>
                 <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Rank</p>
               </div>
            </div>

            {/* Performance Details */}
            <div className="px-8 py-6" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Zap size={16} color="#3b82f6" />
                        <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>校內聯賽 (Internal)</h4>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>勝率 {internalStats.winRate}%</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{internalStats.wins}W - {internalStats.losses}L</span>
                    </div>
                </div>
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Target size={16} color="#10b981" />
                        <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>代表隊出賽 (External)</h4>
                    </div>
                    {externalStatsByYear.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {externalStatsByYear.slice(0, 2).map(([year, stats]) => (
                                <div key={year} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '10px 16px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>{year}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>{Math.round(stats.wins/stats.played * 100)}% Win</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700', fontStyle: 'italic', margin: 0 }}>目前尚無校外賽記錄</p>
                    )}
                </div>
            </div>

            {/* Achievements Footer */}
            <div className="p-8">
                <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', textAlign: 'center' }}>Honor & Badges</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                    {uniqueAchievements.length > 0 ? uniqueAchievements.slice(0, 6).map(badgeId => {
                        const badge = ACHIEVEMENT_DATA[badgeId];
                        if (!badge) return null;
                        return (
                            <div key={badgeId} style={{ width: '44px', height: '44px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {React.cloneElement(badge.icon, { size: 24 })}
                            </div>
                        );
                    }) : <p style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '700' }}>持續努力中...</p>}
                </div>
            </div>

          </div>

          {/* 外部控制按鈕 */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[-20px] pointer-events-none" style={{ width: 'calc(100% + 4rem)' }}>
              <button onClick={handlePrev} disabled={currentIndex <= 0} className="pointer-events-auto p-4 bg-white/10 backdrop-blur-md rounded-full shadow-lg text-white hover:bg-white/30 disabled:opacity-30 transition-all"><ChevronRight className="rotate-180" size={28}/></button>
              <button onClick={handleNext} disabled={currentIndex >= rankedStudents.length - 1} className="pointer-events-auto p-4 bg-white/10 backdrop-blur-md rounded-full shadow-lg text-white hover:bg-white/30 disabled:opacity-30 transition-all"><ChevronRight size={28}/></button>
          </div>

          <button 
            onClick={handleDownload} disabled={isDownloading}
            className="mt-8 flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={20}/> : <Download size={20}/>}
            {isDownloading ? '卡片生成中...' : '儲存球員專屬卡'}
          </button>
          <button onClick={onClose} className="mt-6 text-white/60 hover:text-white font-bold transition-all uppercase tracking-widest text-sm">Close / 關閉</button>
        </div>
      </div>
    );
};
