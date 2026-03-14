// src/pages/AwardsPage.jsx (Version 3.5 - UI Standardized + Timeline + Bug Fixes)

import React, { useMemo } from 'react';
import { Award, Columns, History, PlusCircle, Trophy, UserCog, Trash2, Calendar, User } from 'lucide-react';
import { ACHIEVEMENT_DATA } from '../constants/data';

// 👇 引入共用 UI 元件
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function AwardsPage({
    role,
    awards,
    students,
    awardsViewMode,
    setAwardsViewMode,
    setShowAddAwardModal,
    deleteItem
}) {
    // 輔助函式：根據 studentId 找出學生名稱
    const getStudentName = (studentId) => {
        if (!students || !studentId) return '未知隊員';
        const student = students.find(s => s.id === studentId);
        return student ? `${student.name} (${student.class})` : '未知隊員';
    };

    // 融合你原本的 AwardCard 邏輯，並加上 Bug 修復
    const AwardCard = ({ award, style }) => {
        
        // 判斷是否為系統徽章
        const isSystemBadge = award.badgeId && Object.keys(ACHIEVEMENT_DATA).includes(award.badgeId);
        const badgeData = isSystemBadge ? ACHIEVEMENT_DATA[award.badgeId] : null;
        
        const displayTitle = isSystemBadge && badgeData ? badgeData.baseName : award.name;
        // 你的舊版邏輯是用 rank，但新版我們可能沒有 rank，所以我們用 title 來判斷顏色
        const rankOrTitle = award.rank || award.name || ''; 

        const rankStyles = useMemo(() => {
            if (rankOrTitle.includes('冠軍') || rankOrTitle.includes('金')) {
                return {
                    bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400',
                    text: 'text-yellow-900',
                    shadow: 'shadow-yellow-400/30 hover:shadow-yellow-300/50',
                    border: 'border-yellow-500/50',
                    ribbon: 'bg-yellow-500',
                    rankText: 'text-yellow-800'
                };
            }
            if (rankOrTitle.includes('亞軍') || rankOrTitle.includes('銀')) {
                return {
                    bg: 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-300',
                    text: 'text-slate-800',
                    shadow: 'shadow-slate-400/30 hover:shadow-slate-300/50',
                    border: 'border-gray-400/50',
                    ribbon: 'bg-slate-500',
                    rankText: 'text-slate-100'
                };
            }
            if (rankOrTitle.includes('季軍') || rankOrTitle.includes('殿軍') || rankOrTitle.includes('銅')) {
                return {
                    bg: 'bg-gradient-to-br from-orange-300 via-amber-500 to-orange-400',
                    text: 'text-orange-900',
                    shadow: 'shadow-amber-600/30 hover:shadow-amber-500/50',
                    border: 'border-orange-500/50',
                    ribbon: 'bg-orange-600',
                    rankText: 'text-orange-100'
                };
            }
            return {
                bg: 'bg-gradient-to-br from-blue-300 via-sky-400 to-blue-400',
                text: 'text-sky-900',
                shadow: 'shadow-sky-400/30 hover:shadow-sky-300/50',
                border: 'border-sky-500/50',
                ribbon: 'bg-sky-500',
                rankText: 'text-sky-100'
            };
        }, [rankOrTitle]);

        const studentNameDisplay = getStudentName(award.studentId);
        let typeLabel = '一般獎項';
        if (award.type === 'internal') typeLabel = '校內賽';
        if (award.type === 'external') typeLabel = '校外賽';
        if (isSystemBadge) typeLabel = '系統成就';

        return (
            <div style={style} className={`group relative flex flex-col ${rankStyles.bg} rounded-[2.5rem] p-2 shadow-lg ${rankStyles.shadow} transition-all duration-300 ease-in-out hover:scale-105`}>
                
                {/* 左上角標籤 */}
                <div className="absolute top-0 left-10 w-12 h-16 overflow-hidden z-20">
                    <div className={`absolute -top-2 left-0 w-full h-full rotate-45 transform-gpu ${rankStyles.ribbon} shadow-md`}></div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] h-full flex flex-col p-6">
                    <div className="w-full h-48 rounded-2xl bg-white/50 overflow-hidden relative border border-white/50 shadow-inner flex items-center justify-center">
                        {award.photoUrl ? (
                            <img src={award.photoUrl} alt={displayTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center opacity-40 ${rankStyles.text} group-hover:scale-110 transition-transform duration-300`}>
                                {/* 👇 修復圖示顯示 */}
                                {isSystemBadge && badgeData ? React.cloneElement(badgeData.icon, { size: 80 }) : <Trophy size={80}/>}
                            </div>
                        )}
                        <div className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-xs font-black shadow-lg ${rankStyles.ribbon} ${rankStyles.rankText}`}>
                            {typeLabel}
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col pt-5 px-1">
                        <p className={`text-xs font-bold flex items-center gap-1 ${rankStyles.text} opacity-70`}><Calendar size={12}/> {award.date}</p>
                        <h4 className={`text-xl font-black leading-tight mt-1 mb-4 ${rankStyles.text} line-clamp-2`}>{displayTitle}</h4>
                        
                        <div className="mt-auto flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-white/70 ${rankStyles.text} shadow-sm border-2 ${rankStyles.border}`}>
                                {studentNameDisplay[0]}
                            </div>
                            <div>
                                <p className={`font-bold text-sm ${rankStyles.text}`}>{studentNameDisplay}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {role === 'admin' && (
                    <button 
                        onClick={() => deleteItem(isSystemBadge ? 'achievements' : 'awards', award.id)}
                        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur text-white/70 hover:text-red-500 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg"
                        title="刪除"
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-bold">
            
            {/* 統一的頁面大標題 */}
            <PageHeader 
                title="獎項成就" 
                subtitle="紀錄校隊輝煌戰績與個人榮耀" 
                icon={Award} 
            />

            {/* 控制面板 */}
            <Card className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 md:p-8">
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setAwardsViewMode('grid')} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${awardsViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        <Columns size={18} /> 榮譽牆
                    </button>
                    <button 
                        onClick={() => setAwardsViewMode('timeline')} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${awardsViewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'}`}
                    >
                        <History size={18} /> 時間軸
                    </button>
                </div>
                
                {role === 'admin' && (
                    <PrimaryButton icon={PlusCircle} onClick={() => setShowAddAwardModal(true)}>
                        新增獎項
                    </PrimaryButton>
                )}
            </Card>
            
            {/* 內容顯示區 */}
            {awards.length === 0 ? (
                 <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-6">
                        <Trophy size={48} />
                    </div>
                    <p className="text-xl font-black text-slate-500">目前尚無獎項紀錄</p>
                    {role === 'admin' && <p className="text-sm text-slate-400 mt-2">點擊上方的「新增獎項」按鈕開始記錄</p>}
                </Card>
            ) : (
                <>
                    {awardsViewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {awards.map((award) => (
                                <AwardCard key={award.id} award={award} />
                            ))}
                        </div>
                    )}
                    
                    {awardsViewMode === 'timeline' && (
                        <div className="relative pl-4 md:pl-12 pr-4 mt-12">
                            {/* 時間軸的主線 */}
                            <div className="absolute left-[2.25rem] md:left-[4.25rem] top-0 h-full w-1.5 bg-slate-200 rounded-full"></div>
                            
                            {awards.map((award, index) => {
                                const year = (award.date || '').split('-')[0] || '未知';
                                const prevYear = index > 0 ? (awards[index-1].date || '').split('-')[0] : null;
                                const showYear = year !== prevYear;
                                
                                return (
                                    <div key={award.id} className="relative mb-16 animate-in fade-in slide-in-from-left-8 duration-500">
                                        {/* 年份圓圈 */}
                                        {showYear && (
                                            <div className="absolute -left-6 md:-left-2 top-0 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-slate-800 text-white font-black text-xl md:text-2xl rounded-full border-8 border-[#F8FAFC] z-10 shadow-lg">
                                                {year}
                                            </div>
                                        )}
                                        {/* 卡片內容 */}
                                        <div className={`ml-16 md:ml-32 pl-4 md:pl-10 pt-2 ${showYear ? 'mt-8' : ''}`}>
                                            <div className="max-w-md">
                                                <AwardCard award={award} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
