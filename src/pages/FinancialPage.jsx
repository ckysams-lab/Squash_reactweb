// src/pages/FinancialPage.jsx (Version 1.8)

import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Wallet, TrendingUp, TrendingDown, PlusCircle, Trash2, Users, Target } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // 確保 db 已正確導出
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import FinancialItemModal from '../components/FinancialItemModal.jsx';

// 假設 appId 在一個可訪問的範圍內，如果不在，需要從 props 傳入
const appId = 'bcklas-squash-core-v1'; 

const FinancialItem = ({ item, onDelete }) => (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center group">
        <div>
            <p className="font-black text-slate-700">{item.name}</p>
            {item.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 mt-1 inline-block">{item.category}</span>}
        </div>
        <div className="flex items-center gap-4">
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
    const [items, setItems] = useState([]);
    const [totalStudents, setTotalStudents] = useState(50); // 預設50人
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expenditure'); // 'income' or 'expenditure'

    // 從 Firestore 實時讀取數據
    useEffect(() => {
        const itemsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'financial_items');
        const unsubscribe = onSnapshot(itemsColRef, (snapshot) => {
            const financialData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(financialData.sort((a, b) => b.timestamp - a.timestamp));
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
            await addDoc(itemsColRef, {
                ...itemData,
                timestamp: serverTimestamp()
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('儲存項目失敗，請檢查網絡連線。');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('您確定要永久刪除這個項目嗎？')) {
            try {
                const itemDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'financial_items', itemId);
                await deleteDoc(itemDocRef);
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert('刪除項目失敗，請檢查網絡連線。');
            }
        }
    };
    
    const { totalExpenditure, otherIncome, fundingGap, feePerStudent } = useMemo(() => {
        const totalExpenditure = items
            .filter(item => item.type === 'expenditure')
            .reduce((sum, item) => sum + item.amount, 0);
        
        const otherIncome = items
            .filter(item => item.type === 'income')
            .reduce((sum, item) => sum + item.amount, 0);

        const fundingGap = totalExpenditure - otherIncome;

        const feePerStudent = totalStudents > 0 ? fundingGap / totalStudents : 0;

        return { totalExpenditure, otherIncome, fundingGap, feePerStudent };
    }, [items, totalStudents]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-6xl mx-auto">
            
            {isModalOpen && <FinancialItemModal type={modalType} onSave={handleSaveItem} onClose={() => setIsModalOpen(false)} />}

            <PageHeader 
                title="動態財務管理" 
                subtitle="即時管理團隊收支，智能計算收費標準" 
                icon={DollarSign} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* 左側：流水帳 */}
                <div className="space-y-8">
                    {/* 支出 */}
                    <Card>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><TrendingDown className="text-rose-500"/>總支出</h3>
                            <p className="text-2xl font-black text-rose-600 font-mono">${totalExpenditure.toLocaleString()}</p>
                        </div>
                        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
                            {items.filter(item => item.type === 'expenditure').length > 0 ? (
                                items.filter(item => item.type === 'expenditure').map(item => <FinancialItem key={item.id} item={item} onDelete={handleDeleteItem} />)
                            ) : (
                                <p className="text-center text-slate-400 py-8">暫無支出項目</p>
                            )}
                        </div>
                        <PrimaryButton icon={PlusCircle} onClick={() => handleAddItem('expenditure')} className="w-full bg-rose-500 hover:bg-rose-600">
                            新增支出
                        </PrimaryButton>
                    </Card>

                    {/* 收入 */}
                    <Card>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500"/>其他收入</h3>
                            <p className="text-2xl font-black text-emerald-600 font-mono">${otherIncome.toLocaleString()}</p>
                        </div>
                         <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2">
                            {items.filter(item => item.type === 'income').length > 0 ? (
                                items.filter(item => item.type === 'income').map(item => <FinancialItem key={item.id} item={item} onDelete={handleDeleteItem} />)
                            ) : (
                                <p className="text-center text-slate-400 py-4">暫無其他收入項目</p>
                            )}
                        </div>
                        <PrimaryButton icon={PlusCircle} onClick={() => handleAddItem('income')} className="w-full bg-emerald-500 hover:bg-emerald-600">
                            新增收入
                        </PrimaryButton>
                    </Card>
                </div>

                {/* 右側：計算機 */}
                <Card className="sticky top-28 bg-blue-50 border-2 border-blue-200 shadow-xl">
                    <div className="p-8 border-b border-blue-200 bg-white rounded-t-[3rem]">
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Target className="text-blue-600"/>收支平衡計算機</h3>
                        <p className="text-sm text-slate-500 mt-1 font-bold">根據收支流水帳與收生人數，智能建議學費</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">資金缺口 (總支出 - 其他收入)</p>
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

