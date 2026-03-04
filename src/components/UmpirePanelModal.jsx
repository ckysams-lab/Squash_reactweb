import React, { useState } from 'react';
import { X, Activity } from 'lucide-react';
import { collection, doc, serverTimestamp, addDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';

// 引入外部需要的變數與函數，並接收 BADGE_DATA 以便計算「巨人殺手」
const UmpirePanelModal = ({ 
    onClose, 
    activeLeagueMatch, 
    setActiveLeagueMatch, 
    liveMatches, 
    leagueMatches, 
    students, 
    rankedStudents, 
    BADGE_DATA, // 從外部傳入
    db, 
    appId 
}) => {
    const [p1Name, setP1Name] = useState(activeLeagueMatch ? activeLeagueMatch.player1Name : '');
    const [p2Name, setP2Name] = useState(activeLeagueMatch ? activeLeagueMatch.player2Name : '');
    const [matchFormat, setMatchFormat] = useState('11'); 
    const [bestOf, setBestOf] = useState('3');           
    
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
                updatedAt: serverTimestamp()
            });
        } catch(e) { console.error(e); }
    };

    const updateScore = async (match, playerNum, isAdding) => {
        if (match.matchWinner) return alert("比賽已經結束！");

        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'live_matches', match.id);
        const currentScore = playerNum === 1 ? match.score1 : match.score2;
        const opponentScore = playerNum === 1 ? match.score2 : match.score1;
        
        let newScore = isAdding ? currentScore + 1 : Math.max(0, currentScore - 1);
        let updateData = playerNum === 1 ? { score1: newScore, server: 1 } : { score2: newScore, server: 2 };
        
        if (isAdding) {
            if (match.server === playerNum) {
                updateData.serveSide = match.serveSide === 'R' ? 'L' : 'R';
            } else {
                updateData.serveSide = 'R'; 
            }

            const targetScore = match.format; 
            if (newScore >= targetScore && (newScore - opponentScore) >= 2) {
                if (window.confirm(`【第 ${match.games1 + match.games2 + 1} 局結束】\n\n${playerNum === 1 ? match.player1 : match.player2} 贏得此局！\n是否進入下一局？`)) {
                    const newGames1 = playerNum === 1 ? match.games1 + 1 : match.games1;
                    const newGames2 = playerNum === 2 ? match.games2 + 1 : match.games2;
                    
                    updateData = {
                        score1: 0, score2: 0,
                        games1: newGames1, games2: newGames2,
                        server: playerNum, serveSide: 'R'
                    };

                    const gamesNeededToWin = match.bestOf === 3 ? 2 : 3;
                    if (newGames1 === gamesNeededToWin || newGames2 === gamesNeededToWin) {
                        const winnerNum = newGames1 === gamesNeededToWin ? 1 : 2;
                        updateData.matchWinner = winnerNum;
                        alert(`🏆 比賽結束！\n\n${winnerNum === 1 ? match.player1 : match.player2} 贏得整場比賽！`);

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
                                            score1: newGames1, 
                                            score2: newGames2,
                                            winnerId: winnerId,
                                            status: 'completed',
                                            updatedAt: serverTimestamp()
                                        });
                                        batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'students', winnerStudent.id), {
                                            points: increment(pointsToAdd),
                                            lastUpdated: serverTimestamp()
                                        });
                                        await batch.commit();
                                        alert(`✅ 系統已自動將賽果 (${newGames1} - ${newGames2}) 寫入聯賽記錄，並為 ${winnerStudent.name} 增加 ${pointsToAdd} 分！`);
                                    } catch (err) {
                                        console.error("自動同步失敗", err);
                                        alert("同步至聯賽記錄失敗，請稍後手動輸入。");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        updateData.updatedAt = serverTimestamp();
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
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2rem] p-8 max-w-xl w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24}/></button>
                <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-2"><Activity className="text-red-500 animate-pulse"/> 賽事轉播控制台</h3>
                
                {/* 開賽設定區 */}
                <div className="mb-6 p-5 bg-slate-50 rounded-2xl border space-y-4">
                    {activeLeagueMatch && (
                        <div className="bg-blue-100/50 p-3 rounded-xl border border-blue-200 mb-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">🔗 已連動內部聯賽</span>
                            <div className="flex gap-2 items-center font-bold text-slate-700">
                                <span>{activeLeagueMatch.player1Name}</span> <span className="text-slate-400 text-xs">VS</span> <span>{activeLeagueMatch.player2Name}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 mb-2">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">分數制</label>
                            <select value={matchFormat} onChange={e=>setMatchFormat(e.target.value)} className="w-full p-2 rounded-lg border outline-none font-bold text-sm">
                                <option value="11">11 分制 (PAR 11)</option>
                                <option value="9">9 分制 (PAR 9)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">局數制</label>
                            <select value={bestOf} onChange={e=>setBestOf(e.target.value)} className="w-full p-2 rounded-lg border outline-none font-bold text-sm">
                                <option value="3">3 局 2 勝</option>
                                <option value="5">5 局 3 勝</option>
                            </select>
                        </div>
                    </div>
                    
                    {!activeLeagueMatch && (
                        <div className="flex gap-2">
                            <input value={p1Name} onChange={e=>setP1Name(e.target.value)} placeholder="球員 1" className="flex-1 p-2 rounded-lg border outline-none"/>
                            <span className="font-black text-slate-300 self-center">VS</span>
                            <input value={p2Name} onChange={e=>setP2Name(e.target.value)} placeholder="球員 2" className="flex-1 p-2 rounded-lg border outline-none"/>
                        </div>
                    )}
                    <button onClick={startLiveMatch} className="w-full bg-red-500 text-white px-4 py-3 rounded-xl font-black hover:bg-red-600 shadow-md hover:shadow-red-200 transition-all active:scale-95">正式開賽</button>
                </div>

                {/* 進行中的比賽面板 */}
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {liveMatches.filter(m => m.status === 'live').map(match => (
                        <div key={match.id} className="bg-slate-800 text-white p-4 rounded-2xl relative">
                            {match.matchWinner && (
                                <div className="absolute inset-0 z-10 bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                                    <h4 className="text-xl font-black text-yellow-400 mb-2">🏆 比賽已自動結算完成</h4>
                                    <p className="text-xs text-slate-300 mb-4">賽果已同步至資料庫</p>
                                    <button onClick={() => endMatch(match.id)} className="px-4 py-2 bg-white text-slate-900 font-bold rounded-full text-sm hover:bg-slate-200">關閉轉播</button>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-red-400 animate-pulse flex items-center gap-2">● LIVE</span>
                                    <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300 font-bold tracking-widest">{match.format}分制 • {match.bestOf}局勝</span>
                                </div>
                                <button onClick={() => endMatch(match.id)} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-red-500 transition-colors z-20 relative">強制結束</button>
                            </div>
                            
                            {/* P1 控制 */}
                            <div className={`flex items-center justify-between p-3 rounded-xl mb-2 border-2 transition-all ${match.server === 1 ? 'bg-slate-700 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'bg-slate-800 border-transparent'}`}>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <span className={`font-bold truncate ${match.server === 1 ? 'text-yellow-400' : 'text-slate-300'}`}>{match.player1}</span>
                                    {match.server === 1 && (
                                        <div className="flex gap-1 mt-1">
                                            <button onClick={() => updateServeSide(match.id, 'L')} className={`px-2 py-1 text-[10px] rounded font-black transition-colors ${match.serveSide === 'L' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>左區(L)</button>
                                            <button onClick={() => updateServeSide(match.id, 'R')} className={`px-2 py-1 text-[10px] rounded font-black transition-colors ${match.serveSide === 'R' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>右區(R)</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="px-3 py-1 bg-slate-900 rounded-lg text-xs font-bold text-slate-400 border border-slate-700">局 <span className="text-white text-base ml-1">{match.games1}</span></div>
                                    <button onClick={() => updateScore(match, 1, false)} className="w-8 h-8 bg-slate-600 rounded-lg font-bold hover:bg-slate-500">-</button>
                                    <span className="text-3xl font-black w-10 text-center text-yellow-400 font-mono">{match.score1}</span>
                                    <button onClick={() => updateScore(match, 1, true)} className="w-12 h-12 bg-emerald-500 rounded-lg font-black text-2xl shadow-[0_0_10px_rgba(16,185,129,0.5)] hover:bg-emerald-400 active:scale-95">+</button>
                                </div>
                            </div>
                            
                            {/* P2 控制 */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${match.server === 2 ? 'bg-slate-700 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'bg-slate-800 border-transparent'}`}>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <span className={`font-bold truncate ${match.server === 2 ? 'text-yellow-400' : 'text-slate-300'}`}>{match.player2}</span>
                                    {match.server === 2 && (
                                        <div className="flex gap-1 mt-1">
                                            <button onClick={() => updateServeSide(match.id, 'L')} className={`px-2 py-1 text-[10px] rounded font-black transition-colors ${match.serveSide === 'L' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>左區(L)</button>
                                            <button onClick={() => updateServeSide(match.id, 'R')} className={`px-2 py-1 text-[10px] rounded font-black transition-colors ${match.serveSide === 'R' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>右區(R)</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="px-3 py-1 bg-slate-900 rounded-lg text-xs font-bold text-slate-400 border border-slate-700">局 <span className="text-white text-base ml-1">{match.games2}</span></div>
                                    <button onClick={() => updateScore(match, 2, false)} className="w-8 h-8 bg-slate-600 rounded-lg font-bold hover:bg-slate-500">-</button>
                                    <span className="text-3xl font-black w-10 text-center text-yellow-400 font-mono">{match.score2}</span>
                                    <button onClick={() => updateScore(match, 2, true)} className="w-12 h-12 bg-emerald-500 rounded-lg font-black text-2xl shadow-[0_0_10px_rgba(16,185,129,0.5)] hover:bg-emerald-400 active:scale-95">+</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UmpirePanelModal;
