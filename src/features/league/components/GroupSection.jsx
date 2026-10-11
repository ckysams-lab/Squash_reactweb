// src/features/league/components/GroupSection.jsx
import React, { useMemo, useState } from 'react';
import { Trash2, Zap, Activity, MoreHorizontal } from 'lucide-react';
import { StandingsTable } from './StandingsTable';
import { MatchupCard } from './MatchupCard';
import { CompletedMatchRow } from './CompletedMatchRow';

export const GroupSection = ({ groupName, matches, enrichedStandings, tournamentStandings, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students, openScoreOverrideModal, onDeleteGroup, onOpenTeamLineup }) => {
  const players = enrichedStandings?.[groupName] || [];
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (a.date === 'TBD' && b.date !== 'TBD') return 1;
      if (a.date !== 'TBD' && b.date === 'TBD') return -1;
      return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
    });
  }, [matches]);

  const completedMatches = sortedMatches.filter(m => m.status === 'completed');
  const scheduledMatches = sortedMatches.filter(m => m.status === 'scheduled');

  const [scheduledLimit, setScheduledLimit] = useState(6);
  const [completedLimit, setCompletedLimit] = useState(10);

  const completedCount = completedMatches.length;
  const totalCount = matches.length;

  return (
    <div className="mb-12 animate-in fade-in">
      <div className="flex items-center gap-3 mb-4 px-1">
        <h4 className="text-xl font-black text-slate-800">{groupName}</h4>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{players.length} Players/Teams</span>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{completedCount}/{totalCount} Completed</span>

        {role === 'admin' && onDeleteGroup && (
          <button onClick={() => onDeleteGroup(groupName)} className="ml-auto p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="刪除此組別的所有賽事">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        {players.length > 0 && (
          <>
            <StandingsTable players={players} />
            <div className="border-t-2 border-dashed border-slate-100 mt-6 pt-6 mb-6"></div>
          </>
        )}

        {scheduledMatches.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Zap size={14} /> 待排程或即將上演 (Upcoming Matches)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {scheduledMatches.slice(0, scheduledLimit).map(match => (
                <MatchupCard key={match.id} match={match} role={role} currentUserInfo={currentUserInfo} handleCheerMatch={handleCheerMatch} setActiveLeagueMatch={setActiveLeagueMatch} setShowUmpirePanel={setShowUmpirePanel} handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore} handleEditLeagueMatch={handleEditLeagueMatch} deleteItem={deleteItem} students={students} onOpenTeamLineup={onOpenTeamLineup} />
              ))}
            </div>
            {scheduledMatches.length > scheduledLimit && (
              <div className="flex justify-center mt-6">
                <button onClick={() => setScheduledLimit(l => l + 6)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-sm font-bold transition-colors">
                  <MoreHorizontal size={16} /> 載入更多即將上演賽事
                </button>
              </div>
            )}
          </div>
        )}

        {completedMatches.length > 0 && (
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity size={14} /> 完賽紀錄 (Results)
            </p>
            <div className="overflow-x-auto bg-slate-50/50 rounded-2xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left whitespace-nowrap">日期 / 場次</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">對戰組合</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">最終比分</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedMatches.slice(0, completedLimit).map(match => (
                    <CompletedMatchRow key={match.id} match={match} tournamentStandings={tournamentStandings} groupName={groupName} students={students} role={role} openScoreOverrideModal={openScoreOverrideModal} />
                  ))}
                </tbody>
              </table>
            </div>
            {completedMatches.length > completedLimit && (
              <div className="flex justify-center mt-4">
                <button onClick={() => setCompletedLimit(l => l + 10)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full text-sm font-bold border border-slate-200 transition-colors">
                  <MoreHorizontal size={16} /> 載入更多完賽紀錄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
