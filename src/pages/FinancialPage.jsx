// src/pages/FinancialPage.jsx
import React from 'react';
import { Save, TrendingUp, Trash2, DollarSign } from 'lucide-react';

export default function FinancialPage({
    financeConfig,
    setFinanceConfig,
    financialSummary,
    saveFinanceConfig
}) {
    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 font-bold">
            {/* 儲存按鈕 */}
            <div className="flex justify-end">
                <button 
                    onClick={saveFinanceConfig} 
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Save size={20} /> 儲存財務設定
                </button>
            </div>

            {/* 三大指標卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 預計總收入 */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總收入</p>
                    <h3 className="text-4xl font-black text-emerald-500">${financialSummary.revenue.toLocaleString()}</h3>
                </div>

                {/* 預計總支出 */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                        <Trash2 size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總支出</p>
                    <h3 className="text-4xl font-black text-rose-500">${financialSummary.expense.toLocaleString()}</h3>
                </div>

                {/* 預計資助盈餘 */}
                <div className={`p-10 rounded-[3.5rem] border shadow-sm flex flex-col justify-center items-center text-center ${financialSummary.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${financialSummary.profit >= 0 ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-rose-600 shadow-sm'}`}>
                        <DollarSign size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計資助盈餘</p>
                    <h3 className={`text-4xl font-black ${financialSummary.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        ${financialSummary.profit.toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* 表單設定區 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 支出設定 (教練費) */}
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <Trash2 size={24}/>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">支出設定 (教練費)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[ 
                            { label: '校隊教練次數', key: 'nTeam' }, 
                            { label: '單次校隊成本', key: 'costTeam' }, 
                            { label: '進階班次數', key: 'nTrain' }, 
                            { label: '單次進階成本', key: 'costTrain' }, 
                            { label: '趣味班次數', key: 'nHobby' }, 
                            { label: '單次趣味成本', key: 'costHobby' } 
                        ].map(item => (
                            <div key={item.key}>
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">{item.label}</label>
                                <input 
                                    type="number" 
                                    className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-rose-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" 
                                    value={financeConfig[item.key]} 
                                    onChange={e => setFinanceConfig({...financeConfig, [item.key]: Number(e.target.value)})}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 預計收入 (學費) */}
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <DollarSign size={24}/>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800">預計收入 (學費)</h4>
                    </div>
                    <div className="space-y-10">
                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">預計總人數</label>
                            <input 
                                type="number" 
                                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" 
                                value={financeConfig.totalStudents} 
                                onChange={e => setFinanceConfig({...financeConfig, totalStudents: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">每位學員學費 ($)</label>
                            <input 
                                type="number" 
                                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" 
                                value={financeConfig.feePerStudent} 
                                onChange={e => setFinanceConfig({...financeConfig, feePerStudent: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
