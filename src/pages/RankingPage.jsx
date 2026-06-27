// src/pages/RankingPage.jsx (Version 2.0)
// 更新內容: 重大升級！引入「細化至每球小分」的表現系數 (Point-for-Point Granularity)。
// 透過計算總得分比例，精準反映「險勝/大炒」對 Elo 積分的微細影響。

import React, { useState } from 'react';
import { Search, Trophy as TrophyIcon, Crown, Info, Globe, Trash2, Swords, X, Target } from 'lucide-react';
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
    adjustPoints 
}) {
    // 賽事 Modal 狀態
    const [matchModalData, setMatchModalData] = useState(null);
    const [matchType, setMatchType] = useState("internal_challenge");
    const [opponentId, setOpponentId] = useState("");
    const [externalOppName, setExternalOppName] = useState("");
    const [externalOppRating, setExternalOppRating] = useState("1000");

    // 👉 新增：每局小分狀態 (支援 5 局 3 勝制) 👈
    const [gameScores, setGameScores] = useState([
        { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }
    ]);

    // 初始評級 Modal 狀態
    const [calibrationModalData, setCalibrationModalData] = useState(null);
    const [calibrationTier, setCalibrationTier] = useState("1000");

    // 打開成績輸入窗時，重置比分
    const openMatchModal = (student) => {
        setMatchModalData(student);
        setGameScores([{ p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }, { p: "", o: "" }]);
    };

    // 處理比分輸入
    const handleScoreChange = (idx, field, val) => {
        const newScores = [...gameScores];
        newScores[idx][field] = val;
        setGameScores(newScores);
    };

    // 👉 實時計算總得分與表現評分 (Point Ratio Math) 👈
    const totalP = gameScores.reduce((sum, g) => sum + (parseInt(g.p) || 0), 0);
    const totalO = gameScores.reduce((sum, g) => sum + (parseInt(g.o) || 0), 0);
    const totalPointsMatch = totalP + totalO;
    
    // 計算得球率 (Point Ratio)。假設範圍約落在 0.3 (被大炒) 到 0.7 (大炒對手) 之間
    const pointRatio = totalPointsMatch > 0 ? totalP / totalPointsMatch : 0.5;
    
    // 將得球率映射為 Elo 實際得分 (0 到 1)。公式: (Ratio - 0.3) / 0.4，並限制在 0-1 之間
    const actualScorePlayer = totalPointsMatch > 0 ? Math.max(0, Math.min(1, (pointRatio - 0.3) / 0.4)) : 0.5;

    // 🏆 精細化 Elo 賽事結算邏輯
    const handleMatchSubmit = () => {
        if (totalPointsMatch === 0) return alert("請輸入至少一局的比分！");

        const player = matchModalData;
        const playerRating = player.totalPoints || 1000;
        
        let oppRating;
        let opponentNameForAlert;
        let isInternal = matchType === "internal_challenge";

        if (isInternal) {
            if (!opponentId) return alert("請選擇校內對手！");
            const opponent = rankedStudents.find(s => s.id === opponentId);
            if (!opponent) return;
            oppRating = opponent.totalPoints || 1000;
            opponentNameForAlert = opponent.name;
        } else {
            if (!externalOppRating) return alert("請選擇外部對手的預估實力！");
            oppRating = parseInt(externalOppRating, 10);
            opponentNameForAlert = externalOppName || "未知外部對手";
        }

        const expectedScorePlayer = 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
        
        const baseK = 30; 
        const matchWeights = { 'internal_challenge': 1.0, 'friendly_match': 1.2, 'inter_school': 1.5, 'regional_elite': 2.0 };
        const K = baseK * (matchWeights[matchType] || 1.0);

        // 使用「小分映射」出來的 actualScorePlayer 計算 Delta
        const playerDeltaRaw = K * (actualScorePlayer - expectedScorePlayer);
        const playerDelta = Math.round(playerDeltaRaw);
        const oppDelta = Math.round(-playerDeltaRaw); 

        if (typeof adjustPoints === 'function') {
            adjustPoints(player.id, playerDelta);
            if (isInternal) adjustPoints(opponentId, oppDelta);
            alert(`✅ 小分制 Elo 結算成功！\n\n【比賽數據】\n總得分: ${player.name} (${totalP}) vs 對手 (${totalO})\n得球率: ${(pointRatio*100).toFixed(1)}%\n表現評分: ${(actualScorePlayer*100).toFixed(1)} / 100\n預期勝率: ${(expectedScorePlayer*100).toFixed(1)}%\n\n【積分變動】\n${player.name}: ${playerDelta > 0 ? '+'+playerDelta : playerDelta} 分\n${isInternal ? opponentNameForAlert + ': ' + (oppDelta > 0 ? '+'+oppDelta : oppDelta) + ' 分' : ''}`);
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

            {/* 頒獎台維持不變 */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 mt-10 md:mt-24">
                {rankedStudents.slice(0, 3).map((s, i) => {
                   let orderClass = "", sizeClass = "", gradientClass = "", iconColor = "", shadowClass = "", label = "", labelBg = "";
                   if (i === 0) { orderClass = "order-1 md:order-2"; sizeClass = "w-full md:w-1/3 md:-mt-12 scale-105 md:scale-110 z-20"; gradientClass = "bg-gradient-to-b from-yellow-100 via-yellow-50 to-white border-yellow-300"; iconColor = "text-yellow-500"; shadowClass = "shadow-2xl shadow-yellow-200/50"; label = "CHAMPION"; labelBg = "bg-yellow-500"; } 
                   else if (i === 1) { orderClass = "order-2 md:order-1"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-slate-200 via-slate-50 to-white border-slate-300"; iconColor = "text-slate-500"; shadowClass = "shadow-xl shadow-slate-300/50"; label = "RUNNER-UP"; labelBg = "bg-slate-500"; } 
                   else { orderClass = "order-3 md:order-3"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-orange-100 via-orange-50 to-white border-orange-300"; iconColor = "text-orange-500"; shadowClass = "shadow-xl shadow-orange-200/50"; label = "3RD PLACE"; labelBg = "bg-orange-500"; }

                   return (
                      <div key={s.id} className={`relative flex-shrink-0 flex flex-col items-center text-center ${orderClass} ${sizeClass} transition-all duration-500 hover:-translate-y-2`}>
                          <div className={`absolute inset-0 rounded-[3rem] border-4 ${gradientClass} ${shadowClass} overflow-hidden`}>
                               <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><TrophyIcon size={120} className={i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : 'text-orange-600'}/></div>
                               <div className="absolute top-2 right-4 opacity-10 select-none pointer-events-none"><span className="text-9xl font-black font-mono tracking-tighter">{i+1}</span></div>
                          </div>
                          <div className="relative z-10 p-8 w-full h-full flex flex-col items-center">
                              {i === 0 && (<div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg"><Crown size={64} fill="currentColor" strokeWidth={1.5} /></div>)}
                              <div className={`w-24 h-24 mx-auto bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-black mb-4 ${iconColor}`}>{s.name[0]}<div className={`absolute -bottom-3 px-4 py-1 rounded-full text-[10px] text-white font-black tracking-widest ${labelBg} shadow-sm`}>{label}</div></div>
                              <div className="mt-4 w-full">
                                <h3 className="text-2xl font-black text-slate-800 truncate">{s.name}</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.class} ({s.classNo})</p>
                                <div className="my-6">
                                    <div className={`text-5xl font-black font-mono tracking-tight ${iconColor}`}>{s.totalPoints}</div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Total Points</p>
                                </div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm`}><span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span><span className="text-xs font-black text-slate-500">{s.badge}</span></div>
                              </div>
                          </div>
                      </div>
                   )
                })}
            </div>

            {/* 👉 更新：2.0 版本小分制說明 👈 */}
            <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Info size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 mb-2">💡 SquashLevels 積分機制 (v2.0 每球小分制)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-bold">
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="text-emerald-600">小分精算</span>：系統會記錄每局小分 (如 11-9)，精確計算得球率。</li>
                            <li><span className="text-amber-500">險勝與大勝</span>：同樣是 3-0，比分越懸殊獲得的加分越多；若多次刁時險勝，加分會相應減少。</li>
                        </ul>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="text-indigo-500">光榮落敗</span>：即使 0-3 落敗，若每局都打到 9-11，系統會判定實力接近，大幅減少扣分！</li>
                            <li><span className="text-red-500">初始校準</span>：教練可為新隊員設定初始梯隊積分 (800~2000)。</li>
                        </ul>
                    </div>
                </div>
            </div>

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
                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b font-black"><tr><th className="px-8 py-6 text-center">排名</th><th className="px-8 py-6">隊員資料</th><th className="px-8 py-6">目前章別</th><th className="px-8 py-6 text-right">基礎分</th><th className="px-8 py-6 text-right">總分</th>{role === 'admin' && <th className="px-8 py-6 text-center">教練操作</th>}</tr></thead>
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
                          <td className="px-8 py-8 text-right font-mono text-slate-400">{s.points}</td>
                          <td className="px-8 py-8 text-right font-mono text-3xl text-blue-600 font-black">{s.totalPoints}</td>
                          
                          {role === 'admin' && (
                            <td className="px-8 py-8">
                                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={()=>setCalibrationModalData(s)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="設定初始評級 (定級)"><Target size={18}/></button>
                                    {/* 👉 點擊打開成績輸入 Modal 👈 */}
                                    <button onClick={()=>openMatchModal(s)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="輸入對賽成績 (小分制Elo)"><Swords size={18}/></button>
                                    <button onClick={()=> handleExternalComp(s)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="純紀錄校外賽成績"><Globe size={18}/></button>
                                </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>

            {/* 👉 更新：2.0 版 小分制輸入 Modal 👈 */}
            {matchModalData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Swords size={20}/></div><h3 className="text-xl font-black text-slate-800">輸入每局成績</h3></div>
                            <button onClick={() => setMatchModalData(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">主角球員</label>
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl font-black flex justify-between"><span>{matchModalData.name}</span><span>目前積分: {matchModalData.totalPoints || 1000}</span></div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">比賽類型 (決定最大積分波幅)</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500" value={matchType} onChange={(e)=>setMatchType(e.target.value)}>
                                    <option value="internal_challenge">校內日常挑戰賽 (x1.0 波幅)</option>
                                    <option value="friendly_match">校外友誼賽/交流賽 (x1.2 波幅)</option>
                                    <option value="inter_school">學界比賽 (x1.5 波幅)</option>
                                    <option value="regional_elite">區際/全港錦標賽 (x2.0 波幅)</option>
                                </select>
                            </div>

                            {matchType === 'internal_challenge' ? (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-blue-600">選擇校內對手</label>
                                    <select className="w-full p-3 bg-blue-50/50 border border-blue-200 rounded-xl font-bold text-blue-800 outline-none focus:border-blue-500" value={opponentId} onChange={(e)=>setOpponentId(e.target.value)}>
                                        <option value="">-- 請選擇對手 --</option>
                                        {rankedStudents.filter(s => s.id !== matchModalData.id).map(s => (<option key={s.id} value={s.id}>{s.name} (積分: {s.totalPoints || 1000})</option>))}
                                    </select>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-4">
                                    <div><label className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 block">外部對手名稱</label><input type="text" placeholder="例如: 男拔萃 - 陳大文" className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500" value={externalOppName} onChange={(e)=>setExternalOppName(e.target.value)} /></div>
                                    <div>
                                        <label className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 block">預估外部對手實力級別 (Elo)</label>
                                        <select className="w-full p-3 bg-white border border-orange-200 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-500" value={externalOppRating} onChange={(e)=>setExternalOppRating(e.target.value)}>
                                            <option value="800">初學/新手 (約 800分)</option><option value="1000">一般校隊水準 (約 1000分)</option><option value="1300">學界種子球員 (約 1300分)</option><option value="1600">區際精英水準 (約 1600分)</option><option value="2000">全港青年代表 (約 2000分)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* 👉 核心機制：每局小分輸入區塊 👈 */}
                            <div className="pt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">輸入每局分數 (無需打滿5局可留空)</label>
                                <div className="space-y-3 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner">
                                    <div className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4 mb-2">
                                        <div className="flex-1 text-blue-600 text-left">主角得分</div>
                                        <div className="w-12">VS</div>
                                        <div className="flex-1 text-orange-600 text-right">對手得分</div>
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

                                {/* 實時表現計算器面板 */}
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-500">總得分比例:</span>
                                        <span className="font-black text-slate-700">
                                            <span className="text-blue-600">{totalP}</span> : <span className="text-orange-500">{totalO}</span> 
                                            <span className="text-slate-400 ml-2">({totalPointsMatch > 0 ? (pointRatio * 100).toFixed(1) : 0}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-px bg-emerald-200/50 w-full my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-emerald-700">實時表現評分:</span>
                                        <span className="text-xl font-black text-emerald-600">{(actualScorePlayer * 100).toFixed(1)} <span className="text-sm text-emerald-500">/ 100</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 sticky bottom-0">
                            <button onClick={() => setMatchModalData(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                            <button onClick={handleMatchSubmit} className="px-6 py-3 rounded-xl font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">確認並計算精細 Elo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 初始評級彈出視窗保持不變 */}
            {calibrationModalData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                            <div className="flex items-center gap-3"><div className="p-2 bg-amber-200 text-amber-700 rounded-xl"><Target size={20}/></div><h3 className="text-xl font-black text-slate-800">設定初始評級 (定級)</h3></div>
                            <button onClick={() => setCalibrationModalData(null)} className="p-2 text-slate-400 hover:bg-amber-200/50 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-sm text-slate-600 font-bold bg-slate-50 p-4 rounded-xl border">
                                為 <span className="text-amber-600"> {calibrationModalData.name} </span> 設定基準積分。<br/><br/>
                                該生目前的積分：<span className="text-lg text-blue-600 font-black">{calibrationModalData.totalPoints || 1000} 分</span>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">選擇對應的實力梯隊</label>
                                <select className="w-full p-4 bg-white border-2 border-amber-200 rounded-xl font-bold text-slate-700 outline-none focus:border-amber-500 text-lg" value={calibrationTier} onChange={(e)=>setCalibrationTier(e.target.value)}>
                                    <option value="800">800 分 - 發展梯隊 (新手起步)</option><option value="1000">1000 分 - 基礎梯隊 (掌握基本擊球)</option><option value="1300">1300 分 - 校隊儲備 (具備戰術意識)</option><option value="1600">1600 分 - 校隊常規主力 (學界代表)</option><option value="2000">2000 分 - 精英梯隊 (全港排名前列)</option>
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
