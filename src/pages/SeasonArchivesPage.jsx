// src/pages/SeasonArchivesPage.jsx
import React from 'react';
import { Archive, Trophy, Calendar, Medal, Trash2 } from 'lucide-react';
import { BADGE_DATA } from '../constants/data';

export default function SeasonArchivesPage({ archives, handleArchiveSeason, role, deleteItem }) {
    
    // 依日期排序，最新的在前面
    const sortedArchives = [...archives].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 標題與操作區 */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner"><Archive size={28}/></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">歷年賽季 <span className="text-slate-300 font-normal">|</span> Hall of Records</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1 tracking-wider">永久封存的賽季排行榜與傳奇紀錄</p>
                    </div>
                </div>
                {role === 'admin' && (
                    <button onClick={handleArchiveSeason} className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1">
                        <Archive size={18}/> 封存當前賽季
                    </button>
                )}
            </div>

            {/* 歷史賽季列表 */}
            {sortedArchives.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-24 border border-dashed flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><Trophy size={48}/></div>
                    <p className="text-2xl font-black text-slate-400">尚未封存任何賽季</p>
                    <p className="text-slate-400 font-bold mt-2">當學年結束時，教練可以點擊上方按鈕將目前的排行榜永久保存。</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {sortedArchives.map((archive, idx) => (
                        <div key={archive.id} className="bg-slate-900 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                            {/* 背景裝飾 */}
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Trophy size={300}/></div>
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            
                            {/* 賽季標題 */}
                            <div className="relative z-10 flex justify-between items-start mb-10 border-b border-slate-700/50 pb-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                                        <Calendar size={14}/> SEASON ARCHIVE
                                    </div>
                                    <h2 className="text-4xl font-black text-white">{archive.seasonName}</h2>
                                    <p className="text-slate-400 font-bold mt-2 flex items-center gap-2">
                                        <Swords size={16}/> 全季共完成 <span className="text-emerald-400 font-black">{archive.totalMatches || 0}</span> 場官方對決
                                    </p>
                                </div>
                                {role === 'admin' && (
                                    <button onClick={() => deleteItem('season_archives', archive.id)} className="p-3 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all">
                                        <Trash2 size={18}/>
                                    </button>
                                )}
                            </div>

                            {/* 🏆 冠亞季軍 (Top 3) */}
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {archive.topPlayers?.slice(0, 3).map((p, i) => {
                                    const medals = [
                                        { i: '🥇', c: 'text-amber-400', b: 'border-amber-400/50', bg: 'bg-gradient-to-br from-amber-500/20 to-transparent' },
                                        { i: '🥈', c: 'text-slate-300', b: 'border-slate-400/50', bg: 'bg-gradient-to-br from-slate-400/20 to-transparent' },
                                        { i: '🥉', c: 'text-orange-400', b: 'border-orange-500/50', bg: 'bg-gradient-to-br from-orange-500/20 to-transparent' }
                                    ];
                                    return (
                                        <div key={p.name} className={`flex items-center gap-4 p-5 rounded-2xl border ${medals[i].b} ${medals[i].bg} backdrop-blur-md`}>
                                            <div className="text-4xl drop-shadow-lg">{medals[i].i}</div>
                                            <div>
                                                <p className={`text-xl font-black ${medals[i].c}`}>{p.name}</p>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{p.class} • Elo: {p.points}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 其他入榜者 (4-10名) */}
                            {archive.topPlayers?.length > 3 && (
                                <div className="relative z-10 bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Medal size={14}/> 菁英榜單 (Top 10)
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {archive.topPlayers.slice(3, 10).map((p, i) => (
                                            <div key={p.name} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-500 font-black text-sm w-4">{i + 4}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200">{p.name}</p>
                                                        <p className="text-[10px] text-slate-500">{p.class}</p>
                                                    </div>
                                                </div>
                                                <span className="text-blue-400 font-mono font-black text-sm">{p.points}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
