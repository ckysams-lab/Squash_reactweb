// src/pages/RankingPage.jsx (Version 2.3)
// 更新內容: 
// 1. 新增獨立的「外校對手」勾選框，完美支援跨校賽事的 Elo 結算。
// 2. 在操作列新增手動 ➕ / ➖ 按鈕，讓教練能隨時手動微調學員積分。

import React, { useState } from 'react';
import { Search, Trophy as TrophyIcon, Crown, Info, Globe, Trash2, Swords, X, Target, Zap, Plus, Minus } from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';

import { PageHeader, Card } from '../components/ui';

export default function RankingPage({
    role,
    rankedStudents,
    filteredStudents,
    searchTerm,
    setSearchTerm,
    setShowPlayerCard,
    handleExternalComp,
    deleteItem,
    adjustPoints,
    leagueMatches 
}) {
    const [matchModalData, setMatchModalData] = useState(null);
    const [matchType, setMatchType] = useState("internal_challenge");
    
    // 👉 獨立的「外校對手」狀態 👈
    const [isExternal, setIsExternal] = useState(false);
    const [opponentId, setOpponentId] = useState("");
    const [externalOppName, setExternalOppName] = useState("");
    const [externalOppRating, setExternalOppRating] = useState("1000");

    const [gameScores, setGameScores] = useState([
        { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }
    ]);

    const [calibrationModalData, setCalibrationModalData] = useState(null);
    const [calibrationTier, setCalibrationTier] = useState("1000");

    const openMatchModal = (student) => {
        setMatchModalData(student);
        setGameScores([{ p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }]);
        setOpponentId(""); 
        setIsExternal(false); // 重置為校內
        setExternalOppName("");
    };

    const handleScoreChange = (idx, field, val) => {
        const newScores = [...gameScores];
        newScores[idx][field] = val;
        setGameScores(newScores);
    };

    // 👉 手動加減分功能 👈
    const handleManualAdjust = (student, isAdd) => {
        const actionStr = isAdd ? '加分' : '扣分';
        const valStr = prompt(`請輸入要為 ${student.name} ${actionStr}的數值 (正整數):`, "10");
        if (valStr === null) return;
        
        const val = parseInt(valStr, 10);
        if (isNaN(val) || val <= 0) {
            alert("請輸入有效的正整數！");
            return;
        }

        const finalVal = isAdd ? val : -val;
        if (confirm(`確認為 ${student.name} ${actionStr} ${val} 分？`)) {
            if (typeof adjustPoints === 'function') {
                adjustPoints(student.id, finalVal, `教練手動${actionStr}`);
                alert(`✅ 成功為 ${student.name} ${actionStr} ${val} 分！`);
            } else {
                alert("⚠️ 系統錯誤：找不到 adjustPoints 函數。");
            }
        }
    };

    const totalP = gameScores.reduce((sum, g) => sum + (parseInt(g.p) || 0), 0);
    const totalO = gameScores.reduce((sum, g) => sum + (parseInt(g.o) || 0), 0);
    const totalPointsMatch = totalP + totalO;
    const pointRatio = totalPointsMatch > 0 ? totalP / totalPointsMatch : 0.5;
    const actualScorePlayer = totalPointsMatch > 0 ? Math.max(0, Math.min(1, (pointRatio - 0.3) / 0.4)) : 0.5;

    // 🏆 Elo 勝率預測
    let currentOpponent = null;
    let oppRatingForPredict = 1000;
    
    if (!isExternal && opponentId) {
        currentOpponent = rankedStudents.find(s => s.id === opponentId);
        if (currentOpponent) oppRatingForPredict = currentOpponent.totalPoints || 1000;
    } else if (isExternal) {
        oppRatingForPredict = parseInt(externalOppRating, 10);
    }

    const playerRatingForPredict = matchModalData?.totalPoints || 1000;
    const predictedWinRate = 1 / (1 + Math.pow(10, (oppRatingForPredict - playerRatingForPredict) / 400));

    // 🏆 H2H (歷史對戰) 掃描引擎 (僅限校內對手)
    let h2hP1Wins = 0;
    let h2hP2Wins = 0;
    if (matchModalData && !isExternal && opponentId && Array.isArray(leagueMatches)) {
        leagueMatches.forEach(m => {
            if (m.status === 'completed') {
                const matchPlayers = [m.player1Id, m.player2Id];
                if (matchPlayers.includes(matchModalData.id) && matchPlayers.includes(opponentId)) {
                    if (m.winnerId === matchModalData.id) h2hP1Wins++;
                    if (m.winnerId === opponentId) h2hP2Wins++;
                }
            }
        });
    }

    const handleMatchSubmit = () => {
        if (totalPointsMatch === 0) return alert("請輸入至少一局的比分！");

        const player = matchModalData;
        const playerRating = player.totalPoints || 1000;
        let oppRating;
        let opponentNameForAlert;

        if (!isExternal) {
            if (!opponentId) return alert("請選擇校內對手！");
            const opponent = rankedStudents.find(s => s.id === opponentId);
            if (!opponent) return;
            oppRating = opponent.totalPoints || 1000;
            opponentNameForAlert = opponent.name;
        } else {
            if (!externalOppRating) return alert("請選擇外部對手的預估實力！");
            oppRating = parseInt(externalOppRating, 10);
            opponentNameForAlert = externalOppName.trim() || "未知外部對手";
        }

        const expectedScorePlayer = 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
        const baseK = 30; 
        const matchWeights = { 'internal_challenge': 1.0, 'friendly_match': 1.2, 'inter_school': 1.5, 'regional_elite': 2.0 };
        const K = baseK * (matchWeights[matchType] || 1.0);

        const playerDeltaRaw = K * (actualScorePlayer - expectedScorePlayer);
        const playerDelta = Math.round(playerDeltaRaw);
        const oppDelta = Math.round(-playerDeltaRaw); 

        if (typeof adjustPoints === 'function') {
            adjustPoints(player.id, playerDelta);
            if (!isExternal) adjustPoints(opponentId, oppDelta);
            
            alert(`✅ 小分制 Elo 結算成功！\n\n【積分變動】\n${player.name}: ${playerDelta > 0 ? '+'+playerDelta : playerDelta} 分\n${!isExternal ? opponentNameForAlert + ': ' + (oppDelta > 0 ? '+'+oppDelta : oppDelta) + ' 分' : '(外校生不紀錄積分)'}`);
        } else {
            alert("⚠️ 找不到 adjustPoints 函數！");
        }
        setMatchModalData(null);
    };

    const handleCalibrationSubmit = () => {
        const player = calibrationModalData;
        const currentPoints = player.totalPoints || 1000;
        const targetPoints = parseInt(calibrationTier, 10);
        const delta = targetPoints - currentPoints;
        if (delta === 0) {
            alert("目標積分與目前積分相同，無需調整！");
            setCalibrationModalData(null);
            return;
        }
        if (typeof adjustPoints === 'function') {
            adjustPoints(player.id, delta);
            alert(`✅ 初始評級設定成功！\n\n${player.name} 的積分已從 ${currentPoints} 分調整為 ${targetPoints} 分。`);
        } else {
            alert("⚠️ 找不到 adjustPoints 函數！");
        }
        setCalibrationModalData(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            
            <PageHeader title="積分排行榜" subtitle="查看全隊排名與積分變動" icon={TrophyIcon} />

            {/* 頒獎台區塊 */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 mt-10 md:mt-24">
                {rankedStudents.slice(0, 3).map((s, i) => {
                   let orderClass = "", sizeClass = "", gradientClass = "", iconColor = "", shadowClass = "", label = "", labelBg = "";
                   if (i === 0) { orderClass = "order-1 md:order-2"; sizeClass = "w-full md:w-1/3 md:-mt-12 scale-105 md:scale-110 z-20"; gradientClass = "bg-gradient-to-b from-yellow-100 via-yellow-50 to-white border-yellow-300"; iconColor = "text-yellow-500"; shadowClass = "shadow-2xl shadow-yellow-200/50"; label = "CHAMPION"; labelBg = "bg-yellow-500"; } 
                   else if (i === 1) { orderClass = "order-2 md:order-1"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-slate-200 via-slate-50 to-white border-slate-300"; iconColor = "text-slate-500"; shadowClass = "shadow-xl shadow-slate-300/50"; label = "RUNNER-UP"; labelBg = "bg-slate-500"; } 
                   else { orderClass = "order-3 md:order-3"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-orange-100 via-orange-50 to-white border-orange-300"; iconColor = "text-orange-500"; shadowClass = "shadow-xl shadow-orange-200/50"; label = "3RD PLACE"; labelBg = "bg-orange-500"; }

                   return (
                      <div key={s.id} className={`relative flex-shrink-0 flex flex-col items-center text-center ${orderClass} ${sizeClass} transition-all duration-500 hover:-translate-y-2`}>
                          <div className={`absolute inset-0 rounded-[3rem] border-4 ${gradientClass} ${shadowClass} overflow-hidden`}><div className="absolute -right-4 -top-4 opacity-10 rotate-12"><TrophyIcon size={120} className={i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : 'text-orange-600'}/></div><div className="absolute top-2 right-4 opacity-10 select-none pointer-events-none"><span className="text-9xl font-black font-mono tracking-tighter">{i+1}</span></div></div>
                          <div className="relative z-10 p-8 w-full h-full flex flex-col items-center">
                              {i === 0 && (<div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg"><Crown size={64} fill="currentColor" strokeWidth={1.5} /></div>)}
                              <div className={`w-24 h-24 mx-auto bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-black mb-4 ${iconColor}`}>{s.name[0]}<div className={`absolute -bottom-3 px-4 py-1 rounded-full text-[10px] text-white font-black tracking-widest ${labelBg} shadow-sm`}>{label}</div></div>
                              <div className="mt-4 w-full">
                                <h3 className="text-2xl font-black text-slate-800 truncate">{s.name}</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.class} ({s.classNo})</p>
                                <div className="my-6"><div className={`text-5xl font-black font-mono tracking-tight ${iconColor}`}>{s.totalPoints}</div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Total Points</p></div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm`}><span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span><span className="text-xs font-black text-slate-500">{s.badge}</span></div>
                              </div>
                          </div>
                      </div>
                   )
                })}
            </div>

            {/* 隊員列表 */}
            <Card noPadding>
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  {role === 'admin' && <div className="flex gap-2"><span className="text-[10px] text-slate-400 self-center">*請在下方進行積分管理</span></div>}
                  <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="搜尋姓名或班別..." className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-600 transition-all shadow-sm" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b font-black">
                        <tr>
                            <th className="px-8 py-6 text-center">排名</th>
                            <th className="px-8 py-6">隊員資料</th>
                            <th className="px-8 py-6">目前章別</th>
                            <th className="px-8 py-6 text-right">總分</th>
                            {role === 'admin' && <th className="px-8 py-6 text-center">教練操作 (Elo / 微調)</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="group hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => setShowPlayerCard(s)}>
                          <td className="px-8 py-8 text-center"><span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl text-sm font-black ${i < 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>{i+1}</span></td>
                          
                          <td className="px-8 py-8 max-w-[250px]">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex shrink-0 items-center justify-center text-lg font-black text-slate-300 border group-hover:bg-white group-hover:text-blue-600 transition-all uppercase shadow-inner">{s.name[0]}</div>
                                  <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2"><div className="font-black text-lg text-slate-800 truncate" title={s.name}>{s.name}</div></div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Class {s.class} • No.{s.classNo}</div>
                                  </div>
                              </div>
                          </td>

                          <td className="px-8 py-8"><div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color} ${BADGE_DATA[s.badge]?.border} shadow-sm`}><span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span><span className="text-xs font-black">{s.badge}</span></div></td>
                          <td className="px-8 py-8 text-right font-mono text-3xl text-blue-600 font-black">{s.totalPoints}</td>
                          
                          {role === 'admin' && (
                            <td className="px-8 py-8">
                                <div className="flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    
                                    {/* 1. 對賽成績輸入 (Elo) */}
                                    <button onClick={()=>openMatchModal(s)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="輸入對賽成績 (Elo計算)">
                                        <Swords size={16}/>
                                    </button>

                                    {/* 2. 👉 全新：手動加分 / 扣分按鈕 👈 */}
                                    <button onClick={()=>handleManualAdjust(s, true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="手動加分">
                                        <Plus size={16}/>
                                    </button>
                                    <button onClick={()=>handleManualAdjust(s, false)} className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="手動扣分">
                                        <Minus size={16}/>
                                    </button>
                                    
                                    {/* 3. 其他管理功能 */}
                                    <button onClick={()=>setCalibrationModalData(s)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="設定初始評級 (定級)">
                                        <Target size={16}/>
                                    </button>
                                    <button onClick={()=>deleteItem('students', s.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="永久刪除">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>

            {/* 👉 包含 Tale of the Tape (外校獨立選項) 的 Modal 👈 */}
            {matchModalData && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 text-white rounded-xl shadow-md"><Swords size={20}/></div><h3 className="text-xl font-black text-slate-800">賽前預測與對戰室</h3></div>
                            <button onClick={() => setMatchModalData(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">主角球員 (本校)</label>
                                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-black">{matchModalData.name}</div>
                                </div>
                                <div>
                                    <label className="flex items-center justify-between text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">
                                        <span>選擇對手</span>
                                        <label className="flex items-center gap-1 cursor-pointer text-slate-400 hover:text-orange-500">
                                            <input type="checkbox" checked={isExternal} onChange={(e)=>setIsExternal(e.target.checked)} className="rounded" />
                                            外校
                                        </label>
                                    </label>
                                    
                                    {!isExternal ? (
                                        <select className="w-full p-3 bg-orange-50 border border-orange-100 rounded-xl font-black text-orange-700 outline-none focus:border-orange-500 transition-all" value={opponentId} onChange={(e)=>setOpponentId(e.target.value)}>
                                            <option value="">-- 點擊選擇校內對手 --</option>
                                            {rankedStudents.filter(s => s.id !== matchModalData.id).map(s => (<option key={s.id} value={s.id}>{s.name} (積分: {s.totalPoints || 1000})</option>))}
                                        </select>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in">
                                            <input type="text" placeholder="外校選手名稱 (例: 男拔-陳大文)" className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500 text-sm" value={externalOppName} onChange={(e)=>setExternalOppName(e.target.value)} />
                                            <select className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none text-sm" value={externalOppRating} onChange={(e)=>setExternalOppRating(e.target.value)}>
                                                <option value="800">預估實力: 新手起步 (~800分)</option>
                                                <option value="1000">預估實力: 一般水準 (~1000分)</option>
                                                <option value="1300">預估實力: 學界種子 (~1300分)</option>
                                                <option value="1600">預估實力: 區際精英 (~1600分)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 👉 Tale of the Tape (預測區塊) 👈 */}
                            {(opponentId || isExternal) && (
                                <div className="bg-slate-900 rounded-2xl p-5 shadow-inner relative overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                    <h4 className="text-center font-black text-slate-400 uppercase tracking-[0.3em] text-[10px] mb-4">Tale of the Tape</h4>
                                    
                                    <div className="flex justify-between items-center text-white mb-2 relative z-10">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-blue-400 font-mono">{playerRatingForPredict}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Elo Rating</div>
                                        </div>
                                        <div className="px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-black text-slate-300">VS</div>
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-orange-400 font-mono">{oppRatingForPredict}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">{isExternal ? '預估 Elo' : 'Elo Rating'}</div>
                                        </div>
                                    </div>

                                    {/* Win Probability Bar */}
                                    <div className="mt-6 relative z-10">
                                        <div className="flex justify-between text-[10px] font-bold text-white mb-1 uppercase tracking-wider">
                                            <span className="text-blue-400">勝率預測: {(predictedWinRate * 100).toFixed(1)}%</span>
                                            <span className="text-orange-400">{((1 - predictedWinRate) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${predictedWinRate * 100}%` }}></div>
                                            <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${(1 - predictedWinRate) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* H2H (僅限校內對決顯示) */}
                                    {!isExternal && (
                                        <div className="mt-5 pt-4 border-t border-slate-700 flex justify-center items-center gap-8 relative z-10 animate-in fade-in">
                                            <div className="text-center">
                                                <div className="text-lg font-black text-blue-400">{h2hP1Wins}</div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">Wins</div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold bg-slate-800 px-3 py-1 rounded-full">歷史對戰 (H2H)</div>
                                            <div className="text-center">
                                                <div className="text-lg font-black text-orange-400">{h2hP2Wins}</div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">Wins</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block mt-2">比賽波幅與重要性 (K-Factor)</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500" value={matchType} onChange={(e)=>setMatchType(e.target.value)}>
                                    <option value="internal_challenge">日常校內挑戰賽 (常規波動 x1.0)</option>
                                    <option value="friendly_match">友誼賽/交流賽 (中度波動 x1.2)</option>
                                    <option value="inter_school">學界官方比賽 (高度波動 x1.5)</option>
                                    <option value="regional_elite">區際/全港錦標賽 (極度波動 x2.0)</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">輸入每局分數 (小分制 Elo 必填)</label>
                                <div className="space-y-3 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner">
                                    <div className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4 mb-2">
                                        <div className="flex-1 text-blue-600 text-left">主角得分</div><div className="w-12">VS</div><div className="flex-1 text-orange-600 text-right">對手得分</div>
                                    </div>
                                    {[1, 2, 3, 4, 5].map((gameNum, idx) => (
                                        <div key={gameNum} className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-black text-slate-300 w-6">G{gameNum}</span>
                                            <input type="number" min="0" placeholder="-" className="w-full p-3 text-center bg-white border border-slate-200 rounded-xl font-black text-blue-600 focus:border-blue-500 shadow-sm" value={gameScores[idx].p} onChange={(e) => handleScoreChange(idx, 'p', e.target.value)} />
                                            <span className="text-slate-300 font-bold">-</span>
                                            <input type="number" min="0" placeholder="-" className="w-full p-3 text-center bg-white border border-slate-200 rounded-xl font-black text-orange-600 focus:border-orange-500 shadow-sm" value={gameScores[idx].o} onChange={(e) => handleScoreChange(idx, 'o', e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-between items-center sticky bottom-0">
                            <div className="text-xs font-bold text-slate-400">表現評分: <span className="text-emerald-600 font-black">{(actualScorePlayer * 100).toFixed(1)} / 100</span></div>
                            <div className="flex gap-2">
                                <button onClick={() => setMatchModalData(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                                <button onClick={handleMatchSubmit} className="px-6 py-3 rounded-xl font-black bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">確認結算</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 初始評級 Modal */}
            {calibrationModalData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className="p-2 bg-amber-200 text-amber-700 rounded-xl"><Target size={20}/></div><h3 className="text-xl font-black text-slate-800">設定初始評級</h3></div>
                            <button onClick={() => setCalibrationModalData(null)} className="p-2 text-slate-400 hover:bg-amber-200/50 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-sm text-slate-600 font-bold bg-slate-50 p-4 rounded-xl border">為 <span className="text-amber-600">{calibrationModalData.name}</span> 設定基準積分。<br/><br/>目前積分：<span className="text-lg text-blue-600 font-black">{calibrationModalData.totalPoints || 1000} 分</span></div>
                            <div>
                                <select className="w-full p-4 bg-white border-2 border-amber-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 text-lg" value={calibrationTier} onChange={(e)=>setCalibrationTier(e.target.value)}>
                                    <option value="800">800 分 - 發展梯隊</option><option value="1000">1000 分 - 基礎梯隊</option><option value="1300">1300 分 - 校隊儲備</option><option value="1600">1600 分 - 校隊主力</option><option value="2000">2000 分 - 精英梯隊</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                            <button onClick={() => setCalibrationModalData(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                            <button onClick={handleCalibrationSubmit} className="px-6 py-3 rounded-xl font-black bg-amber-500 text-white hover:bg-amber-600 shadow-md transition-all">確認套用</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
