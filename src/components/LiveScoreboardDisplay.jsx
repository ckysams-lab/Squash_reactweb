// src/components/LiveScoreboardDisplay.jsx (Version 4.0 - Arena Mode)

import React from 'react';

export default function LiveScoreboardDisplay({ liveMatches, TrophyIcon, rankedStudents = [] }) {
    if (!liveMatches || !Array.isArray(liveMatches)) return null;

    const activeMatches = liveMatches.filter(m => m.status === 'live');
    if (activeMatches.length === 0) return null;

    // 輔助函數：透過球員 ID 去找他的排名和 OVR
    const getPlayerInfo = (playerId) => {
        if (!playerId) return null;
        const index = rankedStudents.findIndex(s => s.id === playerId);
        if (index === -1) return null;
        
        const student = rankedStudents[index];
        // 為了簡單起見，我們這裡的 OVR 直接用他的 totalPoints 來代表 (或者你也可以把之前算 OVR 的邏輯搬過來)
        const ovr = student.totalPoints || 0;
        return { rank: index + 1, ovr: ovr, class: student.class };
    };

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                </span>
                LIVE ARENA BROADCAST
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {activeMatches.map(match => {
                    const isFinished = match.matchWinner !== null;
                    const gamesNeeded = match.bestOf === 3 ? 2 : 3;
                    const maxScore = match.format || 11; // 假設預設是 11 分制
                    
                    // 🚨 賽末點判定：任一方距離獲勝只差 1 分，且局數也聽牌 🚨
                    const p1MatchPoint = (match.games1 === gamesNeeded - 1) && (match.score1 >= maxScore - 1) && (match.score1 > match.score2);
                    const p2MatchPoint = (match.games2 === gamesNeeded - 1) && (match.score2 >= maxScore - 1) && (match.score2 > match.score1);
                    const isMatchPoint = !isFinished && (p1MatchPoint || p2MatchPoint);

                    const p1Info = getPlayerInfo(match.player1Id);
                    const p2Info = getPlayerInfo(match.player2Id);

                    return (
                    <div key={match.id} className={`bg-gray-900 rounded-[3rem] p-8 shadow-2xl border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-700
                        ${isFinished ? 'border-yellow-500 scale-[1.02]' : 
                          isMatchPoint ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-[pulse_1.5s_ease-in-out_infinite]' : 
                          'border-slate-800'}
                    `}>
                        
                        {/* 賽末點特效橫幅 */}
                        {isMatchPoint && (
                            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-1.5 font-black tracking-[0.5em] text-sm uppercase z-30 shadow-md">
                                ⚠️ MATCH POINT ⚠️
                            </div>
                        )}

                        {/* 頂部賽制標籤 */}
                        <div className={`absolute top-6 left-6 text-[10px] font-black px-3 py-1.5 rounded-lg border tracking-widest z-20 ${isMatchPoint ? 'bg-red-950/80 text-red-400 border-red-800' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
                            {match.format} 分制 / {match.bestOf} 局勝
                        </div>

                        {/* 完賽特效背景 */}
                        {isFinished && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
                                <div className="w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-gray-900/0 to-transparent animate-spin-slow"></div>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-white relative z-10 mt-6">
                            
                            {/* ================= 左側：Player 1 ================= */}
                            <div className="flex-1 text-center relative group">
                                {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg"><TrophyIcon size={48} fill="currentColor"/></div>}
                                
                                {/* 選手數據小標籤 */}
                                {p1Info && (
                                    <div className="flex justify-center gap-2 mb-3">
                                        <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">RANK #{p1Info.rank}</span>
                                        <span className="bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">PTS {p1Info.ovr}</span>
                                    </div>
                                )}

                                <h4 className={`text-3xl md:text-5xl font-black truncate px-2 mb-6 ${match.matchWinner === 1 ? 'text-yellow-400 drop-shadow-md' : 'text-slate-100'}`}>
                                    {match.player1Name}
                                </h4>
                                
                                <div className="flex justify-center items-end gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-2xl font-black px-4 py-2 rounded-xl border-2 ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {match.games1}
                                        </span>
                                    </div>
                                    {/* 3D 擬態分數 */}
                                    <span className={`text-8xl md:text-[140px] leading-none font-mono font-black transition-all transform-gpu inline-block
                                        ${match.server === 1 && !isFinished ? 'text-white drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)] scale-110 -translate-y-2' : 'text-slate-400'}
                                    `}>
                                        {match.score1}
                                    </span>
                                </div>

                                <div className="h-10 mt-8 flex justify-center">
                                    {match.server === 1 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-5 py-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"></div>
                                            <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* ================= 中央：VS ================= */}
                            <div className="flex flex-col items-center justify-center mx-6 relative shrink-0">
                                <div className="w-px h-40 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-slate-500 text-sm font-black px-3 py-2 rounded-xl border-2 border-slate-700 shadow-xl italic">
                                    VS
                                </div>
                            </div>

                            {/* ================= 右側：Player 2 ================= */}
                            <div className="flex-1 text-center relative group">
                                {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg"><TrophyIcon size={48} fill="currentColor"/></div>}
                                
                                {/* 選手數據小標籤 */}
                                {p2Info && (
                                    <div className="flex justify-center gap-2 mb-3">
                                        <span className="bg-rose-900/50 border border-rose-700 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">RANK #{p2Info.rank}</span>
                                        <span className="bg-pink-900/50 border border-pink-700 text-pink-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">PTS {p2Info.ovr}</span>
                                    </div>
                                )}

                                <h4 className={`text-3xl md:text-5xl font-black truncate px-2 mb-6 ${match.matchWinner === 2 ? 'text-yellow-400 drop-shadow-md' : 'text-slate-100'}`}>
                                    {match.player2Name}
                                </h4>
                                
                                <div className="flex justify-center items-end gap-4 flex-row-reverse">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-2xl font-black px-4 py-2 rounded-xl border-2 ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {match.games2}
                                        </span>
                                    </div>
                                    {/* 3D 擬態分數 */}
                                    <span className={`text-8xl md:text-[140px] leading-none font-mono font-black transition-all transform-gpu inline-block
                                        ${match.server === 2 && !isFinished ? 'text-white drop-shadow-[0_10px_20px_rgba(244,63,94,0.6)] scale-110 -translate-y-2' : 'text-slate-400'}
                                    `}>
                                        {match.score2}
                                    </span>
                                </div>

                                <div className="h-10 mt-8 flex justify-center">
                                    {match.server === 2 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/50 text-rose-300 px-5 py-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                                            <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,1)]"></div>
                                            <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
}
