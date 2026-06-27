// src/pages/AwardsPage.jsx (Version 2.0)
// 更新內容: 新增榮譽數據大屏、智能篩選器(學年/獎牌/類型)、團隊榮譽標籤，並支援點擊學員名字彈出個人檔案(Player Card)。

import React, { useMemo, useState } from 'react';
import { Award, Columns, History, PlusCircle, Trophy, UserCog, Medal, Calendar as CalendarIcon, Users, User, Filter, ArrowUpRight } from 'lucide-react';

// 輔助函數：根據日期計算學年 (例如 2023-10-15 -> "23/24 學年")
const getAcademicYear = (dateString) => {
    if (!dateString) return "未知";
    const d = new Date(dateString);
    if (isNaN(d)) return "未知";
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (month >= 8) return `${year}/${year + 1} 學年`;
    return `${year - 1}/${year} 學年`;
};

// 輔助函數：判斷是否為團體獎項
const checkIsTeamAward = (award) => {
    if (award.isTeam) return true;
    const name = award.studentName || "";
    return name.includes('隊') || name.includes('Team') || name.includes('團體') || name.includes('BCKLAS') || name.includes('正覺');
};

export default function AwardsPage({
    role,
    awards,
    students,
    awardsViewMode,
    setAwardsViewMode,
    setShowAddAwardModal,
    setShowPlayerCard, // 👉 接收彈出 Player Card 的函數
    deleteItem
}) {
    // --- 狀態：智能篩選器 ---
    const [filterYear, setFilterYear] = useState('ALL');
    const [filterMedal, setFilterMedal] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL'); // ALL, INDIVIDUAL, TEAM

    // --- 數據統計 (Dashboard) ---
    const dashboardStats = useMemo(() => {
        let totalGold = 0;
        let totalMedals = awards.length;
        let thisYearMedals = 0;
        
        const currentAcaYear = getAcademicYear(new Date().toISOString());

        awards.forEach(a => {
            const rank = a.rank || '';
            if (rank.includes('冠') || rank.includes('金') || rank.includes('1st') || rank.includes('Champion')) {
                totalGold += 1;
            }
            if (getAcademicYear(a.date) === currentAcaYear) {
                thisYearMedals += 1;
            }
        });

        return { totalGold, totalMedals, thisYearMedals, currentAcaYear };
    }, [awards]);

    // --- 篩選選項列表 ---
    const uniqueYears = useMemo(() => {
        const years = awards.map(a => getAcademicYear(a.date)).filter(y => y !== '未知');
        return [...new Set(years)].sort().reverse();
    }, [awards]);

    // --- 過濾後的獎項列表 ---
    const filteredAwards = useMemo(() => {
        return awards.filter(a => {
            const matchYear = filterYear === 'ALL' || getAcademicYear(a.date) === filterYear;
            
            let matchMedal = true;
            const rank = a.rank || '';
            if (filterMedal === 'GOLD') matchMedal = rank.includes('冠') || rank.includes('金');
            if (filterMedal === 'SILVER') matchMedal = rank.includes('亞') || rank.includes('銀');
            if (filterMedal === 'BRONZE') matchMedal = rank.includes('季') || rank.includes('殿') || rank.includes('銅');

            let matchType = true;
            const isTeam = checkIsTeamAward(a);
            if (filterType === 'TEAM') matchType = isTeam;
            if (filterType === 'INDIVIDUAL') matchType = !isTeam;

            return matchYear && matchMedal && matchType;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 預設按日期新到舊
    }, [awards, filterYear, filterMedal, filterType]);


    // --- 單個獎項卡片元件 ---
    const AwardCard = ({ award, student, style }) => {
        const rank = award.rank || '';
        const isTeam = checkIsTeamAward(award);
        
        const rankStyles = useMemo(() => {
            if (rank.includes('冠') || rank.includes('金') || rank.includes('1st')) {
                return {
                    bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400',
                    text: 'text-yellow-900',
                    shadow: 'shadow-yellow-400/30 hover:shadow-yellow-300/50',
                    border: 'border-yellow-500/50',
                    ribbon: 'bg-yellow-500',
                    rankText: 'text-yellow-800'
                };
            }
            if (rank.includes('亞') || rank.includes('銀') || rank.includes('2nd')) {
                return {
                    bg: 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-300',
                    text: 'text-slate-800',
                    shadow: 'shadow-slate-400/30 hover:shadow-slate-300/50',
                    border: 'border-gray-400/50',
                    ribbon: 'bg-slate-500',
                    rankText: 'text-slate-100'
                };
            }
            if (rank.includes('季') || rank.includes('殿') || rank.includes('銅') || rank.includes('3rd') || rank.includes('4th')) {
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
            <div style={style} className={`group relative flex flex-col ${rankStyles.bg} rounded-[2rem] p-1.5 shadow-lg ${rankStyles.shadow} transition-all duration-300 ease-in-out hover:-translate-y-1`}>
                {/* 左上角緞帶裝飾 */}
                <div className="absolute top-0 left-10 w-12 h-16 overflow-hidden z-20">
                    <div className={`absolute -top-2 left-0 w-full h-full rotate-45 transform-gpu ${rankStyles.ribbon} shadow-md`}></div>
                </div>

                {/* 👉 團隊榮譽標籤 👈 */}
                {isTeam && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1 z-30 border border-indigo-400/50">
                        <Users size={12}/> 團隊榮譽
                    </div>
                )}

                <div className="bg-white/60 backdrop-blur-md rounded-[1.65rem] h-full flex flex-col p-6 border border-white/40">
                    {/* 照片區塊 */}
                    <div className="w-full aspect-[4/3] rounded-2xl bg-white/50 overflow-hidden relative shadow-inner">
                        {award.photoUrl ? (
                            <img src={award.photoUrl} alt={award.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center opacity-20 ${rankStyles.text}`}>
                                <Trophy size={64}/>
                            </div>
                        )}
                        <div className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-sm font-black shadow-lg ${rankStyles.ribbon} ${rankStyles.rankText} backdrop-blur-sm border border-white/20`}>
                            {award.rank}
                        </div>
                    </div>

                    {/* 文字資訊區塊 */}
                    <div className="flex-1 flex flex-col pt-5 px-1">
                        <p className={`text-xs font-bold ${rankStyles.text} opacity-70`}>{award.date} ({getAcademicYear(award.date)})</p>
                        <h4 className={`text-xl font-black leading-tight mt-1 mb-4 ${rankStyles.text}`}>{award.title}</h4>
                        
                        {/* 👉 連動 Player Profile 的點擊區塊 👈 */}
                        <div 
                            className={`mt-auto flex items-center gap-3 ${student && typeof setShowPlayerCard === 'function' ? 'cursor-pointer hover:bg-white/40 p-2 -ml-2 rounded-xl transition-all group/profile' : ''}`}
                            onClick={(e) => {
                                if (student && typeof setShowPlayerCard === 'function') {
                                    e.stopPropagation();
                                    setShowPlayerCard(student);
                                }
                            }}
                            title={student ? "點擊查看球員檔案" : ""}
                        >
                            <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-lg font-bold bg-white/80 ${rankStyles.text} shadow-sm border-2 ${rankStyles.border}`}>
                                {isTeam ? <Users size={18}/> : (student ? student.name[0] : award.studentName[0])}
                            </div>
                            <div className="min-w-0">
                                <p className={`font-bold ${rankStyles.text} truncate`}>{award.studentName}</p>
                                {student && <p className={`text-[10px] font-bold uppercase tracking-wider ${rankStyles.text} opacity-70 flex items-center gap-1`}>Class {student.class} <span className="opacity-0 group-hover/profile:opacity-100 transition-all text-blue-600"><ArrowUpRight size={12}/></span></p>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {role === 'admin' && (
                    <button 
                        onClick={() => deleteItem('awards', award.id)}
                        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur text-white hover:text-red-400 hover:bg-black/40 rounded-full transition-all opacity-0 group-hover:opacity-100 z-30 shadow-lg"
                        title="刪除獎項"
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-bold relative">
            
            {/* 頂部標題與控制區 */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-yellow-100 text-yellow-600 rounded-2xl shadow-inner"><Award size={28}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">獎項成就 <span className="text-slate-300 font-normal">|</span> Hall of Fame</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1 tracking-wider">紀錄 BCKLAS 校隊輝煌戰績</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center p-1.5 bg-slate-100/80 rounded-[1.5rem] shadow-inner">
                        <button onClick={() => setAwardsViewMode('grid')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${awardsViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Columns size={16}/> 榮譽牆</button>
                        <button onClick={() => setAwardsViewMode('timeline')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${awardsViewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><History size={16}/> 時間軸</button>
                    </div>
                    {role === 'admin' && (
                        <button onClick={() => setShowAddAwardModal(true)} className="bg-yellow-500 text-white p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-yellow-600 shadow-xl shadow-yellow-200 transition-all font-black hover:-translate-y-0.5">
                            <PlusCircle size={20}/> <span className="hidden sm:inline">新增獎項</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 👉 1. 榮譽數據大屏 (Trophy Cabinet Dashboard) 👈 */}
            {awards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[2rem] p-6 text-white shadow-xl shadow-yellow-200/50 flex items-center gap-6 relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 opacity-20"><Medal size={120}/></div>
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"><Crown size={32} className="text-yellow-100"/></div>
                        <div>
                            <p className="text-yellow-100 font-bold text-sm uppercase tracking-widest">隊史總冠軍數</p>
                            <h4 className="text-5xl font-black font-mono mt-1">{dashboardStats.totalGold}</h4>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl"><Trophy size={32}/></div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">歷年總獎牌數</p>
                            <h4 className="text-4xl font-black text-slate-700 font-mono mt-1">{dashboardStats.totalMedals}</h4>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl"><CalendarIcon size={32}/></div>
                        <div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">本學年獲獎 ({dashboardStats.currentAcaYear})</p>
                            <h4 className="text-4xl font-black text-blue-600 font-mono mt-1">{dashboardStats.thisYearMedals}</h4>
                        </div>
                    </div>
                </div>
            )}

            {/* 👉 2. 智能賽季與級別篩選器 👈 */}
            {awards.length > 0 && (
                <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 text-slate-400 pl-4 font-black text-sm uppercase tracking-widest w-full md:w-auto">
                        <Filter size={16}/> 篩選
                    </div>
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select className="bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                            <option value="ALL">所有學年 (All Years)</option>
                            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select className="bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" value={filterMedal} onChange={(e) => setFilterMedal(e.target.value)}>
                            <option value="ALL">所有名次 (All Medals)</option>
                            <option value="GOLD">🥇 冠軍 / 金牌</option>
                            <option value="SILVER">🥈 亞軍 / 銀牌</option>
                            <option value="BRONZE">🥉 季殿軍 / 銅牌</option>
                        </select>
                        <select className="bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                            <option value="ALL">所有賽事 (Team & Individual)</option>
                            <option value="INDIVIDUAL">👤 個人單打榮譽</option>
                            <option value="TEAM">👥 校隊團體榮譽</option>
                        </select>
                    </div>
                </div>
            )}
            
            {/* 內容顯示區 */}
            {awards.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><Trophy size={48}/></div>
                    <p className="text-2xl font-black text-slate-400">目前暫無獎項紀錄</p>
                    <p className="text-slate-400 font-bold mt-2">點擊上方「新增獎項」開始建立榮譽殿堂</p>
                </div>
            ) : filteredAwards.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold animate-in fade-in">
                    找不到符合篩選條件的獎項紀錄。
                </div>
            ) : (
                <>
                    {awardsViewMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAwards.map((award) => {
                                const student = students.find(s => s.name === award.studentName);
                                return <AwardCard key={award.id} award={award} student={student} />;
                            })}
                        </div>
                    )}
                    
                    {awardsViewMode === 'timeline' && (
                        <div className="relative pl-8 pr-4 py-8">
                            <div className="absolute left-[3.25rem] top-0 h-full w-1.5 bg-slate-100 rounded-full"></div>
                            {filteredAwards.map((award, index) => {
                                const student = students.find(s => s.name === award.studentName);
                                const year = award.date.split('-')[0];
                                const prevYear = index > 0 ? filteredAwards[index-1].date.split('-')[0] : null;
                                const showYear = year !== prevYear;
                                
                                return (
                                    <div key={award.id} className="relative mb-16 animate-in fade-in slide-in-from-left-8 duration-500">
                                        {showYear && (
                                            <div className="absolute -left-2 top-0 flex items-center justify-center w-24 h-24 bg-blue-600 text-white font-black text-2xl rounded-full border-[6px] border-[#F8FAFC] z-10 shadow-lg">
                                                {year}
                                            </div>
                                        )}
                                        <div className={`ml-20 md:ml-40 pl-6 md:pl-10 pt-2 ${showYear ? 'mt-8' : ''}`}>
                                            <div className="max-w-md">
                                                <AwardCard award={award} student={student} />
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
