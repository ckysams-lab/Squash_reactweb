// src/pages/RosterPage.jsx (Version 3.4 - Back to Basics & CSV Import Focus)

import React from 'react';
import { 
  Users, Filter, ChevronDown, Upload, 
  Cake, Award, Layers, UserCog, Trash2, Plus, 
  FileSpreadsheet, Download
} from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';
import TemplateDownloader from '../components/TemplateDownloader';

// 👇 引入我們的共用 UI 元件
import { PageHeader, Card } from '../components/ui.jsx';

export default function RosterPage({
    students,
    filteredStudents,
    birthYearStats,
    selectedYearFilter,
    setSelectedYearFilter,
    handleCSVImportStudents,
    setViewingStudent,
    handleManualAward,
    handleUpdateSquashClass,
    setEditingStudent,
    deleteItem,
    setShowAddPlayerModal
}) {
    
    // 3.4 更新：移除所有複雜的派班狀態，回歸單純的名單渲染
    const safeSortedStudents = [...filteredStudents].sort((a, b) => (a.class || '').localeCompare(b.class || ''));

    return (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 font-bold">
            <PageHeader title="隊員檔案庫" subtitle="管理所有學員資料與章別" icon={Users} />

            {/* 頂部統計區 */}
            <div className="flex overflow-x-auto gap-4 pb-2">
                <div className="bg-blue-600 text-white px-6 py-4 rounded-3xl whitespace-nowrap shadow-md flex-shrink-0 flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-widest text-blue-200 block mb-1">總人數</span>
                    <span className="text-3xl font-black">{students.length}</span>
                </div>
                {Object.entries(birthYearStats).sort().map(([year, count]) => (
                    <div key={year} className="bg-white px-6 py-4 rounded-3xl whitespace-nowrap shadow-sm border border-slate-100 min-w-[100px] flex-shrink-0 flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">{year} 年</span>
                        <span className="text-xl font-black text-slate-800">{count} <span className="text-sm font-bold text-slate-400">人</span></span>
                    </div>
                ))}
            </div>

            {/* 控制面板：專注於過濾與 CSV 匯入 */}
            <Card className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-visible">
                 <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                    {/* 年份過濾器 */}
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <select 
                            value={selectedYearFilter} 
                            onChange={(e) => setSelectedYearFilter(e.target.value)} 
                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="ALL">全部出生年份</option>
                            {Object.keys(birthYearStats).sort().map(year => (
                                <option key={year} value={year}>{year} 年出生 ({birthYearStats[year]}人)</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                    </div>
                </div>

                {/* 3.4 核心：新學年 CSV 批次匯入區 */}
                <div className="flex w-full lg:w-auto flex-col sm:flex-row items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-200">
                    <div className="hidden sm:flex items-center gap-2 px-4 text-slate-400">
                        <FileSpreadsheet size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Excel 更新區</span>
                    </div>
                    
                    <TemplateDownloader type="students" />

                    <label className="w-full sm:w-auto bg-slate-800 text-white px-8 py-4 rounded-2xl cursor-pointer hover:bg-slate-700 shadow-md flex items-center justify-center gap-2 transition-all font-black active:scale-95">
                        <Upload size={18}/> 匯入新學年名單 (CSV)
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportStudents}/>
                    </label>
                </div>
            </Card>

            {/* 學員網格列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {safeSortedStudents.map(s => (
                    <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group relative cursor-pointer" onClick={() => setViewingStudent(s)}>
                        
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>
                            {s.badge}
                        </div>

                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl mb-4 transition-all duration-300 font-black uppercase shadow-inner border-2 bg-slate-50 text-slate-300 border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600`}>
                            {s.name[0]}
                        </div>
                        
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        
                        <p className="text-xs mt-1 font-bold uppercase tracking-widest text-slate-400">
                            {s.class} ({s.classNo || '-'})
                        </p>

                        <div className="flex items-center justify-center gap-2 mt-3 h-6">
                            {s.featuredBadges?.map(badgeId => {
                                const badge = ACHIEVEMENT_DATA[badgeId];
                                if (!badge) return null;
                                return (
                                    <div key={badgeId} title={badge.baseName} className="w-6 h-6 flex items-center justify-center text-yellow-500 drop-shadow-sm">
                                        {React.cloneElement(badge.icon, { size: 20 })}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2 w-full">
                             {s.dob ? (
                                <div className="text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 border border-slate-100"><Cake size={12}/> {s.dob}</div>
                            ) : (
                                <div className="text-[10px] bg-slate-50 text-slate-300 px-3 py-1.5 rounded-full font-bold border border-slate-100">未設定生日</div>
                            )}
                            {s.squashClass && (
                                <div className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold flex items-center border border-blue-100">
                                    <Layers size={12} className="mr-1" /> {s.squashClass}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 pt-5 border-t border-slate-100 w-full flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleManualAward(s)} className="text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 p-2.5 rounded-xl transition-all"><Award size={18}/></button>
                            <button onClick={() => handleUpdateSquashClass(s)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl transition-all"><Layers size={18}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingStudent(s); }} className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 p-2.5 rounded-xl transition-all"><UserCog size={18} /></button> 
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('確定要刪除嗎?')) deleteItem('students', s.id); }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
                
                {/* 新增單一隊員按鈕 */}
                <button 
                    onClick={() => setShowAddPlayerModal(true)} 
                    className="p-8 bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group min-h-[300px]"
                >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                         <Plus size={32} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">新增隊員</span>
                    <span className="text-xs font-bold text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">手動建立新檔案</span>
                </button>
            </div>
        </div>
    );
}
