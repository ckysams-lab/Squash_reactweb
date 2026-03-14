// src/pages/ExternalMatchesPage.jsx (Version 3.8 - UI Standardized)

import React from 'react';
import { BookMarked, Save, Globe, Trophy, User } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function ExternalMatchesPage({
    newExternalMatch,
    setNewExternalMatch,
    externalTournaments,
    students,
    handleSaveExternalMatch,
    isUpdating
}) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-4xl mx-auto">
            
            <PageHeader 
                title="校外賽紀錄管理" 
                subtitle="為隊員登錄校外比賽的個別成績與積分" 
                icon={BookMarked} 
            />

            <Card className="flex flex-col">
                <div className="mb-8 border-b border-slate-100 pb-4">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Globe className="text-indigo-500" /> 新增賽事紀錄
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">此紀錄將顯示在學生的個人戰績中，如果學生獲勝，請記得至「隊員檔案庫」手動加分。</p>
                </div>

                <div className="space-y-6 flex-1">
                    {/* 第一列：賽事與日期 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">賽事名稱 (請先在設定中匯入)</label>
                            <select 
                                value={newExternalMatch.tournamentName} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, tournamentName: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                            >
                                <option value="" disabled>請選擇一場賽事...</option>
                                {externalTournaments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">比賽日期</label>
                            <input 
                                type="date" 
                                value={newExternalMatch.date} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, date: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold"
                            />
                        </div>
                    </div>

                    {/* 第二列：對戰雙方 */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                        <div className="space-y-4">
                            <h4 className="font-black text-blue-800 flex items-center gap-2"><User size={18}/> 我方隊員</h4>
                            <select 
                                value={newExternalMatch.player1Id} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, player1Id: e.target.value})}
                                className="w-full bg-white border border-blue-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-blue-900"
                            >
                                <option value="" disabled>選擇本校出賽球員...</option>
                                {students.sort((a,b) => a.class.localeCompare(b.class)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                            </select>
                        </div>

                        <div className="hidden md:flex flex-col items-center justify-center font-black text-slate-300 italic text-2xl px-4 pt-8">
                            VS
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-black text-slate-600 flex items-center gap-2"><User size={18}/> 對手資訊</h4>
                            <div className="flex gap-2">
                                <input 
                                    type="text" placeholder="對手學校" 
                                    value={newExternalMatch.opponentSchool} 
                                    onChange={e => setNewExternalMatch({...newExternalMatch, opponentSchool: e.target.value})}
                                    className="w-1/2 bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-slate-400 transition-all font-bold text-sm"
                                />
                                <input 
                                    type="text" placeholder="對手姓名" 
                                    value={newExternalMatch.opponentPlayerName} 
                                    onChange={e => setNewExternalMatch({...newExternalMatch, opponentPlayerName: e.target.value})}
                                    className="w-1/2 bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-slate-400 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 第三列：比賽結果 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">本場結果 (必填)</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setNewExternalMatch({...newExternalMatch, isWin: true})}
                                    className={`flex-1 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 border-2 ${newExternalMatch.isWin === true ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
                                >
                                    <Trophy size={18}/> 勝出 (WIN)
                                </button>
                                <button 
                                    onClick={() => setNewExternalMatch({...newExternalMatch, isWin: false})}
                                    className={`flex-1 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 border-2 ${newExternalMatch.isWin === false ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-300'}`}
                                >
                                    <X size={18}/> 戰敗 (LOSE)
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">最終比分紀錄 (選填)</label>
                            <input 
                                type="text" 
                                placeholder="例如: 11-5, 11-8, 12-10" 
                                value={newExternalMatch.externalMatchScore} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, externalMatchScore: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold font-mono"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                    <PrimaryButton 
                        icon={Save} 
                        onClick={handleSaveExternalMatch} 
                        loading={isUpdating}
                        className="px-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                    >
                        儲存紀錄
                    </PrimaryButton>
                </div>
            </Card>

        </div>
    );
}
