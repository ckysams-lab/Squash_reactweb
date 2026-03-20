// src/components/LiveScoreboardDisplay.jsx (Version 4.5 - Full Score Sheet)

import React, { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, X, ListChecks } from 'lucide-react';

const AnimatedNumber = ({ value }) => {
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
    }, [value]);
    return (
        <span className={`inline-block transition-transform duration-300 transform-gpu ${animate ? 'scale-125 -translate-y-4 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]' : ''}`}>
            {value}
        </span>
    );
};

// 👇 新增：大螢幕專用 - 右側完整逐分紀錄表元件 👇
const FullScoreSheetPanel = ({ pointLog, p1Name, p2Name }) => {
    const scrollRef = useRef(null);

    // 當 pointLog 有新資料寫入時，自動捲動到底部
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [pointLog]);

    return (
        <div className="w-full md:w-80 lg:w-96 bg-gray-950/80 border-l border-gray-800 flex flex-col h-full shrink-0">
            <div className="p-5 bg-gray-900 border-b border-gray-800 flex justify-center items-center">
                <h4 className="text-gray-300 font-black uppercase tracking-[0.3em] text-sm flex items-center gap-2">
                    <ListChecks size={18} className="text-emerald-500" /> WSF MATCH LOG
                </h4>
            </div>
            
            {/* 表格標題列 */}
            <div className="grid grid-cols-[1fr_2fr_1fr] bg-gray-800/80 text-[10px] font-black text-gray-500 uppercase tracking-widest p-3 border-b border-gray-700 text-center">
                <span className="text-blue-500 truncate" title={p1Name}>{p1Name.substring(0,3)}</span>
                <span>GAME / CALL</span>
                <span className="text-rose-500 truncate" title={p2Name}>{p2Name.substring(0,3)}</span>
            </div>

            {/* 紀錄清單 (自動捲動區) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-base custom-scrollbar scroll-smooth">
                {(!pointLog || pointLog.length === 0) ? (
                    <div className="h-full flex items-center justify-center text-gray-700 text-sm font-bold uppercase tracking-widest">
                        Match Starting...
                    </div>
                ) : (
                    pointLog.map((log, i) => {
                        const isNewest = i === pointLog.length - 1; // 最後一筆是最新
                        return (
                            <div key={log.id || i} className={`grid grid-cols-[1fr_2fr_1fr] items-center p-2 rounded-xl transition-all duration-700 ${isNewest ? 'bg-gray-800 border border-gray-600 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-[1.02]' : 'bg-transparent'}`}>
                                
                                {/* 左方分數 */}
                                <div className={`text-center font-black ${log.actionBy === 1 && (log.type === 'normal_win' || log.type === 'stroke') ? 'text-blue-400 text-xl' : 'text-gray-600'}`}>
                                    {log.p1Score}
                                </div>
                                
                                {/* 中央標籤 */}
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] text-gray-500 mb-0.5 font-sans font-bold bg-gray-900 px-2 rounded-sm tracking-widest">G{log.game}</span>
                                    {log.type === 'stroke' && <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-500/50 uppercase tracking-wider">Stroke</span>}
                                    {log.type === 'let' && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/50 uppercase tracking-wider">Yes Let</span>}
                                    {log.type === 'no_let' && <span className="bg-gray-600/20 text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-500/50 uppercase tracking-wider">No Let</span>}
                                </div>

                                {/* 右方分數 */}
                                <div className={`text-center font-black ${log.actionBy === 2 && (log.type === 'normal_win' || log.type === 'stroke') ? 'text-rose-400 text-xl' : 'text-gray-600'}`}>
                                    {log.p2Score}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
// 👆 -------------------------------------------------------- 👆

export default function LiveScoreboardDisplay({ liveMatches, TrophyIcon, rankedStudents = [] }) {
    const [isFullscreen, setIsFullscreen] = useState(false);

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
            <div className={`w-40 md:w-56 bg-gradient-to-b ${theme.bg} rounded-3xl p-3 md:p-4 border-2 ${theme.border} shadow-2xl flex flex-col items-center relative overflow-hidden isolate mb-4 md:mb-6`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                {playerInfo && (
                    <div className="w-full flex justify-between px-2 mb-2 md:mb-3 z-10">
                        <span className={`text-[10px] md:text-xs font-black ${theme.text} uppercase tracking-widest`}>OVR {playerInfo.ovr}</span>
                        <span className={`text-[10px] md:text-xs font-black text-white bg-black/40 px-2 md:px-2.5 py-0.5 rounded-full`}>#{playerInfo.rank}</span>
                    </div>
                )}
                <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl border-4 ${theme.border} bg-slate-800 shadow-inner flex items-center justify-center overflow-hidden z-10 mb-3 md:mb-4`}>
                    {playerInfo?.photo_url ? (
                        <img src={playerInfo.photo_url} alt={defaultName} className="w-full h-full object-cover object-top" crossOrigin="anonymous"/>
                    ) : (
                        <span className="text-3xl md:text-5xl font-black text-slate-500">{defaultName.charAt(0)}</span>
                    )}
                </div>
                <div className="text-center w-full z-10">
                    <h4 className="text-base md:text-2xl font-black text-white truncate drop-shadow-md">{defaultName}</h4>
                    <p className={`text-[9px] md:text-xs font-bold ${theme.text} mt-0.5 md:mt-1 truncate`}>
                        {playerInfo ? `Class ${playerInfo.class} • ${playerInfo.badge || '無章'}` : 'Guest Player'}
                    </p>
                </div>
            </div>
        );
    };

    if (!isFullscreen) {
        return (
            <div className="w-full bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-[2rem] p-4 md:p-6 mb-8 shadow-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 relative z-50">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-full shrink-0">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-black text-white tracking-widest uppercase">Arena 實況轉播中</h3>
                        <p className="text-slate-400 text-sm font-bold">目前有 {activeMatches.length} 場賽事正在進行</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsFullscreen(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-black shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                    <Maximize2 size={20} /> 啟動大螢幕模式
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black flex animate-in fade-in zoom-in-95 duration-700 w-screen h-screen overflow-hidden">
            
            {/* 左側主要計分區 (佔據大部分空間) */}
            <div className="flex-1 flex flex-col pt-6 pb-12 px-4 md:px-12 relative overflow-y-auto">
                {/* 頂部控制列 */}
                <div className="flex justify-between items-center mb-4 shrink-0 relative z-50">
                    <div className="w-12"></div> 
                    <h3 className="text-lg md:text-2xl font-black text-slate-200 flex items-center gap-4 bg-gray-900 border border-gray-800 px-6 py-2 rounded-full shadow-2xl tracking-widest">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                        ARENA BROADCAST
                    </h3>
                    <button onClick={() => setIsFullscreen(false)} className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-90 z-50">
                        <X size={20} />
                    </button>
                </div>
                
                {/* 賽事內容 */}
                <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col justify-center gap-8 relative mt-10">
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
                        <div key={match.id} className={`w-full bg-gray-900 rounded-[3rem] p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-700
                            ${isFinished ? 'border-yellow-500 scale-[1.01]' : 
                              isMatchPoint ? 'border-red-600 shadow-[0_0_80px_rgba(220,38,38,0.4)] animate-[pulse_1.5s_ease-in-out_infinite]' : 
                              'border-slate-800'}
                        `}>
                            
                            {isMatchPoint && (
                                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-black tracking-[0.8em] text-sm md:text-xl uppercase z-30 shadow-2xl">
                                    ⚠️ MATCH POINT ⚠️
                                </div>
                            )}

                            <div className={`absolute top-6 left-6 text-[9px] md:text-xs font-black px-3 md:px-4 py-1.5 md:py-2 rounded-xl border tracking-widest z-20 ${isMatchPoint ? 'bg-red-950/80 text-red-400 border-red-800 mt-6' : 'bg-slate-800/80 text-slate-400 border-slate-700'}`}>
                                {match.format} 分制 / {match.bestOf} 局勝
                            </div>

                            {isFinished && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
                                    <div className="w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-gray-900/0 to-transparent animate-spin-slow"></div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row justify-between items-center text-white relative z-10 w-full">
                                
                                {/* 左側：Player 1 */}
                                <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                    {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-16 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={56} fill="currentColor"/></div>}
                                    <MiniPlayerCard playerInfo={p1Info} defaultName={p1Name} colorTheme="blue" />
                                    <div className="flex items-center gap-4 md:gap-6 mt-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                            <span className={`text-xl md:text-3xl font-black px-4 md:px-5 py-2 md:py-2.5 rounded-xl border-2 ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                <AnimatedNumber value={match.games1} />
                                            </span>
                                        </div>
                                        <div className={`text-8xl md:text-[180px] leading-none font-mono font-black transition-all transform-gpu inline-block min-w-[100px] md:min-w-[150px] text-center
                                            ${match.server === 1 && !isFinished ? 'text-white drop-shadow-[0_10px_30px_rgba(59,130,246,0.6)] scale-110 -translate-y-2 md:-translate-y-4' : 'text-slate-500'}
                                        `}>
                                            <AnimatedNumber value={match.score1} />
                                        </div>
                                    </div>
                                    {match.server === 1 && !isFinished && (
                                        <div className="mt-4 md:mt-6 inline-flex items-center gap-2 md:gap-3 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-4 md:px-6 py-2 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                            <div className="w-3 md:w-4 h-3 md:h-4 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                                            <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* 中央：VS */}
                                <div className="flex flex-row md:flex-col items-center justify-center my-6 md:my-0 md:mx-10 relative shrink-0 w-full md:w-auto">
                                    <div className="hidden md:block w-1 h-48 bg-gradient-to-b from-transparent via-slate-700 to-transparent rounded-full"></div>
                                    <div className="md:hidden h-1 w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded-full"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-950 text-slate-500 text-sm font-black px-3 py-2 rounded-2xl border-2 border-slate-800 shadow-2xl italic tracking-widest">
                                        VS
                                    </div>
                                </div>

                                {/* 右側：Player 2 */}
                                <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                                    {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-16 text-yellow-400 animate-bounce drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-40"><TrophyIcon size={56} fill="currentColor"/></div>}
                                    <MiniPlayerCard playerInfo={p2Info} defaultName={p2Name} colorTheme="rose" />
                                    <div className="flex items-center gap-4 md:gap-6 mt-2 flex-row-reverse">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">Games</span>
                                            <span className={`text-xl md:text-3xl font-black px-4 md:px-5 py-2 md:py-2.5 rounded-xl border-2 ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                <AnimatedNumber value={match.games2} />
                                            </span>
                                        </div>
                                        <div className={`text-8xl md:text-[180px] leading-none font-mono font-black transition-all transform-gpu inline-block min-w-[100px] md:min-w-[150px] text-center
                                            ${match.server === 2 && !isFinished ? 'text-white drop-shadow-[0_10px_30px_rgba(244,63,94,0.6)] scale-110 -translate-y-2 md:-translate-y-4' : 'text-slate-500'}
                                        `}>
                                            <AnimatedNumber value={match.score2} />
                                        </div>
                                    </div>
                                    {match.server === 2 && !isFinished && (
                                        <div className="mt-4 md:mt-6 inline-flex items-center gap-2 md:gap-3 bg-rose-500/20 border border-rose-500/50 text-rose-300 px-4 md:px-6 py-2 rounded-full animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                                            <div className="w-3 md:w-4 h-3 md:h-4 rounded-full bg-rose-400 shadow-[0_0_15px_rgba(251,113,133,1)]"></div>
                                            <span className="text-xs font-black tracking-widest uppercase">{match.serveSide === 'L' ? '左區發球' : '右區發球'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* 👇 右側邊欄：完整逐分紀錄表 (只有在有 active match 的情況下顯示) 👇 */}
            {activeMatches.length > 0 && (
                <FullScoreSheetPanel 
                    pointLog={activeMatches[0].pointLog} 
                    p1Name={activeMatches[0].player1Name || activeMatches[0].player1 || 'Player 1'} 
                    p2Name={activeMatches[0].player2Name || activeMatches[0].player2 || 'Player 2'} 
                />
            )}

        </div>
    );
}
