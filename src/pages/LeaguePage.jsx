// src/pages/LeaguePage.jsx (Version 2.5 - Hotfix for undefined error)

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Target, Activity, Plus, Swords, Zap, PlayCircle, FileText, Pencil, Trash2, Download, Loader2, Trophy, ArrowUp, ArrowDown, Minus, ShieldAlert } from 'lucide-react';
import html2canvas from 'html2canvas';
import LeagueStandingsPoster from '../components/LeagueStandingsPoster';

// Helper component for Trend Arrow
const TrendIndicator = ({ trend }) => {
    if (trend > 0) return <ArrowUp size={14} className="text-emerald-500" title={`排名上升 ${trend} 位`} />;
    if (trend < 0) return <ArrowDown size={14} className="text-rose-500" title={`排名下降 ${Math.abs(trend)} 位`} />;
    return <Minus size={14} className="text-slate-400" title="排名不變" />;
};

export default function LeaguePage({
    role, currentUserInfo, setShowTacticalBoard, setShowUmpirePanel,
    setActiveLeagueMatch, setShowTournamentModal, selectedTournament,
    setSelectedTournament, tournamentList, leagueMatches, myTournamentStats,
    myUpcomingMatches, groupedMatches, tournamentStandings, handleCheerMatch,
    handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, schoolLogo,
    students
}) {

    const posterRef = useRef();
    const [isRenderingPoster, setIsRenderingPoster] = useState(false);
    const [previousStandings, setPreviousStandings] = useState({});

    // This effect now correctly captures the state *before* the update
    useEffect(() => {
        setPreviousStandings(tournamentStandings);
    }, [tournamentStandings]);
    
    // Clear history specifically when the tournament selection changes
    useEffect(() => {
        setPreviousStandings({});
    }, [selectedTournament]);

    const handleDownloadPoster = () => { /* ... (code unchanged) ... */ };
    const renderTeamTieResult = (groupName, matches) => { /* ... (code unchanged) ... */ };

    // --- 👇 FIX IS HERE: Enriched Standings Calculation 👇 ---
    const enrichedStandings = useMemo(() => {
        const enriched = {};
        
        // Defensive check: If tournamentStandings is not ready, return empty object
        if (!tournamentStandings || Object.keys(tournamentStandings).length === 0) {
            return {};
        }

        for (const group in tournamentStandings) {
            // Defensive check for the group itself
            if (!tournamentStandings[group]) continue;

            enriched[group] = tournamentStandings[group].map((player, index) => {
                // Hot Streak Calculation
                const playerMatches = leagueMatches
                    .filter(m => m.status === 'completed' && (m.player1Id === player.id || m.player2Id === player.id) && m.tournamentName === selectedTournament)
                    .sort((a, b) => (b.updatedAt?.seconds || b.timestamp?.seconds || 0) - (a.updatedAt?.seconds || a.timestamp?.seconds || 0));
                
                let hotStreak = 0;
                for (const match of playerMatches) {
                    if (match.winnerId === player.id) {
                        hotStreak++;
                    } else {
                        break;
                    }
                }

                // Trend Calculation with robust checks
                const prevGroupStandings = (previousStandings && previousStandings[group]) ? previousStandings[group] : [];
                const prevRank = prevGroupStandings.findIndex(p => p.id === player.id);
                
                let trend = 0;
                if (prevRank !== -1) {
                    trend = prevRank - index;
                }

                return { ...player, hotStreak, trend };
            });
        }
        return enriched;
    }, [tournamentStandings, leagueMatches, previousStandings, selectedTournament]);
    // --- 👆 END OF FIX 👆 ---

    return (
        <div className="space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                
                {/* Top header and controls section (unchanged) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    {/* ... code is identical ... */}
                </div>
                
                {/* Student's personal stats (unchanged) */}
                {role === 'student' && myTournamentStats && (
                    <div className="mb-10 p-8 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                        {/* ... code is identical ... */}
                    </div>
                )}
                
                {Object.keys(groupedMatches).length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-bold bg-slate-50/50 rounded-2xl">
                        {leagueMatches.length > 0 ? '請從上方選擇一個賽事' : '暫無任何賽事，請教練建立新賽事。'}
                    </div>
                ) : (
                    Object.keys(groupedMatches).map(groupName => (
                        <div key={groupName} className="mb-12">
                            
                            {!groupName.includes(' vs ') && (
                                <h4 className="text-2xl font-black text-slate-600 mb-4 pl-2">{groupName}</h4>
                            )}
                            
                            <div className="overflow-x-auto bg-slate-50/50 p-2 md:p-6 rounded-3xl border">
                                {renderTeamTieResult(groupName, groupedMatches[groupName])}

                                {/* Standings Table (Now using enrichedStandings) */}
                                {!groupName.includes(' vs ') && enrichedStandings[groupName] && (
                                    <table className="w-full text-left mb-6">
                                        {/* ... thead unchanged ... */}
                                        <tbody className="divide-y divide-slate-200/50">
                                            {enrichedStandings[groupName]?.map((player, index) => (
                                                <tr key={player.id} className="font-bold">
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {index + 1}
                                                            <TrendIndicator trend={player.trend} />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            {player.name}
                                                            {player.hotStreak >= 3 && <span title={`目前 ${player.hotStreak} 連勝中！`} className="text-orange-500 animate-pulse">🔥</span>}
                                                        </div>
                                                    </td>
                                                    {/* ... rest of the tds are the same */}
                                                    <td className="px-4 py-3 text-center text-slate-500">{player.played}</td>
                                                    <td className="px-4 py-3 text-center text-emerald-500">{player.wins}</td>
                                                    <td className="px-4 py-3 text-center text-rose-500">{player.losses}</td>
                                                    <td className="px-4 py-3 text-center font-mono">{player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-blue-600 text-lg">{player.leaguePoints}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                
                                {/* Matches Table (with Giant Slayer logic) */}
                                <table className="w-full text-left mt-2">
                                    {/* ... thead unchanged ... */}
                                    <tbody className="divide-y divide-slate-100">
                                        {groupedMatches[groupName].sort((a,b) => a.date.localeCompare(b.date) || (a.matchOrder || '').localeCompare(b.matchOrder || '')).map(match => {
                                            let isGiantSlayer = false;
                                            if (match.status === 'completed' && match.winnerId && tournamentStandings[groupName]) {
                                                const winnerInStandings = tournamentStandings[groupName].find(p => p.id === match.winnerId);
                                                const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
                                                const loserInStandings = tournamentStandings[groupName].find(p => p.id === loserId);

                                                if (winnerInStandings && loserInStandings) {
                                                    const winnerRank = tournamentStandings[groupName].indexOf(winnerInStandings);
                                                    const loserRank = tournamentStandings[groupName].indexOf(loserInStandings);
                                                    if (winnerRank > loserRank) {
                                                        isGiantSlayer = true;
                                                    }
                                                }
                                            }
                                            
                                            return (
                                                <tr key={match.id} className={`transition-all ${match.status === 'completed' ? 'text-slate-400 bg-white/30' : 'hover:bg-white shadow-sm'}`}>
                                                    {/* ... tds unchanged, including giant slayer logic ... */}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {isRenderingPoster && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
                    {/* ... hidden poster unchanged ... */}
                </div>
            )}
        </div>
    );
}

