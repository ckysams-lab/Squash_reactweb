// src/pages/AssessmentsPage.jsx (Version 3.9 - UI Standardized)

import React from 'react';
import { Activity, Save, Zap, Dumbbell, User } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function AssessmentsPage({
    students,
    newAssessment,
    setNewAssessment,
    handleSaveAssessment,
    isUpdating
}) {
    // 處理輸入，確保是數字
    const handleChange = (field, value) => {
        setNewAssessment(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-4xl mx-auto">
            
            <PageHeader 
                title="綜合能力評估" 
                subtitle="定期紀錄球員體能與技術數據，以產生雷達圖" 
                icon={Activity} 
            />

            <Card className="flex flex-col">
                <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="w-full md:w-1/2">
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">1. 選擇受測學員</label>
                        <select 
                            value={newAssessment.studentId} 
                            onChange={(e) => handleChange('studentId', e.target.value)}
                            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-black text-blue-900 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>請選擇一名球員...</option>
                            {students.sort((a,b) => a.class.localeCompare(b.class)).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">2. 評測日期</label>
                        <input 
                            type="date" 
                            value={newAssessment.date} 
                            onChange={(e) => handleChange('date', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    
                    {/* 體能數據群組 */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                            <Zap className="text-amber-500"/> 體能與爆發力
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">折返跑 (趟)</label>
                                <input type="number" placeholder="0" value={newAssessment.shuttleRun} onChange={e => handleChange('shuttleRun', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">仰臥起坐 (次/分)</label>
                                <input type="number" placeholder="0" value={newAssessment.situps} onChange={e => handleChange('situps', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">耐力跑 (級數)</label>
                                <input type="number" placeholder="0" value={newAssessment.enduranceRun} onChange={e => handleChange('enduranceRun', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">柔軟度 (cm)</label>
                                <input type="number" placeholder="0" value={newAssessment.flexibility} onChange={e => handleChange('flexibility', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* 技術數據群組 */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                            <Dumbbell className="text-indigo-500"/> 壁球專項技術 (滿分 10)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">正手長球</label>
                                <input type="number" min="0" max="10" placeholder="0-10" value={newAssessment.fhDrive} onChange={e => handleChange('fhDrive', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">反手長球</label>
                                <input type="number" min="0" max="10" placeholder="0-10" value={newAssessment.bhDrive} onChange={e => handleChange('bhDrive', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">正手截擊</label>
                                <input type="number" min="0" max="10" placeholder="0-10" value={newAssessment.fhVolley} onChange={e => handleChange('fhVolley', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">反手截擊</label>
                                <input type="number" min="0" max="10" placeholder="0-10" value={newAssessment.bhVolley} onChange={e => handleChange('bhVolley', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* 教練總評 */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">教練評語與建議 (顯示於學生儀表板)</label>
                        <textarea 
                            rows="3" 
                            placeholder="在此輸入對球員本階段訓練的觀察..." 
                            value={newAssessment.notes} 
                            onChange={e => handleChange('notes', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all text-sm font-medium resize-none" 
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <PrimaryButton 
                        icon={Save} 
                        onClick={handleSaveAssessment} 
                        loading={isUpdating}
                        className="px-12 text-lg w-full md:w-auto"
                    >
                        送出評估數據
                    </PrimaryButton>
                </div>
            </Card>

        </div>
    );
}
