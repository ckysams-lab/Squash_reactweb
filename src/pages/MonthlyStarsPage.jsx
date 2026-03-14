// src/pages/MonthlyStarsPage.jsx (Version 3.4 - UI Standardized)

import React from 'react';
import { Star, Target, Quote, Image as ImageIcon, User, Trophy } from 'lucide-react';

// 👇 引入共用 UI 元件
import { PageHeader, Card } from '../components/ui.jsx';

export default function MonthlyStarsPage({ monthlyStarsData }) {
    
    // 如果沒有任何資料的預設畫面
    if (!monthlyStarsData || monthlyStarsData.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold">
                <PageHeader 
                    title="每月之星" 
                    subtitle="表揚每月表現優異、態度積極的隊員" 
                    icon={Star} 
                />
                <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-6">
                        <Star size={48} />
                    </div>
                    <p className="text-xl font-black text-slate-500">目前尚無每月之星紀錄</p>
                    <p className="text-sm text-slate-400 mt-2">請教練至「每月之星管理」頁面發佈</p>
                </Card>
            </div>
        );
    }

    // 負責渲染單一得獎者資料的內部小元件
    const WinnerProfile = ({ winner, gender }) => {
        if (!winner || !winner.studentId) return null;
        
        const isMale = gender === 'male';
        // 根據性別設定不同的顏色主題
        const themeColor = isMale ? 'blue' : 'pink';
        const ThemeIcon = isMale ? Trophy : Star;

        return (
            <div className={`flex flex-col bg-white rounded-3xl border-2 border-${themeColor}-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-${themeColor}-300 relative group`}>
                
                {/* 裝飾性背景 */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-${themeColor}-50 rounded-full opacity-50 blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700`}></div>

                {/* 照片區塊 */}
                <div className="w-full h-80 bg-slate-100 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                    {winner.fullBodyPhotoUrl ? (
                        <img 
                            src={winner.fullBodyPhotoUrl} 
                            alt={winner.studentName} 
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" 
                        />
                    ) : (
                        <div className="flex flex-col items-center text-slate-300">
                            <ImageIcon size={64} className="mb-2 opacity-50" />
                            <span className="text-sm font-bold">尚未上傳照片</span>
                        </div>
                    )}
                    {/* 性別與獎項標籤 */}
                    <div className={`absolute top-4 left-4 bg-${themeColor}-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 tracking-widest`}>
                        <ThemeIcon size={14} /> 
                        {isMale ? '最佳男隊員' : '最佳女隊員'}
                    </div>
                </div>

                {/* 資料區塊 */}
                <div className="p-8 flex-1 flex flex-col relative z-10">
                    <div className="mb-6 border-b border-slate-100 pb-4">
                        <h3 className={`text-3xl font-black text-${themeColor}-600 mb-1`}>{winner.studentName}</h3>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <User size={14} /> Class {winner.studentClass}
                        </p>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* 獲選原因 */}
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Quote size={14} className={`text-${themeColor}-400`} /> 教練評語 (獲選原因)
                            </h4>
                            <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100">
                                {winner.reason || "教練尚未填寫評語。"}
                            </p>
                        </div>

                        {/* 本年度目標 */}
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Target size={14} className="text-amber-500" /> 球員期許 (年度目標)
                            </h4>
                            <p className="text-slate-700 font-medium leading-relaxed bg-amber-50/50 p-4 rounded-2xl text-sm border border-amber-100">
                                {winner.goals || "尚未設定目標。"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold">
            
            <PageHeader 
                title="每月之星" 
                subtitle="表揚每月表現優異、態度積極的隊員" 
                icon={Star} 
            />

            {/* 列表渲染：依據月份降冪排列 (最新的在最上面) */}
            {monthlyStarsData
                .sort((a, b) => b.month.localeCompare(a.month))
                .map((data) => {
                    // 解析 YYYY-MM 格式
                    const [year, monthNum] = data.month.split('-');
                    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
                    const displayMonth = `${year} 年 ${monthNames[parseInt(monthNum, 10) - 1]}`;

                    return (
                        <div key={data.id} className="relative">
                            
                            {/* 月份裝飾標籤 */}
                            <div className="sticky top-20 z-20 flex justify-center -mb-6 pointer-events-none">
                                <div className="bg-slate-800 text-white px-8 py-3 rounded-full text-lg font-black shadow-xl border-4 border-white flex items-center gap-3">
                                    <Star className="text-yellow-400" fill="currentColor" size={20} />
                                    {displayMonth}
                                </div>
                            </div>

                            {/* 卡片本體 */}
                            <Card className="pt-16 pb-8 px-6 md:px-12 bg-gradient-to-b from-slate-50 to-white">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                                    <WinnerProfile winner={data.maleWinner} gender="male" />
                                    <WinnerProfile winner={data.femaleWinner} gender="female" />
                                </div>
                            </Card>
                            
                        </div>
                    );
                })
            }
        </div>
    );
}
