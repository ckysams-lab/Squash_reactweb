// src/pages/RosterPage.jsx
import React from 'react';
import { 
  Users, Filter, ChevronDown, Download, Upload, 
  Cake, Award, Layers, Key, UserCog, Trash2, Plus 
} from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';

export default function RosterPage({
    students,
    filteredStudents,
    birthYearStats,
    selectedYearFilter,
    setSelectedYearFilter,
    downloadTemplate,
    handleCSVImportStudents,
    setViewingStudent,
    handleManualAward,
    handleUpdateSquashClass,
    handleSetupStudentAuth,
    setEditingStudent,
    deleteItem,
    setShowAddPlayerModal
}) {
    return (
        <div className="space-y-10 animate-in slide-in-from-right-10 duration-700 font-bold">
            
            {/* 頂部總人數與年份統計 */}
            <div className="flex overflow-x-auto gap-4 pb-4">
                <div className="bg-slate-800 text-white px-5 py-3 rounded-2xl whitespace-nowrap shadow-md flex-shrink-0">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 block">總人數</span>
                    <span className="text-xl font-black">{students.length}</span>
                </div>
                {Object.entries(birthYearStats).sort().map(([year, count]) => (
                    <div key={year} className="bg-white px-5 py-3 rounded-2xl whitespace-nowrap shadow-sm border border-slate-100 min-w-[100px] flex-shrink-0">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 block">{year} 年</span>
                        <span className="text-xl font-black text-slate-800">{count} 人</span>
                    </div>
                ))}
            </div>

            {/* 控制面板：過濾器與匯入/匯出按鈕 */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 opacity-5 rotate-12"><Users size={150}/></div>
                <div className="relative z-10">
                    <h3 className="text-3xl font-black">隊員檔案管理</h3>
                    <p className="text-slate-400 text-sm mt-1">在此批量匯入名單或個別編輯隊員屬性</p>
                </div>
                <div className="flex gap-4 relative z-10 flex-wrap justify-center">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <select 
                            value={selectedYearFilter} 
                            onChange={(e) => setSelectedYearFilter(e.target.value)} 
                            className="pl-10 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 outline-none shadow-sm"
                        >
                            <option value="ALL">全部年份</option>
                            {Object.keys(birthYearStats).sort().map(year => (
                                <option key={year} value={year}>{year} 年出生 ({birthYearStats[year]}人)</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                    </div>
                    <button onClick={() => downloadTemplate('students')} className="p-5 bg-slate-50 text-slate-400 border border-slate-100 rounded-[2rem] hover:text-blue-600 transition-all" title="下載名單範本">
                        <Download size={24}/>
                    </button>
                    <label className="bg-blue-600 text-white px-10 py-5 rounded-[2.2rem] cursor-pointer hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-[0.98]">
                        <Upload size={20}/> 批量匯入 CSV 名單
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportStudents}/>
                    </label>
                </div>
            </div>

            {/* 學員網格列表 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredStudents.sort((a,b) => a.class.localeCompare(b.class)).map(s => (
                    <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col items-center group relative cursor-pointer" onClick={() => setViewingStudent(s)}>
                        {/* 章別標籤 */}
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>
                            {s.badge}
                        </div>
                        {/* 姓名頭像 */}
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl mb-4 text-slate-300 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all font-black uppercase">
                            {s.name[0]}
                        </div>
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{s.class} ({s.classNo})</p>

                        {/* 顯示主打勳章 */}
                        <div className="flex items-center justify-center gap-2 mt-3 h-6">
                            {s.featuredBadges?.map(badgeId => {
                                const badge = ACHIEVEMENT_DATA[badgeId];
                                if (!badge) return null;
                                return (
                                    <div key={badgeId} title={badge.baseName} className="w-6 h-6 flex items-center justify-center text-yellow-500">
                                        {React.cloneElement(badge.icon, { size: 20 })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 生日與班別 */}
                        {s.dob ? (
                            <div className="mt-2 text-[10px] bg-slate-50 text-slate-500 px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-slate-100"><Cake size={10}/> {s.dob}</div>
                        ) : (
                            <div className="mt-2 text-[10px] text-slate-300 font-bold">未設定生日</div>
                        )}
                        <div className="mt-1 text-[10px] text-blue-500 font-bold">{s.squashClass}</div>
                        
                        {/* 操作按鈕 */}
                        <div className="mt-6 pt-6 border-t border-slate-50 w-full flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleManualAward(s)} className="text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 p-2 rounded-xl transition-all" title="授予徽章"><Award size={16}/></button>
                            <button onClick={() => handleUpdateSquashClass(s)} className="text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-xl transition-all" title="設定報名班別"><Layers size={16}/></button>
                            <button onClick={() => handleSetupStudentAuth(s)} className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 p-2 rounded-xl transition-all" title="設定登入資料"><Key size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingStudent(s); }} className="p-2 bg-white/80 rounded-full shadow-md backdrop-blur-sm hover:bg-amber-400 hover:text-white" title="編輯此隊員"><UserCog size={14} /></button> 
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('確定要刪除此隊員嗎?')) deleteItem('students', s.id); }} className="p-2 bg-white/80 rounded-full shadow-md backdrop-blur-sm hover:bg-red-500 hover:text-white" title="刪除此隊員"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
                
                {/* 新增單一隊員按鈕 */}
                <button onClick={() => setShowAddPlayerModal(true)} className="p-8 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-600 transition-all group">
                    <Plus size={32} className="mb-2 group-hover:scale-125 transition-all"/>
                    <span className="text-sm font-black uppercase tracking-widest">新增單一隊員</span>
                </button>
            </div>
        </div>
    );
}

