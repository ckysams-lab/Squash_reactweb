// src/pages/AttendancePage.jsx
import React from 'react';
import { 
  ClipboardCheck, Clock, Star, MapPin, Info, Save, 
  Loader2, FileBarChart, Download, Filter, CheckCircle2 
} from 'lucide-react';

export default function AttendancePage({
    todaySchedule,
    pendingAttendance,
    savePendingAttendance,
    isUpdating,
    attendanceClassFilter,
    setAttendanceClassFilter,
    exportMatrixAttendanceCSV,
    uniqueTrainingClasses,
    studentsInSelectedAttendanceClass,
    attendanceLogs,
    togglePendingAttendance
}) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-bold">
            
            {/* 頂部今日日程看板 */}
            <div className={`p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden transition-all duration-1000 ${todaySchedule ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-800'}`}>
                <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12">
                    <ClipboardCheck size={300}/>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-black flex items-center gap-4 mb-4">教練點名工具 <Clock size={32}/></h3>
                    <div className="flex flex-wrap gap-4">
                        {todaySchedule ? (
                            <>
                                <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                    <Star size={14} className="text-yellow-300 fill-yellow-300"/>
                                    <span className="text-sm font-black">今日：{todaySchedule.trainingClass}</span>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                    <MapPin size={14}/>
                                    <span className="text-sm font-black">{todaySchedule.location}</span>
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-700/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/5 flex items-center gap-2">
                                <Info size={14}/>
                                <span className="text-sm font-black text-slate-300">今日無預設訓練，進行一般點名</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative z-10 bg-white/10 px-10 py-6 rounded-[2.5rem] backdrop-blur-md mt-10 md:mt-0 text-center border border-white/10 shadow-inner">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-100 font-black opacity-60">Today's Date</p>
                    <p className="text-2xl font-black mt-1 font-mono">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* 懸浮儲存按鈕 (只有在有待儲存點名時才出現) */}
            {pendingAttendance.length > 0 && (
                <div className="fixed bottom-10 right-10 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <button 
                        onClick={savePendingAttendance} 
                        disabled={isUpdating}
                        className="flex items-center gap-4 px-8 py-5 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        <div className="text-left">
                            <span className="text-xl font-black">儲存點名紀錄</span>
                            <span className="block text-xs text-blue-200">已選擇 {pendingAttendance.length} 位學生</span>
                        </div>
                    </button>
                </div>
            )}

            {/* 出席率報表匯出區 */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileBarChart size={24}/></div>
                    <div>
                        <h4 className="font-black text-slate-800">出席率報表中心</h4>
                        <p className="text-[10px] text-slate-400 font-bold">匯出 CSV 檢查各班出席狀況</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => exportMatrixAttendanceCSV(attendanceClassFilter)} className="px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center gap-2">
                        <Download size={16}/> 匯出班級點名總表
                    </button>
                </div>
            </div>

            {/* 班別過濾器 */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-3 text-slate-400 min-w-max">
                    <Filter size={20} /><span>選擇點名班別：</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {uniqueTrainingClasses.map(cls => (
                        <button 
                            key={cls} 
                            onClick={() => setAttendanceClassFilter(cls)} 
                            className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${attendanceClassFilter === cls ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                        >
                            {cls === 'ALL' ? '🌍 全部學員' : cls}
                        </button>
                    ))}
                </div>
            </div>

            {/* 學生點名網格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {studentsInSelectedAttendanceClass.length > 0 ? (
                    studentsInSelectedAttendanceClass.map(s => {
                        const isAttended = todaySchedule && attendanceLogs.some(log => log.studentId === s.id && log.date === todaySchedule.date && log.trainingClass === todaySchedule.trainingClass);
                        const isPending = pendingAttendance.includes(s.id);
                        return (
                            <button 
                                key={s.id} 
                                onClick={() => {
                                    if (!isAttended) togglePendingAttendance(s.id);
                                }}
                                disabled={isAttended}
                                className={`group p-8 rounded-[3rem] border shadow-sm transition-all flex flex-col items-center text-center relative overflow-hidden 
                                    ${isAttended 
                                        ? 'bg-emerald-50 border-emerald-200 shadow-emerald-50 cursor-not-allowed' 
                                        : isPending 
                                        ? 'border-blue-500 shadow-xl shadow-blue-50 ring-4 ring-blue-100' 
                                        : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-lg'
                                    }`}
                            >
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl mb-4 transition-all font-black uppercase 
                                    ${isAttended 
                                        ? 'bg-emerald-200 text-white rotate-12' 
                                        : isPending 
                                        ? 'bg-blue-600 text-white rotate-6' 
                                        : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-blue-100'
                                    }`}
                                >
                                    {s.name[0]}
                                </div>
                                <p className={`font-black text-xl transition-all ${isAttended ? 'text-emerald-700' : isPending ? 'text-blue-600' : 'text-slate-800'}`}>{s.name}</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{s.class} ({s.classNo})</p>
                                <div className="mt-1 text-[10px] text-blue-500 font-bold truncate max-w-full px-2" title={s.squashClass}>{s.squashClass}</div>
                                
                                <div className={`absolute top-4 right-4 transition-all ${isAttended ? 'text-emerald-500' : isPending ? 'text-blue-500' : 'text-slate-100 group-hover:text-blue-100'}`}>
                                    <CheckCircle2 size={24}/>
                                </div>
                                
                                {isAttended && (<div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[10px] py-1 font-black uppercase tracking-widest">已出席</div>)}
                                {isPending && !isAttended && (<div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] py-1 font-black uppercase tracking-widest">待儲存</div>)}
                            </button>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-300 font-bold bg-white rounded-[3rem] border border-dashed">此班別暫無學員資料</div>
                )}
            </div>
        </div>
    );
}
