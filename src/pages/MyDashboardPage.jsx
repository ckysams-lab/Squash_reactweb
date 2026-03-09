// src/pages/MyDashboardPage.jsx
import React from 'react';
import { X, Save, Loader2, Pencil } from 'lucide-react';
import PlayerDashboard from '../components/PlayerDashboard';
import { ACHIEVEMENT_DATA } from '../constants/data';

export default function MyDashboardPage({
    currentUserInfo,
    rankedStudents,
    playerDashboardData,
    setViewingBadge,
    tacticalShots,
    role,
    handleCheerMatch,
    showcaseEditorOpen,
    setShowcaseEditorOpen,
    selectedFeaturedBadges,
    setSelectedFeaturedBadges,
    handleSaveFeaturedBadges,
    isUpdating
}) {
    return (
        <>
            {/* 核心：學生的個人數據儀表板 */}
            <PlayerDashboard 
                student={rankedStudents.find(s => s.id === currentUserInfo?.id) || currentUserInfo} 
                data={playerDashboardData} 
                onClose={null} 
                onBadgeClick={setViewingBadge} 
                tacticalShots={tacticalShots}
                currentUserInfo={currentUserInfo}
                role={role}
                handleCheerMatch={handleCheerMatch}
            />

            {/* 勳章展示牆編輯器 Modal 視窗 */}
            {showcaseEditorOpen && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowcaseEditorOpen(false)}>
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl p-10 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowcaseEditorOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors">
                            <X size={24} />
                        </button>
                        <h3 className="text-3xl font-black text-slate-800 mb-2">編輯我的勳章展示牆</h3>
                        <p className="text-slate-400 mb-8">選擇最多 2 個你最自豪的勳章，它們將會顯示在你的名字旁邊！</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 左側：可選勳章 */}
                            <div className="bg-slate-50 p-6 rounded-3xl border">
                                <h4 className="font-bold text-slate-600 mb-4 text-center">我獲得的勳章</h4>
                                <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                    {playerDashboardData?.achievements.map(ach => {
                                        const badgeData = ACHIEVEMENT_DATA[ach.badgeId];
                                        if (!badgeData) return null;
                                        const levelData = badgeData.levels?.[ach.level] || badgeData.levels?.[1] || {};
                                        const isSelected = selectedFeaturedBadges.includes(ach.badgeId);
                                        const isDisabled = !isSelected && selectedFeaturedBadges.length >= 3;

                                        return (
                                            <button 
                                                key={ach.badgeId}
                                                disabled={isDisabled}
                                                onClick={() => {
                                                    setSelectedFeaturedBadges(prev => {
                                                        if (isSelected) {
                                                            return prev.filter(b => b !== ach.badgeId);
                                                        }
                                                        const cleanPrev = [...new Set(prev)];
                                                        if (cleanPrev.length < 3) {
                                                            return [...cleanPrev, ach.badgeId];
                                                        }
                                                        return cleanPrev;
                                                    });
                                                }}
                                                className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${
                                                    isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-transparent hover:bg-slate-200'
                                                } ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                title={levelData.name}
                                            >
                                                <div className="w-12 h-12 flex items-center justify-center">{badgeData.icon}</div>
                                                <p className="text-[9px] font-bold text-slate-500 mt-1 truncate w-full">{levelData.name}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 右側：已選勳章 */}
                            <div className="p-6">
                                <h4 className="font-bold text-slate-600 mb-4 text-center">我的展示牆 (預覽)</h4>
                                <div className="flex justify-center items-center gap-4 p-4 rounded-3xl bg-slate-100 min-h-[100px]">
                                    {selectedFeaturedBadges.map(badgeId => {
                                        const badgeData = ACHIEVEMENT_DATA[badgeId];
                                        if (!badgeData) return null;
                                        return (
                                            <div key={badgeId} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border animate-in zoom-in-50" title={badgeData.baseName}>
                                                {badgeData.icon}
                                            </div>
                                        );
                                    })}
                                    {selectedFeaturedBadges.length === 0 && <p className="text-xs text-slate-400">請從左側選擇勳章</p>}
                                </div>
                            </div>
                        </div>

                        {/* 儲存按鈕 */}
                        <div className="mt-8 flex justify-end">
                            <button onClick={handleSaveFeaturedBadges} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all font-black disabled:opacity-50">
                                {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* "編輯我的勳章展示牆" 按鈕 */}
            <div className="mt-10 text-center">
                <button 
                    onClick={() => {
                        const savedBadges = currentUserInfo?.featuredBadges || [];
                        const uniqueBadges = [...new Set(savedBadges)].slice(0, 3);
                        setSelectedFeaturedBadges(uniqueBadges);
                        setShowcaseEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500 hover:text-blue-600 transition-all font-bold"
                >
                    <Pencil size={16} /> 編輯我的勳章展示牆
                </button>
            </div>
        </>
    );
}
