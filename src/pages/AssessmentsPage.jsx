// src/pages/AssessmentsPage.jsx
import React from 'react';
import { Activity, Swords, Save, Loader2 } from 'lucide-react';

export default function AssessmentsPage({
    students,
    newAssessment,
    setNewAssessment,
    handleSaveAssessment,
    isUpdating
}) {
    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-3xl font-black mb-2 text-center">綜合能力評估錄入</h3>
                <p className="text-center text-slate-400 mb-10">請輸入學員各項體能與技術測試的最新成績。</p>
                
                <div className="space-y-8">
                    {/* 學員與日期選擇區 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">選擇學員</label>
                            <select 
                                value={newAssessment.studentId} 
                                onChange={e => setNewAssessment({...newAssessment, studentId: e.target.value})} 
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"
                            >
                                <option value="" disabled>-- 請選擇一位隊員 --</option>
                                {students.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block">評估日期</label>
                            <input 
                                type="date" 
                                value={newAssessment.date} 
                                onChange={e => setNewAssessment({...newAssessment, date: e.target.value})} 
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"
                            />
                        </div>
                    </div>

                    {/* 體能測試指標 */}
                    <div className="bg-slate-50 p-6 rounded-3xl border space-y-6">
                        <h4 className="text-lg font-black text-slate-700 flex items-center gap-2"><Activity size={20}/> 體能測試指標</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div><label className="text-xs text-slate-500 block mb-1">仰臥起坐 (次/分)</label><input type="number" value={newAssessment.situps} onChange={e => setNewAssessment({...newAssessment, situps: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 45"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">1分鐘折返跑 (次)</label><input type="number" value={newAssessment.shuttleRun} onChange={e => setNewAssessment({...newAssessment, shuttleRun: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="跑3組平均值"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">耐力跑 (6/9分鐘)</label><input type="number" value={newAssessment.enduranceRun} onChange={e => setNewAssessment({...newAssessment, enduranceRun: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 圈數"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">手握力 (kg)</label><input type="number" value={newAssessment.gripStrength} onChange={e => setNewAssessment({...newAssessment, gripStrength: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 30"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">柔軟度 (坐姿體前彎 cm)</label><input type="number" value={newAssessment.flexibility} onChange={e => setNewAssessment({...newAssessment, flexibility: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 25"/></div>
                        </div>
                    </div>

                    {/* 技術測試指標 */}
                    <div className="bg-slate-50 p-6 rounded-3xl border space-y-6">
                        <h4 className="text-lg font-black text-slate-700 flex items-center gap-2"><Swords size={20}/> 技術測試指標</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="text-xs text-slate-500 block mb-1">正手直線連續 (次)</label><input type="number" value={newAssessment.fhDrive} onChange={e => setNewAssessment({...newAssessment, fhDrive: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 30"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">反手直線連續 (次)</label><input type="number" value={newAssessment.bhDrive} onChange={e => setNewAssessment({...newAssessment, bhDrive: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 20"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">正手截擊連續 (次)</label><input type="number" value={newAssessment.fhVolley} onChange={e => setNewAssessment({...newAssessment, fhVolley: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 15"/></div>
                            <div><label className="text-xs text-slate-500 block mb-1">反手截擊連續 (次)</label><input type="number" value={newAssessment.bhVolley} onChange={e => setNewAssessment({...newAssessment, bhVolley: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 10"/></div>
                        </div>
                    </div>

                    {/* 教練評語 */}
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">教練評語 (可選)</label>
                        <textarea value={newAssessment.notes} onChange={e => setNewAssessment({...newAssessment, notes: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none h-24" placeholder="輸入關於學生表現的觀察或建議..."></textarea>
                    </div>

                    {/* 儲存按鈕 */}
                    <div className="pt-6 border-t">
                        <button onClick={handleSaveAssessment} disabled={isUpdating} className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                            {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存評估成績
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
