// File: src/components/TournamentBracket.jsx
// Version: 1.0 (Native Auto-Bracket Engine)

import React, { useMemo } from 'react';
import { Trophy, Swords, ChevronRight, User } from 'lucide-react';

export default function TournamentBracket({ bracketMatches, students, role, onMatchClick }) {
    // 1. 將平面的比賽資料，整理成分層的 Rounds
    const bracketRounds = useMemo(() => {
        if (!bracketMatches || bracketMatches.length === 0) return [];
        
        // 找出這場盃賽最大的輪次 (例如：32強是 round 5, 決賽是 round 1)
        let maxRound = 1;
        bracketMatches.forEach(m => {
            if (m.bracketRound && m.bracketRound > maxRound) maxRound = m.bracketRound;
        });

        const rounds = [];
        // 從最大的輪次 (最早的預賽) 往下跑到決賽
        for (let r = maxRound; r >= 1; r--) {
            // 抓出屬於這一輪的所有比賽
            const matchesInRound = bracketMatches
                .filter(m => m.bracketRound === r)
                .sort((a, b) => a.bracketMatchNumber - b.bracketMatchNumber); // 依照對戰編號由上往下排

            let roundName = `Round ${r}`;
            if (r === 1) roundName = "🏆 總決賽";
            if (r === 2) roundName = "🏅 四強賽";
            if (r === 3) roundName = "八強賽";
            if (r === 4) roundName = "十六強";
            if (r === 5) roundName = "三十二強";

            rounds.push({
                roundNum: r,
                name: roundName,
                matches: matchesInRound
            });
        }
        return rounds;
    }, [bracketMatches]);

    if (bracketRounds.length === 0) {
        return <div className="text-center p-10 text-slate-400 font-bold">目前無盃賽資料</div>;
    }

    // 輔助函數：渲染單一個對戰格子
    const MatchBox = ({ match }) => {
        const isDone = match.status === 'completed';
        const isBye = match.player2Id === 'BYE';
        
        return (
            <div 
                className={`relative w-48 bg-white border-2 rounded-xl shadow-sm overflow-hidden transition-all 
                ${isBye ? 'opacity-60 grayscale' : 'hover:border-blue-400 hover:shadow-md cursor-pointer'} 
                ${isDone ? 'border-emerald-200' : 'border-slate-200'}
                ${match.player1Id || match.player2Id ? '' : 'border-dashed border-slate-300 bg-slate-50'}`}
                onClick={() => !isBye && onMatchClick && onMatchClick(match)}
            >
                {/* 第一位選手 */}
                <div className={`p-2 flex justify-between items-center border-b border-slate-100 ${match.winnerId === match.player1Id ? 'bg-emerald-50' : ''}`}>
                    <span className={`text-xs font-black truncate max-w-[120px] ${match.winnerId === match.player1Id ? 'text-emerald-700' : (match.player1Id ? 'text-slate-700' : 'text-slate-300')}`}>
                        {match.player1Name || 'TBD (待定)'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{isDone ? match.score1 : '-'}</span>
                </div>
                
                {/* 第二位選手 */}
                <div className={`p-2 flex justify-between items-center ${match.winnerId === match.player2Id ? 'bg-emerald-50' : ''}`}>
                    <span className={`text-xs font-black truncate max-w-[120px] ${match.winnerId === match.player2Id ? 'text-emerald-700' : (match.player2Id ? 'text-slate-700' : 'text-slate-300')} ${isBye ? 'italic' : ''}`}>
                        {match.player2Name || 'TBD (待定)'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{isDone ? match.score2 : (isBye ? '' : '-')}</span>
                </div>

                {/* 比賽編號 / 狀態小標籤 */}
                <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[8px] font-black text-slate-400">
                   #{match.bracketMatchNumber}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full overflow-x-auto custom-scrollbar pb-10">
            <div className="flex gap-16 min-w-max p-8">
                {bracketRounds.map((round, rIndex) => (
                    <div key={round.roundNum} className="flex flex-col gap-8 relative">
                        {/* 輪次標題 */}
                        <div className="text-center font-black text-sm uppercase tracking-widest text-blue-600 bg-blue-50 py-2 rounded-xl border border-blue-100 mb-4 sticky top-0 z-10">
                            {round.name}
                        </div>

                        {/* 該輪的所有比賽 */}
                        <div className="flex flex-col justify-around h-full gap-4">
                            {round.matches.map((match, mIndex) => (
                                <div key={match.id} className="relative flex items-center">
                                    <MatchBox match={match} />
                                    
                                    {/* 畫連接線 (如果不是最後一輪決賽的話) */}
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
