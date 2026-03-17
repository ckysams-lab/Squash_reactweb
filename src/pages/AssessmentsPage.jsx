// src/pages/AssessmentsPage.jsx (Version 4.3 - Form Optimization)

import React from 'react';
import { Activity, Save, Zap, Dumbbell, BookOpen, Clock, History } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function AssessmentsPage({
    students,
    assessments, 
    newAssessment,
    setNewAssessment,
    handleSaveAssessment,
    isUpdating
}) {

    // 處理欄位輸入變更
    const handleChange = (field, value) => {
        setNewAssessment(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 核心邏輯：當選擇學生時，自動載入上一次的數據
    const handleStudentChange = (e) => {
        const selectedId = e.target.value;
        const today = new Date().toISOString().split('T')[0];

        if (!selectedId) {
            setNewAssessment({ studentId: '', date: today });
            return;
        }

        const studentHistory = (assessments || [])
            .filter(a => a.studentId === selectedId)
            .sort((a, b) => {
                const dateCompare = b.date.localeCompare(a.date);
                if (dateCompare === 0) {
                    const timeA = a.timestamp?.seconds || 0;
                    const timeB = b.timestamp?.seconds || 0;
                    return timeB - timeA;
                }
                return dateCompare;
            });

        if (studentHistory.length > 0) {
            const lastRecord = studentHistory[0];
            const { id, ...cleanRecord } = lastRecord;
            setNewAssessment({ ...cleanRecord, date: today, notes: '' });
        } else {
            setNewAssessment({
                studentId: selectedId, date: today,
                situps: '', shuttleRun: '', enduranceRun: '', gripStrength: '', flexibility: '',
                fhDrive: '', bhDrive: '', fhVolley: '', bhVolley: '',
                rankT1: '', rankT2: '', rankT3: '', hoursT1: '', hoursT2: '', hoursT3: '', notes: ''
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-5xl mx-auto">
            
            <PageHeader 
                title="綜合能力與學業評估" 
                subtitle="定期紀錄球員體能、技術與學業表現，確保全人發展" 
                icon={Activity} 
            />

            <Card className="flex flex-col">
                {/* 頂部選擇區塊 */}
                <div className="mb-8 border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
                    <div className="w-full md:w-1/2 relative">
                        <label className="text-sm font-black text-slate-600 mb-2 block uppercase tracking-widest flex items-center gap-2">
                            1. 選擇受測學員 
                            {newAssessment.studentId && newAssessment.shuttleRun && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1"><History size={10}/> 已自動載入前次紀錄</span>}
                        </label>
                        <select 
                            value={newAssessment.studentId || ''} 
                            onChange={handleStudentChange}
                            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-black text-blue-900 appearance-none cursor-pointer text-lg"
                        >
                            <option value="" disabled>請選擇一名球員...</option>
                            {students.sort((a,b) => a.class.localeCompare(b.class)).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-sm font-black text-slate-600 mb-2 block uppercase tracking-widest">2. 評測日期</label>
                        <input 
                            type="date" 
                            value={newAssessment.date || new Date().toISOString().split('T')[0]} 
                            onChange={(e) => handleChange('date', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                        />
                    </div>
                </div>

                <div className="space-y-8 flex-1">
                    
                    {/* 學業與訓練負荷區塊 */}
                    <div className="bg-indigo-50/50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm">
                        <div className="flex items-center justify-between border-b border-indigo-200/50 pb-3 mb-5">
                            <h4 className="text-lg font-black text-indigo-800 flex items-center gap-2">
                                <BookOpen className="text-indigo-500"/> 學業排名與訓練負荷
                            </h4>
                            <span className="hidden sm:block text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded font-bold uppercase tracking-widest">圖表分析專用</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-indigo-500 bg-indigo-100/50 p-2 rounded-lg">請輸入該學生最近三次學段的「全級排名」</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1">上學期 (T1)</label><input type="number" placeholder="例: 15" value={newAssessment.rankT1 || ''} onChange={e => handleChange('rankT1', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1">下學期 (T2)</label><input type="number" placeholder="例: 12" value={newAssessment.rankT2 || ''} onChange={e => handleChange('rankT2', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1">年終大考 (T3)</label><input type="number" placeholder="例: 8" value={newAssessment.rankT3 || ''} onChange={e => handleChange('rankT3', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                </div>
                            </div>
                            <div className="space-y-4 md:border-l border-indigo-100 md:pl-8">
                                <p className="text-xs font-bold text-indigo-500 bg-indigo-100/50 p-2 rounded-lg">請輸入該學段的「每週平均訓練時數」</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><Clock size={12}/> T1 時數</label><input type="number" placeholder="例: 4.5" step="0.5" value={newAssessment.hoursT1 || ''} onChange={e => handleChange('hoursT1', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><Clock size={12}/> T2 時數</label><input type="number" placeholder="例: 6.0" step="0.5" value={newAssessment.hoursT2 || ''} onChange={e => handleChange('hoursT2', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><Clock size={12}/> T3 時數</label><input type="number" placeholder="例: 5.5" step="0.5" value={newAssessment.hoursT3 || ''} onChange={e => handleChange('hoursT3', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-indigo-500 transition-all shadow-sm" /></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 體能數據群組 */}
                    <div className="bg-amber-50/30 p-6 md:p-8 rounded-3xl border border-amber-100 shadow-sm">
                        <h4 className="text-lg font-black text-amber-900 mb-5 flex items-center gap-2 border-b border-amber-200/50 pb-3">
                            <Zap className="text-amber-500"/> 體能與爆發力
                        </h4>
                        {/* 👇 手握力就在這排 👇 */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">折返跑 <span className="text-[10px] text-amber-600 bg-amber-100 px-1 rounded">滿分 22趟</span></label>
                                <input type="number" placeholder="趟數" value={newAssessment.shuttleRun || ''} onChange={e => handleChange('shuttleRun', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">耐力跑 <span className="text-[10px] text-amber-600 bg-amber-100 px-1 rounded">滿分 1800m</span></label>
                                <input type="number" placeholder="米" value={newAssessment.enduranceRun || ''} onChange={e => handleChange('enduranceRun', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all shadow-sm" />
                            </div>
                            {/* 手握力在這裡 */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">手握力 <span className="text-[10px] text-amber-600 bg-amber-100 px-1 rounded">滿分 70kg</span></label>
                                <input type="number" placeholder="kg" value={newAssessment.gripStrength || ''} onChange={e => handleChange('gripStrength', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">柔軟度 <span className="text-[10px] text-amber-600 bg-amber-100 px-1 rounded">滿分 30cm</span></label>
                                <input type="number" placeholder="cm" value={newAssessment.flexibility || ''} onChange={e => handleChange('flexibility', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">仰臥起坐 <span className="text-[10px] text-slate-400">次/分</span></label>
                                <input type="number" placeholder="次數" value={newAssessment.situps || ''} onChange={e => handleChange('situps', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-amber-500 transition-all shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* 技術數據群組 */}
                    <div className="bg-blue-50/30 p-6 md:p-8 rounded-3xl border border-blue-100 shadow-sm">
                        <h4 className="text-lg font-black text-blue-900 mb-5 flex items-center gap-2 border-b border-blue-200/50 pb-3">
                            <Dumbbell className="text-blue-500"/> 壁球專項技術
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">正手長球 <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">滿 10 球</span></label>
                                <input type="number" min="0" max="10" placeholder="打進幾球" value={newAssessment.fhDrive || ''} onChange={e => handleChange('fhDrive', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-blue-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">反手長球 <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">滿 10 球</span></label>
                                <input type="number" min="0" max="10" placeholder="打進幾球" value={newAssessment.bhDrive || ''} onChange={e => handleChange('bhDrive', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-blue-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">正手截擊 <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">滿 7 球</span></label>
                                <input type="number" min="0" max="7" placeholder="打進幾球" value={newAssessment.fhVolley || ''} onChange={e => handleChange('fhVolley', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-blue-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">反手截擊 <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">滿 7 球</span></label>
                                <input type="number" min="0" max="7" placeholder="打進幾球" value={newAssessment.bhVolley || ''} onChange={e => handleChange('bhVolley', e.target.value)} className="w-full bg-white p-3 rounded-xl border border-slate-200 outline-none font-mono text-lg text-slate-800 focus:border-blue-500 transition-all shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* 教練總評 */}
                    <div>
                        <label className="text-sm font-black text-slate-600 mb-2 block uppercase tracking-widest">教練評語與建議 (顯示於學生儀表板)</label>
                        <textarea 
                            rows="3" 
                            placeholder="在此輸入對球員本階段訓練的觀察..." 
                            value={newAssessment.notes || ''} 
                            onChange={e => handleChange('notes', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:border-blue-500 transition-all text-base font-medium resize-none shadow-sm" 
                        />
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                    <PrimaryButton 
                        icon={Save} 
                        onClick={handleSaveAssessment} 
                        loading={isUpdating}
                        className="px-16 text-xl w-full md:w-auto py-5 shadow-xl shadow-blue-200"
                    >
                        送出最新評估數據
                    </PrimaryButton>
                </div>
            </Card>
        </div>
    );
}
