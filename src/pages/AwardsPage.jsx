// src/pages/WallOfFamePage.jsx (Version 2.3 - Grouped Trophies)

import React, { useState, useMemo } from 'react';
import { X, Users, Award as AwardIcon, Star, Trophy, Medal } from 'lucide-react';
import { PageHeader } from '../components/ui.jsx';

// 判斷獎項顏色與圖示的輔助函式
const getTrophyStyle = (awardText) => {
    const text = awardText.toLowerCase();
    if (text.includes('冠軍') || text.includes('第一') || text.includes('金')) {
        return { colorClass: 'text-yellow-400', bgClass: 'bg-yellow-500/20', glowClass: 'drop-shadow-[0_5px_15px_rgba(250,204,21,0.5)] group-hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.8)]', Icon: Trophy };
    }
    if (text.includes('亞軍') || text.includes('第二') || text.includes('銀')) {
        return { colorClass: 'text-slate-300', bgClass: 'bg-slate-400/20', glowClass: 'drop-shadow-[0_5px_15px_rgba(203,213,225,0.4)] group-hover:drop-shadow-[0_8px_25px_rgba(203,213,225,0.6)]', Icon: Trophy };
    }
    if (text.includes('季軍') || text.includes('第三') || text.includes('銅')) {
        return { colorClass: 'text-orange-400', bgClass: 'bg-orange-500/20', glowClass: 'drop-shadow-[0_5px_15px_rgba(251,146,60,0.4)] group-hover:drop-shadow-[0_8px_25px_rgba(251,146,60,0.6)]', Icon: Trophy };
    }
    return { colorClass: 'text-blue-400', bgClass: 'bg-blue-500/20', glowClass: 'drop-shadow-[0_5px_15px_rgba(96,165,250,0.4)] group-hover:drop-shadow-[0_8px_25px_rgba(96,165,250,0.6)]', Icon: Medal };
};

// 升級版：支援顯示「一個賽事下的多個獎項」的資訊卡
const TrophyInfoModal = ({ group, onClose }) => {
    if (!group) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header 區塊 */}
                <div className="p-8 border-b text-center relative bg-slate-50 rounded-t-3xl">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 bg-white rounded-full shadow-sm transition-colors"><X size={20} /></button>
                    <p className="text-sm font-black text-slate-500 tracking-widest">{group.year}</p>
                    <h2 className="text-2xl font-black text-slate-800 mt-1">{group.tournamentName}</h2>
                </div>

                {/* 獎項列表區塊 (可捲動) */}
                <div className="p-8 overflow-y-auto space-y-6">
                    {group.awards.map((award, idx) => {
                        const style = getTrophyStyle(award.awardName);
                        const { Icon } = style;
                        
                        return (
                            <div key={idx} className="bg-white border-2 border-slate-100 p-6 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                                    <div className={`p-3 rounded-full ${style.bgClass}`}>
                                        <Icon size={32} className={style.colorClass} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-700">{award.awardName}</h3>
                                </div>
                                
                                {award.roster && award.roster.length > 0 ? (
                                    <div>
                                        <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-1"><Users size={12}/> 獲獎隊員</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {award.roster.map((player, index) => (
                                                <span key={index} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{player}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold">無隊員紀錄</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// 傳奇校友彈出視窗 (保持不變)
const AlumniModal = ({ alumni, onClose }) => { /* ... (為了節省空間，這裡假設你保持跟之前一樣的程式碼) ... */ 
     return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Users className="text-indigo-500"/> 傳奇校友錄</h2>
                    <p className="text-sm text-slate-500 mt-1">感謝這些為球隊奠定輝煌基礎的前輩們</p>
                </div>
                <div className="p-8 overflow-y-auto space-y-4">
                    {alumni.map(person => (
                        <div key={person.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                                <Star className="text-indigo-400" size={32} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800">{person.name}</p>
                                <p className="text-xs text-slate-400 font-bold mt-1">畢業年份: {person.graduationYear}</p>
                                <p className="mt-2 text-sm text-slate-600 font-semibold">"{person.achievement}"</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 text-center border-t">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">關閉</button>
                </div>
            </div>
        </div>
    );
};

export default function WallOfFamePage({ trophies, alumni }) {
    const [selectedGroup, setSelectedGroup] = useState(null); 
    const [showAlumni, setShowAlumni] = useState(false);

    // 👇 核心邏輯：將同一年份、同名稱的比賽合併為一個群組
    const groupedTrophies = useMemo(() => {
        if (!Array.isArray(trophies)) return [];
        const groups = {};
        trophies.forEach(trophy => {
            const key = `${trophy.year}-${trophy.tournamentName}`;
            if (!groups[key]) {
                groups[key] = {
                    id: key, // 用組合鍵作為群組的唯一 ID
                    year: trophy.year,
                    tournamentName: trophy.tournamentName,
                    awards: [] // 這裡會存放該賽事底下的所有獎項
                };
            }
            // 把獎項細節塞進這個群組裡
            groups[key].awards.push({
                awardName: trophy.award,
                roster: trophy.roster
            });
        });

        // 將物件轉回陣列，並確保按年份降冪排序 (最新的在最前面)
        return Object.values(groups).sort((a, b) => b.year - a.year);
    }, [trophies]);

    return (
        <div className="space-y-12 animate-in fade-in duration-500 font-bold">
            
            <PageHeader 
                title="榮譽殿堂" 
                subtitle="展示球隊歷屆參與之重大賽事與傳奇校友" 
                icon={Trophy} 
            />

            {/* 獎盃櫃 */}
            <div 
                className="p-8 rounded-[3rem] border-8 border-yellow-900/80 shadow-2xl relative overflow-hidden" 
                style={{ background: 'linear-gradient(to bottom, #4a2c0f, #2d1804)' }}
            >
                 {/* 木紋質感的反光裝飾 */}
                <div className="absolute inset-0 bg-white opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 20px)' }}></div>
                
                <h2 className="text-3xl font-black text-yellow-100 text-center mb-10 relative z-10 drop-shadow-md">團隊戰績榜</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                    
                    {groupedTrophies.map(group => {
                        
                        // 為該群組裡的所有獎項，算出對應的 Icon 和顏色
                        const awardStyles = group.awards.map(a => getTrophyStyle(a.awardName));
                        
                        // 根據獎項數量，決定排版方式 (最多顯示 3 個代表，以免太擠)
                        const displayStyles = awardStyles.slice(0, 3);
                        const extraCount = awardStyles.length > 3 ? awardStyles.length - 3 : 0;

                        return (
                            <div 
                                key={group.id} 
                                className="bg-black/30 rounded-3xl p-5 flex flex-col justify-between items-center cursor-pointer transition-all duration-300 hover:bg-black/50 hover:scale-105 group border border-white/5 shadow-lg"
                                onClick={() => setSelectedGroup(group)}
                            >
                                {/* 獎盃展示區 */}
                                <div className="flex-1 w-full flex items-end justify-center gap-1 mb-4 h-24 relative">
                                     {displayStyles.map((style, i) => {
                                         const { Icon } = style;
                                         // 讓中間的獎盃大一點，旁邊的稍微小一點並交疊
                                         const isCenter = displayStyles.length === 1 || (displayStyles.length === 3 && i === 1) || (displayStyles.length === 2 && i === 0);
                                         const size = isCenter ? 72 : 56;
                                         const zIndex = isCenter ? 10 : 5;
                                         const margin = displayStyles.length > 1 ? (isCenter ? 'mx-[-10px]' : '') : '';

                                         return (
                                            <div key={i} className={`relative z-${zIndex} ${margin}`}>
                                                <Icon 
                                                    size={size} 
                                                    className={`${style.colorClass} ${style.glowClass} transition-all duration-500 transform-gpu group-hover:-translate-y-2`}
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                         )
                                     })}
                                     {/* 顯示 "+X" 如果獎項超過 3 個 */}
                                     {extraCount > 0 && (
                                         <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#3b220a] z-20">
                                            +{extraCount}
                                         </div>
                                     )}
                                </div>

                                {/* 木質層板裝飾線 */}
                                <div className="h-2 w-[110%] bg-gradient-to-b from-[#8b5a2b] to-[#5c3a21] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] mb-4 -mx-4"></div>
                                
                                {/* 銘牌 */}
                                <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-yellow-950 px-4 py-2.5 rounded-lg text-center w-full border-b-2 border-yellow-700 shadow-inner">
                                    <p className="font-black text-xs mb-0.5 opacity-80">{group.year}</p>
                                    <p className="font-black text-sm truncate" title={group.tournamentName}>{group.tournamentName}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-center">
                <button onClick={() => setShowAlumni(true)} className="bg-white px-8 py-4 rounded-2xl shadow-md border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all font-black text-slate-700 flex items-center gap-3 mx-auto group">
                    <Users className="text-indigo-500 group-hover:scale-110 transition-transform"/>
                    查看傳奇校友錄
                </button>
            </div>

            {/* 彈出視窗 */}
            {selectedGroup && <TrophyInfoModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
            {showAlumni && <AlumniModal alumni={alumni} onClose={() => setShowAlumni(false)} />}
        </div>
    );
}
