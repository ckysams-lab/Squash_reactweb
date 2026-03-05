import React from 'react';
import { X, CheckCircle } from 'lucide-react';

// 我們將 ACHIEVEMENT_DATA 從外部傳入，讓這個元件更獨立
const BadgeInfoModal = ({ badge, onClose, ACHIEVEMENT_DATA }) => {
    if (!badge) return null;

    const badgeData = ACHIEVEMENT_DATA[badge.badgeId];
    if (!badgeData) {
        console.error("找不到對應的徽章定義:", badge.badgeId);
        return null;
    }

    const currentLevelData = badgeData.levels?.[badge.level] || badgeData.levels?.[1] || { name: badgeData.baseName, desc: '詳細描述待補充' };

    return (
        <div 
            className="fixed inset-0 z-[600] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" 
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative border-4 border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all z-10">
                    <X size={18}/>
                </button>
                
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 border-4 border-white shadow-lg text-5xl">
                    {badgeData.icon}
                </div>
                
                <h3 className="text-3xl font-black text-slate-800">{currentLevelData.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-2">首次達成於: {badge.timestamp ? new Date(badge.timestamp.seconds * 1000).toLocaleDateString() : '日期未知'}</p>
                
                <p className="mt-6 text-slate-600 max-w-md mx-auto">{currentLevelData.desc}</p>
                
                {badgeData.levels && (
                    <div className="mt-8 w-full max-w-md">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">進階條件</h4>
                        <div className="space-y-2 text-left">
                            {Object.values(badgeData.levels).map(level => (
                                <div key={level.name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${badge.level >= level.level ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className={`w-6 h-6 flex items-center justify-center rounded-full ${badge.level >= level.level ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <CheckCircle size={14}/>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${badge.level >= level.level ? 'text-emerald-800' : 'text-slate-600'}`}>{level.name}</p>
                                        <p className={`text-xs ${badge.level >= level.level ? 'text-emerald-600' : 'text-slate-400'}`}>{level.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeInfoModal;
