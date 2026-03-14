// src/pages/FinancialPage.jsx (Version 3.7 - UI Standardized)

import React from 'react';
import { DollarSign, Save, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function FinancialPage({
    financeConfig,
    setFinanceConfig,
    financialSummary,
    saveFinanceConfig
}) {
    // 處理數字輸入，避免 NaN
    const handleChange = (field, value) => {
        setFinanceConfig(prev => ({
            ...prev,
            [field]: value === '' ? '' : Number(value)
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-5xl mx-auto">
            
            <PageHeader 
                title="財務收支管理" 
                subtitle="球隊運作成本與學費收入試算" 
                icon={DollarSign} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左側：設定參數 */}
                <Card className="flex flex-col h-full">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 pb-4 border-b flex items-center gap-2">
                        <Wallet className="text-blue-500" /> 參數設定
                    </h3>
                    
                    <div className="space-y-6 flex-1">
                        {/* 收入設定 */}
                        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4">
                            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">預估收入設定</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">預計總收生人數</label>
                                    <input type="number" min="0" value={financeConfig.totalStudents} onChange={e => handleChange('totalStudents', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">每人學費收入 ($)</label>
                                    <input type="number" min="0" value={financeConfig.feePerStudent} onChange={e => handleChange('feePerStudent', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 transition-all font-mono" />
                                </div>
                            </div>
                        </div>

                        {/* 支出設定 */}
                        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-4">
                            <h4 className="text-sm font-black text-rose-800 uppercase tracking-widest">教練費支出設定</h4>
                            
                            <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">校隊班 數量</label>
                                    <input type="number" min="0" value={financeConfig.nTeam} onChange={e => handleChange('nTeam', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">校隊班 單班總成本 ($)</label>
                                    <input type="number" min="0" value={financeConfig.costTeam} onChange={e => handleChange('costTeam', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                            </div>

                            <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">精英班 數量</label>
                                    <input type="number" min="0" value={financeConfig.nTrain} onChange={e => handleChange('nTrain', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">精英班 單班總成本 ($)</label>
                                    <input type="number" min="0" value={financeConfig.costTrain} onChange={e => handleChange('costTrain', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                            </div>

                            <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">初/興趣班 數量</label>
                                    <input type="number" min="0" value={financeConfig.nHobby} onChange={e => handleChange('nHobby', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">初/興趣班 單班總成本 ($)</label>
                                    <input type="number" min="0" value={financeConfig.costHobby} onChange={e => handleChange('costHobby', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:border-rose-500 transition-all font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <PrimaryButton icon={Save} onClick={saveFinanceConfig} className="w-full text-lg">
                            儲存並更新計算
                        </PrimaryButton>
                    </div>
                </Card>

                {/* 右側：統計摘要 */}
                <Card className="flex flex-col h-full bg-slate-800 text-white border-none shadow-2xl" noPadding>
                    <div className="p-8 border-b border-slate-700">
                        <h3 className="text-2xl font-black text-slate-100">預估財務摘要</h3>
                        <p className="text-sm text-slate-400 mt-1">根據左側設定自動即時試算</p>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col justify-center space-y-8">
                        {/* 收入 */}
                        <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl"><TrendingUp size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">總預估收入</p>
                                    <p className="text-3xl font-black text-emerald-400 font-mono mt-1">${financialSummary.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* 支出 */}
                        <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-3xl border border-rose-500/30">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl"><TrendingDown size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">總預估支出</p>
                                    <p className="text-3xl font-black text-rose-400 font-mono mt-1">${financialSummary.expense.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-700 w-full my-4"></div>

                        {/* 結餘 */}
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">預估盈餘 / 虧損</p>
                            <p className={`text-6xl font-black font-mono tracking-tighter ${financialSummary.profit >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                {financialSummary.profit >= 0 ? '+' : '-'}${Math.abs(financialSummary.profit).toLocaleString()}
                            </p>
                            {financialSummary.profit < 0 && (
                                <p className="text-xs text-rose-400 mt-2 font-bold animate-pulse">⚠️ 警告：目前設定將導致財務赤字</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
