// src/pages/AwardsPage.jsx
import React, { useMemo } from 'react';
import { Award, Columns, History, PlusCircle, Trophy, UserCog } from 'lucide-react';

export default function AwardsPage({
    role,
    awards,
    students,
    awardsViewMode,
    setAwardsViewMode,
    setShowAddAwardModal,
    deleteItem
}) {

    // 將 App.jsx 裡的 AwardCard 搬到這裡作為內部元件
    const AwardCard = ({ award, student, style }) => {
        const rank = award.rank || '';
        
        const rankStyles = useMemo(() => {
            if (rank.includes('冠軍')) {
                return {
                    bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400',
                    text: 'text-yellow-900',
                    shadow: 'shadow-yellow-400/30 hover:shadow-yellow-300/50',
                    border: 'border-yellow-500/50',
                    ribbon: 'bg-yellow-500',
                    rankText: 'text-yellow-800'
                };
            }
            if (rank.includes('亞軍')) {
                return {
                    bg: 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-300',
                    text: 'text-slate-800',
                    shadow: 'shadow-slate-400/30 hover:shadow-slate-300/50',
                    border: 'border-gray-400/50',
                    ribbon: 'bg-slate-500',
                    rankText: 'text-slate-100'
                };
            }
            if (rank.includes('季軍') || rank.includes('殿軍')) {
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
        }, [rank]);

        return (
            <div style={style} className={`group relative flex flex-col ${rankStyles.bg} rounded-3xl p-1.5 shadow-lg ${rankStyles.shadow} transition-all duration-300 ease-in-out hover:scale-105`}>
                <div className="absolute top-0 left-10 w-12 h-16 overflow-hidden z-20">
                    <div className={`absolute -top-2 left-0 w-full h-full rotate-45 transform-gpu ${rankStyles.ribbon} shadow-md`}></div>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-[1.35rem] h-full flex flex-col p-6">
                    <div className="w-full aspect-[4/3] rounded-2xl bg-white/50 overflow-hidden relative border border-white/50 shadow-inner">
                        {award.photoUrl ? (
                            <img src={award.photoUrl} alt={award.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center opacity-20 ${rankStyles.text}`}>
                                <Trophy size={64}/>
                            </div>
                        )}
                        <div className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-sm font-black shadow-lg ${rankStyles.ribbon} ${rankStyles.rankText}`}>
                            {award.rank}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col pt-5 px-1">
                        <p className={`text-xs font-bold ${rankStyles.text} opacity-70`}>{award.date}</p>
                        <h4 className={`text-xl font-black leading-tight mt-1 mb-3 ${rankStyles.text}`}>{award.title}</h4>
                        <div className="mt-auto flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-white/70 ${rankStyles.text} shadow-sm border-2 ${rankStyles.border}`}>
                                {student ? student.name[0] : award.studentName[0]}
                            </div>
                            <div>
                                <p className={`font-bold ${rankStyles.text}`}>{award.studentName}</p>
                                {student && <p className={`text-xs font-semibold ${rankStyles.text} opacity-80`}>Class {student.class}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {role === 'admin' && (
                    <button 
                        onClick={() => deleteItem('awards', award.id)}
                        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur text-white/70 hover:text-red-500 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-30"
                    >
                        <UserCog size={16}/>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-bold">
            {/* 頂部標題與控制區 */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-yellow-100 text-yellow-600 rounded-2xl"><Award/></div>
                    <div>
                        <h3 className="text-xl font-black">獎項成就 (Hall of Fame)</h3>
                        <p className="text-xs text-slate-400 mt-1">紀錄校隊輝煌戰績</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
                        <button onClick={() => setAwardsViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-sm font-bold transition-all ${awardsViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Columns size={16}/> 榮譽牆</button>
                        <button onClick={() => setAwardsViewMode('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-sm font-bold transition-all ${awardsViewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><History size={16}/> 時間軸</button>
                    </div>
                    {role === 'admin' && (
                        <button onClick={() => setShowAddAwardModal(true)} className="bg-yellow-500 text-white p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all font-black">
                            <PlusCircle size={18}/> <span className="hidden sm:inline">新增獎項</span>
                        </button>
                    )}
                </div>
            </div>
            
            {/* 內容顯示區 */}
            {awards.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><Trophy size={40}/></div>
                    <p className="text-xl font-black text-slate-400">目前暫無獎項紀錄</p>
                    <p className="text-sm text-slate-300 mt-2">請教練新增比賽獲獎紀錄</p>
                </div>
            ) : (
                <>
                    {awardsViewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {awards.map((award) => {
                                const student = students.find(s => s.name === award.studentName);
                                return <AwardCard key={award.id} award={award} student={student} />;
                            })}
                        </div>
                    )}
                    
                    {awardsViewMode === 'timeline' && (
                        <div className="relative pl-8 pr-4">
                            <div className="absolute left-[3.25rem] top-0 h-full w-1 bg-slate-200 rounded-full"></div>
                            {awards.map((award, index) => {
                                const student = students.find(s => s.name === award.studentName);
                                const year = award.date.split('-')[0];
                                const prevYear = index > 0 ? awards[index-1].date.split('-')[0] : null;
                                const showYear = year !== prevYear;
                                
                                return (
                                    <div key={award.id} className="relative mb-12 animate-in fade-in slide-in-from-left-8 duration-500">
                                        {showYear && (
                                            <div className="absolute -left-2 top-0 flex items-center justify-center w-24 h-24 bg-slate-800 text-white font-black text-2xl rounded-full border-8 border-[#F8FAFC] z-10">
                                                {year}
                                            </div>
                                        )}
                                        <div className={`ml-20 md:ml-40 pl-10 pt-2 ${showYear ? 'mt-8' : ''}`}>
                                            <AwardCard award={award} student={student} />
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
