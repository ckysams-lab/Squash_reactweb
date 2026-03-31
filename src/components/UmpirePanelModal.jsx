// src/components/UmpirePanelModal.jsx (Version 4.1 - Undo Feature Fixed)

import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Timer, AlertTriangle, ListChecks, RotateCcw } from 'lucide-react';
import { collection, doc, serverTimestamp, addDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';

const UmpirePanelModal = ({ 
    onClose, activeLeagueMatch, setActiveLeagueMatch, liveMatches, 
    leagueMatches, students, rankedStudents, BADGE_DATA, db, appId 
}) => {
    const [p1Name, setP1Name] = useState(activeLeagueMatch ? activeLeagueMatch.player1Name : '');
    const [p2Name, setP2Name] = useState(activeLeagueMatch ? activeLeagueMatch.player2Name : '');
    const [matchFormat, setMatchFormat] = useState('11'); 
    const [bestOf, setBestOf] = useState('3');           

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
                server: 1, serveSide: 'R',
                status: 'live',
                format: parseInt(matchFormat), 
                bestOf: parseInt(bestOf),      
                matchWinner: null,
                leagueMatchId: activeLeagueMatch ? activeLeagueMatch.id : null,
                pointLog: [], 
                updatedAt: serverTimestamp()
            });
        } catch(e) { console.error(e); }
    };

    // 👇 --- 核心邏輯：復原上一球 (Undo) --- 👇
    const handleUndoAction = async (match) => {
        const currentLog = match.pointLog || [];
        if (currentLog.length === 0) return; 

        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        const lastAction = currentLog[currentLog.length - 1];
        
        if (window.confirm(`確定要撤銷上一球的紀錄嗎？\n(將還原比分至上一球前)`)) {
            const newLog = [...currentLog];
            newLog.pop(); // 移除最後一筆

            const prevAction = newLog.length > 0 ? newLog[newLog.length - 1] : null;

            const updateData = {
                score1: prevAction ? prevAction.p1Score : 0,
                score2: prevAction ? prevAction.p2Score : 0,
                server: prevAction ? prevAction.actionBy : 1,
                serveSide: 'R', 
                pointLog: newLog,
                updatedAt: serverTimestamp()
            };

            // 安全檢查：暫不支援跨局 Undo
            if (lastAction.p1Score === 0 && lastAction.p2Score === 0 && (match.games1 > 0 || match.games2 > 0)) {
                alert("⚠️ 此分涉及跨局結算，無法直接撤銷。");
                return;
            }
            await updateDoc(matchRef, updateData);
        }
    };

    const handleAction = async (match, playerNum, actionType) => {
        if (match.matchWinner) return alert("比賽已經結束！");
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        
        let newScore1 = match.score1;
        let newScore2 = match.score2;
        let newServer = match.server;
        let newServeSide = match.serveSide;
        let isGameWon = false;
        const currentLog = match.pointLog || [];

        if (actionType === 'normal_win' || actionType === 'stroke') {
            if (playerNum === 1) newScore1 += 1;
            if (playerNum === 2) newScore2 += 1;

            if (match.server === playerNum) {
                newServeSide = match.serveSide === 'R' ? 'L' : 'R';
            } else {
                newServer = playerNum;
                newServeSide = 'R'; 
            }

            const targetScore = match.format; 
            const diff = Math.abs(newScore1 - newScore2);
            const maxScore = Math.max(newScore1, newScore2);
            if (maxScore >= targetScore && diff >= 2) { isGameWon = true; }
        } 

        const currentGameIndex = match.games1 + match.games2 + 1;
        const newLogEntry = {
            id: Date.now(), game: currentGameIndex,
            p1Score: newScore1, p2Score: newScore2,
            actionBy: playerNum, type: actionType, timestamp: new Date().toISOString()
        };

        let updateData = {
            score1: newScore1, score2: newScore2,
            server: newServer, serveSide: newServeSide,
            pointLog: [...currentLog, newLogEntry],
            updatedAt: serverTimestamp()
        };

        if (isGameWon) {
            if (window.confirm(`【第 ${currentGameIndex} 局結束】\n${playerNum === 1 ? match.player1 : match.player2} 贏得此局！`)) {
                const newGames1 = playerNum === 1 ? match.games1 + 1 : match.games1;
                const newGames2 = playerNum === 2 ? match.games2 + 1 : match.games2;
                const gamesNeededToWin = match.bestOf === 3 ? 2 : 3;

                updateData = { ...updateData, score1: 0, score2: 0, games1: newGames1, games2: newGames2, server: playerNum, serveSide: 'R' };

                if (newGames1 === gamesNeededToWin || newGames2 === gamesNeededToWin) {
                    const winnerNum = newGames1 === gamesNeededToWin ? 1 : 2;
                    updateData.matchWinner = winnerNum;
                    if (match.leagueMatchId) {
                        const lMatch = leagueMatches.find(m => m.id === match.leagueMatchId);
                        if (lMatch) {
                            const winnerId = winnerNum === 1 ? lMatch.player1Id : lMatch.player2Id;
                            const winnerStudent = students.find(s => s.id === winnerId);
                            const loserStudent = students.find(s => s.id === (winnerNum === 1 ? lMatch.player2Id : lMatch.player1Id));
                            if (winnerStudent && loserStudent) {
                                const winnerRank = rankedStudents.findIndex(s => s.id === winnerStudent.id) + 1;
                                const loserRank = rankedStudents.findIndex(s => s.id === loserStudent.id) + 1;
                                const pointsToAdd = ((winnerRank - loserRank) >= 5 || (BADGE_DATA[winnerStudent.badge]?.level < BADGE_DATA[loserStudent.badge]?.level)) ? 20 : 10;
                                const batch = writeBatch(db);
                                batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', lMatch.id), { score1: newGames1, score2: newGames2, winnerId: winnerId, status: 'completed', updatedAt: serverTimestamp() });
                                batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', winnerStudent.id), { points: increment(pointsToAdd), lastUpdated: serverTimestamp() });
                                await batch.commit();
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

    return (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Activity className="text-red-500 animate-pulse"/> Pro Umpire Console
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {liveMatches.filter(m => m.status === 'live').length === 0 && (
                        <div className="mb-6 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
                            <h4 className="font-black text-slate-700 border-b pb-2">新賽事設定</h4>
                            <button onClick={startLiveMatch} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg hover:bg-red-700 shadow-lg transition-all active:scale-95">開始轉播</button>
                        </div>
                    )}

                    {liveMatches.filter(m => m.status === 'live').map(match => (
                        <div key={match.id} className="flex flex-col lg:flex-row gap-6 relative">
                            {match.matchWinner && (
                                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center border-4 border-yellow-400 shadow-2xl">
                                    <h4 className="text-4xl font-black text-yellow-500 mb-2">🏆 比賽結束</h4>
                                    <button onClick={() => endMatch(match.id)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-full text-lg shadow-xl hover:bg-slate-800 transition-all">關閉</button>
                                </div>
                            )}

                            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                    <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse">● LIVE</span>
                                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-inner">
                                        <RotateCcw size={16} className={isTimerRunning ? "text-yellow-400 animate-pulse" : "text-slate-400"}/>
                                        <span className="font-mono font-black text-lg w-12 text-center">{formatTime(timeLeft)}</span>
                                        <div className="flex gap-1 ml-2 border-l border-slate-700 pl-2">
                                            <button onClick={() => startTimer(4)} className="text-[9px] font-bold bg-slate-700 px-2 py-1 rounded">4m 熱身</button>
                                            <button onClick={() => startTimer(1.5)} className="text-[9px] font-bold bg-slate-700 px-2 py-1 rounded">90s 局間</button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-6 rounded-[2rem] mb-4 border-4 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${match.server === 1 ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                    <div className="w-full md:w-1/3">
                                        <h3 className={`text-2xl font-black truncate ${match.server === 1 ? 'text-blue-700' : 'text-slate-700'}`}>{match.player1}</h3>
                                        <div className="flex gap-1 mt-3">
                                            {match.server === 1 && (
                                                <>
                                                    <button onClick={() => updateServeSide(match.id, 'L')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>L</button>
                                                    <button onClick={() => updateServeSide(match.id, 'R')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>R</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleAction(match, 1, 'stroke')} className="px-3 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-black border border-rose-200">Stroke</button>
                                            <button onClick={() => handleAction(match, 1, 'let')} className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-black border border-amber-200">Yes Let</button>
                                        </div>
                                        <div className="text-6xl font-mono font-black w-24 text-center text-slate-800">{match.score1}</div>
                                        <button onClick={() => handleAction(match, 1, 'normal_win')} className="w-16 h-16 bg-blue-600 text-white rounded-2xl font-black text-3xl shadow-lg hover:bg-blue-500">+</button>
                                    </div>
                                </div>

                                {/* 👇 --- Undo 按鈕位置 --- 👇 */}
                                <div className="flex justify-center my-4">
                                    <button 
                                        onClick={() => handleUndoAction(match)}
                                        disabled={!match.pointLog || match.pointLog.length === 0}
                                        className="flex items-center gap-2 px-8 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-black text-sm hover:bg-amber-100 transition-all disabled:opacity-30 shadow-sm active:scale-95"
                                    >
                                        <RotateCcw size={16}/> 撤銷上一分 (Undo)
                                    </button>
                                </div>

                                <div className={`p-6 rounded-[2rem] mt-4 border-4 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${match.server === 2 ? 'border-rose-500 bg-rose-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                    <div className="w-full md:w-1/3">
                                        <h3 className={`text-2xl font-black truncate ${match.server === 2 ? 'text-rose-700' : 'text-slate-700'}`}>{match.player2}</h3>
                                        <div className="flex gap-1 mt-3">
                                            {match.server === 2 && (
                                                <>
                                                    <button onClick={() => updateServeSide(match.id, 'L')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>L</button>
                                                    <button onClick={() => updateServeSide(match.id, 'R')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>R</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleAction(match, 2, 'stroke')} className="px-3 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-black border border-rose-200">Stroke</button>
                                            <button onClick={() => handleAction(match, 2, 'let')} className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-black border border-amber-200">Yes Let</button>
                                        </div>
                                        <div className="text-6xl font-mono font-black w-24 text-center text-slate-800">{match.score2}</div>
                                        <button onClick={() => handleAction(match, 2, 'normal_win')} className="w-16 h-16 bg-rose-600 text-white rounded-2xl font-black text-3xl shadow-lg hover:bg-rose-500">+</button>
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-100">
                                     <button onClick={() => handleAction(match, 0, 'no_let')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-300">No Let</button>
                                    <button onClick={() => endMatch(match.id)} className="text-xs text-red-400 font-bold underline">下架</button>
                                </div>
                            </div>

                            <div className="w-full lg:w-80 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                                <div className="bg-black/50 p-4 border-b border-slate-800 flex justify-between items-center">
                                    <h4 className="text-white font-black flex items-center gap-2">逐分紀錄表</h4>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono uppercase tracking-widest">WSF</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm custom-scrollbar">
                                    {match.pointLog?.map((log, i) => (
                                        <div key={log.id || i} className={`grid grid-cols-[1fr_2fr_1fr] items-center p-1.5 rounded-lg border border-slate-700/50 ${i === match.pointLog.length - 1 ? 'bg-slate-800 border-slate-500' : ''}`}>
                                            <div className={`text-center font-black ${log.actionBy === 1 ? 'text-blue-400' : 'text-slate-500'}`}>{log.p1Score}</div>
                                            <div className="flex flex-col items-center">
                                                {log.type !== 'normal_win' && <span className="bg-slate-700 text-[8px] px-1 py-0.5 rounded uppercase">{log.type}</span>}
                                            </div>
                                            <div className={`text-center font-black ${log.actionBy === 2 ? 'text-rose-400' : 'text-slate-500'}`}>{log.p2Score}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default UmpirePanelModal;
