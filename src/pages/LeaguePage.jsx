// src/pages/LeaguePage.jsx (Version 4.1 — Professional Elo Redesign)
// 更新內容: 完美融合 Elo 系統。新增賽前預測條 (Mini Tale of the Tape)、勝率分析，並將聯賽積分替換為專業 Elo 積分展示。

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Target, Activity, Plus, Swords, Zap, PlayCircle, FileText,
  Pencil, Trash2, Download, Loader2, Trophy, ArrowUp, ArrowDown,
  Minus, ShieldAlert, ChevronDown, Medal, Percent
} from 'lucide-react';
import html2canvas from 'html2canvas';
import LeagueStandingsPoster from '../components/LeagueStandingsPoster';

// ─── Small helpers ────────────────────────────────────────────────────────────

const TrendIndicator = ({ trend }) => {
  if (trend > 0) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px] font-bold" title={`排名上升 ${trend} 位`}>
      <ArrowUp size={10} strokeWidth={2.5} />
      {trend}
    </span>
  );
  if (trend < 0) return (
    <span className="inline-flex items-center gap-0.5 text-rose-500 text-[11px] font-bold" title={`排名下降 ${Math.abs(trend)} 位`}>
      <ArrowDown size={10} strokeWidth={2.5} />
      {Math.abs(trend)}
    </span>
  );
  return <Minus size={10} className="text-slate-300" title="排名不變" />;
};

const StatusPill = ({ status }) =>
  status === 'completed' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
      已完賽
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
      待開賽
    </span>
  );

const RankBadge = ({ rank }) => {
  const styles = {
    1: 'bg-amber-100 text-amber-800 shadow-sm',
    2: 'bg-slate-100 text-slate-600 shadow-sm',
    3: 'bg-orange-100 text-orange-700 shadow-sm',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${styles[rank] ?? 'bg-slate-50 text-slate-400'}`}>
      {rank}
    </span>
  );
};

// Top-3 podium strip
const PodiumStrip = ({ players }) => {
  const medals = [
    { icon: '🥇', accent: 'border-l-amber-400', bg: 'bg-gradient-to-r from-amber-50 to-white' },
    { icon: '🥈', accent: 'border-l-slate-400', bg: 'bg-gradient-to-r from-slate-100 to-white' },
    { icon: '🥉', accent: 'border-l-orange-400', bg: 'bg-gradient-to-r from-orange-50 to-white' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      {players.slice(0, 3).map((p, i) => (
        <div key={p.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border-l-[4px] shadow-sm ${medals[i].accent} ${medals[i].bg}`}>
          <span className="text-2xl leading-none drop-shadow-sm">{medals[i].icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Elo: {p.totalPoints || p.leaguePoints}</p>
          </div>
          {p.hotStreak >= 3 && (
            <span title={`${p.hotStreak} 連勝`} className="text-orange-500 text-lg animate-pulse">🔥</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Team Tie scoreboard (保持不變) ───────────────────────────────────────────
const TeamTieBoard = ({ groupName, matches }) => {
  if (!groupName?.includes(' vs ')) return null;
  const [teamA, teamB] = groupName.split(' vs ');
  let aWins = 0, bWins = 0, completed = 0;

  matches.forEach(m => {
    if (m.status !== 'completed') return;
    completed++;
    const aWon =
      (m.winnerId === m.player1Id && m.player1Name?.startsWith(teamA)) ||
      (m.winnerId === m.player2Id && m.player2Name?.startsWith(teamA));
    if (aWon) aWins++;
    else bWins++;
  });

  const finished = completed === matches.length && matches.length > 0;
  const winner = aWins > bWins ? teamA : bWins > aWins ? teamB : null;

  return (
    <div className="rounded-2xl bg-slate-900 text-white p-6 mb-6 relative overflow-hidden shadow-lg">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 relative z-10">
        團體對抗賽
      </p>
      <div className="flex items-center justify-center gap-6 relative z-10">
        <p className={`text-2xl font-black ${aWins > bWins ? 'text-amber-400' : 'text-white'}`}>{teamA}</p>
        <div className="flex items-center gap-3">
          <span className="w-12 h-14 flex items-center justify-center bg-slate-800/80 rounded-xl text-3xl font-black border border-slate-700 backdrop-blur-sm">{aWins}</span>
          <span className="text-slate-600 font-black">:</span>
          <span className="w-12 h-14 flex items-center justify-center bg-slate-800/80 rounded-xl text-3xl font-black border border-slate-700 backdrop-blur-sm">{bWins}</span>
        </div>
        <p className={`text-2xl font-black ${bWins > aWins ? 'text-amber-400' : 'text-white'}`}>{teamB}</p>
      </div>
      <div className="mt-5 text-center text-sm relative z-10">
        {finished ? (
          <span className="inline-flex items-center gap-2 bg-amber-500 text-amber-950 px-5 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-md">
            <Trophy size={13} />
            {winner ? `${winner} 奪勝` : '雙方戰平'}
          </span>
        ) : (
          <span className="text-slate-400 text-xs font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            進度 {completed} / {matches.length} 場
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Standings table ──────────────────────────────────────────────────────────

const StandingsTable = ({ players }) => (
  <div className="overflow-x-auto mb-1">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em]">
          <th className="px-3 py-3 text-left w-16">排名</th>
          <th className="px-3 py-3 text-left">隊員</th>
          <th className="px-3 py-3 text-center w-16">已賽/勝</th>
          <th className="px-3 py-3 text-center w-16">勝率</th>
          <th className="px-3 py-3 text-center w-16">淨得局</th>
          <th className="px-3 py-3 text-center w-20">Elo 積分</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {players.map((player, index) => {
           const winRate = player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0;
           return (
            <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={index + 1} />
                  <TrendIndicator trend={player.trend} />
                </div>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">{player.name}</span>
                  {player.hotStreak >= 3 && <span title={`目前 ${player.hotStreak} 連勝`} className="text-orange-500 text-sm">🔥</span>}
                </div>
              </td>
              <td className="px-3 py-3.5 text-center text-slate-500 font-bold">
                {player.played} <span className="text-slate-300 font-normal">/</span> <span className="text-emerald-600">{player.wins}</span>
              </td>
              <td className="px-3 py-3.5 text-center">
                 <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    {winRate}%
                 </div>
              </td>
              <td className="px-3 py-3.5 text-center font-mono text-xs">
                <span className={player.pointsDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                  {player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}
                </span>
              </td>
              <td className="px-3 py-3.5 text-center">
                {/* 顯示 Elo 積分取代傳統聯賽分 */}
                <span className="text-blue-600 font-black text-lg">{player.totalPoints || player.leaguePoints}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
);

// ─── Match row (引入賽前預測條) ───────────────────────────────────────────────

const MatchRow = ({
  match, role, tournamentStandings, groupName, currentUserInfo,
  handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel,
  handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students
}) => {
  const isGiantSlayer = useMemo(() => {
    if (match.status !== 'completed' || !match.winnerId) return false;
    const group = tournamentStandings?.[groupName];
    if (!Array.isArray(group)) return false;
    const winnerRank = group.findIndex(p => p.id === match.winnerId);
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const loserRank = group.findIndex(p => p.id === loserId);
    return winnerRank !== -1 && loserRank !== -1 && winnerRank > loserRank;
  }, [match, tournamentStandings, groupName]);

  const cheersCount = match.cheers?.length || 0;
  const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');
  const isDone = match.status === 'completed';

  const scoreStr = isDone
    ? (match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`)
    : null;

  // 👉 Elo 賽前預測邏輯 (Mini Tale of the Tape) 👈
  const p1Elo = useMemo(() => students?.find(s => s.id === match.player1Id)?.totalPoints || 1000, [students, match.player1Id]);
  const p2Elo = useMemo(() => students?.find(s => s.id === match.player2Id)?.totalPoints || 1000, [students, match.player2Id]);
  const p1WinProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const p2WinProb = 1 - p1WinProb;

  return (
    <tr className={`transition-colors ${isDone ? '' : 'hover:bg-slate-50'}`}>
      <td className="px-4 py-4 whitespace-nowrap align-top pt-5">
        <p className="font-bold text-slate-700 text-sm">{match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time}</p>
        {(match.matchOrder || match.venue) && (
          <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-wider">{match.matchOrder || match.venue}</p>
        )}
      </td>

      <td className="px-4 py-4 min-w-[200px]">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>
                {match.player1Name}
              </span>
              <span className="text-[10px] font-black text-slate-300 italic px-1">vs</span>
              <span className={`font-black text-sm ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
                {match.player2Name}
              </span>
              {isGiantSlayer && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase tracking-wider">
                  <ShieldAlert size={10} /> 爆冷
                </span>
              )}
            </div>

            {/* 👉 未開賽時顯示：Mini Tale of the Tape (預測條) 👈 */}
            {!isDone && match.matchType !== 'external' && (
                <div className="mt-1 w-full max-w-[220px]">
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      <span className="text-blue-500">勝率 {(p1WinProb*100).toFixed(0)}%</span>
                      <span className="text-orange-500">{(p2WinProb*100).toFixed(0)}%</span>
                   </div>
                   <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100 shadow-inner">
                      <div className="bg-blue-500 h-full" style={{ width: `${p1WinProb * 100}%` }}></div>
                      <div className="bg-orange-400 h-full" style={{ width: `${p2WinProb * 100}%` }}></div>
                   </div>
                </div>
            )}
        </div>
      </td>

      <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
        {scoreStr
          ? <span className="font-mono font-black text-xl text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{scoreStr}</span>
          : <span className="text-slate-300 font-bold text-lg">—</span>
        }
      </td>

      <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
        <StatusPill status={match.status} />
      </td>

      <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
        <button
          onClick={(e) => handleCheerMatch(match.id, e)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 shadow-sm ${
            hasCheered
              ? 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 border-orange-200'
              : 'bg-white text-slate-400 border-slate-200 hover:text-orange-500 hover:border-orange-300'
          }`}
        >
          <Zap size={12} className={hasCheered ? 'fill-orange-500' : ''} />
          {cheersCount > 0 ? cheersCount : '支持'}
        </button>
      </td>

      {role === 'admin' && (
        <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
          <div className="flex justify-center gap-1.5">
            {match.status === 'scheduled' && match.matchType !== 'external' && (
              <>
                <button
                  onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }}
                  className="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="即時轉播"
                >
                  <PlayCircle size={14} />
                </button>
                <button
                  onClick={() => handleUpdateLeagueMatchScore(match)}
                  className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  title="結算 Elo 積分"
                >
                  <Swords size={14} />
                </button>
                <button
                  onClick={() => handleEditLeagueMatch(match)}
                  className="p-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-600 hover:text-white transition-all shadow-sm"
                  title="編輯"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => deleteItem('league_matches', match.id)}
              className="p-2.5 rounded-xl bg-white text-red-400 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
              title="刪除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

// ─── Group section ────────────────────────────────────────────────────────────

const GroupSection = ({
  groupName, matches, enrichedStandings, tournamentStandings,
  role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch,
  setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch,
  deleteItem, students
}) => {
  const isTeamTie = groupName.includes(' vs ');
  const players = enrichedStandings?.[groupName] || [];
  const sortedMatches = [...matches].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.matchOrder || '').localeCompare(b.matchOrder || '')
  );
  const completed = matches.filter(m => m.status === 'completed').length;
  const total = matches.length;

  return (
    <div className="mb-10">
      {!isTeamTie && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <h4 className="text-xl font-black text-slate-800">{groupName}</h4>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
            {players.length} Players
          </span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
            {completed}/{total} Completed
          </span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <TeamTieBoard groupName={groupName} matches={matches} />

          {!isTeamTie && players.length > 0 && (
            <>
              <PodiumStrip players={players} />
              <StandingsTable players={players} />
              <div className="border-t-2 border-dashed border-slate-100 mt-6 pt-6 mb-2">
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14}/> 賽事預測與記錄
                </p>
              </div>
            </>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-4 py-3 text-left whitespace-nowrap">日期 / 場次</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">對賽球員 (預測勝率)</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">比分</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">狀態</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">人氣</th>
                  {role === 'admin' && <th className="px-4 py-3 text-center whitespace-nowrap">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedMatches.map(match => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    role={role}
                    groupName={groupName}
                    tournamentStandings={tournamentStandings}
                    currentUserInfo={currentUserInfo}
                    handleCheerMatch={handleCheerMatch}
                    setActiveLeagueMatch={setActiveLeagueMatch}
                    setShowUmpirePanel={setShowUmpirePanel}
                    handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore}
                    handleEditLeagueMatch={handleEditLeagueMatch}
                    deleteItem={deleteItem}
                    students={students}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── My stats banner (升級版) ────────────────────────────────────────────────

const MyStatsBanner = ({ stats, upcomingMatches, selectedTournament, currentUserInfo }) => {
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  
  return (
    <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 md:p-8 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md"><Trophy size={18} /></div>
          <div>
            <h4 className="font-black text-slate-800 text-lg">我的戰績中心</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedTournament}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm">
          <p className="text-3xl font-black text-slate-700">{stats.played}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">已賽場數</p>
        </div>
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5"><Percent size={40}/></div>
          <p className="text-3xl font-black text-emerald-600">{winRate}%</p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">賽事勝率</p>
        </div>
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm">
          <p className={`text-3xl font-black ${stats.pointsDiff >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
            {stats.pointsDiff > 0 ? `+${stats.pointsDiff}` : stats.pointsDiff}
          </p>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">得失局差</p>
        </div>
        <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-2xl py-4 shadow-md text-white">
          <p className="text-3xl font-black font-mono tracking-tighter">{stats.leaguePoints}</p>
          <p className="text-[10px] font-black text-blue-200 mt-1 uppercase tracking-widest">目前 Elo 積分</p>
        </div>
      </div>

      {upcomingMatches.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={12}/> 即將對陣 (Tale of the Tape)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingMatches.map(m => (
              <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400">{m.date} {m.time}</span>
                  <span className="text-sm font-black text-slate-700 mt-0.5">vs {m.player1Id === currentUserInfo.id ? m.player2Name : m.player1Name}</span>
                </div>
                <StatusPill status="scheduled" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LeaguePage({
  role, currentUserInfo, setShowTacticalBoard, setShowUmpirePanel,
  setActiveLeagueMatch, setShowTournamentModal, selectedTournament,
  setSelectedTournament, tournamentList, leagueMatches, myTournamentStats,
  myUpcomingMatches, groupedMatches, tournamentStandings, handleCheerMatch,
  handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, schoolLogo,
  students,
}) {
  const posterRef = useRef();
  const [isRenderingPoster, setIsRenderingPoster] = useState(false);
  const [previousStandings, setPreviousStandings] = useState({});

  useEffect(() => {
    if (tournamentStandings && Object.keys(tournamentStandings).length > 0) {
      setPreviousStandings(prev => ({ ...prev, [selectedTournament]: tournamentStandings }));
    }
  }, [tournamentStandings, selectedTournament]);

  useEffect(() => {
    setPreviousStandings({});
  }, [selectedTournament]);

  const handleDownloadPoster = useCallback(() => {
    if (!tournamentStandings || Object.keys(tournamentStandings).length === 0)
      return alert('目前沒有可生成的積分榜數據。');
    setIsRenderingPoster(true);
    setTimeout(() => {
      html2canvas(posterRef.current, { scale: 2, useCORS: true })
        .then(canvas => {
          const a = document.createElement('a');
          a.download = `league_standings_${selectedTournament}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
        })
        .catch(err => { console.error(err); alert('海報生成失敗。'); })
        .finally(() => setIsRenderingPoster(false));
    }, 500);
  }, [tournamentStandings, selectedTournament]);

  const enrichedStandings = useMemo(() => {
    if (!tournamentStandings || typeof tournamentStandings !== 'object') return {};
    const safeMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
    const prevData = previousStandings?.[selectedTournament] ?? null;
    const result = {};

    for (const group of Object.keys(tournamentStandings)) {
      const current = tournamentStandings[group];
      if (!Array.isArray(current)) continue;
      
      // Update the points mapping to ensure Elo is respected
      result[group] = current.map((player, index) => {
        const studentInfo = students?.find(s => s.id === player.id);
        const actualElo = studentInfo?.totalPoints || player.leaguePoints || 1000;
        
        const pMatches = safeMatches
          .filter(m =>
            m.status === 'completed' &&
            (m.player1Id === player.id || m.player2Id === player.id) &&
            m.tournamentName === selectedTournament
          )
          .sort((a, b) =>
            (b.updatedAt?.seconds || b.timestamp?.seconds || 0) -
            (a.updatedAt?.seconds || a.timestamp?.seconds || 0)
          );
        let hotStreak = 0;
        for (const m of pMatches) {
          if (m.winnerId === player.id) hotStreak++;
          else break;
        }
        const prevGroup = Array.isArray(prevData?.[group]) ? prevData[group] : [];
        const prevRank = prevGroup.findIndex(p => p.id === player.id);
        const trend = prevRank !== -1 ? prevRank - index : 0;
        return { ...player, hotStreak, trend, totalPoints: actualElo };
      });
      // Re-sort based on Elo (highest first)
      result[group].sort((a, b) => b.totalPoints - a.totalPoints);
    }
    return result;
  }, [tournamentStandings, leagueMatches, previousStandings, selectedTournament, students]);

  const safeTournamentList  = Array.isArray(tournamentList) ? tournamentList : [];
  const safeGroupedMatches  = groupedMatches && typeof groupedMatches === 'object' ? groupedMatches : {};
  const safeLeagueMatches   = Array.isArray(leagueMatches) ? leagueMatches : [];
  const safeUpcomingMatches = Array.isArray(myUpcomingMatches) ? myUpcomingMatches : [];
  const hasStandings = tournamentStandings && Object.keys(tournamentStandings).length > 0;

  return (
    <div className="space-y-0 animate-in fade-in duration-500">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Medal size={28}/></div>
             <div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">聯賽專區</h3>
               <p className="text-slate-500 text-sm mt-1 font-bold">預測分析與 Elo 職業積分榜</p>
             </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative shadow-sm rounded-xl">
              <select
                value={selectedTournament}
                onChange={e => setSelectedTournament(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-black text-slate-700 outline-none cursor-pointer hover:bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all min-w-[220px]"
              >
                {safeTournamentList.length === 0
                  ? <option value="">暫無賽事</option>
                  : safeTournamentList.map(t => <option key={t} value={t}>{t}</option>)
                }
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {role === 'admin' && (
              <>
                <button
                  onClick={setShowTacticalBoard.bind(null, true)}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"
                >
                  <Target size={16} /> 戰術板
                </button>
                <button
                  onClick={setShowUmpirePanel.bind(null, true)}
                  className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-md animate-pulse"
                >
                  <Activity size={16} /> 轉播室
                </button>
                <button
                  onClick={handleDownloadPoster}
                  disabled={isRenderingPoster || !hasStandings}
                  className="p-3 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 shadow-sm"
                  title="下載積分榜海報"
                >
                  {isRenderingPoster ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
                <button
                  onClick={() => setShowTournamentModal(true)}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                  title="建立新賽事"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Student's own stats */}
        {role === 'student' && myTournamentStats && (
          <MyStatsBanner
            stats={myTournamentStats}
            upcomingMatches={safeUpcomingMatches}
            selectedTournament={selectedTournament}
            currentUserInfo={currentUserInfo}
          />
        )}

        {/* Empty state */}
        {Object.keys(safeGroupedMatches).length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <div className="p-6 bg-slate-50 rounded-full mb-4"><Trophy size={48} strokeWidth={1.5} className="text-slate-300" /></div>
            <p className="font-black text-slate-400 text-lg">
              {safeLeagueMatches.length > 0 ? '請選擇上方的一個賽事' : '暫無賽事，教練可建立新賽事'}
            </p>
          </div>
        )}
      </div>

      {/* ── Group sections ───────────────────────────────────────────────── */}
      {Object.keys(safeGroupedMatches).map(groupName => (
        <GroupSection
          key={groupName}
          groupName={groupName}
          matches={safeGroupedMatches[groupName]}
          enrichedStandings={enrichedStandings}
          tournamentStandings={tournamentStandings}
          role={role}
          currentUserInfo={currentUserInfo}
          handleCheerMatch={handleCheerMatch}
          setActiveLeagueMatch={setActiveLeagueMatch}
          setShowUmpirePanel={setShowUmpirePanel}
          handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore}
          handleEditLeagueMatch={handleEditLeagueMatch}
          deleteItem={deleteItem}
          students={students}
        />
      ))}

      {/* Hidden poster renderer */}
      {isRenderingPoster && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
          <LeagueStandingsPoster
            ref={posterRef}
            tournamentName={selectedTournament}
            standings={
              hasStandings
                ? Object.values(tournamentStandings).flat().sort((a, b) => b.leaguePoints - a.leaguePoints)
                : []
            }
            upcomingMatches={safeLeagueMatches}
            schoolLogo={schoolLogo}
          />
        </div>
      )}
    </div>
  );
}
