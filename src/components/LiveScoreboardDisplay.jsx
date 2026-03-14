// src/components/LiveScoreboardDisplay.jsx

import React from 'react';

// 注意：這裡接收了 liveMatches 和 TrophyIcon 作為 props
export default function LiveScoreboardDisplay({ liveMatches, TrophyIcon }) {
    if (!liveMatches || !Array.isArray(liveMatches)) return null;
    
    const activeMatches = liveMatches.filter(m => m.status === 'live');
    if (activeMatches.length === 0) return null;

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                即時比分轉播 (LIVE)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMatches.map(match => {
                    const isFinished = match.matchWinner !== null;
                    const gamesNeeded = match.bestOf === 3 ? 2 : 3;
                    return (
                    <div key={match.id} className={`bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-1000 ${isFinished ? 'border-yellow-500 scale-[1.02]' : 'border-slate-800'}`}>
                        {!isFinished && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]"></div>}
                        <div className="absolute top-4 left-4 bg-slate-800 text-slate-400 text-[9px] font-black px-2 py-1 rounded border border-slate-700 tracking-widest">
                            {match.format} 分制 / {match.bestOf} 局勝
                        </div>
                        {isFinished && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
                                <div className="w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-slate-900/0 to-transparent animate-spin-slow"></div>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-white relative z-10 mt-6">
                            <div className="flex-1 text-center relative">
                                {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><TrophyIcon size={32} fill="currentColor"/></div>}
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Player 1</p>
                                <h4 className={`text-2xl md:text-3xl font-black truncate px-2 mb-4 ${match.matchWinner === 1 ? 'text-yellow-400' : ''}`}>{match.player1}</h4>
                                <div className="flex justify-center items-end gap-2">
                                    <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>局 {match.games1}</span>
                                    <span className={`text-6xl md:text-8xl font-mono font-black transition-all ${match.server === 1 && !isFinished ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110' : 'text-slate-100'}`}>
                                        {match.score1}
                                    </span>
                                </div>
                                <div className="h-8 mt-6">
                                    {match.server === 1 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 px-4 py-1.5 rounded-full animate-bounce">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                                            <span className="text-xs font-black tracking-widest">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-px h-32 bg-slate-700/50 mx-4 relative shrink-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-500 text-xs font-black px-2 py-1 rounded-full border border-slate-700">VS</div>
                            </div>
                            <div className="flex-1 text-center relative">
                                {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><TrophyIcon size={32} fill="currentColor"/></div>}
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Player 2</p>
                                <h4 className={`text-2xl md:text-3xl font-black truncate px-2 mb-4 ${match.matchWinner === 2 ? 'text-yellow-400' : ''}`}>{match.player2}</h4>
                                <div className="flex justify-center items-end gap-2 flex-row-reverse">
                                    <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>局 {match.games2}</span>
                                    <span className={`text-6xl md:text-8xl font-mono font-black transition-all ${match.server === 2 && !isFinished ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110' : 'text-slate-100'}`}>
                                        {match.score2}
                                    </span>
                                </div>
                                <div className="h-8 mt-6">
                                    {match.server === 2 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 px-4 py-1.5 rounded-full animate-bounce">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                                            <span className="text-xs font-black tracking-widest">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
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
