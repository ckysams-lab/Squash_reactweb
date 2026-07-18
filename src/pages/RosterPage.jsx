// src/pages/RosterPage.jsx (Version 3.2 - Bulk Promotion Wizard)

import React, { useState } from 'react';
import { 
  Users, Filter, ChevronDown, Upload, 
  Cake, Award, Layers, Key, UserCog, Trash2, Plus, 
  ArrowUpRight, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';
import TemplateDownloader from '../components/TemplateDownloader';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore'; // 3.2 新增：引入 Firestore 批次更新功能

// 👇 引入我們的共用 UI 元件
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

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
    handleSetupStudentAuth,
    setEditingStudent,
    deleteItem,
    setShowAddPlayerModal,
    db, // 3.2 新增：需要資料庫實例來執行批次更新
    appId // 3.2 新增：需要 appId 來定位資料庫路徑
}) {
    // 3.2 新增：升級精靈的狀態管理
    const [showWizard, setShowWizard] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);

    // 3.2 新增：精靈預覽計算 (透過正規表達式找出 6 年級與 1-5 年級)
    const p6Students = students.filter(s => s.class && s.class.match(/6/));
    const promotableStudents = students.filter(s => s.class && s.class.match(/[1-5]/));

    // 3.2 新增：執行批次升級核心邏輯
    const executePromotion = async () => {
        if (!db || !appId) {
            alert("⚠️ 系統錯誤：找不到資料庫連線 (請確認 App.jsx 已將 db 與 appId 傳入 RosterPage)");
            return;
        }

        if(p6Students.length === 0 && promotableStudents.length === 0) {
            alert("目前沒有找到任何符合升級條件的學生！");
            return;
        }

        setIsPromoting(true);
        try {
            const batch = writeBatch(db);
            let updateCount = 0;

            students.forEach(s => {
                if (!s.class) return;
                const gradeMatch = s.class.match(/[1-6]/); // 抓出字串中的年級數字
                
                if (gradeMatch) {
                    const grade = parseInt(gradeMatch[0]);
                    const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id);

                    if (grade === 6) {
                        // 6年級 -> 畢業
                        batch.update(studentRef, {
                            class: '畢業/校友',
                            status: 'archived',
                            updatedAt: serverTimestamp()
                        });
                        updateCount++;
                    } else if (grade >= 1 && grade <= 5) {
                        // 1到5年級 -> 升級並待編班
                        batch.update(studentRef, {
                            class: `${grade + 1}`, // 只保留新的年級數字
                            classNo: '', // 清空舊的班號
                            enrollmentStatus: '待編班', // 加上待編班標籤
                            updatedAt: serverTimestamp()
                        });
                        updateCount++;
                    }
                }
            });

            await batch.commit(); // 一次性提交所有更新
            alert(`✅ 新學年升級成功！共自動處理了 ${updateCount} 名隊員檔案。`);
            setShowWizard(false);
        } catch (error) {
            console.error("升級失敗:", error);
            alert("❌ 升級過程中發生錯誤，請稍後再試。");
        }
        setIsPromoting(false);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 font-bold">
            
            {/* 統一的頁面大標題 */}
            <PageHeader 
                title="隊員檔案庫" 
                subtitle="管理所有學員資料與章別" 
                icon={Users} 
            />

            {/* 頂部總人數與年份統計 */}
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

            {/* 控制面板：過濾器與匯入/匯出按鈕 */}
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

                <div className="flex w-full lg:w-auto flex-col sm:flex-row gap-4">
                    {/* 3.2 新增：年度批次升級按鈕 */}
                    <button onClick={() => setShowWizard(true)} className="bg-amber-500 text-white px-6 py-4 rounded-2xl cursor-pointer hover:bg-amber-600 shadow-lg flex items-center justify-center gap-2 transition-all font-bold active:scale-95">
                        <ArrowUpRight size={18}/> 年度批次升級
                    </button>

                    {/* 下載範本 */}
                    <TemplateDownloader type="students" />

                    {/* 匯入名單 */}
                    <label className="bg-slate-800 text-white px-8 py-4 rounded-2xl cursor-pointer hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2 transition-all font-bold active:scale-95">
                        <Upload size={18}/> 批量匯入名單
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportStudents}/>
                    </label>
                </div>
            </Card>

            {/* 學員網格列表 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.sort((a,b) => a.class.localeCompare(b.class)).map(s => (
                    <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col items-center group relative cursor-pointer hover:-translate-y-1" onClick={() => setViewingStudent(s)}>
                        
                        {/* 章別標籤 */}
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>
                            {s.badge}
                        </div>

                        {/* 姓名頭像 */}
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl mb-4 transition-all duration-300 font-black uppercase shadow-inner border-2 ${s.enrollmentStatus === '待編班' ? 'bg-red-50 text-red-400 border-red-100' : 'bg-slate-50 text-slate-300 border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'}`}>
                            {s.name[0]}
                        </div>
                        
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        
                        {/* 3.2 升級：智能顯示待編班狀態 */}
                        <p className="text-xs mt-1 font-bold uppercase tracking-widest">
                            {s.enrollmentStatus === '待編班' ? (
                                <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">{s.class} 年級 (待編班)</span>
                            ) : (
                                <span className="text-slate-400">{s.class} ({s.classNo || '-'})</span>
                            )}
                        </p>

                        {/* 顯示主打勳章 */}
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

                        {/* 生日與班別 */}
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
                        
                        {/* 操作按鈕 */}
                        <div className="mt-6 pt-5 border-t border-slate-100 w-full flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleManualAward(s)} className="text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 p-2.5 rounded-xl transition-all" title="授予徽章"><Award size={18}/></button>
                            <button onClick={() => handleUpdateSquashClass(s)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2.5 rounded-xl transition-all" title="設定報名班別"><Layers size={18}/></button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingStudent(s); }} className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 p-2.5 rounded-xl transition-all" title="編輯此隊員"><UserCog size={18} /></button> 
                            <button onClick={(e) => { e.stopPropagation(); if(window.confirm('確定要刪除此隊員嗎?')) deleteItem('students', s.id); }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all" title="刪除此隊員"><Trash2 size={18} /></button>
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

            {/* 3.2 新增：升級精靈確認彈窗 (Modal) */}
            {showWizard && (
                <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative flex flex-col">
                        <div className="flex items-center gap-3 text-amber-500 mb-6">
                            <AlertTriangle size={32} />
                            <h3 className="text-2xl font-black text-slate-800">執行新學年升級</h3>
                        </div>

                        <p className="text-slate-600 font-bold mb-6">
                            此操作將會自動更新所有活躍隊員的年級，請確認目前正處於「學年轉換期」。
                        </p>

                        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 font-black text-slate-700">
                                    <ArrowUpRight className="text-blue-500"/>
                                    1-5 年級升級
                                </div>
                                <span className="text-blue-600 font-black text-xl">{promotableStudents.length} 人</span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold pl-8">將年級 +1，清空班號並標記為「待編班」</p>

                            <div className="w-full h-px bg-slate-200 my-2"></div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 font-black text-slate-700">
                                    <CheckCircle2 className="text-emerald-500"/>
                                    6 年級畢業
                                </div>
                                <span className="text-emerald-600 font-black text-xl">{p6Students.length} 人</span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold pl-8">標記為「畢業/校友」並於活躍名單中隱藏</p>
                        </div>

                        <div className="flex gap-4 w-full">
                            <button onClick={() => setShowWizard(false)} className="flex-1 py-4 rounded-xl font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">取消</button>
                            <button onClick={executePromotion} disabled={isPromoting} className="flex-1 py-4 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all disabled:opacity-50">
                                {isPromoting ? '處理中...' : '確認執行升級'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
