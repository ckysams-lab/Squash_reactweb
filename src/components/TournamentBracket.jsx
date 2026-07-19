// File: src/components/TournamentBracket.jsx
// Version: 1.1 (Live Arena Integration)
// 升級內容：加入即時轉播脈動，支援深色 LIVE 模式與即時比分顯示。

import React, { useMemo } from 'react';

export default function TournamentBracket({ bracketMatches, students, role, onMatchClick, liveMatches = [] }) {
    const bracketRounds = useMemo(() => {
        if (!bracketMatches || bracketMatches.length === 0) return [];
        
        let maxRound = 1;
        bracketMatches.forEach(m => {
            if (m.bracketRound && m.bracketRound > maxRound) maxRound = m.bracketRound;
        });

        const rounds = [];
        for (let r = maxRound; r >= 1; r--) {
            const matchesInRound = bracketMatches
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
        return rounds;
    }, [bracketMatches]);

    if (bracketRounds.length === 0) {
        return <div className="text-center p-10 text-slate-400 font-bold">目前無盃賽資料</div>;
    }

    const MatchBox = ({ match }) => {
        const isDone = match.status === 'completed';
        const isBye = match.player2Id === 'BYE';
        
        // 🌟 核心升級：偵測這場比賽是否正在「轉播室」進行中
        const liveData = liveMatches.find(l => l.leagueMatchId === match.id && l.status === 'live');
        const isLive = !!liveData;
        
        // 動態決定顯示的比分 (如果是 LIVE，顯示即時比分；如果完賽，顯示最終比分)
        const displayScore1 = isLive ? liveData.score1 : (isDone ? match.score1 : '-');
        const displayScore2 = isLive ? liveData.score2 : (isDone ? match.score2 : (isBye ? '' : '-'));

        return (
            <div 
                className={`relative w-48 border-2 rounded-xl overflow-hidden transition-all duration-300 
                ${isBye ? 'opacity-60 grayscale bg-white border-slate-200' : ''} 
                ${isLive ? 'border-red-500 bg-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105 z-20' : 
                  (isDone ? 'border-emerald-200 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer')}
                ${!match.player1Id && !match.player2Id ? 'border-dashed border-slate-300 bg-slate-50' : ''}`}
                onClick={() => !isBye && onMatchClick && onMatchClick(match)}
            >
                {/* 🔴 LIVE 閃爍標籤 */}
                {isLive && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg animate-pulse flex items-center gap-1 z-30 shadow-md">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </div>
                )}

                {/* 第一位選手 */}
                <div className={`p-2 flex justify-between items-center border-b ${isLive ? 'border-slate-700' : 'border-slate-100'} ${match.winnerId === match.player1Id && !isLive ? 'bg-emerald-50' : ''}`}>
                    <span className={`text-xs font-black truncate max-w-[120px] 
                        ${isLive ? 'text-white' : (match.winnerId === match.player1Id ? 'text-emerald-700' : (match.player1Id ? 'text-slate-700' : 'text-slate-300'))}`}>
                        {match.player1Name || 'TBD (待定)'}
                    </span>
                    <span className={`text-xs font-black ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>
                        {displayScore1}
                    </span>
                </div>
                
                {/* 第二位選手 */}
                <div className={`p-2 flex justify-between items-center ${match.winnerId === match.player2Id && !isLive ? 'bg-emerald-50' : ''}`}>
                    <span className={`text-xs font-black truncate max-w-[120px] 
                        ${isLive ? 'text-white' : (match.winnerId === match.player2Id ? 'text-emerald-700' : (match.player2Id ? 'text-slate-700' : 'text-slate-300'))} ${isBye ? 'italic' : ''}`}>
                        {match.player2Name || 'TBD (待定)'}
                    </span>
                    <span className={`text-xs font-black ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>
                        {displayScore2}
                    </span>
                </div>

                {/* 比賽編號 */}
                {!isLive && (
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">
                       #{match.bracketMatchNumber}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-16 pt-4">
            <div className="flex gap-16 min-w-max px-8">
                {bracketRounds.map((round, rIndex) => (
                    <div key={round.roundNum} className="flex flex-col gap-8 relative">
                        <div className="text-center font-black text-sm uppercase tracking-widest text-blue-600 bg-blue-50 py-2 rounded-xl border border-blue-100 mb-4 sticky top-0 z-10 shadow-sm">
                            {round.name}
                        </div>
                        <div className="flex flex-col justify-around h-full gap-4">
                            {round.matches.map((match) => (
                                <div key={match.id} className="relative flex items-center">
                                    <MatchBox match={match} />
                                    {rIndex < bracketRounds.length - 1 && (
                                        <div className="absolute -right-8 w-8 border-t-2 border-slate-300"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
