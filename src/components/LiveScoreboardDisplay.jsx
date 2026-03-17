// src/components/LiveScoreboardDisplay.jsx (Version 4.1 - Ultimate Arena Mode with Mini Cards)

import React from 'react';

export default function LiveScoreboardDisplay({ liveMatches, TrophyIcon, rankedStudents = [] }) {
    if (!liveMatches || !Array.isArray(liveMatches)) return null;

    const activeMatches = liveMatches.filter(m => m.status === 'live');
    if (activeMatches.length === 0) return null;

    // 輔助函數：透過「名字」去反查學生的完整資料 (這是最安全的做法，因為名字一定有)
    const getStudentInfoByName = (playerName) => {
        if (!playerName) return null;
        // 尋找名字完全符合的學生，或是名字包含在裡面的 (例如 "紅隊 - 陳小明" 包含 "陳小明")
        const studentIndex = rankedStudents.findIndex(s => playerName.includes(s.name));
        if (studentIndex === -1) return null;
        
        const student = rankedStudents[studentIndex];
        return { 
            ...student, 
            rank: studentIndex + 1, 
            ovr: student.totalPoints || student.points || 0 
        };
    };

    // --- 迷你球星卡組件 ---
    const MiniPlayerCard = ({ playerInfo, defaultName, colorTheme }) => {
        const theme = colorTheme === 'blue' 
            ? { bg: 'from-blue-900 to-indigo-900', border: 'border-blue-500', text: 'text-blue-300' }
            : { bg: 'from-rose-900 to-pink-900', border: 'border-rose-500', text: 'text-rose-300' };

        return (
            <div className={`w-40 md:w-56 bg-gradient-to-b ${theme.bg} rounded-3xl p-3 border-2 ${theme.border} shadow-xl flex flex-col items-center relative overflow-hidden isolate`}>
                {/* 裝飾背光 */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                
                {/* 排名與 OVR */}
                {playerInfo && (
                    <div className="w-full flex justify-between px-2 mb-2 z-10">
                        <span className={`text-[10px] md:text-xs font-black ${theme.text} uppercase tracking-widest`}>OVR {playerInfo.ovr}</span>
                        <span className={`text-[10px] md:text-xs font-black text-white bg-black/40 px-2 rounded-full`}>#{playerInfo.rank}</span>
                    </div>
                )}

                {/* 頭像 */}
                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl border-4 ${theme.border} bg-slate-800 shadow-inner flex items-center justify-center overflow-hidden z-10 mb-3`}>
                    {playerInfo?.photo_url ? (
                        <img src={playerInfo.photo_url} alt={defaultName} className="w-full h-full object-cover object-top" crossOrigin="anonymous"/>
                    ) : (
                        <span className="text-4xl font-black text-slate-500">{defaultName.charAt(0)}</span>
                    )}
                </div>

                {/* 姓名與徽章 */}
                <div className="text-center w-full z-10">
                    <h4 className="text-lg md:text-2xl font-black text-white truncate drop-shadow-md">{defaultName}</h4>
                    <p className={`text-[10px] md:text-xs font-bold ${theme.text} mt-0.5 truncate`}>
                        {playerInfo ? `Class ${playerInfo.class} • ${playerInfo.badge || '無章'}` : 'Guest Player'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700 w-full">
            <div className="flex justify-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-slate-200">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    LIVE ARENA BROADCAST
                </h3>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                {activeMatches.map(match => {
                    const isFinished = match.matchWinner !== null;
                    const gamesNeeded = match.bestOf === 3 ? 2 : 3;
                    const maxScore = match.format || 11;
                    
                    const p1MatchPoint = (match.games1 === gamesNeeded - 1) && (match.score1 >= maxScore - 1) && (match.score1 > match.score2);
                    const p2MatchPoint = (match.games2 === gamesNeeded - 1) && (match.score2 >= maxScore - 1) && (match.score2 > match.score1);
                    const isMatchPoint = !isFinished && (p1MatchPoint || p2MatchPoint);

                    // 👇 終極防呆：不管是用 player1Name 還是 player1 存的，我們都抓得到
                    const p1Name = match.player1Name || match.player1 || "Player 1";
                    const p2Name = match.player2Name || match.player2 || "Player 2";

                    // 透過名字去反查球員資料
                    const p1Info = getStudentInfoByName(p1Name);
                    const p2Info = getStudentInfoByName(p2Name);

                    return (
                    <div key={match.id} className={`bg-gray-900 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-700
                        ${isFinished ? 'border-yellow-500 scale-[1.02]' : 
                          isMatchPoint ? 'border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.7)] animate-[pulse_1.5s_ease-in-out_infinite]' : 
                          'border-slate-800'}
                    `}>
                        
                        {isMatchPoint && (
                            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-black tracking-[0.5em] text-sm md:text-lg uppercase z-30 shadow-md">
                                ⚠️ MATCH POINT ⚠️
                            </div>
                        )}

                        <div className={`absolute top-6 left-6 text-[10px] font-black px-3 py-1.5 rounded-lg border tracking-widest z-20 ${isMatchPoint ? 'bg-red-950/80 text-red-400 border-red-800 mt-6' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
                            {match.format} 分制 / {match.bestOf} 局勝
                        </div>

                        {isFinished && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
                                <div className="w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-gray-900/0 to-transparent animate-spin-slow"></div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row justify-between items-center text-white relative z-10 mt-6">
                            
                            {/* ================= 左側：Player 1 ================= */}
                            <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-16 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={56} fill="currentColor"/></div>}
                                
                                <MiniPlayerCard playerInfo={p1Info} defaultName={p1Name} colorTheme="blue" />
                                
                                <div className="flex items-center gap-4 mt-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-2xl font-black px-4 py-2 rounded-xl border-2 ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {match.games1}
                                        </span>
                                    </div>
                                    <span className={`text-8xl md:text-[130px] leading-none font-mono font-black transition-all transform-gpu inline-block
                                        ${match.server === 1 && !isFinished ? 'text-white drop-shadow-[0_10px_20px_rgba(59,130,246,0.6)] scale-110 -translate-y-2' : 'text-slate-400'}
                                    `}>
                                        {match.score1}
                                    </span>
                                </div>
                                {match.server === 1 && !isFinished && (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-5 py-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                        <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]"></div>
                                        <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* ================= 中央：VS ================= */}
                            <div className="flex flex-row md:flex-col items-center justify-center my-8 md:my-0 md:mx-10 relative shrink-0 w-full md:w-auto">
                                <div className="hidden md:block w-px h-48 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
                                <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-950 text-slate-500 text-sm font-black px-4 py-3 rounded-2xl border-2 border-slate-700 shadow-xl italic tracking-wider">
                                    VS
                                </div>
                            </div>

                            {/* ================= 右側：Player 2 ================= */}
                            <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-16 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={56} fill="currentColor"/></div>}
                                
                                <MiniPlayerCard playerInfo={p2Info} defaultName={p2Name} colorTheme="rose" />
                                
                                <div className="flex items-center gap-4 mt-6 flex-row-reverse">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                        <span className={`text-2xl font-black px-4 py-2 rounded-xl border-2 ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                            {match.games2}
                                        </span>
                                    </div>
                                    <span className={`text-8xl md:text-[130px] leading-none font-mono font-black transition-all transform-gpu inline-block
                                        ${match.server === 2 && !isFinished ? 'text-white drop-shadow-[0_10px_20px_rgba(244,63,94,0.6)] scale-110 -translate-y-2' : 'text-slate-400'}
                                    `}>
                                        {match.score2}
                                    </span>
                                </div>
                                {match.server === 2 && !isFinished && (
                                    <div className="mt-4 inline-flex items-center gap-2 bg-rose-500/20 border border-rose-500/50 text-rose-300 px-5 py-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                                        <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,1)]"></div>
                                        <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
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
