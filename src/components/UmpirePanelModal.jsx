// src/components/UmpirePanelModal.jsx (Version 4.0 - Pro Umpire Console)

import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Timer, AlertTriangle, ListChecks, Play, Pause, RotateCcw } from 'lucide-react';
import { collection, doc, serverTimestamp, addDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';

export default function UmpirePanelModal({ 
    onClose, activeLeagueMatch, setActiveLeagueMatch, liveMatches, 
    leagueMatches, students, rankedStudents, BADGE_DATA, db, appId 
}) {
    const [p1Name, setP1Name] = useState(activeLeagueMatch ? activeLeagueMatch.player1Name : '');
    const [p2Name, setP2Name] = useState(activeLeagueMatch ? activeLeagueMatch.player2Name : '');
    const [matchFormat, setMatchFormat] = useState('11'); 
    const [bestOf, setBestOf] = useState('3');           

    // --- 計時器邏輯 ---
    const [timeLeft, setTimeLeft] = useState(0); // 秒數
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsTimerRunning(false);
        }
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

    // --- 開賽邏輯 ---
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
                pointLog: [], // 👇 新增：用來儲存逐分紀錄的陣列
                updatedAt: serverTimestamp()
            });
        } catch(e) { console.error(e); }
    };

    // --- 得分與判決邏輯 ---
    // actionType: 'normal_win', 'stroke', 'let', 'no_let', 'undo'
    const handleAction = async (match, playerNum, actionType) => {
        if (match.matchWinner) return alert("比賽已經結束！");
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        
        let newScore1 = match.score1;
        let newScore2 = match.score2;
        let newServer = match.server;
        let newServeSide = match.serveSide;
        let isGameWon = false;
        const currentLog = match.pointLog || [];

        // 1. 處理分數與發球權變動
        if (actionType === 'normal_win' || actionType === 'stroke') {
            const isAdding = true; // 目前先不實作減分，複雜度太高，復原用 undo 取代
            
            if (playerNum === 1) newScore1 += 1;
            if (playerNum === 2) newScore2 += 1;

            if (match.server === playerNum) {
                // 發球方得分，換邊發球
                newServeSide = match.serveSide === 'R' ? 'L' : 'R';
            } else {
                // 接發球方得分，取得發球權，通常從右區開始(或可自選，這裡簡化預設為R)
                newServer = playerNum;
                newServeSide = 'R'; 
            }

            // 檢查是否贏得此局
            const targetScore = match.format; 
            const diff = Math.abs(newScore1 - newScore2);
            const maxScore = Math.max(newScore1, newScore2);
            if (maxScore >= targetScore && diff >= 2) {
                isGameWon = true;
            }
        } 
        // 如果是 Let 或 No Let，分數不變，發球權不變

        // 2. 建立這筆動作的 Log 紀錄
        const currentGameIndex = match.games1 + match.games2 + 1;
        const newLogEntry = {
            id: Date.now(),
            game: currentGameIndex,
            p1Score: newScore1,
            p2Score: newScore2,
            actionBy: playerNum, // 誰觸發的 (或判給誰的)
            type: actionType,
            timestamp: new Date().toISOString()
        };

        let updateData = {
            score1: newScore1,
            score2: newScore2,
            server: newServer,
            serveSide: newServeSide,
            pointLog: [...currentLog, newLogEntry],
            updatedAt: serverTimestamp()
        };

        // 3. 局數結算邏輯
        if (isGameWon) {
            if (window.confirm(`【第 ${currentGameIndex} 局結束】\n${playerNum === 1 ? match.player1 : match.player2} 贏得此局！\n是否進入下一局？`)) {
                
                const newGames1 = playerNum === 1 ? match.games1 + 1 : match.games1;
                const newGames2 = playerNum === 2 ? match.games2 + 1 : match.games2;
                const gamesNeededToWin = match.bestOf === 3 ? 2 : 3;

                // 準備進入下一局 (分數歸零)
                updateData = {
                    ...updateData,
                    score1: 0, score2: 0,
                    games1: newGames1, games2: newGames2,
                    server: playerNum, serveSide: 'R' // 贏家下一局先發球
                };

                // 檢查是否整場獲勝
                if (newGames1 === gamesNeededToWin || newGames2 === gamesNeededToWin) {
                    const winnerNum = newGames1 === gamesNeededToWin ? 1 : 2;
                    updateData.matchWinner = winnerNum;
                    alert(`🏆 比賽結束！\n${winnerNum === 1 ? match.player1 : match.player2} 贏得整場比賽！`);

                    // 同步到外部聯賽的邏輯 (保持你不變的邏輯)
                    if (match.leagueMatchId) {
                        const lMatch = leagueMatches.find(m => m.id === match.leagueMatchId);
                        if (lMatch) {
                            const winnerId = winnerNum === 1 ? lMatch.player1Id : lMatch.player2Id;
                            const loserId = winnerNum === 1 ? lMatch.player2Id : lMatch.player1Id;
                            const winnerStudent = students.find(s => s.id === winnerId);
                            const loserStudent = students.find(s => s.id === loserId);

                            if (winnerStudent && loserStudent) {
                                const winnerRank = rankedStudents.findIndex(s => s.id === winnerStudent.id) + 1;
                                const loserRank = rankedStudents.findIndex(s => s.id === loserStudent.id) + 1;
                                const isRankGK = winnerRank > 0 && loserRank > 0 && (winnerRank - loserRank) >= 5;
                                const isBadgeGK = (BADGE_DATA[winnerStudent.badge]?.level || 0) < (BADGE_DATA[loserStudent.badge]?.level || 0);
                                const pointsToAdd = (isRankGK || isBadgeGK) ? 20 : 10;

                                try {
                                    const batch = writeBatch(db);
                                    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', lMatch.id), {
                                        score1: newGames1, score2: newGames2, winnerId: winnerId, status: 'completed', updatedAt: serverTimestamp()
                                    });
                                    batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', winnerStudent.id), {
                                        points: increment(pointsToAdd), lastUpdated: serverTimestamp()
                                    });
                                    await batch.commit();
                                } catch (err) { console.error("同步失敗", err); }
                            }
                        }
                    }
                }
            } else {
                // 教練按了取消，可能是點錯了，我們不要寫入這筆資料
                return;
            }
        }

        await updateDoc(matchRef, updateData);
    };

    const updateServeSide = async (matchId, side) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', matchId), { serveSide: side });
    };

    const endMatch = async (matchId) => {
        if(window.confirm("確定要將這場比賽從大螢幕下架嗎？")) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', matchId), { status: 'finished' });
            setActiveLeagueMatch(null); 
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in">
            {/* 加寬容器以容納計分表 */}
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Activity className="text-red-500 animate-pulse"/> Pro Umpire Console (WSF Standard)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* 開賽設定區 (如果有直播賽事，這裡會自動隱藏) */}
                    {liveMatches.filter(m => m.status === 'live').length === 0 && (
                        <div className="mb-6 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
                            <h4 className="font-black text-slate-700 border-b pb-2">新賽事設定</h4>
                            {activeLeagueMatch && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2 text-center">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">已連動內部聯賽</span>
                                    <div className="flex justify-center items-center gap-4 font-black text-lg text-blue-900">
                                        <span>{activeLeagueMatch.player1Name}</span> <span className="text-blue-300 text-sm">VS</span> <span>{activeLeagueMatch.player2Name}</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">分數制 (PAR)</label>
                                    <select value={matchFormat} onChange={e=>setMatchFormat(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-sm">
                                        <option value="11">11 分制</option>
                                        <option value="9">9 分制</option>
                                        <option value="15">15 分制</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">局數制 (Best of)</label>
                                    <select value={bestOf} onChange={e=>setBestOf(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-sm">
                                        <option value="3">3 局 2 勝</option>
                                        <option value="5">5 局 3 勝</option>
                                    </select>
                                </div>
                            </div>
                            {!activeLeagueMatch && (
                                <div className="flex gap-3">
                                    <input value={p1Name} onChange={e=>setP1Name(e.target.value)} placeholder="球員 1" className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold"/>
                                    <span className="font-black text-slate-300 self-center">VS</span>
                                    <input value={p2Name} onChange={e=>setP2Name(e.target.value)} placeholder="球員 2" className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-right"/>
                                </div>
                            )}
                            <button onClick={startLiveMatch} className="w-full bg-red-600 text-white px-4 py-4 rounded-xl font-black text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95">
                                開始轉播 (Start Match)
                            </button>
                        </div>
                    )}

                    {/* 進行中的比賽面板 */}
                    {liveMatches.filter(m => m.status === 'live').map(match => (
                        <div key={match.id} className="flex flex-col lg:flex-row gap-6 relative">
                            
                            {/* 完賽覆蓋層 */}
                            {match.matchWinner && (
                                <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center border-4 border-yellow-400 shadow-2xl">
                                    <h4 className="text-4xl font-black text-yellow-500 mb-2 drop-shadow-md">🏆 比賽結算完成</h4>
                                    <p className="font-bold text-slate-500 mb-8">賽果已同步至資料庫</p>
                                    <button onClick={() => endMatch(match.id)} className="px-10 py-4 bg-slate-900 text-white font-black rounded-full text-lg shadow-xl hover:bg-slate-800 hover:scale-105 transition-all">關閉裁判台</button>
                                </div>
                            )}

                            {/* 👇 左側：裁判控制台 (Umpire Controls) 👇 */}
                            <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                                
                                {/* 頂部資訊與計時器 */}
                                <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200 animate-pulse">● LIVE</span>
                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500 tracking-widest">{match.format} PTS • BO{match.bestOf}</span>
                                    </div>
                                    
                                    {/* 智能計時器 */}
                                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-inner">
                                        <Timer size={16} className={isTimerRunning ? "text-yellow-400 animate-pulse" : "text-slate-400"}/>
                                        <span className="font-mono font-black text-lg w-12 text-center">{formatTime(timeLeft)}</span>
                                        <div className="flex gap-1 ml-2 border-l border-slate-700 pl-2">
                                            <button onClick={() => startTimer(4)} className="text-[9px] font-bold bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">4m (熱身)</button>
                                            <button onClick={() => startTimer(1.5)} className="text-[9px] font-bold bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">90s (局間)</button>
                                            <button onClick={() => { setIsTimerRunning(false); setTimeLeft(0); }} className="text-[9px] font-bold bg-red-900/50 text-red-400 hover:bg-red-800 px-2 py-1 rounded">Stop</button>
                                        </div>
                                    </div>
                                </div>

                                {/* P1 控制區 */}
                                <div className={`p-6 rounded-[2rem] mb-4 border-4 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${match.server === 1 ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                    <div className="w-full md:w-1/3 text-center md:text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Player 1</p>
                                        <h3 className={`text-2xl font-black truncate ${match.server === 1 ? 'text-blue-700' : 'text-slate-700'}`}>{match.player1}</h3>
                                        {/* 發球區切換 */}
                                        <div className="flex justify-center md:justify-start gap-1 mt-3 h-8">
                                            {match.server === 1 && (
                                                <>
                                                    <button onClick={() => updateServeSide(match.id, 'L')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>左區 L</button>
                                                    <button onClick={() => updateServeSide(match.id, 'R')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-blue-200 text-blue-400 hover:bg-blue-100'}`}>右區 R</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 判決與加分按鈕 */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleAction(match, 1, 'stroke')} className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-[10px] font-black border border-rose-200">Stroke</button>
                                            <button onClick={() => handleAction(match, 1, 'let')} className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-[10px] font-black border border-amber-200">Yes Let</button>
                                        </div>
                                        <div className="flex flex-col items-center bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 mx-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game</span>
                                            <span className="text-2xl font-black text-slate-700 leading-none">{match.games1}</span>
                                        </div>
                                        <div className="text-6xl font-mono font-black w-24 text-center tracking-tighter text-slate-800">{match.score1}</div>
                                        {/* 加分大按鈕 */}
                                        <button onClick={() => handleAction(match, 1, 'normal_win')} className="w-16 h-16 bg-blue-600 text-white rounded-2xl font-black text-3xl shadow-[0_5px_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* VS 分隔線 */}
                                <div className="flex justify-center my-2 relative">
                                    <div className="w-full h-px bg-slate-200 absolute top-1/2"></div>
                                    <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 z-10 border border-slate-200 italic">VS</div>
                                </div>

                                {/* P2 控制區 */}
                                <div className={`p-6 rounded-[2rem] mt-4 border-4 transition-all flex flex-col md:flex-row justify-between items-center gap-4 ${match.server === 2 ? 'border-rose-500 bg-rose-50 shadow-lg' : 'border-slate-100 bg-white'}`}>
                                    <div className="w-full md:w-1/3 text-center md:text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Player 2</p>
                                        <h3 className={`text-2xl font-black truncate ${match.server === 2 ? 'text-rose-700' : 'text-slate-700'}`}>{match.player2}</h3>
                                        <div className="flex justify-center md:justify-start gap-1 mt-3 h-8">
                                            {match.server === 2 && (
                                                <>
                                                    <button onClick={() => updateServeSide(match.id, 'L')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'L' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>左區 L</button>
                                                    <button onClick={() => updateServeSide(match.id, 'R')} className={`px-4 py-1 text-xs rounded-lg font-black transition-all ${match.serveSide === 'R' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-rose-200 text-rose-400 hover:bg-rose-100'}`}>右區 R</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleAction(match, 2, 'stroke')} className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-[10px] font-black border border-rose-200">Stroke</button>
                                            <button onClick={() => handleAction(match, 2, 'let')} className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-[10px] font-black border border-amber-200">Yes Let</button>
                                        </div>
                                        <div className="flex flex-col items-center bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 mx-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Game</span>
                                            <span className="text-2xl font-black text-slate-700 leading-none">{match.games2}</span>
                                        </div>
                                        <div className="text-6xl font-mono font-black w-24 text-center tracking-tighter text-slate-800">{match.score2}</div>
                                        <button onClick={() => handleAction(match, 2, 'normal_win')} className="w-16 h-16 bg-rose-600 text-white rounded-2xl font-black text-3xl shadow-[0_5px_15px_rgba(225,29,72,0.4)] hover:bg-rose-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                                            +
                                        </button>
                                    </div>
                                </div>
                                
                                {/* 底部危險操作區 */}
                                <div className="mt-auto pt-6 flex justify-between items-center">
                                     <button onClick={() => handleAction(match, 0, 'no_let')} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-black border border-slate-300 flex items-center gap-2">
                                        <AlertTriangle size={14}/> No Let (不予重打)
                                    </button>
                                    <button onClick={() => endMatch(match.id)} className="text-xs text-red-400 hover:text-red-600 font-bold underline underline-offset-4">放棄這場比賽</button>
                                </div>
                            </div>

                            {/* 👇 右側：逐分紀錄表 (Score Sheet) 👇 */}
                            <div className="w-full lg:w-80 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                                <div className="bg-black/50 p-4 border-b border-slate-800 flex justify-between items-center">
                                    <h4 className="text-white font-black flex items-center gap-2">
                                        <ListChecks className="text-emerald-400" size={18}/> 逐分紀錄表
                                    </h4>
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono tracking-widest">WSF SHEET</span>
                                </div>

                                {/* 表格標題 */}
                                <div className="grid grid-cols-[1fr_2fr_1fr] bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 border-b border-slate-700 text-center">
                                    <span className="text-blue-400 truncate pr-1" title={match.player1}>{match.player1.substring(0,4)}</span>
                                    <span>局 / 判決</span>
                                    <span className="text-rose-400 truncate pl-1" title={match.player2}>{match.player2.substring(0,4)}</span>
                                </div>

                                {/* 紀錄清單 (捲動區) */}
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm custom-scrollbar">
                                    {(!match.pointLog || match.pointLog.length === 0) ? (
                                        <div className="h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                                            尚未產生得分紀錄
                                        </div>
                                    ) : (
                                        match.pointLog.map((log, i) => (
                                            <div key={log.id || i} className="grid grid-cols-[1fr_2fr_1fr] items-center bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700/50 transition-colors">
                                                
                                                {/* 左方分數 */}
                                                <div className={`text-center font-black ${log.actionBy === 1 && (log.type === 'normal_win' || log.type === 'stroke') ? 'text-blue-400 text-lg' : 'text-slate-500'}`}>
                                                    {log.p1Score}
                                                </div>
                                                
                                                {/* 中央標籤 */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-[8px] text-slate-500 mb-0.5 font-sans font-bold bg-slate-900 px-1.5 rounded-sm">Game {log.game}</span>
                                                    {log.type === 'stroke' && <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/50">Stroke</span>}
                                                    {log.type === 'let' && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/50">Let</span>}
                                                    {log.type === 'no_let' && <span className="bg-slate-500/20 text-slate-400 text-[9px] px-1.5 py-0.5 rounded border border-slate-500/50">No Let</span>}
                                                    {/* 如果是一般得分，中央留空 */}
                                                </div>

                                                {/* 右方分數 */}
                                                <div className={`text-center font-black ${log.actionBy === 2 && (log.type === 'normal_win' || log.type === 'stroke') ? 'text-rose-400 text-lg' : 'text-slate-500'}`}>
                                                    {log.p2Score}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
