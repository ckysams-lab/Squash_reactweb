// src/features/league/components/CompletedMatchRow.jsx
import React from 'react';
import { Pencil } from 'lucide-react';
import { StatusPill } from './StandingsTable';

export const CompletedMatchRow = ({ match, tournamentStandings, groupName, students, role, openScoreOverrideModal }) => {
  const scoreStr = match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`;
  const p2Internal = students?.find(s => s.id === match.player2Id);
  const isTeamMatch = match.isTeamMatch;

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-4 whitespace-nowrap align-middle">
        <p className="font-bold text-slate-700 text-sm">{match.date === 'TBD' ? '時間待定' : match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time === 'TBD' ? '' : match.time}</p>
      </td>
      <td className="px-4 py-4 min-w-[200px] align-middle">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>{match.player1Name}</span>
          <span className="text-[10px] font-black text-slate-300 italic px-1">vs</span>
          <span className={`font-black text-sm flex items-center gap-1 ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
            {match.player2Name} {!p2Internal && match.player2Id && match.player2Id !== 'BYE' && !isTeamMatch && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider">外校</span>}
          </span>
        </div>
        {match.gameScoresStr && !isTeamMatch && <p className="text-[10px] font-mono text-slate-400 mt-1">{match.gameScoresStr}</p>}
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle">
        <span className="font-mono font-black text-xl text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{scoreStr}</span>
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle flex items-center justify-center gap-2 h-full min-h-[64px]">
        <StatusPill status={match.status} />
        {role === 'admin' && match.matchType !== 'external' && !match.matchType?.includes('tournament_bracket') && !isTeamMatch && (
          <button
            onClick={() => openScoreOverrideModal(match)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="修改最終比分"
          >
            <Pencil size={14} />
          </button>
        )}
      </td>
    </tr>
  );
};
