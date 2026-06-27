// src/pages/LeaguePage.jsx (Version 5.2 — Elo Read Bug Fix)
// 更新內容: 修復了對戰卡片與賽程表中，無法正確讀取學生 Elo 積分 (錯誤讀取 totalPoints 導致全部顯示 1000) 的問題。

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Target, Activity, Plus, Swords, Zap, PlayCircle, Pencil, Trash2, Download, Loader2, Trophy, ArrowUp, ArrowDown, Minus, ShieldAlert, ChevronDown, Medal, Percent, X, UserPlus } from 'lucide-react';
import html2canvas from 'html2canvas';
import LeagueStandingsPoster from '../components/LeagueStandingsPoster';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const TrendIndicator = ({ trend }) => {
  if (trend > 0) return (<span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px] font-bold"><ArrowUp size={10} strokeWidth={2.5} />{trend}</span>);
  if (trend < 0) return (<span className="inline-flex items-center gap-0.5 text-rose-500 text-[11px] font-bold"><ArrowDown size={10} strokeWidth={2.5} />{Math.abs(trend)}</span>);
  return <Minus size={10} className="text-slate-300" />;
};

const StatusPill = ({ status }) =>
  status === 'completed' ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">已完賽</span>) 
  : (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">待開賽</span>);

const RankBadge = ({ rank }) => {
  const styles = { 1: 'bg-amber-100 text-amber-800', 2: 'bg-slate-100 text-slate-600', 3: 'bg-orange-100 text-orange-700' };
  return (<span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${styles[rank] ?? 'bg-slate-50 text-slate-400'}`}>{rank}</span>);
};

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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">聯賽積分: {p.leaguePoints}</p>
          </div>
          {p.hotStreak >= 3 && (<span title={`${p.hotStreak} 連勝`} className="text-orange-500 text-lg animate-pulse">🔥</span>)}
        </div>
      ))}
    </div>
  );
};

const TeamTieBoard = ({ groupName, matches }) => {
  if (!groupName?.includes(' vs ')) return null;
  const [teamA, teamB] = groupName.split(' vs ');
  let aWins = 0, bWins = 0, completed = 0;
  matches.forEach(m => {
    if (m.status !== 'completed') return;
    completed++;
    const aWon = (m.winnerId === m.player1Id && m.player1Name?.startsWith(teamA)) || (m.winnerId === m.player2Id && m.player2Name?.startsWith(teamA));
    if (aWon) aWins++; else bWins++;
  });
  const finished = completed === matches.length && matches.length > 0;
  const winner = aWins > bWins ? teamA : bWins > aWins ? teamB : null;

  return (
    <div className="rounded-2xl bg-slate-900 text-white p-6 mb-6 relative overflow-hidden shadow-lg">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 relative z-10">團體對抗賽</p>
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
        {finished ? (<span className="inline-flex items-center gap-2 bg-amber-500 text-amber-950 px-5 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-md"><Trophy size={13} />{winner ? `${winner} 奪勝` : '雙方戰平'}</span>) 
        : (<span className="text-slate-400 text-xs font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">進度 {completed} / {matches.length} 場</span>)}
      </div>
    </div>
  );
};

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
          <th className="px-3 py-3 text-center w-20">聯賽積分</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {players.map((player, index) => {
           const winRate = player.played > 0 ? Math.round((player.wins / player.played) * 100) : 0;
           return (
            <tr key={player.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-3 py-3.5"><div className="flex items-center gap-1.5"><RankBadge rank={index + 1} /><TrendIndicator trend={player.trend} /></div></td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{player.name}</span>
                  {player.isExternal && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">外校</span>}
                  {player.hotStreak >= 3 && <span title={`目前 ${player.hotStreak} 連勝`} className="text-orange-500 text-sm">🔥</span>}
                </div>
              </td>
              <td className="px-3 py-3.5 text-center text-slate-500 font-bold">{player.played} <span className="text-slate-300 font-normal">/</span> <span className="text-emerald-600">{player.wins}</span></td>
              <td className="px-3 py-3.5 text-center"><div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{winRate}%</div></td>
              <td className="px-3 py-3.5 text-center font-mono text-xs"><span className={player.pointsDiff >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>{player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}</span></td>
              <td className="px-3 py-3.5 text-center"><span className="text-blue-600 font-black text-lg">{player.leaguePoints}</span></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
);

// 👉 修復點 1：MatchupCard 內讀取 Elo 的欄位更正為 points 👈
const MatchupCard = ({ match, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students }) => {
    const cheersCount = match.cheers?.length || 0;
    const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');

    const p1Internal = students?.find(s => s.id === match.player1Id);
    const p2Internal = students?.find(s => s.id === match.player2Id);
    
    // 將 totalPoints 修正為 points
    const p1Elo = p1Internal ? (p1Internal.points || 1000) : (match.extElo || 1000);
    const p2Elo = p2Internal ? (p2Internal.points || 1000) : (match.extElo || 1000);
    const p1WinProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
    const p2WinProb = 1 - p1WinProb;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden border border-slate-700 hover:-translate-y-1 transition-transform group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            <div className="flex justify-between items-center mb-5 relative z-10">
                <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-inner">
                    {match.date} {match.time}
                </span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2.5 py-1 border border-amber-500/30 rounded-lg bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {match.matchOrder || match.venue || '即將開戰'}
                </span>
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="text-center w-5/12">
                    <div className="w-14 h-14 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        {match.player1Name[0]}
                    </div>
                    <p className="font-black text-white text-sm truncate">{match.player1Name}</p>
                    <p className="text-[10px] text-blue-400 font-bold mt-1">Elo {p1Elo}</p>
                </div>
                <div className="w-2/12 text-center">
                    <span className="text-xl font-black italic text-slate-500 drop-shadow-lg">VS</span>
                </div>
                <div className="text-center w-5/12">
                    <div className="w-14 h-14 mx-auto bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        {match.player2Name?.[0] || '?'}
                    </div>
                    <p className="font-black text-white text-sm truncate">
                        {match.player2Name} {!p2Internal && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded ml-1">外</span>}
                    </p>
                    <p className="text-[10px] text-orange-400 font-bold mt-1">Elo {p2Elo}</p>
                </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl p-3.5 mb-6 border border-slate-800 relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    <span className="text-blue-400">{(p1WinProb*100).toFixed(0)}%</span>
                    <span className="text-slate-500 text-[9px]">勝率預測</span>
                    <span className="text-orange-400">{(p2WinProb*100).toFixed(0)}%</span>
                </div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
                    <div className="bg-blue-500 h-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${p1WinProb * 100}%` }}></div>
                    <div className="bg-orange-500 h-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" style={{ width: `${p2WinProb * 100}%` }}></div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50 relative z-10">
                <button onClick={(e) => handleCheerMatch(match.id, e)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all active:scale-95 shadow-lg ${hasCheered ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/50' : 'bg-slate-800 text-slate-400 hover:text-orange-400 hover:bg-slate-700'}`}>
                    <Zap size={14} className={hasCheered ? 'fill-white' : ''} /> {cheersCount > 0 ? cheersCount : '支持'}
                </button>
                {role === 'admin' && (
                    <div className="flex gap-2">
                        {!match.player2Id?.startsWith('ext_') && (
                            <button onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><PlayCircle size={14} /></button>
                        )}
                        <button onClick={() => handleUpdateLeagueMatchScore(match)} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><Swords size={14} /></button>
                        <button onClick={() => handleEditLeagueMatch(match)} className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Pencil size={12} /></button>
                        <button onClick={() => deleteItem('league_matches', match.id)} className="w-8 h-8 rounded-full bg-slate-700 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

// 👉 修復點 2：傳統表格中的預測條也是使用 points 👈
const MatchRow = ({ match, role, tournamentStandings, groupName, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students }) => {
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
  const scoreStr = isDone ? (match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`) : null;

  const p1Elo = useMemo(() => {
      const s = students?.find(s => s.id === match.player1Id);
      return s ? (s.points || 1000) : (match.extElo || 1000);
  }, [students, match.player1Id, match.extElo]);

  const p2Elo = useMemo(() => {
      const s = students?.find(s => s.id === match.player2Id);
      return s ? (s.points || 1000) : (match.extElo || 1000);
  }, [students, match.player2Id, match.extElo]);
  
  const p1WinProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const p2WinProb = 1 - p1WinProb;

  return (
    <tr className={`transition-colors ${isDone ? '' : 'hover:bg-slate-50'}`}>
      <td className="px-4 py-4 whitespace-nowrap align-top pt-5">
        <p className="font-bold text-slate-700 text-sm">{match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time}</p>
        {(match.matchOrder || match.venue) && (<p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-wider">{match.matchOrder || match.venue}</p>)}
      </td>
      <td className="px-4 py-4 min-w-[200px]">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>{match.player1Name}</span>
              <span className="text-[10px] font-black text-slate-300 italic px-1">vs</span>
              <span className={`font-black text-sm flex items-center gap-1 ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
                {match.player2Name} {(!students?.find(s => s.id === match.player2Id) && match.player2Id) && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider">外校</span>}
              </span>
              {isGiantSlayer && (<span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase tracking-wider"><ShieldAlert size={10} /> 爆冷</span>)}
            </div>
            {!isDone && match.matchType !== 'external' && (
                <div className="mt-1 w-full max-w-[220px]">
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      <span className="text-blue-500">勝率預測 {(p1WinProb*100).toFixed(0)}%</span>
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
        {scoreStr ? <span className="font-mono font-black text-xl text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{scoreStr}</span> : <span className="text-slate-300 font-bold text-lg">—</span>}
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5"><StatusPill status={match.status} /></td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
        <button onClick={(e) => handleCheerMatch(match.id, e)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all active:scale-95 shadow-sm ${hasCheered ? 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 border-orange-200' : 'bg-white text-slate-400 border-slate-200 hover:text-orange-500 hover:border-orange-300'}`}>
          <Zap size={12} className={hasCheered ? 'fill-orange-500' : ''} />{cheersCount > 0 ? cheersCount : '支持'}
        </button>
      </td>
      {role === 'admin' && (
        <td className="px-4 py-4 text-center whitespace-nowrap align-top pt-5">
          <div className="flex justify-center gap-1.5">
            {match.status === 'scheduled' && match.matchType !== 'external' && (
              <>
                {!match.player2Id?.startsWith('ext_') && (
                    <button onClick={() => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }} className="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="即時轉播"><PlayCircle size={14} /></button>
                )}
                <button onClick={() => handleUpdateLeagueMatchScore(match)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="結算聯賽與 Elo 積分"><Swords size={14} /></button>
                <button onClick={() => handleEditLeagueMatch(match)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-600 hover:text-white transition-all shadow-sm" title="編輯"><Pencil size={14} /></button>
              </>
            )}
            <button onClick={() => deleteItem('league_matches', match.id)} className="p-2.5 rounded-xl bg-white text-red-400 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm" title="刪除"><Trash2 size={14} /></button>
          </div>
        </td>
      )}
    </tr>
  );
};

const CompletedMatchRow = ({ match, tournamentStandings, groupName, students }) => {
  const isGiantSlayer = useMemo(() => {
    if (match.status !== 'completed' || !match.winnerId) return false;
    const group = tournamentStandings?.[groupName];
    if (!Array.isArray(group)) return false;
    const winnerRank = group.findIndex(p => p.id === match.winnerId);
    const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const loserRank = group.findIndex(p => p.id === loserId);
    return winnerRank !== -1 && loserRank !== -1 && winnerRank > loserRank;
  }, [match, tournamentStandings, groupName]);

  const scoreStr = match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`;
  const p2Internal = students?.find(s => s.id === match.player2Id);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-4 whitespace-nowrap align-middle">
        <p className="font-bold text-slate-700 text-sm">{match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time}</p>
      </td>
      <td className="px-4 py-4 min-w-[200px] align-middle">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>{match.player1Name}</span>
            <span className="text-[10px] font-black text-slate-300 italic px-1">vs</span>
            <span className={`font-black text-sm flex items-center gap-1 ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
              {match.player2Name} {!p2Internal && match.player2Id && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider">外校</span>}
            </span>
            {isGiantSlayer && (<span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase tracking-wider"><ShieldAlert size={10} /> 爆冷</span>)}
          </div>
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle">
        <span className="font-mono font-black text-xl text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{scoreStr}</span>
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle"><StatusPill status={match.status} /></td>
    </tr>
  );
};

const GroupSection = ({ groupName, matches, enrichedStandings, tournamentStandings, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students }) => {
  const isTeamTie = groupName.includes(' vs ');
  const players = enrichedStandings?.[groupName] || [];
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date) || (a.matchOrder || '').localeCompare(b.matchOrder || ''));
  
  const completedMatches = sortedMatches.filter(m => m.status === 'completed');
  const scheduledMatches = sortedMatches.filter(m => m.status === 'scheduled');
  
  const completedCount = completedMatches.length; 
  const totalCount = matches.length;

  return (
    <div className="mb-12">
      {!isTeamTie && (
        <div className="flex items-center gap-3 mb-4 px-1">
          <h4 className="text-xl font-black text-slate-800">{groupName}</h4>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{players.length} Players</span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{completedCount}/{totalCount} Completed</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
          <TeamTieBoard groupName={groupName} matches={matches} />

          {!isTeamTie && players.length > 0 && (
            <>
              <PodiumStrip players={players} />
              <StandingsTable players={players} />
              <div className="border-t-2 border-dashed border-slate-100 mt-6 pt-6 mb-6"></div>
            </>
          )}

          {scheduledMatches.length > 0 && (
              <div className="mb-10">
                  <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Zap size={14}/> 即將上演 (Main Events)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {scheduledMatches.map(match => (
                          <MatchupCard key={match.id} match={match} role={role} currentUserInfo={currentUserInfo} handleCheerMatch={handleCheerMatch} setActiveLeagueMatch={setActiveLeagueMatch} setShowUmpirePanel={setShowUmpirePanel} handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore} handleEditLeagueMatch={handleEditLeagueMatch} deleteItem={deleteItem} students={students} />
                      ))}
                  </div>
              </div>
          )}

          {completedMatches.length > 0 && (
              <div>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Activity size={14}/> 完賽紀錄 (Results)
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
                        {completedMatches.map(match => (
                          <CompletedMatchRow key={match.id} match={match} tournamentStandings={tournamentStandings} groupName={groupName} students={students}/>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const MyStatsBanner = ({ stats, upcomingMatches, selectedTournament, currentUserInfo }) => {
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  return (
    <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 md:p-8 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md"><Trophy size={18} /></div><div><h4 className="font-black text-slate-800 text-lg">我的戰績中心</h4><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedTournament}</p></div></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm"><p className="text-3xl font-black text-slate-700">{stats.played}</p><p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">已賽場數</p></div>
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-5"><Percent size={40}/></div><p className="text-3xl font-black text-emerald-600">{winRate}%</p><p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">賽事勝率</p></div>
        <div className="bg-white rounded-2xl py-4 border border-slate-100 shadow-sm"><p className={`text-3xl font-black ${stats.pointsDiff >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>{stats.pointsDiff > 0 ? `+${stats.pointsDiff}` : stats.pointsDiff}</p><p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">淨得局</p></div>
        <div className="bg-gradient-to-b from-blue-600 to-indigo-700 rounded-2xl py-4 shadow-md text-white"><p className="text-3xl font-black font-mono tracking-tighter">{stats.leaguePoints}</p><p className="text-[10px] font-black text-blue-200 mt-1 uppercase tracking-widest">聯賽積分</p></div>
      </div>
      {upcomingMatches.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={12}/> 即將對陣 (Tale of the Tape)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingMatches.map(m => (
              <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400">{m.date} {m.time}</span><span className="text-sm font-black text-slate-700 mt-0.5">vs {m.player1Id === currentUserInfo.id ? m.player2Name : m.player1Name}</span></div>
                <StatusPill status="scheduled" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function LeaguePage({
  role, currentUserInfo, setShowTacticalBoard, setShowUmpirePanel,
  setActiveLeagueMatch, setShowTournamentModal, selectedTournament,
  setSelectedTournament, tournamentList, leagueMatches, myTournamentStats,
  myUpcomingMatches, groupedMatches, tournamentStandings, handleCheerMatch,
  handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, schoolLogo,
  students, db, appId 
}) {
  const posterRef = useRef();
  const [isRenderingPoster, setIsRenderingPoster] = useState(false);
  const [previousStandings, setPreviousStandings] = useState({});
  const [showAddSingleMatch, setShowAddSingleMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({ groupName: 'Group A', date: new Date().toISOString().split('T')[0], time: '16:00', player1Id: '', isExternal: false, player2Id: '', extName: '', extElo: '1000' });

  const handleSaveSingleMatch = async () => {
      if (!newMatch.player1Id) return alert("必須選擇一位本校出賽球員！");
      if (!newMatch.isExternal && !newMatch.player2Id) return alert("請選擇本校對手！");
      if (newMatch.isExternal && !newMatch.extName.trim()) return alert("請輸入外校對手名稱！");

      setIsUpdatingMatch(true);
      try {
          const p1 = students.find(s => s.id === newMatch.player1Id);
          let p2Id = null; let p2Name = "";
          
          if (newMatch.isExternal) {
              p2Id = `ext_${Date.now()}`; p2Name = newMatch.extName.trim();
          } else {
              const p2 = students.find(s => s.id === newMatch.player2Id);
              p2Id = p2.id; p2Name = p2.name;
          }

          const matchData = {
              tournamentName: selectedTournament, groupName: newMatch.groupName || '預設組別', date: newMatch.date, time: newMatch.time,
              player1Id: p1.id, player1Name: p1.name, player2Id: p2Id, player2Name: p2Name,
              matchType: newMatch.isExternal ? 'friendly_match' : 'internal_challenge', status: 'scheduled', timestamp: serverTimestamp()
          };

          if (newMatch.isExternal) { matchData.extElo = parseInt(newMatch.extElo, 10) || 1000; }

          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'), matchData);
          alert("✅ 成功加入一場新賽程！"); setShowAddSingleMatch(false);
      } catch(e) { console.error(e); alert("新增失敗，請檢查網絡。"); }
      setIsUpdatingMatch(false);
  };

  useEffect(() => {
    if (tournamentStandings && Object.keys(tournamentStandings).length > 0) {
      setPreviousStandings(prev => ({ ...prev, [selectedTournament]: tournamentStandings }));
    }
  }, [tournamentStandings, selectedTournament]);

  useEffect(() => { setPreviousStandings({}); }, [selectedTournament]);

  const handleDownloadPoster = useCallback(() => {
    if (!tournamentStandings || Object.keys(tournamentStandings).length === 0) return alert('目前沒有可生成的積分榜數據。');
    setIsRenderingPoster(true);
    setTimeout(() => {
      html2canvas(posterRef.current, { scale: 2, useCORS: true }).then(canvas => {
          const a = document.createElement('a'); a.download = `league_standings_${selectedTournament}.png`; a.href = canvas.toDataURL('image/png'); a.click();
      }).catch(err => { console.error(err); alert('海報生成失敗。'); }).finally(() => setIsRenderingPoster(false));
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
      
      const sortedGroup = [...current].sort((a, b) => {
        if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
        return (b.pointsDiff || 0) - (a.pointsDiff || 0);
      });

      result[group] = sortedGroup.map((player, index) => {
        const pMatches = safeMatches
          .filter(m => m.status === 'completed' && (m.player1Id === player.id || m.player2Id === player.id) && m.tournamentName === selectedTournament)
          .sort((a, b) => (b.updatedAt?.seconds || b.timestamp?.seconds || 0) - (a.updatedAt?.seconds || a.timestamp?.seconds || 0));
        let hotStreak = 0;
        for (const m of pMatches) { if (m.winnerId === player.id) hotStreak++; else break; }
        const prevGroup = Array.isArray(prevData?.[group]) ? prevData[group] : [];
        const prevRank = prevGroup.findIndex(p => p.id === player.id);
        const trend = prevRank !== -1 ? prevRank - index : 0;
        return { ...player, hotStreak, trend };
      });
    }
    return result;
  }, [tournamentStandings, leagueMatches, previousStandings, selectedTournament]);

  const safeTournamentList  = Array.isArray(tournamentList) ? tournamentList : [];
  const safeGroupedMatches  = groupedMatches && typeof groupedMatches === 'object' ? groupedMatches : {};
  const safeLeagueMatches   = Array.isArray(leagueMatches) ? leagueMatches : [];
  const safeUpcomingMatches = Array.isArray(myUpcomingMatches) ? myUpcomingMatches : [];
  const hasStandings = tournamentStandings && Object.keys(tournamentStandings).length > 0;

  return (
    <div className="space-y-0 animate-in fade-in duration-500 relative">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Medal size={28}/></div>
             <div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">聯賽專區</h3>
               <p className="text-slate-500 text-sm mt-1 font-bold">查看賽事排位與賽前勝率分析</p>
             </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative shadow-sm rounded-xl">
              <select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)} className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-black text-slate-700 outline-none cursor-pointer hover:bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all min-w-[220px]">
                {safeTournamentList.length === 0 ? <option value="">暫無賽事</option> : safeTournamentList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {role === 'admin' && (
              <>
                {selectedTournament && (
                    <button onClick={() => setShowAddSingleMatch(true)} className="p-3 bg-white border border-slate-200 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm" title={`新增單場賽程至 ${selectedTournament}`}>
                      <UserPlus size={18} />
                    </button>
                )}
                <button onClick={setShowTacticalBoard.bind(null, true)} className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"><Target size={16} /> 戰術板</button>
                <button onClick={setShowUmpirePanel.bind(null, true)} className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-md animate-pulse"><Activity size={16} /> 轉播室</button>
                <button onClick={handleDownloadPoster} disabled={isRenderingPoster || !hasStandings} className="p-3 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-40 shadow-sm" title="下載積分榜海報">{isRenderingPoster ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}</button>
                <button onClick={() => setShowTournamentModal(true)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200" title="建立新聯賽 (批次)"><Plus size={18} /></button>
              </>
            )}
          </div>
        </div>

        {role === 'student' && myTournamentStats && (
          <MyStatsBanner stats={myTournamentStats} upcomingMatches={safeUpcomingMatches} selectedTournament={selectedTournament} currentUserInfo={currentUserInfo} />
        )}

        {Object.keys(safeGroupedMatches).length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <div className="p-6 bg-slate-50 rounded-full mb-4"><Trophy size={48} strokeWidth={1.5} className="text-slate-300" /></div>
            <p className="font-black text-slate-400 text-lg">{safeLeagueMatches.length > 0 ? '請選擇上方的一個賽事' : '暫無賽事，教練可建立新賽事'}</p>
          </div>
        )}
      </div>

      {Object.keys(safeGroupedMatches).map(groupName => (
        <GroupSection key={groupName} groupName={groupName} matches={safeGroupedMatches[groupName]} enrichedStandings={enrichedStandings} tournamentStandings={tournamentStandings} role={role} currentUserInfo={currentUserInfo} handleCheerMatch={handleCheerMatch} setActiveLeagueMatch={setActiveLeagueMatch} setShowUmpirePanel={setShowUmpirePanel} handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore} handleEditLeagueMatch={handleEditLeagueMatch} deleteItem={deleteItem} students={students} />
      ))}

      {isRenderingPoster && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
          <LeagueStandingsPoster ref={posterRef} tournamentName={selectedTournament} standings={hasStandings ? Object.values(tournamentStandings).flat().sort((a, b) => b.leaguePoints - a.leaguePoints) : []} upcomingMatches={safeLeagueMatches} schoolLogo={schoolLogo} />
        </div>
      )}

      {showAddSingleMatch && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><UserPlus size={20}/></div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">新增單場賽程</h3>
                            <p className="text-xs font-bold text-slate-400">目前賽事: {selectedTournament}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAddSingleMatch(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">比賽日期</label>
                            <input type="date" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">比賽時間</label>
                            <input type="time" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">分組名稱</label>
                        <input type="text" placeholder="例如: 男子甲組 / Group A" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold" value={newMatch.groupName} onChange={e=>setNewMatch({...newMatch, groupName: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 block">主角球員 (本校)</label>
                        <select className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700 outline-none focus:border-blue-500" value={newMatch.player1Id} onChange={(e)=>setNewMatch({...newMatch, player1Id: e.target.value})}>
                            <option value="">-- 請選擇本校出賽球員 --</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                        </select>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold text-orange-500 uppercase tracking-widest">對手球員</label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500">
                                <input type="checkbox" checked={newMatch.isExternal} onChange={(e)=>setNewMatch({...newMatch, isExternal: e.target.checked})} className="rounded text-orange-500 focus:ring-orange-500"/>
                                此為外校對手
                            </label>
                        </div>

                        {!newMatch.isExternal ? (
                            <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none" value={newMatch.player2Id} onChange={(e)=>setNewMatch({...newMatch, player2Id: e.target.value})}>
                                <option value="">-- 請選擇本校對手 --</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                            </select>
                        ) : (
                            <div className="space-y-3 animate-in fade-in zoom-in-95">
                                <input type="text" placeholder="輸入外校選手名稱 (例如: 男拔-陳大文)" className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500" value={newMatch.extName} onChange={(e)=>setNewMatch({...newMatch, extName: e.target.value})} />
                                <select className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none" value={newMatch.extElo} onChange={(e)=>setNewMatch({...newMatch, extElo: e.target.value})}>
                                    <option value="800">預估對手實力: 新手起步 (~800分)</option>
                                    <option value="1000">預估對手實力: 一般水準 (~1000分)</option>
                                    <option value="1300">預估對手實力: 學界種子 (~1300分)</option>
                                    <option value="1600">預估對手實力: 區際精英 (~1600分)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={() => setShowAddSingleMatch(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                    <button onClick={handleSaveSingleMatch} disabled={isUpdatingMatch} className="px-6 py-3 rounded-xl font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2">
                        {isUpdatingMatch ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} 建立賽程
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
}
