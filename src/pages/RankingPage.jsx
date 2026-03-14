// src/pages/RankingPage.jsx (Version 1.0)

import React from 'react';
import { Search, Trophy as TrophyIcon, Crown, Info, Plus, MinusCircle, Globe, Trash2 } from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';

// 引入共用 UI 元件
import { PageHeader, Card, DangerButton } from '../components/ui';

export default function RankingPage({
    role,
    rankedStudents,
    filteredStudents,
    searchTerm,
    setSearchTerm,
    setShowPlayerCard,
    adjustPoints,
    handleExternalComp,
    deleteItem
}) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <PageHeader 
                title="積分排行榜" 
                subtitle="查看全隊排名與積分變動" 
                icon={TrophyIcon} 
            />

            {/* 前三名頒獎台區塊 */}
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

            {/* 積分機制說明 */}
            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Info size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 mb-2">💡 積分機制說明</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-bold">
                        <ul className="list-disc pl-4 space-y-1"><li><span className="text-slate-400">出席訓練</span>：只作紀錄 (不加分)</li><li><span className="text-blue-600">內部聯賽</span>：勝方 +10 / 巨人殺手 +20</li></ul>
                        <ul className="list-disc pl-4 space-y-1"><li><span className="text-indigo-500">校外賽參與</span>：+20 / 勝場 +20</li><li><span className="text-yellow-600">校外賽獎項</span>：冠軍+100 / 亞軍+50 / 季殿+30</li></ul>
                    </div>
                </div>
            </div>

            {/* 全體隊員列表 (使用 Card 元件) */}
            <Card noPadding>
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  {role === 'admin' && <div className="flex gap-2"><span className="text-[10px] text-slate-400 self-center">*請在下方列表為個別學生加分</span></div>}
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
                          
                          {/* 👉 優化後的隊員資料顯示區塊 👈 */}
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
                                    <button onClick={()=>adjustPoints(s.id, 10)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="+10分"><Plus size={18}/></button>
                                    <button onClick={()=>adjustPoints(s.id, -10)} className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm hover:shadow-md" title="-10分"><MinusCircle size={18}/></button>
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
        </div>
    );
}
