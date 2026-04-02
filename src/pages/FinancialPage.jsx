// src/pages/FinancialPage.jsx (Version 2.0 - Full Code)

import React, { useState, useMemo, useEffect } from 'react';
import { doc, collection, onSnapshot, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, Trash2, Users, Target, Calendar, Tag, PieChart as PieChartIcon } from 'lucide-react';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import FinancialItemModal from '../components/FinancialItemModal.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

const appId = 'bcklas-squash-core-v1'; 

const FinancialItem = ({ item, onDelete, onToggleBillable }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.type === 'expenditure' && (
                <input
                    type="checkbox"
                    checked={!!item.isBillable}
                    onChange={() => onToggleBillable(item.id, !item.isBillable)}
                    className="form-checkbox h-5 w-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                    title="是否計入學費攤分"
                />
            )}
            <div className="flex-1 min-w-0">
                <p className={`font-black truncate ${item.isBillable === false ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    {item.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 inline-block">{item.category}</span>}
                    {item.timestamp?.seconds && <span className="text-[10px] font-medium text-slate-400">{new Date(item.timestamp.seconds * 1000).toLocaleDateString()}</span>}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
            <p className={`font-mono font-bold text-lg ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'income' ? '+' : '-'}$ {item.amount.toLocaleString()}
            </p>
            <button onClick={() => onDelete(item.id)} className="p-2 rounded-full bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

export default function FinancialPage() {
    const [allItems, setAllItems] = useState([]);
    const [totalStudents, setTotalStudents] = useState(50);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expenditure');
    
    // Filters State
    const [dateFilter, setDateFilter] = useState('all');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    useEffect(() => {
        const itemsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'financial_items');
        const unsubscribe = onSnapshot(itemsColRef, (snapshot) => {
            const financialData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllItems(financialData.sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)));
        });
        return () => unsubscribe();
    }, []);

    const handleAddItem = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleSaveItem = async (itemData) => {
        try {
            const itemsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'financial_items');
            await addDoc(itemsColRef, { ...itemData, isBillable: itemData.type === 'expenditure' ? true : null, timestamp: serverTimestamp() });
            setIsModalOpen(false);
        } catch (error) { console.error("Error adding document: ", error); alert('儲存失敗'); }
    };
    
    const handleToggleBillable = async (itemId, newIsBillable) => {
        const itemDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'financial_items', itemId);
        await updateDoc(itemDocRef, { isBillable: newIsBillable });
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('您確定要永久刪除這個項目嗎？')) {
            const itemDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'financial_items', itemId);
            await deleteDoc(itemDocRef);
        }
    };
    
    const uniqueCategories = useMemo(() => {
        const categories = new Set(allItems.map(item => item.category).filter(Boolean));
        return ['ALL', ...Array.from(categories)];
    }, [allItems]);

    const filteredItems = useMemo(() => {
        let items = [...allItems];
        
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);

        items = items.filter(item => {
            if (!item.timestamp?.seconds) return dateFilter === 'all'; 
            const itemDate = new Date(item.timestamp.seconds * 1000);
            switch (dateFilter) {
                case 'thisMonth': return itemDate >= startOfThisMonth && itemDate <= endOfThisMonth;
                case 'lastMonth': return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth;
                case 'thisYear': return itemDate >= startOfThisYear;
                case 'custom': {
                    const startDate = customDateRange.start ? new Date(customDateRange.start) : null;
                    const endDate = customDateRange.end ? new Date(customDateRange.end) : null;
                    if (startDate && endDate) return itemDate >= startDate && itemDate <= new Date(endDate.getTime() + 86400000);
                    if (startDate) return itemDate >= startDate;
                    if (endDate) return itemDate <= new Date(endDate.getTime() + 86400000);
                    return true;
                }
                case 'all': default: return true;
            }
        });

        if (categoryFilter !== 'ALL') {
            items = items.filter(item => item.category === categoryFilter);
        }
        
        return items;
    }, [allItems, dateFilter, customDateRange, categoryFilter]);
    
    const { totalExpenditure, otherIncome, fundingGap, feePerStudent, expenditureByCategory } = useMemo(() => {
        const totalExpenditure = filteredItems.filter(i => i.type === 'expenditure').reduce((s, i) => s + i.amount, 0);
        const billableExpenditure = filteredItems.filter(i => i.type === 'expenditure' && i.isBillable).reduce((s, i) => s + i.amount, 0);
        const otherIncome = filteredItems.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
        const fundingGap = billableExpenditure - otherIncome;
        const feePerStudent = totalStudents > 0 ? fundingGap / totalStudents : 0;
        
        const expenditureByCategory = filteredItems
            .filter(item => item.type === 'expenditure')
            .reduce((acc, item) => {
                const category = item.category || '未分類';
                if (!acc[category]) acc[category] = 0;
                acc[category] += item.amount;
                return acc;
            }, {});

        return { totalExpenditure, otherIncome, fundingGap, feePerStudent, expenditureByCategory };
    }, [filteredItems, totalStudents]);

    const pieData = Object.entries(expenditureByCategory).map(([name, value]) => ({ name, value }));
    const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#6b7280'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-7xl mx-auto">
            
            {isModalOpen && <FinancialItemModal type={modalType} onSave={handleSaveItem} onClose={() => setIsModalOpen(false)} />}

            <PageHeader title="動態財務管理" subtitle="即時管理團隊收支，智能計算收費標準" icon={DollarSign} />
            
            <Card className="flex flex-wrap items-center gap-x-6 gap-y-4">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-500" />
                    <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-slate-100 border-none rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500">
                        <option value="all">全部時間</option>
                        <option value="thisMonth">本月</option>
                        <option value="lastMonth">上個月</option>
                        <option value="thisYear">本年度</option>
                        <option value="custom">自訂範圍</option>
                    </select>
                </div>
                {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-300">
                        <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange(p => ({ ...p, start: e.target.value }))} className="bg-white border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500" />
                        <span>至</span>
                        <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange(p => ({ ...p, end: e.target.value }))} className="bg-white border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500" />
                    </div>
                )}
                 <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Tag size={18} className="text-slate-500" />
                    {uniqueCategories.map(cat => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 text-sm rounded-full transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {cat === 'ALL' ? '全部' : cat}
                        </button>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                <div className="space-y-8">
                    <Card>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><TrendingDown className="text-rose-500"/>總支出</h3>
                            <p className="text-2xl font-black text-rose-600 font-mono">${totalExpenditure.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-slate-500 mb-3 font-bold">✅ 勾選的項目將會計入右側的學費攤分計算。</p>
                        <div className="space-y-3 mb-4 max-h-[22rem] overflow-y-auto pr-2">
                            {filteredItems.filter(item => item.type === 'expenditure').length > 0 ? (
                                filteredItems.filter(item => item.type === 'expenditure').map(item => <FinancialItem key={item.id} item={item} onDelete={handleDeleteItem} onToggleBillable={handleToggleBillable} />)
                            ) : (
                                <p className="text-center text-slate-400 py-8">在選定範圍內暫無支出項目</p>
                            )}
                        </div>
                        <PrimaryButton icon={PlusCircle} onClick={() => handleAddItem('expenditure')} className="w-full bg-rose-500 hover:bg-rose-600">
                            新增支出
                        </PrimaryButton>
                    </Card>

                    <Card>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500"/>其他收入</h3>
                            <p className="text-2xl font-black text-emerald-600 font-mono">${otherIncome.toLocaleString()}</p>
                        </div>
                         <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2">
                            {filteredItems.filter(item => item.type === 'income').length > 0 ? (
                                filteredItems.filter(item => item.type === 'income').map(item => <FinancialItem key={item.id} item={item} onDelete={handleDeleteItem} />)
                            ) : (
                                <p className="text-center text-slate-400 py-4">在選定範圍內暫無其他收入</p>
                            )}
                        </div>
                        <PrimaryButton icon={PlusCircle} onClick={() => handleAddItem('income')} className="w-full bg-emerald-500 hover:bg-emerald-600">
                            新增收入
                        </PrimaryButton>
                    </Card>

                    {pieData.length > 0 && (
                        <Card>
                            <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon className="text-slate-500"/>支出分類佔比</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}
                </div>

                <Card className="sticky top-28 bg-blue-50 border-2 border-blue-200 shadow-xl">
                    <div className="p-8 border-b border-blue-200 bg-white rounded-t-[3rem]">
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Target className="text-blue-600"/>收支平衡計算機</h3>
                        <p className="text-sm text-slate-500 mt-1 font-bold">根據<span className="text-blue-600">篩選後的可攤分收支</span>，智能建議學費</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">學費需覆蓋資金</p>
                            <p className="text-xs text-slate-400 font-bold">(可攤分支出 - 其他收入)</p>
                            <p className="text-5xl font-black text-slate-800 font-mono tracking-tighter mt-2">${fundingGap > 0 ? fundingGap.toLocaleString() : 0}</p>
                        </div>

                        <div className="h-0.5 bg-blue-200 w-full rounded-full"></div>
                        
                        <div>
                            <label className="text-sm font-bold text-slate-500 mb-2 block text-center flex items-center justify-center gap-2"><Users size={16}/> 預計收生總人數</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={totalStudents} 
                                onChange={e => setTotalStudents(Number(e.target.value))} 
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-center font-mono text-2xl outline-none focus:border-blue-500 transition-all" 
                            />
                        </div>

                        <div className="text-center bg-white p-8 rounded-3xl border-2 border-blue-500 shadow-lg relative overflow-hidden">
                             <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-blue-500 blur-3xl opacity-20"></div>
                            <p className="text-sm font-black text-blue-800 uppercase tracking-widest mb-3 relative z-10">建議每人學費</p>
                            <p className="text-6xl font-black text-blue-600 font-mono tracking-tighter relative z-10">
                                ${feePerStudent > 0 ? Math.ceil(feePerStudent).toLocaleString() : 0}
                            </p>
                             <p className="text-xs text-slate-400 mt-2 font-bold relative z-10">
                                (結果向上取整，以確保收支平衡)
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

