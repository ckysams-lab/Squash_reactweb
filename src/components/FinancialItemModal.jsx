// src/components/FinancialItemModal.jsx

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Check } from 'lucide-react';
import { PrimaryButton } from './ui';

export default function FinancialItemModal({ item, type, onSave, onClose }) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (item) {
            setName(item.name || '');
            setAmount(item.amount || '');
            setCategory(item.category || '');
        } else {
            // Reset for new item
            setName('');
            setAmount('');
            setCategory('');
        }
    }, [item]);

    const handleSave = () => {
        const amountNumber = parseFloat(amount);
        if (!name || isNaN(amountNumber) || amountNumber <= 0) {
            alert('請填寫有效的項目名稱和正數金額。');
            return;
        }
        onSave({
            name: name.trim(),
            amount: amountNumber,
            category: category.trim(),
            type // 'income' or 'expenditure'
        });
    };
    
    const title = type === 'income' ? '新增收入項目' : '新增支出項目';
    const accentColor = type === 'income' ? 'emerald' : 'rose';

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b rounded-t-[2rem] bg-${accentColor}-50`}>
                    <h3 className={`text-2xl font-black text-${accentColor}-800`}>{title}</h3>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">項目名稱</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="例如：校際比賽報名費"
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 transition-all rounded-xl p-4 outline-none font-bold" 
                        />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1"><Tag size={12}/> 分類 (可選)</label>
                        <input 
                            type="text" 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            placeholder="例如：賽事開銷、器材費"
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 transition-all rounded-xl p-4 outline-none font-bold" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1"><DollarSign size={12}/> 金額 ($)</label>
                        <input 
                            type="number" 
                            min="0"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="例如：1500"
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 transition-all rounded-xl p-4 outline-none font-bold font-mono" 
                        />
                    </div>
                </div>
                <div className="p-6 border-t bg-slate-50 rounded-b-[2rem]">
                    <PrimaryButton icon={Check} onClick={handleSave} className="w-full text-lg">
                        儲存項目
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}

