// src/pages/LeaguePage.jsx (Version 3.9 - Merging New Features into v3.2 Base Code - Full Code)

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
    Target, Activity, Plus, Swords, Zap, PlayCircle, FileText, Pencil, Trash2, Download, Loader2, Trophy,
    ArrowUp, ArrowDown, Minus, ShieldAlert // <-- v3.9: Import new icons
} from 'lucide-react';
import html2canvas from 'html2canvas';
import LeagueStandingsPoster from '../components/LeagueStandingsPoster';

// --- v3.9: New Helper Component for Trend Arrow ---
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
    students // v3.9: Ensure students prop is passed for Giant Slayer logic
}) {

    const posterRef = useRef();
    const [isRenderingPoster, setIsRenderingPoster] = useState(false);
    
    // --- v3.9: New state and effects for trend calculation ---
    const [previousStandings, setPreviousStandings] = useState({});

    useEffect(() => {
        // Only update previous standings if the new standings are valid and not empty
        if (tournamentStandings && Object.keys(tournamentStandings).length > 0) {
            setPreviousStandings(current => ({ ...current, [selectedTournament]: tournamentStandings }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentStandings]);
    
    useEffect(() => {
        // Clear history specifically when the tournament selection changes to avoid stale data
        setPreviousStandings({});
    }, [selectedTournament]);
    // --- End of new state and effects ---

    const handleDownloadPoster = () => {
        // This logic from v3.2 is retained completely.
        if (!tournamentStandings || Object.keys(tournamentStandings).length === 0) return alert("目前沒有可生成的積分榜數據。");
        setIsRenderingPoster(true);
        setTimeout(() => {
            html2canvas(posterRef.current, { scale: 2, useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = `league_standings_${selectedTournament}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                setIsRenderingPoster(false);
            }).catch(err => {
                console.error("海報生成失敗:", err);
                alert("海報生成失敗，請檢查主控台錯誤。");
                setIsRenderingPoster(false);
            });
        }, 500);
    };

    // This entire function from v3.2 is retained completely.
    const renderTeamTieResult = (groupName, matches) => {
        if (!groupName || !groupName.includes(' vs ')) return null;
        const [teamA, teamB] = groupName.split(' vs ');
        let teamAWins = 0;
        let teamBWins = 0;
        let completedMatches = 0;
        matches.forEach(match => {
            if (match.status === 'completed') {
                completedMatches++;
                if (match.winnerId === match.player1Id && match.player1Name.startsWith(teamA)) teamAWins++;
                else if (match.winnerId === match.player2Id && match.player2Name.startsWith(teamA)) teamAWins++;
                else if (match.winnerId === match.player1Id && match.player1Name.startsWith(teamB)) teamBWins++;
                else if (match.winnerId === match.player2Id && match.player2Name.startsWith(teamB)) teamBWins++;
            }
        });
        const isAllCompleted = completedMatches === matches.length && matches.length > 0;
        const winnerTeam = teamAWins > teamBWins ? teamA : (teamBWins > teamAWins ? teamB : '平手');
        return (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
                <h5 className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">團體對抗賽戰況 (Team Tie)</h5>
                <div className="flex items-center justify-between max-w-lg mx-auto relative z-10">
                    <div className="text-center flex-1"><p className={`text-2xl md:text-3xl font-black ${teamAWins > teamBWins ? 'text-yellow-400' : 'text-white'}`}>{teamA}</p></div>
                    <div className="flex items-center gap-4 px-6">
                        <div className="w-12 h-16 bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center text-3xl font-black">{teamAWins}</div>
                        <span className="text-slate-500 font-black text-xl">-</span>
                        <div className="w-12 h-16 bg-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center text-3xl font-black">{teamBWins}</div>
                    </div>
                    <div className="text-center flex-1"><p className={`text-2xl md:text-3xl font-black ${teamBWins > teamAWins ? 'text-yellow-400' : 'text-white'}`}>{teamB}</p></div>
                </div>
                <div className="mt-6 text-center">
                    {isAllCompleted ? (
                        <div className="inline-flex flex-col items-center">
                            <span className="bg-yellow-500 text-yellow-950 px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.5)]"><Trophy size={16} /> {winnerTeam === '平手' ? '雙方戰平' : `${winnerTeam} 奪得勝利！`}</span>
                            {role === 'admin' && winnerTeam !== '平手' && (<button className="mt-3 text-xs text-blue-300 hover:text-white transition-colors underline underline-offset-4">[開發中] 為勝隊所有成員發放 +50 團隊積分</button>)}
                        </div>
                    ) : (
                        <span className="bg-slate-700/50 border border-slate-600 px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 tracking-wider">進度：已賽 {completedMatches} / 總計 {matches.length} 點</span>
                    )}
                </div>
            </div>
        );
    };

    // --- v3.9: New robust useMemo hook for enriched data ---
    const enrichedStandings = useMemo(() => {
        if (!tournamentStandings || typeof tournamentStandings !== 'object') {
            return {};
        }
        const enriched = {};
        const prevTournamentData = previousStandings ? previousStandings[selectedTournament] : null;

        for (const group of Object.keys(tournamentStandings)) {
            const currentGroupData = tournamentStandings[group];
            if (!Array.isArray(currentGroupData)) {
                continue;
            }
            enriched[group] = currentGroupData.map((player, index) => {
                const playerMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === player.id || m.player2Id === player.id) && m.tournamentName === selectedTournament).sort((a, b) => (b.updatedAt?.seconds || b.timestamp?.seconds || 0) - (a.updatedAt?.seconds || a.timestamp?.seconds || 0));
                let hotStreak = 0;
                for (const match of playerMatches) {
                    if (match.winnerId === player.id) { hotStreak++; } else { break; }
                }
                const prevGroupData = (prevTournamentData && Array.isArray(prevTournamentData[group])) ? prevTournamentData[group] : [];
                const prevRank = prevGroupData.findIndex(p => p.id === player.id);
                const trend = (prevRank !== -1) ? prevRank - index : 0;
                return { ...player, hotStreak, trend };
            });
        }
        return enriched;
    }, [tournamentStandings, leagueMatches, previousStandings, selectedTournament]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-4xl font-black">🗓️ 聯賽專區</h3>
                            {role === 'admin' && (
                                <>
                                    <button onClick={() => setShowTacticalBoard(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-indigo-700 font-bold text-sm">
                                        <Target size={16}/> 戰術板
                                    </button>
                                    <button onClick={() => setShowUmpirePanel(true)} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl shadow-md hover:bg-red-600 font-bold text-sm ml-2 animate-pulse">
                                        <Activity size={16}/> 啟動即時轉播
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-slate-400">查看賽程、賽果及歷史賽事</p>
                    </div>
                    
                    <div className="flex w-full md:w-auto items-center gap-3">
                        <select 
                            value={selectedTournament} 
                            onChange={(e) => setSelectedTournament(e.target.value)} 
                            className="flex-grow w-full md:w-72 bg-slate-50 border-none outline-none pl-6 pr-10 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                        >
                            {tournamentList.length === 0 ? <option value="">暫無賽事</option> : tournamentList.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        
                        {role === 'admin' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleDownloadPoster} 
                                    disabled={isRenderingPoster || !tournamentStandings || Object.keys(tournamentStandings).length === 0}
                                    className="p-4 bg-white border border-slate-200 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all shadow-sm disabled:opacity-50" 
                                    title="下載積分榜海報"
                                >
                                    {isRenderingPoster ? <Loader2 className="animate-spin" size={20} /> : <Download size={20}/>}
                                </button>
                                <button onClick={() => setShowTournamentModal(true)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all" title="建立新賽事">
                                    <Plus size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {role === 'student' && myTournamentStats && (
                    <div className="mb-10 p-8 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                        <h4 className="text-xl font-black text-blue-800 mb-6">我的個人戰績 ({selectedTournament})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><p className="text-3xl font-black text-blue-600">{myTournamentStats.played}</p><p className="text-xs font-bold text-slate-400">已賽</p></div>
                            <div><p className="text-3xl font-black text-emerald-600">{myTournamentStats.wins}</p><p className="text-xs font-bold text-slate-400">勝</p></div>
                            <div><p className="text-3xl font-black text-rose-600">{myTournamentStats.losses}</p><p className="text-xs font-bold text-slate-400">負</p></div>
                            <div><p className="text-3xl font-black text-slate-600">{myTournamentStats.leaguePoints}</p><p className="text-xs font-bold text-slate-400">積分</p></div>
                        </div>
                        {myUpcomingMatches.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-blue-200">
                                <h5 className="font-bold text-sm text-blue-800 mb-2">你即將到來的比賽：</h5>
                                {myUpcomingMatches.map(match => (
                                    <div key={match.id} className="text-xs text-slate-600">
                                        <span>{match.date} {match.time} vs <strong>{match.player1Id === currentUserInfo.id ? match.player2Name : match.player1Name}</strong></span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {Object.keys(groupedMatches).length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-bold bg-slate-50/50 rounded-2xl">
                        {leagueMatches.length > 0 ? '請從上方選擇一個賽事' : '暫無任何賽事，請教練建立新賽事。'}
                    </div>
                ) : (
                    Object.keys(groupedMatches).map(groupName => (
                        <div key={groupName} className="mb-12">
                            {!groupName.includes(' vs ') && ( <h4 className="text-2xl font-black text-slate-600 mb-4 pl-2">{groupName}</h4> )}
                            <div className="overflow-x-auto bg-slate-50/50 p-2 md:p-6 rounded-3xl border">
                                {renderTeamTieResult(groupName, groupedMatches[groupName])}

                                {/* --- 👇 v3.9: UPDATED Standings Table 👇 --- */}
                                {!groupName.includes(' vs ') && enrichedStandings[groupName] && (
                                    <table className="w-full text-left mb-6">
                                        <thead className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                            <tr>
                                                <th className="px-4 py-3">排名</th>
                                                <th className="px-4 py-3">球員</th>
                                                <th className="px-4 py-3 text-center">已賽</th>
                                                <th className="px-4 py-3 text-center">勝</th>
                                                <th className="px-4 py-3 text-center">負</th>
                                                <th className="px-4 py-3 text-center">分差</th>
                                                <th className="px-4 py-3 text-center">積分</th>
                                            </tr>
                                        </thead>
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
                                
                                {/* --- 👇 v3.9: UPDATED Matches Table 👇 --- */}
                                <table className="w-full text-left mt-2">
                                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-4 whitespace-nowrap">日期 / 點數</th>
                                            <th className="px-4 py-4 whitespace-nowrap">對賽球員</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">比分</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">狀態</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">人氣</th>
                                            {role === 'admin' && <th className="px-4 py-4 text-center whitespace-nowrap">操作</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {groupedMatches[groupName].sort((a,b) => a.date.localeCompare(b.date) || (a.matchOrder || '').localeCompare(b.matchOrder || '')).map(match => {
                                            let isGiantSlayer = false;
                                            if (match.status === 'completed' && match.winnerId && tournamentStandings && tournamentStandings[groupName]) {
                                                const winnerRank = tournamentStandings[groupName].findIndex(p => p.id === match.winnerId);
                                                const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
                                                const loserRank = tournamentStandings[groupName].findIndex(p => p.id === loserId);

                                                if (winnerRank !== -1 && loserRank !== -1 && winnerRank > loserRank) {
                                                    isGiantSlayer = true;
                                                }
                                            }
                                            
                                            return (
                                                <tr key={match.id} className={`transition-all ${match.status === 'completed' ? 'text-slate-400 bg-white/30' : 'hover:bg-white shadow-sm'}`}>
                                                    <td className="px-4 py-5 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{match.date} <span className="font-mono text-sm ml-2">{match.time}</span></div>
                                                        <div className="text-xs text-blue-600 font-bold mt-0.5">{match.matchOrder || match.venue}</div>
                                                    </td>
                                                    <td className="px-4 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`font-black text-base ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player1Name}</div>
                                                            <Swords size={14} className="text-slate-300 shrink-0"/>
                                                            <div className={`font-black text-base ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player2Name}</div>
                                                            {isGiantSlayer && <span title="巨人殺手！(以弱勝強)" className="p-1 bg-amber-100 text-amber-600 rounded-md ml-2"><ShieldAlert size={14} /></span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                                        {match.status === 'completed' ? (
                                                            <span className="font-mono font-black text-xl md:text-2xl text-slate-800 tracking-widest">{match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`}</span>
                                                        ) : ( <span className="text-slate-300">-</span> )}
                                                    </td>
                                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                                        {match.status === 'completed' ? (
                                                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-200">已完賽</span>
                                                        ) : (
                                                            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-600 text-[10px] font-black rounded-full border border-yellow-200">待開賽</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                                        {(() => {
                                                            const cheersCount = match.cheers?.length || 0;
                                                            const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');
                                                            return (
                                                                <button onClick={(e) => handleCheerMatch(match.id, e)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 border ${hasCheered ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-orange-500 hover:border-orange-200 hover:shadow-sm'}`}>
                                                                    <Zap size={14} className={hasCheered ? 'fill-orange-500' : ''}/>
                                                                    {cheersCount > 0 ? cheersCount : ''}
                                                                </button>
                                                            );
                                                        })()}
                                                    </td>
                                                    {role === 'admin' && (
                                                        <td className="px-4 py-5 text-center whitespace-nowrap">
                                                            <div className="flex justify-center gap-2">
                                                                {match.status === 'scheduled' && match.matchType !== 'external' && (
                                                                    <>
                                                                        <button onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }} className="p-3 bg-red-50 text-red-600 rounded-xl border hover:bg-red-500 hover:text-white transition-all animate-pulse" title="啟動即時轉播"><PlayCircle size={16}/></button>
                                                                        <button onClick={() => handleUpdateLeagueMatchScore(match)} className="p-3 bg-white text-blue-600 rounded-xl border hover:bg-blue-600 hover:text-white transition-all" title="輸入比分"><FileText size={16}/></button>
                                                                        <button onClick={() => handleEditLeagueMatch(match)} className="p-3 bg-white text-gray-600 rounded-xl border hover:bg-gray-600 hover:text-white transition-all" title="編輯比賽"><Pencil size={16}/></button>
                                                                    </>
                                                                )}
                                                                <button onClick={() => deleteItem('league_matches', match.id)} className="p-3 bg-white text-red-500 rounded-xl border hover:bg-red-600 hover:text-white transition-all" title="刪除比賽"><Trash2 size={16}/></button>
                                                            </div>
                                                        </td>
                                                    )}
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
                    <LeagueStandingsPoster 
                        ref={posterRef}
                        tournamentName={selectedTournament}
                        standings={tournamentStandings && Object.values(tournamentStandings).flat().sort((a,b) => b.leaguePoints - a.leaguePoints)}
                        upcomingMatches={leagueMatches}
                        schoolLogo={schoolLogo}
                    />
                </div>
            )}
        </div>
    );
}

