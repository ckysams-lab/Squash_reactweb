// src/features/league/components/MatchupCard.jsx
import React from 'react';
import { Clock, Users, Zap, PlayCircle, Swords, Pencil, Trash2, ClipboardList } from 'lucide-react';

export const MatchupCard = ({ match, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students, onOpenTeamLineup }) => {
  const cheersCount = match.cheers?.length || 0;
  const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');
  const isTeamMatch = match.isTeamMatch;

  const p1Internal = students?.find(s => s.id === match.player1Id);
  const p2Internal = students?.find(s => s.id === match.player2Id);

  const p1Elo = p1Internal ? (p1Internal.points || 1000) : (match.extElo || 1000);
  const p2Elo = p2Internal ? (p2Internal.points || 1000) : (match.extElo || 1000);
  const p1WinProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const p2WinProb = 1 - p1WinProb;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden border border-slate-700 hover:-translate-y-1 transition-transform group will-change-transform">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <div className="flex justify-between items-center mb-5 relative z-10">
        <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-inner flex items-center gap-1">
          <Clock size={10} className="text-blue-400" /> {match.date === 'TBD' ? 'TBD (待定)' : `${match.date} ${match.time}`}
        </span>
        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2.5 py-1 border border-amber-500/30 rounded-lg bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          {isTeamMatch ? `團體對抗 (${match.teamSize}場制)` : (match.venue === 'TBD' ? '場地待定' : match.venue || match.matchOrder || '即將開戰')}
        </span>
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="text-center w-5/12">
          <div className="w-14 h-14 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {isTeamMatch ? <Users size={24} /> : (match.player1Name?.[0] || '?')}
          </div>
          <p className="font-black text-white text-sm truncate">{match.player1Name}</p>
        </div>
        <div className="w-2/12 text-center">
          <span className="text-xl font-black italic text-slate-500 drop-shadow-lg">VS</span>
        </div>
        <div className="text-center w-5/12">
          <div className="w-14 h-14 mx-auto bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            {isTeamMatch ? <Users size={24} /> : (match.player2Name?.[0] || '?')}
          </div>
          <p className="font-black text-white text-sm truncate">
            {match.player2Name} {!p2Internal && match.player2Id !== 'BYE' && !isTeamMatch && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded ml-1">外</span>}
          </p>
        </div>
      </div>

      {!isTeamMatch && match.status !== 'completed' && match.date !== 'TBD' && (
        <div className="bg-slate-950/50 rounded-xl p-3.5 mb-6 border border-slate-800 relative z-10">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            <span className="text-blue-400">{(p1WinProb * 100).toFixed(0)}%</span>
            <span className="text-slate-500 text-[9px]">勝率預測</span>
            <span className="text-orange-400">{(p2WinProb * 100).toFixed(0)}%</span>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
            <div className="bg-blue-500 h-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${p1WinProb * 100}%` }}></div>
            <div className="bg-orange-500 h-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" style={{ width: `${p2WinProb * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-slate-700/50 relative z-10">
        <button onClick={(e) => handleCheerMatch(match.id, e)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 shadow-lg ${hasCheered ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/50' : 'bg-slate-800 text-slate-400 hover:text-orange-400 hover:bg-slate-700'}`}>
          <Zap size={14} className={hasCheered ? 'fill-white' : ''} /> {cheersCount > 0 ? cheersCount : '支持'}
        </button>
        {role === 'admin' && (
          <div className="flex gap-2">
            {isTeamMatch ? (
              <button onClick={() => onOpenTeamLineup && onOpenTeamLineup(match)} className="px-4 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-all text-[11px] font-black tracking-widest shadow-md">
                <ClipboardList size={14} className="mr-1" /> 排陣/賽果
              </button>
            ) : (
              <>
                {!match.player2Id?.startsWith('ext_') && match.player2Id !== 'BYE' && (
                  <button onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="開啟轉播室"><PlayCircle size={14} /></button>
                )}
                <button onClick={() => handleUpdateLeagueMatchScore(match)} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all" title="輸入賽果"><Swords size={14} /></button>
                <button onClick={() => handleEditLeagueMatch(match)} className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 hover:text-white transition-all opacity-0 group-hover:opacity-100" title="編輯賽事"><Pencil size={12} /></button>
              </>
            )}
            <button onClick={() => deleteItem('league_matches', match.id)} className="w-8 h-8 rounded-full bg-slate-700 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
    </div>
  );
};
