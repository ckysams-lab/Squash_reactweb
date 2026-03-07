// src/pages/LeaguePage.jsx
import React from 'react';
import { Target, Activity, Plus, Swords, Zap, PlayCircle, FileText, Pencil, Trash2 } from 'lucide-react';

export default function LeaguePage({
    role,
    currentUserInfo,
    setShowTacticalBoard,
    setShowUmpirePanel,
    setActiveLeagueMatch,
    setShowTournamentModal,
    selectedTournament,
    setSelectedTournament,
    tournamentList,
    leagueMatches,
    myTournamentStats,
    myUpcomingMatches,
    groupedMatches,
    tournamentStandings,
    handleCheerMatch,
    handleUpdateLeagueMatchScore,
    handleEditLeagueMatch,
    deleteItem
}) {
    return (
        <div className="space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                
                {/* 頂部標題與控制區 */}
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
                                <button onClick={() => setShowTournamentModal(true)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all" title="建立新賽事">
                                    <Plus size={20}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 學生視角的個人戰績 */}
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
                
                {/* 賽程列表 (分組顯示) */}
                {Object.keys(groupedMatches).length === 0 ? (
                    <div className="text-center py-20 text-slate-300 font-bold bg-slate-50/50 rounded-2xl">
                        {leagueMatches.length > 0 ? '請從上方選擇一個賽事' : '暫無任何賽事，請教練建立新賽事。'}
                    </div>
                ) : (
                    Object.keys(groupedMatches).map(groupName => (
                        <div key={groupName} className="mb-10">
                            <h4 className="text-2xl font-black text-slate-600 mb-4 pl-2">{groupName}</h4>
                            <div className="overflow-x-auto bg-slate-50/50 p-2 md:p-6 rounded-3xl border">
                                
                                {/* 分組積分榜 */}
                                {tournamentStandings[groupName] && (
                                    <table className="w-full text-left mb-4">
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
                                            {tournamentStandings[groupName]?.map((player, index) => (
                                                <tr key={player.id} className="font-bold">
                                                    <td className="px-4 py-3 text-center">{index + 1}</td>
                                                    <td className="px-4 py-3 text-slate-800">{player.name}</td>
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

                                {/* 分組對戰列表 */}
                                <table className="w-full text-left mt-6">
                                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                                        <tr>
                                            <th className="px-4 py-4 whitespace-nowrap">日期 / 地點</th>
                                            <th className="px-4 py-4 whitespace-nowrap">對賽球員</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">比分</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">狀態</th>
                                            <th className="px-4 py-4 text-center whitespace-nowrap">人氣</th>
                                            {role === 'admin' && <th className="px-4 py-4 text-center whitespace-nowrap">操作</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200/50">
                                        {groupedMatches[groupName].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(match => (
                                            <tr key={match.id} className={`transition-all ${match.status === 'completed' ? 'text-slate-400' : 'hover:bg-white/50'}`}>
                                                <td className="px-4 py-5 whitespace-nowrap">
                                                    <div className="font-bold text-slate-800">{match.date} <span className="font-mono text-sm ml-2">{match.time}</span></div>
                                                    <div className="text-xs">{match.venue}</div>
                                                </td>
                                                <td className="px-4 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`font-black text-base ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player1Name}</div>
                                                        <Swords size={14} className="text-slate-300 shrink-0"/>
                                                        <div className={`font-black text-base ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player2Name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 text-center whitespace-nowrap">
                                                    {match.status === 'completed' ? (
                                                        <span className="font-mono font-black text-xl md:text-2xl text-slate-800 tracking-widest">{match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`}</span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
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
                                                            <button 
                                                                onClick={(e) => handleCheerMatch(match.id, e)}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 border ${hasCheered ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-orange-500 hover:border-orange-200 hover:shadow-sm'}`}
                                                            >
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
                                                                    <button 
                                                                        onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }} 
                                                                        className="p-3 bg-red-50 text-red-600 rounded-xl border hover:bg-red-500 hover:text-white transition-all animate-pulse" 
                                                                        title="啟動即時轉播"
                                                                    >
                                                                        <PlayCircle size={16}/>
                                                                    </button>

                                                                    <button onClick={() => handleUpdateLeagueMatchScore(match)} className="p-3 bg-white text-blue-600 rounded-xl border hover:bg-blue-600 hover:text-white transition-all" title="輸入比分"><FileText size={16}/></button>
                                                                    <button onClick={() => handleEditLeagueMatch(match)} className="p-3 bg-white text-gray-600 rounded-xl border hover:bg-gray-600 hover:text-white transition-all" title="編輯比賽"><Pencil size={16}/></button>
                                                                </>
                                                            )}
                                                            <button onClick={() => deleteItem('league_matches', match.id)} className="p-3 bg-white text-red-500 rounded-xl border hover:bg-red-600 hover:text-white transition-all" title="刪除比賽"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
