// src/features/league/components/StandingsTable.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

export const TrendIndicator = ({ trend }) => {
  if (trend > 0) return (<span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px] font-bold"><ArrowUp size={10} strokeWidth={2.5} />{trend}</span>);
  if (trend < 0) return (<span className="inline-flex items-center gap-0.5 text-rose-500 text-[11px] font-bold"><ArrowDown size={10} strokeWidth={2.5} />{Math.abs(trend)}</span>);
  return <Minus size={10} className="text-slate-300" />;
};

export const StatusPill = ({ status }) =>
  status === 'completed' ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">已完賽</span>)
  : (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">待開賽</span>);

export const RankBadge = ({ rank }) => {
  const styles = { 1: 'bg-amber-100 text-amber-800', 2: 'bg-slate-100 text-slate-600', 3: 'bg-orange-100 text-orange-700' };
  return (<span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${styles[rank] ?? 'bg-slate-50 text-slate-400'}`}>{rank}</span>);
};

export const StandingsTable = ({ players }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { setCurrentPage(1); }, [players]);

  const totalPages = Math.ceil(players.length / itemsPerPage);
  const paginatedPlayers = useMemo(() => {
    return players.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [players, currentPage]);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto mb-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] border-b border-slate-100">
              <th className="px-3 py-3 text-left w-16">排名</th>
              <th className="px-3 py-3 text-left">選手 / 隊伍</th>
              <th className="px-3 py-3 text-center w-16">已賽/勝</th>
              <th className="px-3 py-3 text-center w-16">勝率</th>
              <th className="px-3 py-3 text-center w-16">淨得局</th>
              <th className="px-3 py-3 text-center w-20">總積分</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPlayers.map((player, index) => {
              const actualRank = (currentPage - 1) * itemsPerPage + index + 1;
              const winRate = player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0;
              return (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-3 py-3.5"><div className="flex items-center gap-1.5"><RankBadge rank={actualRank} /><TrendIndicator trend={player.trend} /></div></td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{player.name}</span>
                      {player.isExternal && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">外卡</span>}
                      {player.hotStreak >= 3 && <span title={`目前 ${player.hotStreak} 連勝`} className="text-orange-500 text-sm">🔥</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center text-slate-500 font-bold">{player.played} <span className="text-slate-300 font-normal">/</span> <span className="text-emerald-600">{player.wins}</span></td>
                  <td className="px-3 py-3.5 text-center"><div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{winRate}%</div></td>
                  <td className="px-3 py-3.5 text-center font-mono text-xs"><span className={player.pointsDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>{player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}</span></td>
                  <td className="px-3 py-3.5 text-center"><span className="text-blue-600 font-black text-lg">{player.leaguePoints}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-[1rem]">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} /> 上一頁
          </button>
          <div className="text-[10px] font-black text-slate-400 tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">
            PAGE {currentPage} / {totalPages}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors">
            下一頁 <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
