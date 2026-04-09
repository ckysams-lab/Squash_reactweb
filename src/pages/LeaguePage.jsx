// src/pages/LeaguePage.jsx (Version 4.0 — Professional Redesign)

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Target, Activity, Plus, Swords, Zap, PlayCircle, FileText,
  Pencil, Trash2, Download, Loader2, Trophy, ArrowUp, ArrowDown,
  Minus, ShieldAlert, ChevronDown, Medal,
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
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
      已完賽
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
      待開賽
    </span>
  );

const RankBadge = ({ rank }) => {
  const styles = {
    1: 'bg-amber-100 text-amber-800',
    2: 'bg-slate-100 text-slate-600',
    3: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${styles[rank] ?? 'bg-slate-50 text-slate-400'}`}>
      {rank}
    </span>
  );
};

// Top-3 podium strip above the full standings table
const PodiumStrip = ({ players }) => {
  const medals = [
    { icon: '🥇', accent: 'border-l-amber-400' },
    { icon: '🥈', accent: 'border-l-slate-400' },
    { icon: '🥉', accent: 'border-l-orange-400' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {players.slice(0, 3).map((p, i) => (
        <div key={p.id} className={`flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border-l-[3px] ${medals[i].accent}`}>
          <span className="text-base leading-none">{medals[i].icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800 truncate">{p.name}</p>
            <p className="text-xs font-bold text-slate-400">{p.leaguePoints} 分</p>
          </div>
          {p.hotStreak >= 3 && (
            <span title={`${p.hotStreak} 連勝`} className="text-orange-500 text-sm">🔥</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Team Tie scoreboard ──────────────────────────────────────────────────────

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
    <div className="rounded-2xl bg-slate-900 text-white p-6 mb-6">
      <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">
        團體對抗賽
      </p>
      <div className="flex items-center justify-center gap-6">
        <p className={`text-2xl font-black ${aWins > bWins ? 'text-amber-400' : 'text-white'}`}>{teamA}</p>
        <div className="flex items-center gap-3">
          <span className="w-12 h-14 flex items-center justify-center bg-slate-800 rounded-xl text-3xl font-black border border-slate-700">{aWins}</span>
          <span className="text-slate-600 font-black">:</span>
          <span className="w-12 h-14 flex items-center justify-center bg-slate-800 rounded-xl text-3xl font-black border border-slate-700">{bWins}</span>
        </div>
        <p className={`text-2xl font-black ${bWins > aWins ? 'text-amber-400' : 'text-white'}`}>{teamB}</p>
      </div>
      <div className="mt-5 text-center text-sm">
        {finished ? (
          <span className="inline-flex items-center gap-2 bg-amber-500 text-amber-950 px-5 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
            <Trophy size={13} />
            {winner ? `${winner} 奪勝` : '雙方戰平'}
          </span>
        ) : (
          <span className="text-slate-500 text-xs font-bold">
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
          <th className="px-3 py-2.5 text-left w-16">排名</th>
          <th className="px-3 py-2.5 text-left">球員</th>
          <th className="px-3 py-2.5 text-center w-12">已賽</th>
          <th className="px-3 py-2.5 text-center w-10">勝</th>
          <th className="px-3 py-2.5 text-center w-10">負</th>
          <th className="px-3 py-2.5 text-center w-16">分差</th>
          <th className="px-3 py-2.5 text-center w-16">積分</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {players.map((player, index) => (
          <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-3 py-3">
              <div className="flex items-center gap-1.5">
                <RankBadge rank={index + 1} />
                <TrendIndicator trend={player.trend} />
              </div>
            </td>
            <td className="px-3 py-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">{player.name}</span>
                {player.hotStreak >= 3 && (
                  <span title={`目前 ${player.hotStreak} 連勝`} className="text-orange-500 text-sm">🔥</span>
                )}
              </div>
            </td>
            <td className="px-3 py-3 text-center text-slate-400 font-medium">{player.played}</td>
            <td className="px-3 py-3 text-center text-emerald-600 font-bold">{player.wins}</td>
            <td className="px-3 py-3 text-center text-rose-500 font-bold">{player.losses}</td>
            <td className="px-3 py-3 text-center font-mono text-xs">
              <span className={player.pointsDiff >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                {player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}
              </span>
            </td>
            <td className="px-3 py-3 text-center">
              <span className="text-blue-600 font-black text-base">{player.leaguePoints}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Match row ────────────────────────────────────────────────────────────────

const MatchRow = ({
  match, role, tournamentStandings, groupName, currentUserInfo,
  handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel,
  handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem,
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

  return (
    <tr className={`transition-colors ${isDone ? '' : 'hover:bg-slate-50'}`}>
      {/* Date / time */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="font-bold text-slate-700 text-sm">{match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time}</p>
        {(match.matchOrder || match.venue) && (
          <p className="text-[10px] text-blue-500 font-bold mt-0.5">{match.matchOrder || match.venue}</p>
        )}
      </td>

      {/* Players */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>
            {match.player1Name}
          </span>
          <Swords size={12} className="text-slate-300 shrink-0" />
          <span className={`font-black text-sm ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
            {match.player2Name}
          </span>
          {isGiantSlayer && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
              <ShieldAlert size={10} />
              巨人殺手
            </span>
          )}
        </div>
      </td>

      {/* Score */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        {scoreStr
          ? <span className="font-mono font-black text-xl text-slate-800 tracking-wider">{scoreStr}</span>
          : <span className="text-slate-200 font-bold">—</span>
        }
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        <StatusPill status={match.status} />
      </td>

      {/* Cheer */}
      <td className="px-4 py-3.5 text-center whitespace-nowrap">
        <button
          onClick={(e) => handleCheerMatch(match.id, e)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 ${
            hasCheered
              ? 'bg-orange-50 text-orange-600 border-orange-200'
              : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:text-orange-500 hover:border-orange-200'
          }`}
        >
          <Zap size={12} className={hasCheered ? 'fill-orange-500' : ''} />
          {cheersCount > 0 ? cheersCount : ''}
        </button>
      </td>

      {/* Admin actions */}
      {role === 'admin' && (
        <td className="px-4 py-3.5 text-center whitespace-nowrap">
          <div className="flex justify-center gap-1.5">
            {match.status === 'scheduled' && match.matchType !== 'external' && (
              <>
                <button
                  onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }}
                  className="p-2 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all animate-pulse"
                  title="即時轉播"
                >
                  <PlayCircle size={14} />
                </button>
                <button
                  onClick={() => handleUpdateLeagueMatchScore(match)}
                  className="p-2 rounded-lg bg-slate-50 text-blue-500 border border-slate-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  title="輸入比分"
                >
                  <FileText size={14} />
                </button>
                <button
                  onClick={() => handleEditLeagueMatch(match)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all"
                  title="編輯"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => deleteItem('league_matches', match.id)}
              className="p-2 rounded-lg bg-slate-50 text-red-400 border border-slate-100 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
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
  deleteItem,
}) => {
  const isTeamTie = groupName.includes(' vs ');
  const players = enrichedStandings?.[groupName] || [];
  const sortedMatches = [...matches].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.matchOrder || '').localeCompare(b.matchOrder || '')
  );
  const completed = matches.filter(m => m.status === 'completed').length;
  const total = matches.length;

  return (
    <div className="mb-8">
      {!isTeamTie && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <h4 className="text-lg font-black text-slate-700">{groupName}</h4>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {players.length} 人
          </span>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {completed}/{total} 場完賽
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
          <TeamTieBoard groupName={groupName} matches={matches} />

          {!isTeamTie && players.length > 0 && (
            <>
              <PodiumStrip players={players} />
              <StandingsTable players={players} />
              <div className="border-t border-slate-100 mt-3 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">賽事記錄</p>
              </div>
            </>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left whitespace-nowrap">日期 / 場次</th>
                  <th className="px-4 py-2.5 text-left whitespace-nowrap">對賽球員</th>
                  <th className="px-4 py-2.5 text-center whitespace-nowrap">比分</th>
                  <th className="px-4 py-2.5 text-center whitespace-nowrap">狀態</th>
                  <th className="px-4 py-2.5 text-center whitespace-nowrap">支持</th>
                  {role === 'admin' && <th className="px-4 py-2.5 text-center whitespace-nowrap">操作</th>}
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

// ─── My stats banner ──────────────────────────────────────────────────────────

const MyStatsBanner = ({ stats, upcomingMatches, selectedTournament, currentUserInfo }) => (
  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 mb-8">
    <div className="flex items-center gap-2 mb-4">
      <Trophy size={16} className="text-blue-600" />
      <h4 className="font-black text-blue-800 text-sm">我的個人戰績 · {selectedTournament}</h4>
    </div>
    <div className="grid grid-cols-4 gap-3 text-center mb-4">
      {[
        { val: stats.played,       label: '已賽', color: 'text-slate-700' },
        { val: stats.wins,         label: '勝',   color: 'text-emerald-600' },
        { val: stats.losses,       label: '負',   color: 'text-rose-500' },
        { val: stats.leaguePoints, label: '積分', color: 'text-blue-600' },
      ].map(({ val, label, color }) => (
        <div key={label} className="bg-white rounded-xl py-3 border border-blue-100">
          <p className={`text-2xl font-black ${color}`}>{val}</p>
          <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
    {upcomingMatches.length > 0 && (
      <div className="border-t border-blue-200 pt-4">
        <p className="text-xs font-black text-blue-700 mb-2">即將對賽</p>
        {upcomingMatches.map(m => (
          <p key={m.id} className="text-xs text-slate-600 font-medium">
            {m.date} {m.time} · vs{' '}
            <strong>{m.player1Id === currentUserInfo.id ? m.player2Name : m.player1Name}</strong>
          </p>
        ))}
      </div>
    )}
  </div>
);

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

  // Track standings changes for trend arrows
  useEffect(() => {
    if (tournamentStandings && Object.keys(tournamentStandings).length > 0) {
      setPreviousStandings(prev => ({ ...prev, [selectedTournament]: tournamentStandings }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentStandings]);

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

  // Enrich standings with hotStreak + trend
  const enrichedStandings = useMemo(() => {
    if (!tournamentStandings || typeof tournamentStandings !== 'object') return {};
    const safeMatches = Array.isArray(leagueMatches) ? leagueMatches : [];
    const prevData = previousStandings?.[selectedTournament] ?? null;
    const result = {};

    for (const group of Object.keys(tournamentStandings)) {
      const current = tournamentStandings[group];
      if (!Array.isArray(current)) continue;
      result[group] = current.map((player, index) => {
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
        return { ...player, hotStreak, trend };
      });
    }
    return result;
  }, [tournamentStandings, leagueMatches, previousStandings, selectedTournament]);

  // Safe array/object guards
  const safeTournamentList  = Array.isArray(tournamentList) ? tournamentList : [];
  const safeGroupedMatches  = groupedMatches && typeof groupedMatches === 'object' ? groupedMatches : {};
  const safeLeagueMatches   = Array.isArray(leagueMatches) ? leagueMatches : [];
  const safeUpcomingMatches = Array.isArray(myUpcomingMatches) ? myUpcomingMatches : [];
  const hasStandings = tournamentStandings && Object.keys(tournamentStandings).length > 0;

  return (
    <div className="space-y-0 animate-in fade-in duration-500">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">聯賽專區</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">查看賽程、賽果及積分排名</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tournament selector */}
            <div className="relative">
              <select
                value={selectedTournament}
                onChange={e => setSelectedTournament(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-9 py-2.5 text-sm font-black text-slate-700 outline-none cursor-pointer hover:bg-white hover:border-slate-300 transition-all min-w-[200px]"
              >
                {safeTournamentList.length === 0
                  ? <option value="">暫無賽事</option>
                  : safeTournamentList.map(t => <option key={t} value={t}>{t}</option>)
                }
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Admin controls */}
            {role === 'admin' && (
              <>
                <button
                  onClick={setShowTacticalBoard.bind(null, true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Target size={14} /> 戰術板
                </button>
                <button
                  onClick={setShowUmpirePanel.bind(null, true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-sm animate-pulse"
                >
                  <Activity size={14} /> 即時轉播
                </button>
                <button
                  onClick={handleDownloadPoster}
                  disabled={isRenderingPoster || !hasStandings}
                  className="p-2.5 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all disabled:opacity-40"
                  title="下載積分榜海報"
                >
                  {isRenderingPoster ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
                <button
                  onClick={() => setShowTournamentModal(true)}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
                  title="建立新賽事"
                >
                  <Plus size={16} />
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
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Trophy size={40} strokeWidth={1} className="mb-4" />
            <p className="font-black text-slate-400">
              {safeLeagueMatches.length > 0 ? '請選擇一個賽事' : '暫無賽事，教練可建立新賽事'}
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
