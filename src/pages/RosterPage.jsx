// src/pages/RosterPage.jsx (Version 3.3 - Speed Assignment UI & Safe Sort)

import React, { useState } from 'react';
import { 
  Users, Filter, ChevronDown, Upload, 
  Cake, Award, Layers, Key, UserCog, Trash2, Plus, 
  ArrowUpRight, AlertTriangle, CheckCircle2, Zap, ArrowRight, Save
} from 'lucide-react';
import { BADGE_DATA, ACHIEVEMENT_DATA } from '../constants/data';
import TemplateDownloader from '../components/TemplateDownloader';
import { doc, writeBatch, updateDoc, serverTimestamp } from 'firebase/firestore'; 

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
    db, 
    appId 
}) {
    const [showWizard, setShowWizard] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    
    // 3.3 新增：極速派班面板的狀態
    const [showSpeedAssign, setShowSpeedAssign] = useState(false);
    const [assignIndex, setAssignIndex] = useState(0);
    const [selectedLetter, setSelectedLetter] = useState('A');
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isSavingAssign, setIsSavingAssign] = useState(false);

    const p6Students = students.filter(s => s.class && s.class.match(/6/));
    const promotableStudents = students.filter(s => s.class && s.class.match(/[1-5]/));
    
    // 3.3 新增：篩選出所有「待編班」的學生
    const pendingStudents = students.filter(s => s.enrollmentStatus === '待編班');

    const executePromotion = async () => {
        if (!db || !appId) return alert("系統錯誤：找不到資料庫連線");
        if(p6Students.length === 0 && promotableStudents.length === 0) return alert("目前沒有找到符合升級條件的學生！");

        setIsPromoting(true);
        try {
            const batch = writeBatch(db);
            let updateCount = 0;

            students.forEach(s => {
                if (!s.class) return;
                const gradeMatch = s.class.match(/[1-6]/); 
                
                if (gradeMatch) {
                    const grade = parseInt(gradeMatch[0]);
                    const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id);

                    if (grade === 6) {
                        batch.update(studentRef, { class: '畢業/校友', status: 'archived', updatedAt: serverTimestamp() });
                        updateCount++;
                    } else if (grade >= 1 && grade <= 5) {
                        batch.update(studentRef, { class: `${grade + 1}`, classNo: '', enrollmentStatus: '待編班', updatedAt: serverTimestamp() });
                        updateCount++;
                    }
                }
            });
            await batch.commit(); 
            alert(`✅ 新學年升級成功！共處理了 ${updateCount} 名隊員檔案。`);
            setShowWizard(false);
        } catch (error) {
            console.error(error); alert("❌ 升級過程中發生錯誤。");
        }
        setIsPromoting(false);
    };

    // 3.3 新增：執行單一學生的快速派班
    const handleSaveAssignment = async (student) => {
        if (!selectedNumber) return alert("請輸入班號！");
        setIsSavingAssign(true);
        try {
            const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
            await updateDoc(studentRef, {
                class: `${student.class}${selectedLetter}`, // 組合年級與字母，例如 "4" + "A" = "4A"
                classNo: selectedNumber.toString(),
                enrollmentStatus: 'active', // 拔除待編班標籤，回到活躍狀態
                updatedAt: serverTimestamp()
            });
            
            // 清空輸入並進入下一位
            setSelectedNumber('');
            setSelectedLetter('A');
            // 因為 pendingStudents 會即時更新，所以我們維持 Index 0 就可以一直吃下一筆資料
        } catch (error) {
            console.error(error); alert("儲存失敗！");
        }
        setIsSavingAssign(false);
    };

    // 3.3 修正：確保排序時如果沒有 class 也不會崩潰
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
                {pendingStudents.length > 0 && (
                    <div className="bg-red-500 text-white px-6 py-4 rounded-3xl whitespace-nowrap shadow-md flex-shrink-0 flex flex-col justify-center animate-pulse">
                        <span className="text-[10px] uppercase tracking-widest text-red-200 block mb-1">待編班人數</span>
                        <span className="text-3xl font-black">{pendingStudents.length}</span>
                    </div>
                )}
                {Object.entries(birthYearStats).sort().map(([year, count]) => (
                    <div key={year} className="bg-white px-6 py-4 rounded-3xl whitespace-nowrap shadow-sm border border-slate-100 min-w-[100px] flex-shrink-0 flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">{year} 年</span>
                        <span className="text-xl font-black text-slate-800">{count} <span className="text-sm font-bold text-slate-400">人</span></span>
                    </div>
                ))}
            </div>

            {/* 控制面板 */}
            <Card className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-visible">
                 <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
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
                    {/* 3.3 新增：如果有人待編班，顯示極速派班按鈕 */}
                    {pendingStudents.length > 0 ? (
                        <button onClick={() => setShowSpeedAssign(true)} className="bg-red-500 text-white px-6 py-4 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all font-black animate-bounce">
                            <Zap size={18}/> 開啟極速派班面板 ({pendingStudents.length})
                        </button>
                    ) : (
                        <button onClick={() => setShowWizard(true)} className="bg-amber-500 text-white px-6 py-4 rounded-2xl cursor-pointer hover:bg-amber-600 shadow-lg flex items-center justify-center gap-2 transition-all font-bold">
                            <ArrowUpRight size={18}/> 年度批次升級
                        </button>
                    )}
                    <TemplateDownloader type="students" />
                    <label className="bg-slate-800 text-white px-8 py-4 rounded-2xl cursor-pointer hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2 transition-all font-bold">
                        <Upload size={18}/> 批量匯入名單
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

                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl mb-4 transition-all duration-300 font-black uppercase shadow-inner border-2 ${s.enrollmentStatus === '待編班' ? 'bg-red-50 text-red-400 border-red-100' : 'bg-slate-50 text-slate-300 border-slate-100 group-hover:bg-blue-600 group-hover:text-white'}`}>
                            {s.name[0]}
                        </div>
                        
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        
                        <p className="text-xs mt-1 font-bold uppercase tracking-widest">
                            {s.enrollmentStatus === '待編班' ? (
                                <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">{s.class} 年級 (待派班)</span>
                            ) : (
                                <span className="text-slate-400">{s.class} ({s.classNo || '-'})</span>
                            )}
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
            </div>

            {/* 3.3 新增：極速派班面板 (Speed Assignment Modal) */}
            {showSpeedAssign && (
                <div className="fixed inset-0 z-[600] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        {pendingStudents.length > 0 ? (
                            <>
                                <div className="bg-red-500 p-6 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-3">
                                        <Zap size={24} className="animate-pulse" />
                                        <h3 className="text-xl font-black">極速派班面板</h3>
                                    </div>
                                    <div className="bg-red-600 px-4 py-1.5 rounded-full text-sm font-black shadow-inner">
                                        剩餘 {pendingStudents.length} 人
                                    </div>
                                </div>
                                
                                <div className="p-10 flex flex-col items-center text-center">
                                    <div className="w-24 h-24 bg-red-100 text-red-500 rounded-[2rem] flex items-center justify-center text-4xl font-black mb-6 shadow-inner">
                                        {pendingStudents[0].name[0]}
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-800 mb-2">{pendingStudents[0].name}</h2>
                                    <p className="text-lg text-slate-500 font-bold mb-8">
                                        即將升上 <span className="text-blue-600 font-black text-2xl mx-2">{pendingStudents[0].class}</span> 年級
                                    </p>

                                    <div className="w-full max-w-sm space-y-6">
                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">1. 選擇班別字母</label>
                                            <div className="flex justify-center gap-2">
                                                {['A', 'B', 'C', 'D', 'E'].map(letter => (
                                                    <button 
                                                        key={letter}
                                                        onClick={() => setSelectedLetter(letter)}
                                                        className={`w-14 h-14 rounded-2xl text-xl font-black transition-all ${selectedLetter === letter ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {letter}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">2. 輸入班號</label>
                                            <input 
                                                type="number" 
                                                value={selectedNumber}
                                                onChange={e => setSelectedNumber(e.target.value)}
                                                className="w-full text-center text-3xl font-black p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors"
                                                placeholder="e.g. 15"
                                                autoFocus
                                            />
                                        </div>

                                        <button 
                                            onClick={() => handleSaveAssignment(pendingStudents[0])}
                                            disabled={isSavingAssign || !selectedNumber}
                                            className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-xl hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            {isSavingAssign ? '儲存中...' : <>儲存並切換下一位 <ArrowRight size={24}/></>}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-16 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={48} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 mb-4">全部編班完成！</h2>
                                <p className="text-slate-500 font-bold mb-8">所有學生都已經成功分配到新的班級了。</p>
                                <button onClick={() => setShowSpeedAssign(false)} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-700 transition-all">
                                    返回檔案庫
                                </button>
                            </div>
                        )}
                        
                        {pendingStudents.length > 0 && (
                            <button onClick={() => setShowSpeedAssign(false)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-red-600 p-2 rounded-full">
                                關閉
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            {/* ... (其餘保留，包含 setShowWizard 的 Modal) */}
        </div>
    );
}
