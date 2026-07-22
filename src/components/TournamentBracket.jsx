// File: src/components/TournamentBracket.jsx
// Version: 1.4 (Visual Layout Fix & Time/Venue Display)

import React, { useMemo } from 'react';
import { PlayCircle, Clock, MapPin } from 'lucide-react';

export default function TournamentBracket({ bracketMatches, students, role, onMatchClick, liveMatches = [], onStartLiveBroadcast }) {
    // 🌟 核心修復：將季軍戰 (bronzeMatch) 與主賽程 (mainRounds) 徹底分離，避免破壞 flexbox 排版
    const { mainRounds, bronzeMatch } = useMemo(() => {
        if (!bracketMatches || bracketMatches.length === 0) return { mainRounds: [], bronzeMatch: null };
        
        const bMatch = bracketMatches.find(m => m.isBronzeFinal);
        const mainM = bracketMatches.filter(m => !m.isBronzeFinal);

        let maxRound = 1;
        mainM.forEach(m => {
            if (m.bracketRound && m.bracketRound > maxRound) maxRound = m.bracketRound;
        });

        const rounds = [];
        for (let r = maxRound; r >= 1; r--) {
            const matchesInRound = mainM
                .filter(m => m.bracketRound === r)
                .sort((a, b) => a.bracketMatchNumber - b.bracketMatchNumber); 

            let roundName = `Round ${r}`;
            if (r === 1) roundName = "🏆 總決賽";
            if (r === 2) roundName = "🏅 四強賽";
            if (r === 3) roundName = "八強賽";
            if (r === 4) roundName = "十六強";
            if (r === 5) roundName = "三十二強";

            rounds.push({ roundNum: r, name: roundName, matches: matchesInRound });
        }
        return { mainRounds: rounds, bronzeMatch: bMatch };
    }, [bracketMatches]);

    if (mainRounds.length === 0) {
        return <div className="text-center p-10 text-slate-400 font-bold">目前無盃賽資料</div>;
    }

    const MatchBox = ({ match, isBronze = false }) => {
        const isDone = match.status === 'completed';
        const isBye = match.player2Id === 'BYE';
        
        const liveData = liveMatches.find(l => l.leagueMatchId === match.id && l.status === 'live');
        const isLive = !!liveData;
        
        const displayScore1 = isLive ? liveData.score1 : (isDone ? match.score1 : '-');
        const displayScore2 = isLive ? liveData.score2 : (isDone ? match.score2 : (isBye ? '' : '-'));

        let detailedScores = isDone ? match.gameScoresStr : '';
        if (isLive && liveData.gameScores && liveData.gameScores.length > 0) {
            detailedScores = liveData.gameScores.map(g => `${g.p1}-${g.p2}`).join(', ');
        }

        const renderPlayerName = (name, seed, isWinner) => {
            if (!name) return <span className="text-slate-300">TBD (待定)</span>;
            return (
                <div className="flex items-center gap-1 overflow-hidden">
                    {seed && <span className="text-[9px] font-mono text-slate-400 shrink-0">[{seed}]</span>}
                    <span className={`text-xs font-black truncate 
                        ${isLive ? 'text-white' : (isWinner ? 'text-emerald-700' : 'text-slate-700')}
                    `}>
                        {name}
                    </span>
                </div>
            );
        };

        return (
            <div 
                className={`relative w-48 border-2 rounded-xl overflow-visible transition-all duration-300 group flex flex-col
                ${isBye ? 'opacity-60 grayscale bg-white border-slate-200 cursor-not-allowed' : 'cursor-pointer'} 
                ${isLive ? 'border-red-500 bg-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105 z-20' : 
                  (isDone ? 'border-emerald-200 bg-white shadow-sm hover:border-emerald-400' : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md')}
                ${!match.player1Id && !match.player2Id ? 'border-dashed border-slate-300 bg-slate-50' : ''}
                ${isBronze ? 'border-orange-300 bg-orange-50' : ''}`}
                onClick={() => {
                    if (!isBye && onMatchClick) onMatchClick(match);
                }}
            >
                {!isBronze && match.isFinal && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">總決賽 (Final)</div>}
                {isBronze && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 border border-orange-200 text-[9px] font-black px-2 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">季軍戰 (3rd Place)</div>}

                {isLive && (
                    <div className="absolute -top-3 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-t-lg animate-pulse flex items-center gap-1 z-30 shadow-md">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </div>
                )}

                {/* 🌟 核心修復：顯示場地與時間資訊 */}
                {!isBye && (
                    <div className={`text-[9px] font-bold px-2 py-1.5 flex justify-between items-center border-b ${isLive ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100/50 text-slate-500 border-slate-100'}`}>
                        <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-400"/> {match.venue || 'TBD'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} className="text-amber-500"/> {match.time || 'TBD'}</span>
                    </div>
                )}

                <div className={`p-2 flex justify-between items-center border-b ${isLive ? 'border-slate-700' : 'border-slate-100'} ${match.winnerId === match.player1Id && !isLive ? 'bg-emerald-50' : ''}`}>
                    {renderPlayerName(match.player1Name, match.player1Seed, match.winnerId === match.player1Id)}
                    <span className={`text-xs font-black shrink-0 ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>
                        {displayScore1}
                    </span>
                </div>
                
                <div className={`p-2 flex justify-between items-center ${match.winnerId === match.player2Id && !isLive ? 'bg-emerald-50' : ''}`}>
                    {renderPlayerName(match.player2Name, match.player2Seed, match.winnerId === match.player2Id)}
                    <span className={`text-xs font-black shrink-0 ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>
                        {displayScore2}
                    </span>
                </div>

                {detailedScores && !isBye && (
                    <div className={`py-1.5 text-[10px] font-mono text-center tracking-tight border-t ${isLive ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-slate-100 text-slate-500 bg-slate-50'}`}>
                        {detailedScores}
                    </div>
                )}

                {role === 'admin' && !isDone && !isBye && match.player1Id && match.player2Id && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-40 rounded-xl">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                if(onStartLiveBroadcast) onStartLiveBroadcast(match);
                            }} 
                            className="flex flex-col items-center gap-1 text-white hover:text-red-400 transition-colors hover:scale-110"
                        >
                            <PlayCircle size={28} className="fill-red-500/20 stroke-red-500" />
                            <span className="text-[10px] font-black tracking-widest uppercase">開啟轉播台</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-16 pt-8">
            <div className="flex gap-16 min-w-max px-8">
                {mainRounds.map((round, rIndex) => (
                    <div key={round.roundNum} className="flex flex-col relative" style={{ justifyContent: 'space-around' }}>
                        <div className="text-center font-black text-sm uppercase tracking-widest text-blue-600 bg-blue-50 py-2 rounded-xl border border-blue-100 mb-8 sticky top-0 z-10 shadow-sm shrink-0">
                            {round.name}
                        </div>
                        <div className="flex flex-col justify-around flex-1 gap-4">
                            {round.matches.map((match) => (
                                <div key={match.id} className="relative flex items-center">
                                    <MatchBox match={match} />
                                    {rIndex < mainRounds.length - 1 && (
                                        <div className="absolute -right-8 w-8 border-t-2 border-slate-300"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* 🌟 核心修復：將季軍戰獨立渲染在決賽列的最下方，絕不干擾主樹狀圖的連線排版 */}
                        {round.roundNum === 1 && bronzeMatch && (
                            <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200 flex justify-center shrink-0">
                                <MatchBox match={bronzeMatch} isBronze={true} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
