// src/pages/AwardsPage.jsx (Version 3.3 - UI Standardized)

import React from 'react';
import { Award, PlusCircle, LayoutGrid, List, Trash2, Calendar, User } from 'lucide-react';
import { ACHIEVEMENT_DATA } from '../constants/data';

// 👇 引入共用 UI 元件
import { PageHeader, Card, PrimaryButton, SecondaryButton, DangerButton } from '../components/ui.jsx';

export default function AwardsPage({
    role,
    awards,
    students,
    awardsViewMode,
    setAwardsViewMode,
    setShowAddAwardModal,
    deleteItem
}) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold">
            
            {/* 統一的頁面大標題 */}
            <PageHeader 
                title="獎項與成就" 
                subtitle="記錄隊員們的榮耀時刻與晉級歷程" 
                icon={Award} 
            />

            {/* 控制面板 */}
            <Card className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 md:p-8">
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setAwardsViewMode('grid')} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${awardsViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        <LayoutGrid size={18} /> 網格
                    </button>
                    <button 
                        onClick={() => setAwardsViewMode('list')} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${awardsViewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        <List size={18} /> 列表
                    </button>
                </div>
                
                {role === 'admin' && (
                    <PrimaryButton icon={PlusCircle} onClick={() => setShowAddAwardModal(true)}>
                        新增獎項
                    </PrimaryButton>
                )}
            </Card>

            {/* 內容區塊 */}
            {awards.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-6">
                        <Award size={48} />
                    </div>
                    <p className="text-xl font-black text-slate-500">目前尚無獎項紀錄</p>
                    {role === 'admin' && <p className="text-sm text-slate-400 mt-2">點擊上方的「新增獎項」按鈕開始記錄</p>}
                </Card>
            ) : awardsViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {awards.map(award => {
                        const student = students.find(s => s.id === award.studentId);
                        const isSystemBadge = Object.keys(ACHIEVEMENT_DATA).includes(award.name);
                        const badgeData = isSystemBadge ? ACHIEVEMENT_DATA[award.name] : null;

                        return (
                            <div key={award.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group relative">
                                
                                {/* 圖片區塊 */}
                                <div className="h-48 bg-slate-50 relative flex items-center justify-center border-b border-slate-100">
                                    {award.photoUrl ? (
                                        <img src={award.photoUrl} alt="Award" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-slate-300 flex flex-col items-center group-hover:scale-110 transition-transform duration-300">
                                            {isSystemBadge && badgeData ? badgeData.icon : <Award size={64} />}
                                        </div>
                                    )}
                                    {/* 右上角標籤 */}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-slate-700 shadow-sm border border-slate-200 uppercase tracking-widest">
                                        {award.type === 'internal' ? '校內獎項' : award.type === 'external' ? '校外賽事' : '系統徽章'}
                                    </div>
                                </div>
                                
                                {/* 文字區塊 */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-slate-800 line-clamp-2 leading-tight">{isSystemBadge && badgeData ? badgeData.baseName : award.name}</h3>
                                    
                                    <div className="mt-4 space-y-2 flex-1">
                                        <p className="text-sm font-bold text-blue-600 flex items-center gap-2 bg-blue-50 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
                                            <User size={14} /> {student ? `${student.name} (${student.class})` : '未知隊員'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2 pl-1">
                                            <Calendar size={14} className="text-slate-400" /> {award.date}
                                        </p>
                                    </div>
                                    
                                    {role === 'admin' && (
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                            <button onClick={() => deleteItem('awards', award.id)} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2.5 rounded-xl transition-colors" title="刪除獎項">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <Card noPadding>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400 font-black">日期</th>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400 font-black">獎項名稱</th>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400 font-black">獲獎人</th>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400 font-black">類型</th>
                                    {role === 'admin' && <th className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400 font-black text-right">操作</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {awards.map(award => {
                                    const student = students.find(s => s.id === award.studentId);
                                    const isSystemBadge = Object.keys(ACHIEVEMENT_DATA).includes(award.name);
                                    const badgeData = isSystemBadge ? ACHIEVEMENT_DATA[award.name] : null;
                                    
                                    return (
                                        <tr key={award.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">{award.date}</td>
                                            <td className="px-6 py-4 font-black text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    {award.photoUrl ? (
                                                        <img src={award.photoUrl} alt="thumbnail" className="w-10 h-10 rounded-lg object-cover shadow-sm border border-slate-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                                                            {isSystemBadge && badgeData ? React.cloneElement(badgeData.icon, { size: 20 }) : <Award size={20} />}
                                                        </div>
                                                    )}
                                                    {isSystemBadge && badgeData ? badgeData.baseName : award.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                                                    {student?.name || '未知'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                                                 <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                                                    {award.type === 'internal' ? '校內' : award.type === 'external' ? '校外' : '系統'}
                                                 </span>
                                            </td>
                                            {role === 'admin' && (
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => deleteItem('awards', award.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
