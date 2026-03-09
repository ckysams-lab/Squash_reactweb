// src/pages/ExternalMatchesPage.jsx
import React from 'react';
import { Save, Loader2 } from 'lucide-react';

export default function ExternalMatchesPage({
    newExternalMatch,
    setNewExternalMatch,
    externalTournaments,
    students,
    handleSaveExternalMatch,
    isUpdating
}) {
    return (
        <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-3xl font-black mb-2 text-center">新增校外賽記錄</h3>
                <p className="text-center text-slate-400 mb-10">請在此逐一記錄每場校外賽的賽果。</p>
                
                <div className="space-y-6">
                    {/* 1. 選擇賽事 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">1. 選擇賽事</label>
                        <select 
                            value={newExternalMatch.tournamentName} 
                            onChange={e => setNewExternalMatch({...newExternalMatch, tournamentName: e.target.value})} 
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"
                        >
                            <option value="" disabled>-- 請選擇一個已匯入的賽事 --</option>
                            {externalTournaments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        <p className="text-xs text-slate-400 mt-2 px-2">如清單中沒有所需賽事，請先到「系統設定」頁面匯入。</p>
                    </div>

                    {/* 2. 比賽日期 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">2. 比賽日期</label>
                        <input 
                            type="date" 
                            value={newExternalMatch.date} 
                            onChange={e => setNewExternalMatch({...newExternalMatch, date: e.target.value})} 
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"
                        />
                    </div>

                    {/* 3. 我方隊員 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">3. 我方隊員</label>
                        <select 
                            value={newExternalMatch.player1Id} 
                            onChange={e => setNewExternalMatch({...newExternalMatch, player1Id: e.target.value})} 
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"
                        >
                            <option value="" disabled>-- 請選擇一位隊員 --</option>
                            {students.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                        </select>
                    </div>

                    {/* 4 & 5. 對手資訊 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">4. 對手學校 (可選)</label>
                            <input 
                                type="text" 
                                value={newExternalMatch.opponentSchool} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, opponentSchool: e.target.value})} 
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" 
                                placeholder="例如: 喇沙書院"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">5. 對手球員 (可選)</label>
                            <input 
                                type="text" 
                                value={newExternalMatch.opponentPlayerName} 
                                onChange={e => setNewExternalMatch({...newExternalMatch, opponentPlayerName: e.target.value})} 
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" 
                                placeholder="例如: 王小虎"
                            />
                        </div>
                    </div>

                    {/* 6. 賽果文字 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">6. 賽果 (文字)</label>
                        <input 
                            type="text" 
                            value={newExternalMatch.externalMatchScore} 
                            onChange={e => setNewExternalMatch({...newExternalMatch, externalMatchScore: e.target.value})} 
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" 
                            placeholder="例如: 2-1"
                        />
                    </div>

                    {/* 7. 勝負結果 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">7. 本場結果</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setNewExternalMatch({...newExternalMatch, isWin: true})} 
                                className={`p-4 rounded-2xl text-lg font-black transition-all ${newExternalMatch.isWin === true ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                                勝利
                            </button>
                            <button 
                                onClick={() => setNewExternalMatch({...newExternalMatch, isWin: false})} 
                                className={`p-4 rounded-2xl text-lg font-black transition-all ${newExternalMatch.isWin === false ? 'bg-rose-500 text-white ring-4 ring-rose-200' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                                落敗
                            </button>
                        </div>
                    </div>

                    {/* 儲存按鈕 */}
                    <div className="pt-6 border-t">
                        <button 
                            onClick={handleSaveExternalMatch} 
                            disabled={isUpdating} 
                            className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存賽果
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
