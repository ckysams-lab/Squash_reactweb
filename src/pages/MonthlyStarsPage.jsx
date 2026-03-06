// src/pages/MonthlyStarsPage.jsx
import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';

export default function MonthlyStarsPage({ monthlyStarsData }) {
    const [displayMonth, setDisplayMonth] = useState('');

    useEffect(() => {
        if (monthlyStarsData && monthlyStarsData.length > 0) {
            setDisplayMonth(monthlyStarsData[0].id);
        }
    }, [monthlyStarsData]);

    const currentData = monthlyStarsData?.find(ms => ms.id === displayMonth);

    if (!monthlyStarsData || monthlyStarsData.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-300 mb-6"><Star size={40}/></div>
               <p className="text-xl font-black text-slate-400">「每月之星」即將登場</p>
               <p className="text-sm text-slate-300 mt-2">請教練在後台設定本月的得獎者。</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 font-bold">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h3 className="text-4xl font-black text-slate-800">每月之星 <span className="text-yellow-500">Player of the Month</span></h3>
                <select 
                    value={displayMonth} 
                    onChange={e => setDisplayMonth(e.target.value)}
                    className="bg-white border-2 border-slate-100 focus:border-blue-600 transition-all rounded-2xl p-4 outline-none text-lg font-bold shadow-sm"
                >
                    {monthlyStarsData.map(ms => <option key={ms.id} value={ms.id}>{ms.id.replace('-', ' 年 ')} 月</option>)}
                </select>
            </div>

            {currentData && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* 男生卡片 */}
                    <div className="bg-gradient-to-br from-blue-50 to-white p-10 rounded-[4rem] border-2 border-white shadow-xl">
                        <div className="w-full aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden mb-8 shadow-lg">
                           {currentData.maleWinner?.fullBodyPhotoUrl ? <img src={currentData.maleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top" alt="Male Winner"/> : <div className="flex items-center justify-center h-full text-slate-400"><User size={64}/></div>}
                        </div>
                        <h4 className="text-3xl font-black text-blue-800">{currentData.maleWinner?.studentName}</h4>
                        <p className="text-sm font-bold text-slate-400 mb-6">{currentData.maleWinner?.studentClass}</p>
                        <div className="space-y-6">
                            <div>
                                <h5 className="font-black text-slate-500 mb-2">獲選原因</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed">{currentData.maleWinner?.reason}</p>
                            </div>
                             <div>
                                <h5 className="font-black text-slate-500 mb-2">本年度目標</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed font-semibold italic">"{currentData.maleWinner?.goals}"</p>
                            </div>
                        </div>
                    </div>
                    {/* 女生卡片 */}
                    <div className="bg-gradient-to-br from-pink-50 to-white p-10 rounded-[4rem] border-2 border-white shadow-xl">
                        <div className="w-full aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden mb-8 shadow-lg">
                            {currentData.femaleWinner?.fullBodyPhotoUrl ? <img src={currentData.femaleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top" alt="Female Winner"/> : <div className="flex items-center justify-center h-full text-slate-400"><User size={64}/></div>}
                        </div>
                        <h4 className="text-3xl font-black text-pink-800">{currentData.femaleWinner?.studentName}</h4>
                        <p className="text-sm font-bold text-slate-400 mb-6">{currentData.femaleWinner?.studentClass}</p>
                        <div className="space-y-6">
                            <div>
                                <h5 className="font-black text-slate-500 mb-2">獲選原因</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed">{currentData.femaleWinner?.reason}</p>
                            </div>
                             <div>
                                <h5 className="font-black text-slate-500 mb-2">本年度目標</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed font-semibold italic">"{currentData.femaleWinner?.goals}"</p>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
