// src/components/LiveScoreboardDisplay.jsx (Version 4.2 - Fullscreen & Animated)

import React, { useEffect, useState } from 'react';

// --- 新增：帶有跳動特效的數字元件 ---
const AnimatedNumber = ({ value }) => {
    const [animate, setAnimate] = useState(false);

    // 監聽 value 的變化，一變就觸發動畫
    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300); // 300ms 後移除動畫 class
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <span className={`inline-block transition-transform duration-300 transform-gpu ${animate ? 'scale-125 -translate-y-4 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]' : ''}`}>
            {value}
        </span>
    );
};

export default function LiveScoreboardDisplay({ liveMatches, TrophyIcon, rankedStudents = [] }) {
    if (!liveMatches || !Array.isArray(liveMatches)) return null;

    const activeMatches = liveMatches.filter(m => m.status === 'live');
    if (activeMatches.length === 0) return null;

    const getStudentInfoByName = (playerName) => {
        if (!playerName) return null;
        const studentIndex = rankedStudents.findIndex(s => playerName.includes(s.name));
        if (studentIndex === -1) return null;
        const student = rankedStudents[studentIndex];
        return { ...student, rank: studentIndex + 1, ovr: student.totalPoints || student.points || 0 };
    };

    const MiniPlayerCard = ({ playerInfo, defaultName, colorTheme }) => {
        const theme = colorTheme === 'blue' 
            ? { bg: 'from-blue-900 to-indigo-900', border: 'border-blue-500', text: 'text-blue-300' }
            : { bg: 'from-rose-900 to-pink-900', border: 'border-rose-500', text: 'text-rose-300' };

        return (
            <div className={`w-48 md:w-64 bg-gradient-to-b ${theme.bg} rounded-3xl p-4 border-2 ${theme.border} shadow-2xl flex flex-col items-center relative overflow-hidden isolate mb-6`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                {playerInfo && (
                    <div className="w-full flex justify-between px-2 mb-3 z-10">
                        <span className={`text-xs font-black ${theme.text} uppercase tracking-widest`}>OVR {playerInfo.ovr}</span>
                        <span className={`text-xs font-black text-white bg-black/40 px-2.5 py-0.5 rounded-full`}>#{playerInfo.rank}</span>
                    </div>
                )}
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 ${theme.border} bg-slate-800 shadow-inner flex items-center justify-center overflow-hidden z-10 mb-4`}>
                    {playerInfo?.photo_url ? (
                        <img src={playerInfo.photo_url} alt={defaultName} className="w-full h-full object-cover object-top" crossOrigin="anonymous"/>
                    ) : (
                        <span className="text-5xl font-black text-slate-500">{defaultName.charAt(0)}</span>
                    )}
                </div>
                <div className="text-center w-full z-10">
                    <h4 className="text-xl md:text-3xl font-black text-white truncate drop-shadow-md">{defaultName}</h4>
                    <p className={`text-xs font-bold ${theme.text} mt-1 truncate`}>
                        {playerInfo ? `Class ${playerInfo.class} • ${playerInfo.badge || '無章'}` : 'Guest Player'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        // 👇 修正：移除 maxWidth 限制，改用 w-screen 並且把背景填滿整個畫面 👇
        <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col pt-8 pb-12 px-6 md:px-12 animate-in fade-in zoom-in-95 duration-700 overflow-y-auto w-screen h-screen">
            
            <div className="flex justify-center mb-8 shrink-0">
                <h3 className="text-2xl md:text-3xl font-black text-slate-200 flex items-center gap-4 bg-gray-900 border border-gray-800 px-8 py-3 rounded-full shadow-2xl tracking-widest">
                    <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                    </span>
                    LIVE ARENA BROADCAST
                </h3>
            </div>
            
            <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col justify-center">
                {activeMatches.map(match => {
                    const isFinished = match.matchWinner !== null;
                    const gamesNeeded = match.bestOf === 3 ? 2 : 3;
                    const maxScore = match.format || 11;
                    
                    const p1MatchPoint = (match.games1 === gamesNeeded - 1) && (match.score1 >= maxScore - 1) && (match.score1 > match.score2);
                    const p2MatchPoint = (match.games2 === gamesNeeded - 1) && (match.score2 >= maxScore - 1) && (match.score2 > match.score1);
                    const isMatchPoint = !isFinished && (p1MatchPoint || p2MatchPoint);

                    const p1Name = match.player1Name || match.player1 || "Player 1";
                    const p2Name = match.player2Name || match.player2 || "Player 2";
                    const p1Info = getStudentInfoByName(p1Name);
                    const p2Info = getStudentInfoByName(p2Name);

                    return (
                    // 👇 修正：加大卡片，讓它充滿剩餘空間 👇
                    <div key={match.id} className={`w-full bg-gray-900 rounded-[3rem] p-8 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-700
                        ${isFinished ? 'border-yellow-500 scale-[1.01]' : 
                          isMatchPoint ? 'border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.4)] animate-[pulse_1.5s_ease-in-out_infinite]' : 
                          'border-slate-800'}
                    `}>
                        
                        {isMatchPoint && (
                            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-black tracking-[0.8em] text-lg md:text-2xl uppercase z-30 shadow-2xl">
                                ⚠️ MATCH POINT ⚠️
                            </div>
                        )}

                        <div className={`absolute top-8 left-8 text-xs font-black px-4 py-2 rounded-xl border tracking-widest z-20 ${isMatchPoint ? 'bg-red-950/80 text-red-400 border-red-800 mt-8' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
                            {match.format} 分制 / {match.bestOf} 局勝
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center text-white relative z-10 w-full max-w-6xl mx-auto">
                            
                            {/* ================= 左側：Player 1 ================= */}
                            <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-20 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={80} fill="currentColor"/></div>}
                                
                                <MiniPlayerCard playerInfo={p1Info} defaultName={p1Name} colorTheme="blue" />
                                
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-3xl font-black px-5 py-2.5 rounded-xl border-2 ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {/* 局數動畫 */}
                                            <AnimatedNumber value={match.games1} />
                                        </span>
                                    </div>
                                    
                                    <div className={`text-9xl md:text-[200px] leading-none font-mono font-black transition-all transform-gpu inline-block min-w-[150px] text-center
                                        ${match.server === 1 && !isFinished ? 'text-white drop-shadow-[0_10px_30px_rgba(59,130,246,0.6)] scale-110 -translate-y-4' : 'text-slate-500'}
                                    `}>
                                        {/* 👇 加入分數彈跳動畫 👇 */}
                                        <AnimatedNumber value={match.score1} />
                                    </div>
                                </div>
                                {match.server === 1 && !isFinished && (
                                    <div className="mt-8 inline-flex items-center gap-3 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-6 py-2.5 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                        <div className="w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                                        <span className="text-sm font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* ================= 中央：VS ================= */}
                            <div className="flex flex-row md:flex-col items-center justify-center my-10 md:my-0 md:mx-16 relative shrink-0 w-full md:w-auto">
                                <div className="hidden md:block w-1 h-64 bg-gradient-to-b from-transparent via-slate-700 to-transparent rounded-full"></div>
                                <div className="md:hidden h-1 w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-950 text-slate-500 text-xl font-black px-5 py-4 rounded-3xl border-4 border-slate-800 shadow-2xl italic tracking-widest">
                                    VS
                                </div>
                            </div>

                            {/* ================= 右側：Player 2 ================= */}
                            <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-20 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={80} fill="currentColor"/></div>}
                                
                                <MiniPlayerCard playerInfo={p2Info} defaultName={p2Name} colorTheme="rose" />
                                
                                <div className="flex items-center gap-6 mt-4 flex-row-reverse">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-3xl font-black px-5 py-2.5 rounded-xl border-2 ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {/* 局數動畫 */}
                                            <AnimatedNumber value={match.games2} />
                                        </span>
                                    </div>
                                    
                                    <div className={`text-9xl md:text-[200px] leading-none font-mono font-black transition-all transform-gpu inline-block min-w-[150px] text-center
                                        ${match.server === 2 && !isFinished ? 'text-white drop-shadow-[0_10px_30px_rgba(244,63,94,0.6)] scale-110 -translate-y-4' : 'text-slate-500'}
                                    `}>
                                        {/* 👇 加入分數彈跳動畫 👇 */}
                                        <AnimatedNumber value={match.score2} />
                                    </div>
                                </div>
                                {match.server === 2 && !isFinished && (
                                    <div className="mt-8 inline-flex items-center gap-3 bg-rose-500/20 border border-rose-500/50 text-rose-300 px-6 py-2.5 rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                                        <div className="w-4 h-4 rounded-full bg-rose-400 shadow-[0_0_15px_rgba(251,113,133,1)]"></div>
                                        <span className="text-sm font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
}
