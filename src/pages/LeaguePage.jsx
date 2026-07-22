// File: src/pages/LeaguePage.jsx
// Version 7.6: 🏆 修復淘汰賽樹狀圖重複生成決賽的邏輯錯誤，並重新加入「組別名稱（如男子組、女子組）」的設定功能。

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Target, Activity, Plus, Swords, Zap, PlayCircle, Pencil, Trash2, Download, Loader2, Trophy, ArrowUp, ArrowDown, Minus, ShieldAlert, ChevronDown, Medal, Percent, X, UserPlus, Save, Users, CheckCircle2, Clock, Grid, FastForward } from 'lucide-react';
import html2canvas from 'html2canvas';
import LeagueStandingsPoster from '../components/LeagueStandingsPoster';
import { collection, addDoc, doc, updateDoc, writeBatch, increment, serverTimestamp, onSnapshot } from 'firebase/firestore';

import TournamentBracket from '../components/TournamentBracket';

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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">積分: {p.leaguePoints}</p>
          </div>
          {p.hotStreak >= 3 && (<span title={`${p.hotStreak} 連勝`} className="text-orange-500 text-lg animate-pulse">🔥</span>)}
        </div>
      ))}
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
          <th className="px-3 py-3 text-center w-20">總積分</th>
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
                  {player.isExternal && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">外卡</span>}
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

const MatchupCard = ({ match, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students }) => {
    const cheersCount = match.cheers?.length || 0;
    const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');

    const p1Internal = students?.find(s => s.id === match.player1Id);
    const p2Internal = students?.find(s => s.id === match.player2Id);
    
    const p1Elo = p1Internal ? (p1Internal.points || 1000) : (match.extElo || 1000);
    const p2Elo = p2Internal ? (p2Internal.points || 1000) : (match.extElo || 1000);
    const p1WinProb = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
    const p2WinProb = 1 - p1WinProb;

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden border border-slate-700 hover:-translate-y-1 transition-transform group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            
            <div className="flex justify-between items-center mb-5 relative z-10">
                <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-inner flex items-center gap-1">
                    <Clock size={10} className="text-blue-400"/> {match.date} {match.time}
                </span>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2.5 py-1 border border-amber-500/30 rounded-lg bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {match.venue || match.matchOrder || '即將開戰'}
                </span>
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="text-center w-5/12">
                    <div className="w-14 h-14 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        {match.player1Name?.[0] || '?'}
                    </div>
                    <p className="font-black text-white text-sm truncate">{match.player1Name}</p>
                </div>
                <div className="w-2/12 text-center">
                    <span className="text-xl font-black italic text-slate-500 drop-shadow-lg">VS</span>
                </div>
                <div className="text-center w-5/12">
                    <div className="w-14 h-14 mx-auto bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-black text-2xl mb-2 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        {match.player2Name?.[0] || '?'}
                    </div>
                    <p className="font-black text-white text-sm truncate">
                        {match.player2Name} {!p2Internal && match.player2Id !== 'BYE' && <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded ml-1">外</span>}
                    </p>
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
                        {!match.player2Id?.startsWith('ext_') && match.player2Id !== 'BYE' && (
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

const CompletedMatchRow = ({ match, tournamentStandings, groupName, students, role, openScoreOverrideModal }) => {
  const scoreStr = match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`;
  const p2Internal = students?.find(s => s.id === match.player2Id);

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-4 whitespace-nowrap align-middle">
        <p className="font-bold text-slate-700 text-sm">{match.date}</p>
        <p className="font-mono text-xs text-slate-400 mt-0.5">{match.time}</p>
      </td>
      <td className="px-4 py-4 min-w-[200px] align-middle">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-black text-sm ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-700'}`}>{match.player1Name}</span>
            <span className="text-[10px] font-black text-slate-300 italic px-1">vs</span>
            <span className={`font-black text-sm flex items-center gap-1 ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-700'}`}>
              {match.player2Name} {!p2Internal && match.player2Id && match.player2Id !== 'BYE' && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wider">外校</span>}
            </span>
          </div>
          {match.gameScoresStr && <p className="text-[10px] font-mono text-slate-400 mt-1">{match.gameScoresStr}</p>}
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle">
        <span className="font-mono font-black text-xl text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{scoreStr}</span>
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap align-middle flex items-center justify-center gap-2 h-full min-h-[64px]">
        <StatusPill status={match.status} />
        {role === 'admin' && match.matchType !== 'external' && match.matchType !== 'tournament_bracket' && (
            <button 
                onClick={() => openScoreOverrideModal(match)} 
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="修改最終比分"
            >
                <Pencil size={14}/>
            </button>
        )}
      </td>
    </tr>
  );
};

const GroupSection = ({ groupName, matches, enrichedStandings, tournamentStandings, role, currentUserInfo, handleCheerMatch, setActiveLeagueMatch, setShowUmpirePanel, handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, students, openScoreOverrideModal, onDeleteGroup }) => {
  const players = enrichedStandings?.[groupName] || [];
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
  
  const completedMatches = sortedMatches.filter(m => m.status === 'completed');
  const scheduledMatches = sortedMatches.filter(m => m.status === 'scheduled');
  
  const completedCount = completedMatches.length; 
  const totalCount = matches.length;

  return (
    <div className="mb-12 animate-in fade-in">
        <div className="flex items-center gap-3 mb-4 px-1">
          <h4 className="text-xl font-black text-slate-800">{groupName}</h4>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{players.length} Players</span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">{completedCount}/{totalCount} Completed</span>
          
          {role === 'admin' && onDeleteGroup && (
              <button onClick={() => onDeleteGroup(groupName)} className="ml-auto p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="刪除此組別的所有賽事">
                  <Trash2 size={16}/>
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
                          <CompletedMatchRow key={match.id} match={match} tournamentStandings={tournamentStandings} groupName={groupName} students={students} role={role} openScoreOverrideModal={openScoreOverrideModal}/>
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

export default function LeaguePage({
  role, currentUserInfo, setShowTacticalBoard, setShowUmpirePanel,
  setActiveLeagueMatch, setShowTournamentModal, selectedTournament, 
  setSelectedTournament, tournamentList, leagueMatches, myTournamentStats,
  myUpcomingMatches, handleCheerMatch, 
  handleUpdateLeagueMatchScore, handleEditLeagueMatch, deleteItem, schoolLogo,
  students, db, appId 
}) {
  const posterRef = useRef();
  const [isRenderingPoster, setIsRenderingPoster] = useState(false);
  const [showAddSingleMatch, setShowAddSingleMatch] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({ groupName: 'Group A', date: new Date().toISOString().split('T')[0], time: '16:00', player1Id: '', isExternal: false, player2Id: '', extName: '', extElo: '1000' });

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [matchToOverride, setMatchToOverride] = useState(null);
  const [overrideScores, setOverrideScores] = useState({ s1: 0, s2: 0, details: '' });

  const [liveBracketMatches, setLiveBracketMatches] = useState([]);

  useEffect(() => {
      if (!db || !appId) return;
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'live_matches');
      const unsub = onSnapshot(q, (snap) => {
          const liveData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLiveBracketMatches(liveData);
      });
      return () => unsub();
  }, [db, appId]);

  const [viewMode, setViewMode] = useState('league'); 
  const [showBracketGenerator, setShowBracketGenerator] = useState(false);
  const [bracketPlayers, setBracketPlayers] = useState([]);
  const [bracketEventName, setBracketEventName] = useState('2026 校慶盃'); 
  const [bracketName, setBracketName] = useState('混合組');
  const [selectedBracket, setSelectedBracket] = useState('');

  const [tournFormat, setTournFormat] = useState('knockout'); 
  const [tournPools, setTournPools] = useState(2); 

  const [bracketStartDate, setBracketStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bracketStartTime, setBracketStartTime] = useState('09:00');
  const [bracketCourts, setBracketCourts] = useState(2);
  const [bracketMatchDuration, setBracketMatchDuration] = useState(20);

  const [externalBracketPlayers, setExternalBracketPlayers] = useState([]);
  const [extPlayerName, setExtPlayerName] = useState('');
  const [extPlayerElo, setExtPlayerElo] = useState('1000');

  const leagueNames = useMemo(() => {
    return [...new Set(leagueMatches.filter(m => m.matchType !== 'tournament_bracket' && m.matchType !== 'tournament_round_robin').map(m => m.tournamentName).filter(Boolean))].sort();
  }, [leagueMatches]);

  const bracketNames = useMemo(() => {
    return [...new Set(leagueMatches.filter(m => m.matchType === 'tournament_bracket' || m.matchType === 'tournament_round_robin').map(m => m.tournamentName).filter(Boolean))].sort();
  }, [leagueMatches]);

  useEffect(() => {
      if (bracketNames.length > 0 && !selectedBracket) { setSelectedBracket(bracketNames[0]); }
  }, [bracketNames, selectedBracket]);

  const currentLeagueMatches = useMemo(() => {
    return leagueMatches.filter(m => m.tournamentName === selectedTournament && m.matchType !== 'tournament_bracket' && m.matchType !== 'tournament_round_robin');
  }, [leagueMatches, selectedTournament]);

  const currentTournamentMatches = useMemo(() => {
    return leagueMatches.filter(m => m.tournamentName === selectedBracket && (m.matchType === 'tournament_bracket' || m.matchType === 'tournament_round_robin'));
  }, [leagueMatches, selectedBracket]);

  const activeMatchesForStandings = useMemo(() => {
    return viewMode === 'league' ? currentLeagueMatches : currentTournamentMatches;
  }, [viewMode, currentLeagueMatches, currentTournamentMatches]);

  const tournamentStandings = useMemo(() => {
    if (!activeMatchesForStandings || activeMatchesForStandings.length === 0) return {};
    const standingsData = {};

    const getOrCreateStanding = (playerId, playerName, groupKey) => {
        if (!standingsData[groupKey]) standingsData[groupKey] = {};
        if (!standingsData[groupKey][playerId]) {
            const student = students?.find(s => s.id === playerId);
            standingsData[groupKey][playerId] = {
                id: playerId, name: student ? student.name : (playerName || '外部選手'), class: student ? student.class : 'EXT', classNo: student ? student.classNo : '-',
                played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, leaguePoints: 0, isExternal: !student
            };
        }
        return standingsData[groupKey][playerId];
    };

    activeMatchesForStandings.forEach(match => {
        if (match.status !== 'completed') return;
        const { player1Id, player2Id, groupName, player1Name, player2Name } = match;
        const groupKey = groupName || '所有比賽';
        const p1Score = parseInt(match.score1, 10) || 0; const p2Score = parseInt(match.score2, 10) || 0;

        const player1Standing = getOrCreateStanding(player1Id, player1Name, groupKey);
        player1Standing.played += 1;

        if (player2Id || player2Name) {
            const p2IdToUse = player2Id || `ext_${player2Name}`; 
            const player2Standing = getOrCreateStanding(p2IdToUse, player2Name, groupKey);
            if (player1Id !== p2IdToUse) player2Standing.played += 1;

            player1Standing.pointsFor += p1Score; player1Standing.pointsAgainst += p2Score;
            player2Standing.pointsFor += p2Score; player2Standing.pointsAgainst += p1Score;

            if (p1Score > p2Score) { player1Standing.wins += 1; player1Standing.leaguePoints += 3; player2Standing.losses += 1; } 
            else if (p2Score > p1Score) { player2Standing.wins += 1; player2Standing.leaguePoints += 3; player1Standing.losses += 1; } 
            else { player1Standing.leaguePoints += 1; player2Standing.leaguePoints += 1; }
        } else { player1Standing.wins += 1; player1Standing.leaguePoints += 3; }
    });

    const finalSortedResult = {};
    Object.keys(standingsData).forEach(groupKey => {
        finalSortedResult[groupKey] = Object.values(standingsData[groupKey]).map(player => {
            player.pointsDiff = player.pointsFor - player.pointsAgainst; return player;
        }).sort((a, b) => {
            if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            return b.pointsFor - a.pointsFor;
        });
    });

    return finalSortedResult;
  }, [activeMatchesForStandings, students]);

  const currentRRMatches = currentTournamentMatches.filter(m => m.matchType === 'tournament_round_robin');
  const currentKOMatches = currentTournamentMatches.filter(m => m.matchType === 'tournament_bracket');

  const groupedRRMatches = useMemo(() => {
    const groups = {};
    if (currentRRMatches.length > 0) {
        currentRRMatches.forEach(match => {
            const groupKey = match.groupName || 'Pool A';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(match);
        });
    }
    return groups;
  }, [currentRRMatches]);

  const groupedKOMatches = useMemo(() => {
    const groups = {};
    if (currentKOMatches.length > 0) {
        currentKOMatches.forEach(match => {
            const groupKey = match.groupName || '淘汰賽';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(match);
        });
    }
    return groups;
  }, [currentKOMatches]);

  const localGroupedLeagueMatches = useMemo(() => {
    const groups = {};
    if (currentLeagueMatches.length > 0) {
        currentLeagueMatches.forEach(match => {
            const groupKey = match.groupName || '所有比賽';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(match);
        });
    }
    return groups;
  }, [currentLeagueMatches]);

  const handleDeleteCollection = async (level, name, matchType) => {
      let confirmMsg = "";
      let matchesToDelete = [];
      
      if (level === 'tournament') {
          confirmMsg = `🚨 警告：確定要永久刪除大會「${name}」的【所有賽程與紀錄】嗎？\n資料庫空間將會被徹底釋放，此操作無法復原！`;
          matchesToDelete = leagueMatches.filter(m => m.tournamentName === name && (matchType === 'bracket' ? (m.matchType === 'tournament_bracket' || m.matchType === 'tournament_round_robin') : m.matchType !== 'tournament_bracket' && m.matchType !== 'tournament_round_robin'));
      } else if (level === 'group') {
          confirmMsg = `⚠️ 確定要永久刪除組別「${name}」的所有賽程與紀錄嗎？此操作無法復原！`;
          const currentTName = matchType === 'bracket' ? selectedBracket : selectedTournament;
          matchesToDelete = leagueMatches.filter(m => m.tournamentName === currentTName && m.groupName === name && (matchType === 'bracket' ? (m.matchType === 'tournament_bracket' || m.matchType === 'tournament_round_robin') : m.matchType !== 'tournament_bracket' && m.matchType !== 'tournament_round_robin'));
      }

      if (!window.confirm(confirmMsg)) return;

      setIsUpdatingMatch(true);
      try {
          const chunks = [];
          for (let i = 0; i < matchesToDelete.length; i += 500) { chunks.push(matchesToDelete.slice(i, i + 500)); }
          for (const chunk of chunks) {
              const chunkBatch = writeBatch(db);
              chunk.forEach(m => { chunkBatch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', m.id)); });
              await chunkBatch.commit();
          }
          alert(`✅ 已成功刪除！釋放了 ${matchesToDelete.length} 筆賽程空間。`);
          if (level === 'tournament') {
              if (matchType === 'bracket') setSelectedBracket('');
              else setSelectedTournament('');
          }
      } catch (error) { console.error(error); alert("❌ 刪除失敗，請檢查網路連線。"); }
      setIsUpdatingMatch(false);
  };

  const addMins = (timeStr, mins) => {
      if(!timeStr) return "00:00";
      const [h, m] = timeStr.split(':').map(Number);
      const total = h * 60 + m + mins;
      const nh = Math.floor(total / 60) % 24;
      const nm = total % 60;
      return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };
  const getEarliestCourt = (courts) => {
      let minIdx = 0; let minMins = 24 * 60;
      courts.forEach((timeStr, idx) => {
          const [h, m] = timeStr.split(':').map(Number);
          const mins = h * 60 + m;
          if(mins < minMins) { minMins = mins; minIdx = idx; }
      });
      return minIdx;
  };
  const getMaxTime = (courts) => {
      let maxMins = 0; let maxStr = "00:00";
      courts.forEach((timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          const mins = h * 60 + m;
          if(mins > maxMins) { maxMins = mins; maxStr = timeStr; }
      });
      return maxStr;
  };

  const handleGenerateTournament = async () => {
      if(bracketPlayers.length < 3) return alert("舉辦賽事至少需要 3 名選手！");
      if(!bracketEventName.trim()) return alert("請輸入大會名稱！");
      if(!bracketName.trim()) return alert("請輸入組別名稱！"); // Version 7.6 Added Validation

      const allAvailablePlayers = [...students, ...externalBracketPlayers];
      const sortedPlayers = [...bracketPlayers].sort((a, b) => {
          const pA = allAvailablePlayers.find(s=>s.id===a)?.points || 0;
          const pB = allAvailablePlayers.find(s=>s.id===b)?.points || 0;
          return pB - pA; 
      });

      setIsUpdatingMatch(true);
      try {
          const batch = writeBatch(db);
          
          const existingMatches = leagueMatches.filter(m => 
              m.tournamentName === bracketEventName.trim() && 
              m.matchType === (tournFormat === 'round_robin' ? 'tournament_round_robin' : 'tournament_bracket') &&
              (tournFormat === 'round_robin' ? true : m.groupName === bracketName.trim())
          );
          existingMatches.forEach(m => { batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', m.id)); });

          const matchesToCreate = [];
          let matchCounter = 1;
          let courtsAvailable = Array(Number(bracketCourts)).fill(bracketStartTime || "09:00");

          if (tournFormat === 'round_robin') {
              const pools = Array.from({ length: tournPools }, () => []);
              sortedPlayers.forEach((playerId, index) => {
                  const isEvenRound = Math.floor(index / tournPools) % 2 === 0;
                  const poolIdx = isEvenRound ? index % tournPools : tournPools - 1 - (index % tournPools);
                  const pData = allAvailablePlayers.find(s=>s.id===playerId);
                  pools[poolIdx].push({ id: playerId, name: pData ? pData.name : 'Unknown', seed: index + 1 });
              });

              pools.forEach((pool, pIdx) => {
                  const groupName = `Pool ${String.fromCharCode(65 + pIdx)}`; 
                  for(let i=0; i<pool.length; i++) {
                      for(let j=i+1; j<pool.length; j++) {
                          const p1 = pool[i];
                          const p2 = pool[j];

                          const cIdx = getEarliestCourt(courtsAvailable);
                          const matchTime = courtsAvailable[cIdx];
                          const matchVenue = `Court ${cIdx + 1}`;
                          courtsAvailable[cIdx] = addMins(courtsAvailable[cIdx], Number(bracketMatchDuration));

                          const matchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                          matchesToCreate.push({
                              ref: matchRef,
                              data: {
                                  id: matchRef.id, tournamentName: bracketEventName.trim(), groupName: groupName,
                                  matchType: 'tournament_round_robin', matchOrder: `Match ${matchCounter++}`,
                                  player1Id: p1.id, player1Name: p1.name, player1Seed: p1.seed,
                                  player2Id: p2.id, player2Name: p2.name, player2Seed: p2.seed,
                                  status: 'scheduled', score1: 0, score2: 0, winnerId: null,
                                  date: bracketStartDate, time: matchTime, venue: matchVenue, timestamp: serverTimestamp()
                              }
                          });
                      }
                  }
              });
          } else {
              let size = 4;
              if (bracketPlayers.length > 4) size = 8;
              if (bracketPlayers.length > 8) size = 16;
              if (bracketPlayers.length > 16) size = 32;

              let pl = [1];
              let rounds = Math.log2(size);
              for (let i = 0; i < rounds; i++) {
                  let next_pl = [];
                  let sum = Math.pow(2, i + 1) + 1;
                  pl.forEach(p => { next_pl.push(p); next_pl.push(sum - p); });
                  pl = next_pl;
              }

              const seededPlayers = pl.map(seedNum => {
                  if (seedNum <= sortedPlayers.length) {
                      const sId = sortedPlayers[seedNum - 1];
                      const sData = allAvailablePlayers.find(s=>s.id===sId);
                      return { id: sId, name: sData ? sData.name : 'Unknown', seed: seedNum };
                  } else {
                      return { id: 'BYE', name: '[輪空 BYE]', seed: null };
                  }
              });

              let currentRoundPlayers = seededPlayers;
              let currentRoundNodes = [];
              let r = rounds;

              for(let i=0; i<size/2; i++){
                  const p1 = currentRoundPlayers[i*2]; const p2 = currentRoundPlayers[i*2 + 1];
                  const isBye = p2.id === 'BYE' || p1.id === 'BYE';
                  const winnerId = isBye ? (p1.id !== 'BYE' ? p1.id : p2.id) : null;
                  const winnerName = isBye ? (p1.id !== 'BYE' ? p1.name : p2.name) : null;
                  const winnerSeed = isBye ? (p1.id !== 'BYE' ? p1.seed : p2.seed) : null;

                  let matchTime = 'N/A'; let matchVenue = '';
                  if (!isBye) {
                      const cIdx = getEarliestCourt(courtsAvailable); matchTime = courtsAvailable[cIdx]; matchVenue = `Court ${cIdx + 1}`;
                      courtsAvailable[cIdx] = addMins(courtsAvailable[cIdx], Number(bracketMatchDuration));
                  }

                  const matchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                  const matchObj = {
                      id: matchRef.id, tournamentName: bracketEventName.trim(), groupName: bracketName.trim(), matchType: 'tournament_bracket',
                      bracketRound: r, bracketMatchNumber: matchCounter++,
                      player1Id: p1.id, player1Name: p1.name, player1Seed: p1.seed,
                      player2Id: p2.id, player2Name: p2.name, player2Seed: p2.seed,
                      status: isBye ? 'completed' : 'scheduled', score1: isBye ? 3 : 0, score2: 0, winnerId,
                      date: bracketStartDate, time: matchTime, venue: matchVenue, timestamp: serverTimestamp()
                  };
                  currentRoundNodes.push(matchObj); matchesToCreate.push({ ref: matchRef, data: matchObj });
              }

              let currentRoundStartTime = getMaxTime(courtsAvailable);
              let previousRoundNodes = currentRoundNodes;

              for(r = rounds - 1; r >= 1; r--) {
                  let nextRoundNodes = [];
                  courtsAvailable = Array(Number(bracketCourts)).fill(currentRoundStartTime);

                  for(let i=0; i<previousRoundNodes.length; i+=2) {
                      const m1 = previousRoundNodes[i]; const m2 = previousRoundNodes[i+1];
                      const matchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                      
                      const p1Id = m1.winnerId || null; const p1Name = p1Id ? allAvailablePlayers.find(s=>s.id===p1Id)?.name : null; const p1Seed = p1Id ? (m1.winnerId === m1.player1Id ? m1.player1Seed : m1.player2Seed) : null;
                      const p2Id = m2.winnerId || null; const p2Name = p2Id ? allAvailablePlayers.find(s=>s.id===p2Id)?.name : null; const p2Seed = p2Id ? (m2.winnerId === m1.player1Id ? m1.player1Seed : m2.player2Seed) : null;

                      const cIdx = getEarliestCourt(courtsAvailable); const matchTime = courtsAvailable[cIdx]; const matchVenue = `Court ${cIdx + 1}`;
                      courtsAvailable[cIdx] = addMins(courtsAvailable[cIdx], Number(bracketMatchDuration));

                      const matchObj = {
                          id: matchRef.id, tournamentName: bracketEventName.trim(), groupName: bracketName.trim(), matchType: 'tournament_bracket',
                          bracketRound: r, isFinal: r === 1, bracketMatchNumber: matchCounter++,
                          player1Id: p1Id, player1Name: p1Name, player1Seed: p1Seed,
                          player2Id: p2Id, player2Name: p2Name, player2Seed: p2Seed,
                          status: 'scheduled', score1: 0, score2: 0, winnerId: null,
                          date: bracketStartDate, time: matchTime, venue: matchVenue, timestamp: serverTimestamp()
                      };
                      m1.nextMatchId = matchObj.id; m1.nextMatchSlot = 'player1'; m2.nextMatchId = matchObj.id; m2.nextMatchSlot = 'player2';

                      nextRoundNodes.push(matchObj); matchesToCreate.push({ ref: matchRef, data: matchObj });

                      if (r === 1) {
                          const bIdx = getEarliestCourt(courtsAvailable); const bronzeTime = courtsAvailable[bIdx]; const bronzeVenue = `Court ${bIdx + 1}`;
                          courtsAvailable[bIdx] = addMins(courtsAvailable[bIdx], Number(bracketMatchDuration));
                          const bronzeMatchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                          const bronzeMatchObj = {
                              id: bronzeMatchRef.id, tournamentName: bracketEventName.trim(), groupName: bracketName.trim(), matchType: 'tournament_bracket',
                              bracketRound: 1, isBronzeFinal: true, bracketMatchNumber: matchCounter++,
                              player1Id: null, player1Name: null, player1Seed: null, player2Id: null, player2Name: null, player2Seed: null,
                              status: 'scheduled', score1: 0, score2: 0, winnerId: null,
                              date: bracketStartDate, time: bronzeTime, venue: bronzeVenue, timestamp: serverTimestamp()
                          };
                          m1.nextLoserMatchId = bronzeMatchRef.id; m1.nextLoserMatchSlot = 'player1'; m2.nextLoserMatchId = bronzeMatchRef.id; m2.nextLoserMatchSlot = 'player2';
                          matchesToCreate.push({ ref: bronzeMatchRef, data: bronzeMatchObj });
                      }
                  }
                  currentRoundStartTime = getMaxTime(courtsAvailable);
                  previousRoundNodes = nextRoundNodes; // Version 7.6 FIX: 更新前一輪節點，避免迴圈無限複製第一輪資料
              }
          }

          matchesToCreate.forEach(m => { batch.set(m.ref, m.data); });
          await batch.commit();
          alert(`✅ 大會「${bracketEventName}」生成成功！`);
          setShowBracketGenerator(false);
          setSelectedBracket(bracketEventName.trim()); 
          setViewMode('bracket'); 
      } catch (e) { console.error(e); alert("生成失敗，請檢查網路連線。"); }
      setIsUpdatingMatch(false);
  };

  const handleAdvanceToKnockout = async () => {
      if (!window.confirm(`確定要結束小組賽階段，並將各組【前 2 名】晉級至淘汰賽嗎？\n(這將自動為 ${selectedBracket} 產生淘汰賽籤表)`)) return;

      let advancingPlayers = [];
      const poolNames = Object.keys(groupedRRMatches).sort();
      
      poolNames.forEach(pool => {
          const standings = tournamentStandings[pool] || [];
          if (standings[0]) advancingPlayers.push({ ...standings[0], pool, seed: 1 });
          if (standings[1]) advancingPlayers.push({ ...standings[1], pool, seed: 2 });
      });

      if (advancingPlayers.length < 2) return alert("晉級人數不足，無法產生淘汰賽！");

      let size = 4;
      if (advancingPlayers.length > 4) size = 8;
      if (advancingPlayers.length > 8) size = 16;
      if (advancingPlayers.length > 16) size = 32;

      while(advancingPlayers.length < size) {
          advancingPlayers.push({ id: 'BYE', name: '[輪空 BYE]', seed: null });
      }

      const rank1s = advancingPlayers.filter(p => p.seed === 1);
      const rank2s = advancingPlayers.filter(p => p.seed === 2);
      const byes = advancingPlayers.filter(p => p.id === 'BYE');

      let seededPlayers = [];
      for (let i = 0; i < size / 2; i++) {
          seededPlayers.push(rank1s[i] || byes.pop());
          seededPlayers.push(rank2s[rank2s.length - 1 - i] || byes.pop());
      }

      setIsUpdatingMatch(true);
      try {
          const batch = writeBatch(db);
          
          const oldKOs = leagueMatches.filter(m => m.tournamentName === selectedBracket && m.groupName === '淘汰賽 (Knockout Stage)' && m.matchType === 'tournament_bracket');
          oldKOs.forEach(m => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', m.id)));

          const matchesToCreate = [];
          let matchCounter = 1;
          let currentRoundPlayers = seededPlayers;
          let currentRoundNodes = [];
          let rounds = Math.log2(size);
          let r = rounds;
          let courtsAvailable = Array(2).fill("14:00"); 

          for(let i=0; i<size/2; i++){
              const p1 = currentRoundPlayers[i*2];
              const p2 = currentRoundPlayers[i*2 + 1];
              const isBye = p2?.id === 'BYE' || p1?.id === 'BYE';
              const winnerId = isBye ? (p1?.id !== 'BYE' ? p1?.id : p2?.id) : null;
              const winnerName = isBye ? (p1?.id !== 'BYE' ? p1?.name : p2?.name) : null;

              const cIdx = getEarliestCourt(courtsAvailable);
              const matchTime = courtsAvailable[cIdx];
              const matchVenue = `Court ${cIdx + 1}`;
              if(!isBye) courtsAvailable[cIdx] = addMins(courtsAvailable[cIdx], 20);

              const matchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
              const matchObj = {
                  id: matchRef.id,
                  tournamentName: selectedBracket,
                  groupName: '淘汰賽 (Knockout Stage)',
                  matchType: 'tournament_bracket',
                  bracketRound: r, 
                  bracketMatchNumber: matchCounter++,
                  player1Id: p1?.id, player1Name: p1?.name, player1Seed: p1?.pool ? `${p1.pool.slice(-1)}1` : null, 
                  player2Id: p2?.id, player2Name: p2?.name, player2Seed: p2?.pool ? `${p2.pool.slice(-1)}2` : null,
                  status: isBye ? 'completed' : 'scheduled',
                  score1: isBye ? 3 : 0, score2: 0,
                  winnerId,
                  date: new Date().toISOString().split('T')[0],
                  time: matchTime, venue: matchVenue, timestamp: serverTimestamp()
              };
              currentRoundNodes.push(matchObj);
              matchesToCreate.push({ ref: matchRef, data: matchObj });
          }

          let currentRoundStartTime = getMaxTime(courtsAvailable);
          let previousRoundNodes = currentRoundNodes;

          for(r = rounds - 1; r >= 1; r--) {
              let nextRoundNodes = [];
              courtsAvailable = Array(2).fill(currentRoundStartTime);

              for(let i=0; i<previousRoundNodes.length; i+=2) {
                  const m1 = previousRoundNodes[i]; const m2 = previousRoundNodes[i+1];
                  const matchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                  
                  const p1Id = m1.winnerId || null; const p1Name = p1Id ? (m1.winnerId === m1.player1Id ? m1.player1Name : m1.player2Name) : null;
                  const p2Id = m2.winnerId || null; const p2Name = p2Id ? (m2.winnerId === m1.player1Id ? m1.player1Name : m2.player2Name) : null;

                  const cIdx = getEarliestCourt(courtsAvailable); const matchTime = courtsAvailable[cIdx]; const matchVenue = `Court ${cIdx + 1}`;
                  courtsAvailable[cIdx] = addMins(courtsAvailable[cIdx], 20);

                  const matchObj = {
                      id: matchRef.id, tournamentName: selectedBracket, groupName: '淘汰賽 (Knockout Stage)', matchType: 'tournament_bracket',
                      bracketRound: r, isFinal: r === 1, bracketMatchNumber: matchCounter++,
                      player1Id: p1Id, player1Name: p1Name, player1Seed: null,
                      player2Id: p2Id, player2Name: p2Name, player2Seed: null,
                      status: 'scheduled', score1: 0, score2: 0, winnerId: null,
                      date: new Date().toISOString().split('T')[0], time: matchTime, venue: matchVenue, timestamp: serverTimestamp()
                  };
                  
                  m1.nextMatchId = matchObj.id; m1.nextMatchSlot = 'player1';
                  m2.nextMatchId = matchObj.id; m2.nextMatchSlot = 'player2';

                  nextRoundNodes.push(matchObj); matchesToCreate.push({ ref: matchRef, data: matchObj });

                  if (r === 1) {
                      const bIdx = getEarliestCourt(courtsAvailable); const bronzeTime = courtsAvailable[bIdx]; const bronzeVenue = `Court ${bIdx + 1}`;
                      const bronzeMatchRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'));
                      const bronzeMatchObj = {
                          id: bronzeMatchRef.id, tournamentName: selectedBracket, groupName: '淘汰賽 (Knockout Stage)', matchType: 'tournament_bracket',
                          bracketRound: 1, isBronzeFinal: true, bracketMatchNumber: matchCounter++,
                          player1Id: null, player1Name: null, player2Id: null, player2Name: null,
                          status: 'scheduled', score1: 0, score2: 0, winnerId: null,
                          date: new Date().toISOString().split('T')[0], time: bronzeTime, venue: bronzeVenue, timestamp: serverTimestamp()
                      };
                      m1.nextLoserMatchId = bronzeMatchRef.id; m1.nextLoserMatchSlot = 'player1'; m2.nextLoserMatchId = bronzeMatchRef.id; m2.nextLoserMatchSlot = 'player2';
                      matchesToCreate.push({ ref: bronzeMatchRef, data: bronzeMatchObj });
                  }
              }
              currentRoundStartTime = getMaxTime(courtsAvailable);
              previousRoundNodes = nextRoundNodes; // Version 7.6 FIX: 更新前一輪節點，避免迴圈無限複製第一輪資料
          }

          matchesToCreate.forEach(m => { batch.set(m.ref, m.data); });
          await batch.commit();
          alert("✅ 已成功根據小組賽成績，生成最終的晉級淘汰賽籤表！");
      } catch (e) { console.error(e); alert("生成淘汰賽失敗。"); }
      setIsUpdatingMatch(false);
  };

  const handleScoreUpdateIntercept = async (match) => {
      if (match.matchType === 'tournament_bracket' || match.matchType === 'tournament_round_robin') {
          const p1Raw = prompt(`請輸入 ${match.player1Name} 總局數得分 (例如: 3)`); if (p1Raw === null) return;
          const p2Raw = prompt(`請輸入 ${match.player2Name} 總局數得分 (例如: 1)`); if (p2Raw === null) return;
          
          const score1 = parseInt(p1Raw, 10); const score2 = parseInt(p2Raw, 10);
          if (isNaN(score1) || isNaN(score2) || score1 === score2) return alert("比分無效或平手，必須分出勝負。");

          const gameScoresRaw = prompt(`請輸入詳細各局比分 (例如: 11-5, 9-11, 11-8)\n若不想記錄可直接留空：`);
          if (gameScoresRaw === null) return;

          const isP1Winner = score1 > score2;
          const winnerId = isP1Winner ? match.player1Id : match.player2Id;
          const winnerName = isP1Winner ? match.player1Name : match.player2Name;
          const winnerSeed = isP1Winner ? match.player1Seed : match.player2Seed; 
          
          const loserId = isP1Winner ? match.player2Id : match.player1Id;
          const loserName = isP1Winner ? match.player2Name : match.player1Name;
          const loserSeed = isP1Winner ? match.player2Seed : match.player1Seed; 

          if(!confirm(`確認賽果？\n${match.player1Name} ${score1} : ${score2} ${match.player2Name}\n晉級者：${winnerName}`)) return;

          try {
              const batch = writeBatch(db);
              const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.id);
              batch.update(matchRef, { score1, score2, winnerId, status: 'completed', gameScoresStr: gameScoresRaw.trim(), updatedAt: serverTimestamp() });
              
              if (match.matchType === 'tournament_bracket') {
                  if (match.nextMatchId) {
                       const nextMatchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.nextMatchId);
                       const updateObj = {};
                       if (match.nextMatchSlot === 'player1') { updateObj.player1Id = winnerId; updateObj.player1Name = winnerName; updateObj.player1Seed = winnerSeed; } 
                       else { updateObj.player2Id = winnerId; updateObj.player2Name = winnerName; updateObj.player2Seed = winnerSeed; }
                       batch.update(nextMatchRef, updateObj);
                  }
                  if (match.nextLoserMatchId) {
                       const nextLoserMatchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.nextLoserMatchId);
                       const updateLoserObj = {};
                       if (match.nextLoserMatchSlot === 'player1') { updateLoserObj.player1Id = loserId; updateLoserObj.player1Name = loserName; updateLoserObj.player1Seed = loserSeed; } 
                       else { updateLoserObj.player2Id = loserId; updateLoserObj.player2Name = loserName; updateLoserObj.player2Seed = loserSeed; }
                       batch.update(nextLoserMatchRef, updateLoserObj);
                  }
              }

              if (match.matchType === 'tournament_round_robin') {
                  const winnerStudent = students.find(s => s.id === winnerId);
                  const loserStudent = students.find(s => s.id === loserId);
                  if (winnerStudent && loserStudent) {
                      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', winnerStudent.id), { points: increment(10), lastUpdated: serverTimestamp() });
                      batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', loserStudent.id), { points: increment(-10), lastUpdated: serverTimestamp() });
                  }
              }

              await batch.commit();
              alert("✅ 賽果已儲存！");
          } catch (e) { console.error(e); alert("儲存失敗。"); }
      } else {
          handleUpdateLeagueMatchScore(match);
      }
  };

  const openScoreOverrideModal = (match) => { /* 略 */ };
  const handleConfirmOverride = async () => { /* 略 */ };
  const handleDownloadPoster = useCallback(() => { /* 略 */ }, [tournamentStandings, selectedTournament]);
  const hasStandings = tournamentStandings && Object.keys(tournamentStandings).length > 0;

  return (
    <div className="space-y-0 animate-in fade-in duration-500 relative">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Medal size={28}/></div>
             <div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">聯賽專區</h3>
               <p className="text-slate-500 text-sm mt-1 font-bold">查看賽事排位與大賽賽程 <span className="ml-2 bg-slate-100 px-2 py-0.5 rounded text-xs">v7.6</span></p>
             </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-100 shrink-0">
                <button onClick={() => setViewMode('league')} className={`px-4 py-2 text-sm font-black rounded-xl transition-all ${viewMode === 'league' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    📊 日常聯賽榜
                </button>
                <button onClick={() => setViewMode('bracket')} className={`px-4 py-2 text-sm font-black rounded-xl transition-all flex items-center gap-1 ${viewMode === 'bracket' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Trophy size={16}/> 大賽管理 (Tournaments)
                </button>
            </div>

            <div className="relative shadow-sm rounded-xl">
              {viewMode === 'league' ? (
                  <select value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)} className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-black text-slate-700 outline-none cursor-pointer hover:bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all min-w-[220px]">
                    {leagueNames.length === 0 ? <option value="">暫無聯賽</option> : leagueNames.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              ) : (
                  <select value={selectedBracket} onChange={e => setSelectedBracket(e.target.value)} className="appearance-none bg-amber-50 border border-amber-200 rounded-xl pl-4 pr-10 py-3 text-sm font-black text-amber-700 outline-none cursor-pointer hover:bg-white hover:border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all min-w-[220px]">
                    {bracketNames.length === 0 ? <option value="">暫無大賽</option> : bracketNames.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
              )}
              <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${viewMode === 'league' ? 'text-slate-400' : 'text-amber-500'}`} />
            </div>

            {role === 'admin' && (
              <>
                {(viewMode === 'league' ? selectedTournament : selectedBracket) && (
                    <button onClick={() => handleDeleteCollection('tournament', viewMode === 'league' ? selectedTournament : selectedBracket, viewMode)} className="p-3 bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm" title="刪除整個大會">
                        <Trash2 size={18} />
                    </button>
                )}

                {viewMode === 'bracket' && (
                    <button onClick={() => setShowBracketGenerator(true)} className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 transition-all shadow-md">
                      <Trophy size={16} /> 舉辦新大賽
                    </button>
                )}
                <button onClick={setShowTacticalBoard.bind(null, true)} className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"><Target size={16} /> 戰術板</button>
                <button onClick={setShowUmpirePanel.bind(null, true)} className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl text-xs font-black hover:bg-red-600 transition-all shadow-md animate-pulse"><Activity size={16} /> 轉播室</button>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'bracket' ? (
          currentTournamentMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mt-8">
                <div className="p-6 bg-slate-50 rounded-full mb-4"><Trophy size={48} strokeWidth={1.5} className="text-slate-300" /></div>
                <p className="font-black text-slate-400 text-lg">目前大賽無任何紀錄</p>
              </div>
          ) : (
              <div className="space-y-12 mt-8">
                  
                  {/* 小組循環賽 (Round Robin) */}
                  {Object.keys(groupedRRMatches).length > 0 && (
                      <div className="mb-12">
                          <div className="flex items-center justify-between mb-6">
                              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Grid className="text-blue-500"/> 小組積分榜 (Group Stage)</h3>
                              
                              {role === 'admin' && (
                                  <button onClick={handleAdvanceToKnockout} disabled={isUpdatingMatch} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl text-sm font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                      {isUpdatingMatch ? <Loader2 className="animate-spin" size={18}/> : <FastForward size={18}/>} 結算小組賽並生成晉級淘汰賽
                                  </button>
                              )}
                          </div>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                              {Object.keys(groupedRRMatches).map(groupName => (
                                  <div key={groupName} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                                      <div className="flex justify-between items-center mb-4">
                                          <h4 className="text-lg font-black text-blue-700 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">{groupName}</h4>
                                          {role === 'admin' && (
                                              <button onClick={() => handleDeleteCollection('group', groupName, 'bracket')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                                          )}
                                      </div>
                                      <StandingsTable players={tournamentStandings?.[groupName] || []} />
                                      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar border-t border-slate-100 pt-4">
                                          {groupedRRMatches[groupName].map(match => (
                                              <div key={match.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                  <div className="flex flex-col w-1/3">
                                                      <span className="text-[10px] text-slate-400 font-bold">{match.date} {match.time}</span>
                                                      <span className="text-xs font-black text-slate-700">{match.player1Name} vs {match.player2Name}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                      {match.status === 'completed' ? (
                                                          <span className="font-mono font-black text-sm bg-slate-200 px-2 py-1 rounded">{match.score1}:{match.score2}</span>
                                                      ) : (
                                                          <StatusPill status={match.status} />
                                                      )}
                                                      {role === 'admin' && match.status !== 'completed' && (
                                                          <button onClick={(e) => { e.stopPropagation(); setActiveLeagueMatch(match); setShowUmpirePanel(true); }} className="text-red-500 hover:scale-110 transition-transform"><PlayCircle size={20}/></button>
                                                      )}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* 淘汰賽樹狀圖 (Knockout) */}
                  {Object.keys(groupedKOMatches).map(groupName => (
                      <div key={groupName} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in zoom-in-95 duration-300">
                          <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                  <Trophy size={20} className="text-amber-500" /> {groupName} 
                              </h3>
                              {role === 'admin' && (
                                  <button onClick={() => handleDeleteCollection('group', groupName, 'bracket')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18}/></button>
                              )}
                          </div>
                          <TournamentBracket 
                              bracketMatches={groupedKOMatches[groupName]} 
                              students={students} 
                              role={role} 
                              onMatchClick={role === 'admin' ? handleScoreUpdateIntercept : null} 
                              liveMatches={liveBracketMatches} 
                              onStartLiveBroadcast={(match) => { setActiveLeagueMatch(match); setShowUmpirePanel(true); }}
                          />
                      </div>
                  ))}
              </div>
          )
      ) : (
          Object.keys(localGroupedLeagueMatches).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <div className="p-6 bg-slate-50 rounded-full mb-4"><Trophy size={48} strokeWidth={1.5} className="text-slate-300" /></div>
                <p className="font-black text-slate-400 text-lg">{currentLeagueMatches.length > 0 ? '目前賽事無聯賽紀錄' : '暫無聯賽，教練可建立新聯賽'}</p>
              </div>
          ) : (
              Object.keys(localGroupedLeagueMatches).map(groupName => (
                <GroupSection 
                    key={groupName} groupName={groupName} matches={localGroupedLeagueMatches[groupName]} 
                    enrichedStandings={tournamentStandings} tournamentStandings={tournamentStandings} role={role} 
                    currentUserInfo={currentUserInfo} handleCheerMatch={handleCheerMatch} setActiveLeagueMatch={setActiveLeagueMatch} 
                    setShowUmpirePanel={setShowUmpirePanel} handleUpdateLeagueMatchScore={handleScoreUpdateIntercept} 
                    handleEditLeagueMatch={handleEditLeagueMatch} deleteItem={deleteItem} students={students} 
                    openScoreOverrideModal={openScoreOverrideModal} onDeleteGroup={(name) => handleDeleteCollection('group', name, 'league')}
                />
              ))
          )
      )}

      {/* 大賽生成器 UI */}
      {showBracketGenerator && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[95vh] min-h-0">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <div>
                          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Trophy className="text-amber-500"/> 舉辦世界級大賽</h3>
                          <p className="text-sm font-bold text-slate-400">選擇賽制並讓系統自動分配賽程</p>
                      </div>
                      <button onClick={() => setShowBracketGenerator(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 min-h-0">
                      
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <label className="text-xs font-black text-amber-800 mb-3 block">1. 選擇賽制 (Format)</label>
                          <div className="flex gap-2 mb-4">
                              <button onClick={() => setTournFormat('knockout')} className={`flex-1 py-3 rounded-xl font-black transition-all ${tournFormat === 'knockout' ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>單敗淘汰賽 (Knockout)</button>
                              <button onClick={() => setTournFormat('round_robin')} className={`flex-1 py-3 rounded-xl font-black transition-all ${tournFormat === 'round_robin' ? 'bg-blue-500 text-white shadow-md scale-105' : 'bg-white text-slate-500 border border-slate-200'}`}>小組循環賽 (Round Robin)</button>
                          </div>
                          
                          {tournFormat === 'round_robin' && (
                              <div className="animate-in fade-in slide-in-from-top-2">
                                  <label className="text-xs font-black text-blue-800 mb-2 block">分組數量 (自動蛇形排陣)</label>
                                  <select value={tournPools} onChange={e=>setTournPools(parseInt(e.target.value))} className="w-full p-3 rounded-lg border border-blue-200 text-sm font-bold outline-none text-blue-800 bg-white">
                                      <option value={1}>1 組 (單循環)</option>
                                      <option value={2}>2 組 (Pool A, Pool B)</option>
                                      <option value={4}>4 組 (Pool A ~ D)</option>
                                      <option value={8}>8 組 (Pool A ~ H)</option>
                                  </select>
                              </div>
                          )}
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <h4 className="text-sm font-black text-blue-800 mb-3 flex items-center gap-2"><Clock size={16}/> 2. 智能賽程排程</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase">比賽日期</label>
                                  <input type="date" value={bracketStartDate} onChange={e=>setBracketStartDate(e.target.value)} className="w-full p-2 mt-1 rounded-lg border border-blue-200 text-sm font-bold outline-none" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase">首場時間</label>
                                  <input type="time" value={bracketStartTime} onChange={e=>setBracketStartTime(e.target.value)} className="w-full p-2 mt-1 rounded-lg border border-blue-200 text-sm font-bold outline-none" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase">可用場地</label>
                                  <input type="number" min="1" max="10" value={bracketCourts} onChange={e=>setBracketCourts(e.target.value)} className="w-full p-2 mt-1 rounded-lg border border-blue-200 text-sm font-bold outline-none" />
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase">預估耗時 (分)</label>
                                  <input type="number" min="5" step="5" value={bracketMatchDuration} onChange={e=>setBracketMatchDuration(e.target.value)} className="w-full p-2 mt-1 rounded-lg border border-blue-200 text-sm font-bold outline-none" />
                              </div>
                          </div>
                      </div>

                      <div>
                          {/* Version 7.6 FIX: 重新加回組別名稱的輸入介面 */}
                          <label className="text-xs font-black text-slate-400 mb-2 block">3. 大會名稱與組別</label>
                          <div className="flex gap-4 flex-col md:flex-row">
                              <div className="flex-1">
                                  <input type="text" placeholder="大會名稱 (例: 2026 校慶盃)" value={bracketEventName} onChange={e=>setBracketEventName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-lg outline-none focus:border-amber-500" />
                              </div>
                              <div className="flex-1">
                                  <input type="text" placeholder="組別名稱 (例: 男子組/女子組)" value={bracketName} onChange={e=>setBracketName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-lg outline-none focus:border-amber-500" />
                              </div>
                          </div>
                      </div>

                      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl flex flex-col md:flex-row gap-3 items-center">
                          <span className="text-sm font-black text-purple-700 whitespace-nowrap">➕ 4. 邀請外校選手</span>
                          <input type="text" placeholder="選手名稱 (例: 男拔-李明)" value={extPlayerName} onChange={e=>setExtPlayerName(e.target.value)} className="flex-1 p-2 rounded-lg border border-purple-200 text-sm font-bold outline-none focus:border-purple-500" />
                          <button onClick={() => {
                              if(!extPlayerName.trim()) return;
                              const newExt = { id: `ext_${Date.now()}`, name: extPlayerName.trim(), points: 1000, isExternal: true };
                              setExternalBracketPlayers([...externalBracketPlayers, newExt]);
                              setBracketPlayers([...bracketPlayers, newExt.id]);
                              setExtPlayerName('');
                          }} className="px-4 py-2 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-700">加入籤表</button>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[...students, ...externalBracketPlayers].map(s => {
                              const isSelected = bracketPlayers.includes(s.id);
                              return (
                                  <div key={s.id} onClick={() => setBracketPlayers(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2 font-bold text-sm ${isSelected ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'} shadow-sm`}>
                                      {isSelected ? <CheckCircle2 size={18} className="text-amber-500" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>}
                                      <span className="truncate">{s.name}</span>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3 pt-4 border-t shrink-0">
                      <button onClick={() => setBracketPlayers([])} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">清空選擇</button>
                      <button onClick={handleGenerateTournament} disabled={isUpdatingMatch} className="px-8 py-3 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 shadow-lg flex items-center gap-2">
                          {isUpdatingMatch ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>} 開始生成大會賽程
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
