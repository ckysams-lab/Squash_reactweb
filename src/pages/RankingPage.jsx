// src/pages/RankingPage.jsx (Version 1.7)
// 更新內容: 參考 SquashLevels，引入 Elo Rating System 演算法，根據「預期勝率」與「實際局數」動態計算積分增減

import React, { useState } from 'react';
import { Search, Trophy as TrophyIcon, Crown, Info, Globe, Trash2, Swords, X } from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';

import { PageHeader, Card, DangerButton } from '../components/ui';

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
    const [matchModalData, setMatchModalData] = useState(null);
    const [opponentId, setOpponentId] = useState("");
    const [matchType, setMatchType] = useState("internal_challenge");
    const [score, setScore] = useState("3-0");

    // 🏆 SquashLevels (Elo) 核心計算邏輯
    const handleMatchSubmit = () => {
        if (!opponentId) {
            alert("請選擇對手！");
            return;
        }

        const player = matchModalData;
        const opponent = rankedStudents.find(s => s.id === opponentId);
        if (!opponent) return;

        const playerRating = player.totalPoints || 1000; // 預設積分
        const oppRating = opponent.totalPoints || 1000;

        // 1. 計算主角的預期勝率 (Expected Score) - 基於積分差距
        // 公式: 1 / (1 + 10 ^ ((對手積分 - 主角積分) / 400))
        const expectedScorePlayer = 1 / (1 + Math.pow(10, (oppRating - playerRating) / 400));
        
        // 2. 將實際局數轉換為「實際表現得分 (Actual Score)」 0 到 1 之間
        const scoreMapping = {
            "3-0": 1.0,
            "3-1": 0.85,
            "3-2": 0.7,
            "2-3": 0.3,
            "1-3": 0.15,
            "0-3": 0.0
        };
        const actualScorePlayer = scoreMapping[score];
        const actualScoreOpp = 1 - actualScorePlayer;

        // 3. 賽事權重設定 (Match Weight / K-Factor)
        // K值代表一場比賽最多能改變多少分。大賽的波動會更大。
        const baseK = 30; 
        const matchWeights = {
            'internal_challenge': 1.0,  // 最大變動 ~30分
            'friendly_match': 1.2,      // 最大變動 ~36分
            'inter_school': 1.5,        // 最大變動 ~45分
            'regional_elite': 2.0       // 最大變動 ~60分
        };
        const K = baseK * (matchWeights[matchType] || 1.0);

        // 4. 計算積分變動 = K * (實際得分 - 預期得分)
        const playerDeltaRaw = K * (actualScorePlayer - expectedScorePlayer);
        // 對手的變動通常與主角相反 (零和遊戲)
        const oppDeltaRaw = -playerDeltaRaw; 

        // 四捨五入
        const playerDelta = Math.round(playerDeltaRaw);
        const oppDelta = Math.round(oppDeltaRaw);

        // 寫入資料庫
        if (typeof adjustPoints === 'function') {
            adjustPoints(player.id, playerDelta);
            adjustPoints(opponent.id, oppDelta);
            alert(`✅ SquashLevels 專業演算法計算成功！\n\n賽前積分: ${player.name}(${playerRating}) vs ${opponent.name}(${oppRating})\n預期勝率: ${(expectedScorePlayer*100).toFixed(1)}%\n\n【積分結算】\n${player.name}: ${playerDelta > 0 ? '+'+playerDelta : playerDelta} 分\n${opponent.name}: ${oppDelta > 0 ? '+'+oppDelta : oppDelta} 分`);
        } else {
            alert(`⚠️ 找不到 adjustPoints！\n\n【模擬結算】\n${player.name}: ${playerDelta > 0 ? '+'+playerDelta : playerDelta} 分\n${opponent.name}: ${oppDelta > 0 ? '+'+oppDelta : oppDelta} 分`);
        }

        setMatchModalData(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            
            <PageHeader 
                title="積分排行榜" 
                subtitle="查看全隊排名與積分變動" 
                icon={TrophyIcon} 
            />

            {/* 前三名頒獎台區塊保持不變 */}
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

            {/* 👉 更新：1.7 版本 SquashLevels 機制說明 👈 */}
            <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Info size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 mb-2">💡 SquashLevels 專業等級分機制 (v1.7)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-bold">
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="text-emerald-600">預期表現</span>：系統會根據雙方積分差距計算預期勝率。</li>
                            <li><span className="text-amber-500">防刷分機制</span>：高分球員擊敗低分球員只會獲得極少積分。</li>
                        </ul>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="text-indigo-500">光榮落敗</span>：低分球員若表現超乎預期 (例如 2-3 惜敗高分球員)，積分將會**不跌反升**！</li>
                            <li><span className="text-red-500">賽事權重</span>：學界與區際賽事會觸發更高的積分波幅。</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 全體隊員列表 */}
            <Card noPadding>
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  {role === 'admin' && <div className="flex gap-2"><span className="text-[10px] text-slate-400 self-center">*請在下方點擊以記錄對賽成績</span></div>}
                  <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                      <input 
                          value={searchTerm} 
                          onChange={(e)=>setSearchTerm(e.target.value)} 
                          placeholder="搜尋姓名或班別..." 
                          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-600 transition-all shadow-sm"
                      />
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
                                      <div className="flex flex-wrap items-center gap-2">
                                          <div className="font-black text-lg text-slate-800 truncate" title={s.name}>{s.name}</div>
                                          <div className="flex shrink-0 items-center gap-1">
                                              {s.featuredBadges?.map(badgeId => {
                                                  const badge = ACHIEVEMENT_DATA[badgeId];
                                                  if (!badge) return null;
                                                  return (
                                                      <div key={badgeId} title={badge.baseName} className="w-5 h-5 flex items-center justify-center text-blue-600">
                                                          {React.cloneElement(badge.icon, { size: 18 })}
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
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
                                    <button onClick={()=>setMatchModalData(s)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="輸入對賽成績 (計算權重)"><Swords size={18}/></button>
                                    <button onClick={()=> handleExternalComp(s)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="校外賽成績錄入"><Globe size={18}/></button>
                                    <button onClick={()=>deleteItem('students', s.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="永久刪除"><Trash2 size={18}/></button>
                                </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>

            {/* 對賽成績彈出視窗 (Modal) */}
            {matchModalData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Swords size={20}/></div>
                                <h3 className="text-xl font-black text-slate-800">輸入對賽成績</h3>
                            </div>
                            <button onClick={() => setMatchModalData(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">主角球員 (勝/負方)</label>
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl font-black">{matchModalData.name} (目前的總分: {matchModalData.totalPoints})</div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">選擇對手</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={opponentId} onChange={(e)=>setOpponentId(e.target.value)}>
                                    <option value="">-- 請選擇對手 --</option>
                                    {rankedStudents.filter(s => s.id !== matchModalData.id).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (積分: {s.totalPoints})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">比賽類型 (決定最大積分波幅)</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={matchType} onChange={(e)=>setMatchType(e.target.value)}>
                                    <option value="internal_challenge">校內日常挑戰賽 (x1.0)</option>
                                    <option value="friendly_match">友誼賽/交流賽 (x1.2)</option>
                                    <option value="inter_school">學界比賽 (x1.5)</option>
                                    <option value="regional_elite">區際/全港錦標賽 (x2.0)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">局數比分</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={score} onChange={(e)=>setScore(e.target.value)}>
                                    <option value="3-0">勝 3 - 0 (表現評分: 100%)</option>
                                    <option value="3-1">勝 3 - 1 (表現評分: 85%)</option>
                                    <option value="3-2">勝 3 - 2 (表現評分: 70%)</option>
                                    <option value="2-3">負 2 - 3 (表現評分: 30%)</option>
                                    <option value="1-3">負 1 - 3 (表現評分: 15%)</option>
                                    <option value="0-3">負 0 - 3 (表現評分: 0%)</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                            <button onClick={() => setMatchModalData(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">取消</button>
                            <button onClick={handleMatchSubmit} className="px-6 py-3 rounded-xl font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">確認並計算 Elo 積分</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
