// src/components/UmpirePanelModal.jsx (Version 4.5 - Fix Empty View & Full Pro Analytics Integration)

import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Timer, AlertTriangle, ListChecks, RotateCcw, Swords, Play, Flag, Crosshair, TrendingDown } from 'lucide-react';
import { collection, doc, serverTimestamp, addDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';

const UmpirePanelModal = ({ 
    onClose, activeLeagueMatch, setActiveLeagueMatch, liveMatches, 
    leagueMatches, students, rankedStudents, BADGE_DATA, db, appId 
}) => {
    const [p1Name, setP1Name] = useState(activeLeagueMatch ? activeLeagueMatch.player1Name : '');
    const [p2Name, setP2Name] = useState(activeLeagueMatch ? activeLeagueMatch.player2Name : '');
    const [matchFormat, setMatchFormat] = useState('11'); 
    const [bestOf, setBestOf] = useState('3');           
    const [startingServer, setStartingServer] = useState(1);

    const [timeLeft, setTimeLeft] = useState(0); 
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) { setIsTimerRunning(false); }
        return () => clearTimeout(timerRef.current);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const startTimer = (minutes) => {
        setTimeLeft(minutes * 60);
        setIsTimerRunning(true);
    };

    const startLiveMatch = async () => {
        if (!p1Name || !p2Name) return alert("請確認雙方球員姓名");
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'live_matches'), {
                player1: p1Name, player2: p2Name,
                score1: 0, score2: 0,
                games1: 0, games2: 0,
                server: startingServer, serveSide: 'R',
                status: 'live',
                format: parseInt(matchFormat), bestOf: parseInt(bestOf),      
                matchWinner: null,
                leagueMatchId: activeLeagueMatch ? activeLeagueMatch.id : null,
                pointLog: [], updatedAt: serverTimestamp()
            });
            if(!activeLeagueMatch) { setP1Name(''); setP2Name(''); }
        } catch(e) { console.error(e); }
    };

    const handleUndoAction = async (match) => {
        const currentLog = match.pointLog || [];
        if (currentLog.length === 0) return; 
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        const lastAction = currentLog[currentLog.length - 1];
        
        if (window.confirm(`確定要撤銷上一球 (${lastAction.p1Score}-${lastAction.p2Score}) 的紀錄嗎？`)) {
            const newLog = [...currentLog];
            newLog.pop();
            const prevAction = newLog.length > 0 ? newLog[newLog.length - 1] : null;
            const updateData = {
                score1: prevAction ? prevAction.p1Score : 0,
                score2: prevAction ? prevAction.p2Score : 0,
                server: prevAction ? prevAction.actionBy : match.server, 
                serveSide: 'R', pointLog: newLog, updatedAt: serverTimestamp()
            };
            if (lastAction.p1Score === 0 && lastAction.p2Score === 0 && (match.games1 > 0 || match.games2 > 0)) {
                alert("⚠️ 注意：此分涉及跨局結算，請直接手動修正下一局比分。");
                return;
            }
            await updateDoc(matchRef, updateData);
        }
    };

    const handleAction = async (match, playerNum, actionType, cause = null) => {
        if (match.matchWinner) return alert("比賽已經結束！");
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        let newScore1 = match.score1;
        let newScore2 = match.score2;
        let newServer = match.server;
        let newServeSide = match.serveSide;
        let isGameWon = false;
        
        if (actionType === 'normal_win' || actionType === 'stroke' || actionType === 'no_let') {
            const scoringPlayer = actionType === 'no_let' ? (playerNum === 1 ? 2 : 1) : playerNum;
            
            if (scoringPlayer === 1) newScore1 += 1;
            if (scoringPlayer === 2) newScore2 += 1;
            
            if (match.server === scoringPlayer) {
                newServeSide = match.serveSide === 'R' ? 'L' : 'R';
            } else {
                newServer = scoringPlayer;
                newServeSide = 'R'; 
            }
            const targetScore = match.format; 
            const diff = Math.abs(newScore1 - newScore2);
            if (Math.max(newScore1, newScore2) >= targetScore && diff >= 2) { isGameWon = true; }
        } 

        const newLogEntry = {
            id: Date.now(), game: match.games1 + match.games2 + 1,
            p1Score: newScore1, p2Score: newScore2,
            actionBy: playerNum, type: actionType, 
            cause: cause || actionType, 
            timestamp: new Date().toISOString()
        };

        let updateData = {
            score1: newScore1, score2: newScore2,
            server: newServer, serveSide: newServeSide,
            pointLog: [...(match.pointLog || []), newLogEntry],
            updatedAt: serverTimestamp()
        };

        if (isGameWon) {
            const winningPlayerName = (newScore1 > newScore2) ? match.player1 : match.player2;
            const gameWinnerNum = (newScore1 > newScore2) ? 1 : 2;
            
            if (window.confirm(`【第 ${match.games1 + match.games2 + 1} 局結束】\n${winningPlayerName} 贏得此局！`)) {
                const newGames1 = gameWinnerNum === 1 ? match.games1 + 1 : match.games1;
                const newGames2 = gameWinnerNum === 2 ? match.games2 + 1 : match.games2;
                const gamesNeededToWin = match.bestOf === 1 ? 1 : (match.bestOf === 3 ? 2 : 3);

                updateData = { ...updateData, score1: 0, score2: 0, games1: newGames1, games2: newGames2, server: gameWinnerNum, serveSide: 'R' };

                if (newGames1 === gamesNeededToWin || newGames2 === gamesNeededToWin) {
                    const matchWinnerNum = newGames1 === gamesNeededToWin ? 1 : 2;
                    updateData.matchWinner = matchWinnerNum;
                    
                    if (match.leagueMatchId) {
                        const lMatch = leagueMatches.find(m => m.id === match.leagueMatchId);
                        if (lMatch) {
                            const winnerId = matchWinnerNum === 1 ? lMatch.player1Id : lMatch.player2Id;
                            const winnerStudent = students.find(s => s.id === winnerId);
                            const loserStudent = students.find(s => s.id === (matchWinnerNum === 1 ? lMatch.player2Id : lMatch.player1Id));
                            if (winnerStudent && loserStudent) {
                                const winnerRank = rankedStudents.findIndex(s => s.id === winnerStudent.id) + 1;
                                const loserRank = rankedStudents.findIndex(s => s.id === loserStudent.id) + 1;
                                const pointsToAdd = ((winnerRank - loserRank) >= 5 || (BADGE_DATA[winnerStudent.badge]?.level < BADGE_DATA[loserStudent.badge]?.level)) ? 20 : 10;
                                const batch = writeBatch(db);
                                batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', lMatch.id), { score1: newGames1, score2: newGames2, winnerId: winnerId, status: 'completed', updatedAt: serverTimestamp() });
                                batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', winnerStudent.id), { points: increment(pointsToAdd), lastUpdated: serverTimestamp() });
                                batch.commit();
                            }
                        }
                    }
                }
            } else { return; }
        }
        await updateDoc(matchRef, updateData);
    };

    const updateServeSide = async (matchId, side) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', matchId), { serveSide: side });
    };

    const endMatch = async (matchId) => {
        if(window.confirm("確定要下架這場比賽嗎？")) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', matchId), { status: 'finished' });
            setActiveLeagueMatch(null); 
        }
    };

    const checkGameMatchBall = (score, oppScore, format, myGames, bestOf) => {
        const target = parseInt(format);
        const gamesNeeded = bestOf === 1 ? 1 : (bestOf === 3 ? 2 : 3);
        if (score >= target - 1 && score > oppScore) {
            if (myGames === gamesNeeded - 1) return 'Match Ball';
            return 'Game Ball';
        }
        return null;
    };

    const renderCauseBadge = (cause) => {
        switch(cause) {
            case 'winner': return <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-sm">W</span>;
            case 'error': return <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-sm">E</span>;
            case 'stroke': return <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-sm">S</span>;
            case 'let': return <span className="bg-slate-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-sm">L</span>;
            case 'no_let': return <span className="bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-black shadow-sm">NL</span>;
            default: return <span className="bg-slate-300 text-slate-700 text-[9px] px-1 py-0.5 rounded uppercase">{cause}</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Activity className="text-red-500 animate-pulse"/> Pro Umpire Console <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">v4.5 Full Analytics</span>
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    
                    {/* 完整修復：重回賽事設定區 */}
                    <div className="mb-8 p-8 bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center gap-3 border-b pb-4">
                            <Play className="text-red-600 fill-red-600" size={24}/>
                            <h4 className="text-2xl font-black text-slate-800">Match Setup</h4>
                        </div>

                        {activeLeagueMatch && (
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">連動賽事：</span>
                                <div className="flex gap-4 items-center font-black text-blue-900 text-lg mr-2">
                                    <span>{activeLeagueMatch.player1Name}</span> <span className="text-blue-300">VS</span> <span>{activeLeagueMatch.player2Name}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">分數制 (Format)</label>
                                <select value={matchFormat} onChange={e=>setMatchFormat(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none font-black text-slate-700 focus:border-blue-500 transition-all">
                                    <option value="11">11 分制 (Standard)</option>
                                    <option value="9">9 分制 (Classic)</option>
                                    <option value="15">15 分制 (Club)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">局數制 (Best of)</label>
                                <select value={bestOf} onChange={e=>setBestOf(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none font-black text-slate-700 focus:border-blue-500 transition-all">
                                    <option value="1">1 局定勝負</option>
                                    <option value="3">3 局 2 勝</option>
                                    <option value="5">5 局 3 勝</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">先發球員 (Start Server)</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-100">
                                    <button onClick={()=>setStartingServer(1)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${startingServer === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>P1</button>
                                    <button onClick={()=>setStartingServer(2)} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${startingServer === 2 ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>P2</button>
                                </div>
                            </div>
                        </div>

                        {!activeLeagueMatch && (
                            <div className="flex gap-4">
                                <input value={p1Name} onChange={e=>setP1Name(e.target.value)} placeholder="Player 1 Name" className="flex-1 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none font-black text-blue-600 placeholder:text-slate-300 focus:border-blue-500 transition-all"/>
                                <div className="self-center font-black text-slate-300 italic">VS</div>
                                <input value={p2Name} onChange={e=>setP2Name(e.target.value)} placeholder="Player 2 Name" className="flex-1 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none font-black text-rose-600 placeholder:text-slate-300 focus:border-rose-500 transition-all text-right"/>
                            </div>
                        )}

                        <button onClick={startLiveMatch} className="w-full bg-red-600 text-white px-4 py-5 rounded-[1.5rem] font-black text-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                            <Activity size={24}/> 開始即時轉播 (Launch Arena)
                        </button>
                    </div>
                    
                    {/* 進行中的比賽面板 */}
                    {liveMatches.filter(m => m.status === 'live').map(match => {
                        const p1Status = checkGameMatchBall(match.score1, match.score2, match.format, match.games1, match.bestOf);
                        const p2Status = checkGameMatchBall(match.score2, match.score1, match.format, match.games2, match.bestOf);

                        return (
                            <div key={match.id} className="flex flex-col lg:flex-row gap-6 relative animate-in zoom-in-95 mt-4">
                                
                                {match.matchWinner && (
                                    <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center border-4 border-yellow-400 shadow-2xl">
                                        <h4 className="text-4xl font-black text-yellow-500 mb-2">🏆 比賽結束</h4>
                                        <button onClick={() => endMatch(match.id)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-full text-lg shadow-xl hover:bg-slate-800 transition-all">關閉裁判台</button>
                                    </div>
                                )}

                                <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse">● LIVE</span>
                                            <span className="text-sm font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">BO{match.bestOf}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl shadow-inner">
                                                <RotateCcw size={16} className={isTimerRunning ? "text-yellow-400 animate-pulse" : "text-slate-400"}/>
                                                <span className="font-mono font-black text-xl w-14 text-center">{formatTime(timeLeft)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="text-center"><div className="text-[10px] font-black text-slate-400">P1 局數</div><div className="text-xl font-black text-blue-600">{match.games1}</div></div>
                                            <div className="text-slate-300 font-black">-</div>
                                            <div className="text-center"><div className="text-[10px] font-black text-slate-400">P2 局數</div><div className="text-xl font-black text-rose-600">{match.games2}</div></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        
                                        {/* Player 1 控制區 */}
                                        <div className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col justify-between items-center relative ${match.server === 1 ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                            {p1Status && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm"><Flag size={12}/> {p1Status}</div>}
                                            <h3 className={`text-2xl font-black w-full text-center mb-2 ${match.server === 1 ? 'text-blue-700' : 'text-slate-700'}`}>{match.player1}</h3>
                                            
                                            <div className="flex gap-2 mb-4 h-8">
                                                {match.server === 1 && (
                                                    <>
                                                        <button onClick={() => updateServeSide(match.id, 'L')} className={`px-5 py-1 text-sm rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>Left</button>
                                                        <button onClick={() => updateServeSide(match.id, 'R')} className={`px-5 py-1 text-sm rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>Right</button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="text-8xl font-mono font-black text-slate-800 mb-4">{match.score1}</div>
                                            
                                            <div className="w-full mb-4">
                                                <div className="text-[9px] text-slate-400 font-bold mb-1 text-center uppercase tracking-widest border-b border-slate-200 pb-1">得分原因 (Score Cause)</div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <button onClick={() => handleAction(match, 1, 'normal_win', 'winner')} className="py-3 bg-emerald-500 text-white rounded-xl font-black shadow-md hover:bg-emerald-400 active:scale-95 flex flex-col items-center"><Crosshair size={16} className="mb-1"/>致勝球 (W)</button>
                                                    <button onClick={() => handleAction(match, 1, 'normal_win', 'error')} className="py-3 bg-amber-500 text-white rounded-xl font-black shadow-md hover:bg-amber-400 active:scale-95 flex flex-col items-center"><TrendingDown size={16} className="mb-1"/>對手失誤 (E)</button>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full">
                                                <div className="text-[9px] text-slate-400 font-bold mb-1 text-center uppercase tracking-widest border-b border-slate-200 pb-1">裁判判決 (Decisions)</div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <button onClick={() => handleAction(match, 1, 'stroke', 'stroke')} className="py-2 bg-rose-100 text-rose-700 rounded-lg text-[11px] font-black border border-rose-200 active:scale-95">Stroke (S)</button>
                                                    <button onClick={() => handleAction(match, 1, 'let', 'let')} className="py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-black border border-slate-300 active:scale-95">Yes Let</button>
                                                    <button onClick={() => handleAction(match, 1, 'no_let', 'no_let')} className="py-2 bg-slate-800 text-white rounded-lg text-[11px] font-black shadow-md active:scale-95">No Let</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Player 2 控制區 */}
                                        <div className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col justify-between items-center relative ${match.server === 2 ? 'border-rose-500 bg-rose-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                            {p2Status && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm"><Flag size={12}/> {p2Status}</div>}
                                            <h3 className={`text-2xl font-black w-full text-center mb-2 ${match.server === 2 ? 'text-rose-700' : 'text-slate-700'}`}>{match.player2}</h3>
                                            
                                            <div className="flex gap-2 mb-4 h-8">
                                                {match.server === 2 && (
                                                    <>
                                                        <button onClick={() => updateServeSide(match.id, 'L')} className={`px-5 py-1 text-sm rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>Left</button>
                                                        <button onClick={() => updateServeSide(match.id, 'R')} className={`px-5 py-1 text-sm rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>Right</button>
                                                    </>
                                                )}
                                            </div>

                                            <div className="text-8xl font-mono font-black text-slate-800 mb-4">{match.score2}</div>
                                            
                                            <div className="w-full mb-4">
                                                <div className="text-[9px] text-slate-400 font-bold mb-1 text-center uppercase tracking-widest border-b border-slate-200 pb-1">得分原因 (Score Cause)</div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <button onClick={() => handleAction(match, 2, 'normal_win', 'winner')} className="py-3 bg-emerald-500 text-white rounded-xl font-black shadow-md hover:bg-emerald-400 active:scale-95 flex flex-col items-center"><Crosshair size={16} className="mb-1"/>致勝球 (W)</button>
                                                    <button onClick={() => handleAction(match, 2, 'normal_win', 'error')} className="py-3 bg-amber-500 text-white rounded-xl font-black shadow-md hover:bg-amber-400 active:scale-95 flex flex-col items-center"><TrendingDown size={16} className="mb-1"/>對手失誤 (E)</button>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full">
                                                <div className="text-[9px] text-slate-400 font-bold mb-1 text-center uppercase tracking-widest border-b border-slate-200 pb-1">裁判判決 (Decisions)</div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <button onClick={() => handleAction(match, 2, 'stroke', 'stroke')} className="py-2 bg-rose-100 text-rose-700 rounded-lg text-[11px] font-black border border-rose-200 active:scale-95">Stroke (S)</button>
                                                    <button onClick={() => handleAction(match, 2, 'let', 'let')} className="py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-black border border-slate-300 active:scale-95">Yes Let</button>
                                                    <button onClick={() => handleAction(match, 2, 'no_let', 'no_let')} className="py-2 bg-slate-800 text-white rounded-lg text-[11px] font-black shadow-md active:scale-95">No Let</button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-4">
                                        <button onClick={() => handleUndoAction(match)} disabled={!match.pointLog || match.pointLog.length === 0} className="flex items-center gap-2 px-6 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-black text-sm hover:bg-amber-100 transition-all disabled:opacity-30 shadow-sm active:scale-95"><RotateCcw size={16}/> 撤銷上一分</button>
                                        <button onClick={() => endMatch(match.id)} className="text-sm text-red-400 font-bold underline hover:text-red-600">下架此賽事</button>
                                    </div>
                                </div>

                                {/* 高階逐分紀錄表 */}
                                <div className="w-full lg:w-80 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                                    <div className="bg-black/50 p-4 border-b border-slate-800 flex justify-between items-center">
                                        <h4 className="text-white font-black flex items-center gap-2"><ListChecks size={18}/> 專業賽事分析流</h4>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono uppercase tracking-widest">Matrix Log</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-sm custom-scrollbar bg-slate-900">
                                        {match.pointLog?.map((log, i) => (
                                            <div key={log.id || i} className={`grid grid-cols-[1fr_2fr_1fr] items-center p-2 rounded-xl border border-slate-700/50 ${i === match.pointLog.length - 1 ? 'bg-slate-800 border-slate-500 shadow-inner' : 'bg-slate-800/30'}`}>
                                                <div className={`text-center text-lg font-black ${log.actionBy === 1 ? 'text-blue-400' : 'text-slate-500'}`}>{log.p1Score}</div>
                                                <div className="flex flex-col items-center">
                                                    {renderCauseBadge(log.cause)}
                                                </div>
                                                <div className={`text-center text-lg font-black ${log.actionBy === 2 ? 'text-rose-400' : 'text-slate-500'}`}>{log.p2Score}</div>
                                            </div>
                                        ))}
                                        {(!match.pointLog || match.pointLog.length === 0) && (
                                            <div className="text-center text-slate-600 text-xs mt-10 font-bold">尚未產生紀錄</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UmpirePanelModal;
