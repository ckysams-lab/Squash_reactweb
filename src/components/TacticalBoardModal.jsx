// src/components/TacticalBoardModal.jsx (Version 3.1 - Squash Specific Errors)

import React, { useState } from 'react';
import { X, Target, Save, CheckCircle2, XCircle, CircleDashed, ArrowDownToLine, SignalHigh } from 'lucide-react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

export default function TacticalBoardModal({ onClose, db, appId }) {
    
    const [tacticalData, setTacticalData] = useState({ p1: '', p2: '' });
    const [activePlayer, setActivePlayer] = useState(1); 
    const [currentShotResult, setCurrentShotResult] = useState('neutral'); 
    const [lastRecorded, setLastRecorded] = useState(null);
    const [pendingTacticalShots, setPendingTacticalShots] = useState([]);

    const zones = [
        { id: 'Front-Left', label: '前左' }, { id: 'Front-Center', label: '前中' }, { id: 'Front-Right', label: '前右' },
        { id: 'Mid-Left', label: '中左' }, { id: 'T-Zone', label: 'T字位' }, { id: 'Mid-Right', label: '中右' },
        { id: 'Back-Left', label: '後左' }, { id: 'Back-Center', label: '後中' }, { id: 'Back-Right', label: '後右' }
    ];

    // 一般落點的點擊處理
    const handleTacticalClick = (zone) => {
        if (!tacticalData.p1) return alert("請至少輸入一位我方球員的姓名！");
        
        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
        
        setLastRecorded({ player: playerName, zone: zone, result: currentShotResult });
        setTimeout(() => setLastRecorded(null), 1000);

        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);

        setPendingTacticalShots(prev => [
            ...prev, 
            {
                player: playerName, opponent: opponentName || '未知對手',
                zone: zone, shotResult: currentShotResult, date: new Date().toISOString().split('T')[0]
            }
        ]);

        setCurrentShotResult('neutral');
    };

    // 👇 新增：特殊失誤 (Tin / Out) 的快速點擊處理 👇
    const handleSpecialErrorClick = (errorZoneId, errorLabel) => {
        if (!tacticalData.p1) return alert("請至少輸入一位我方球員的姓名！");

        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;

        // 特殊失誤強制標記為 'error' (紅色)
        setLastRecorded({ player: playerName, zone: errorLabel, result: 'error' });
        setTimeout(() => setLastRecorded(null), 1000);

        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);

        setPendingTacticalShots(prev => [
            ...prev, 
            {
                player: playerName, opponent: opponentName || '未知對手',
                zone: errorZoneId, // 例如: 'Error-Tin' 或 'Error-Out'
                shotResult: 'error', // 強制設定為失誤
                date: new Date().toISOString().split('T')[0]
            }
        ]);
        
        // 點完特殊失誤後，依然切回普通狀態
        setCurrentShotResult('neutral');
    };

    const saveTacticalShots = async () => {
        if (pendingTacticalShots.length === 0) return;
        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'tactical_shots');
            pendingTacticalShots.forEach(shot => {
                batch.set(doc(colRef), { ...shot, timestamp: serverTimestamp() });
            });
            await batch.commit();
            alert(`✅ 成功批次儲存 ${pendingTacticalShots.length} 筆戰術紀錄！`);
            setPendingTacticalShots([]); 
        } catch(e) {
            alert("儲存失敗，請檢查網路連線。");
        }
    };

    const handleClose = () => {
        if (pendingTacticalShots.length > 0) {
            if (window.confirm(`還有 ${pendingTacticalShots.length} 筆紀錄未儲存，確定要關閉嗎？`)) {
                setPendingTacticalShots([]);
                onClose(); 
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onClick={handleClose}>
            
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Target className="text-blue-600"/> 實戰落點紀錄
                    </h3>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm transition-all"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 flex flex-col">
                    
                    {/* 球員輸入區塊 */}
                    <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-2xl shadow-inner">
                        <div className={`flex-1 p-3 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 1 ? 'border-blue-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(1)}>
                            {activePlayer === 1 && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">藍方 (我方)</label>
                            <input type="text" value={tacticalData.p1} onChange={e => setTacticalData({...tacticalData, p1: e.target.value})} className="w-full bg-transparent font-black text-lg text-slate-800 outline-none placeholder:text-slate-300" placeholder="輸入姓名"/>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-[10px] shadow-sm italic shrink-0">VS</div>
                        <div className={`flex-1 p-3 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 2 ? 'border-rose-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(2)}>
                            {activePlayer === 2 && <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>}
                            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1 text-right">紅方 (對手)</label>
                            <input type="text" value={tacticalData.p2} onChange={e => setTacticalData({...tacticalData, p2: e.target.value})} className="w-full bg-transparent font-black text-lg text-slate-800 outline-none text-right placeholder:text-slate-300" placeholder="可留空"/>
                        </div>
                    </div>

                    {/* 擊球結果狀態列 */}
                    <div className="mb-4">
                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">1. 選擇擊球結果，然後點擊下方球場落點</p>
                        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setCurrentShotResult('winner')}
                                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${currentShotResult === 'winner' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-100'}`}
                            >
                                <CheckCircle2 size={16}/> 致勝球
                            </button>
                            <button 
                                onClick={() => setCurrentShotResult('neutral')}
                                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${currentShotResult === 'neutral' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <CircleDashed size={16}/> 普通落點
                            </button>
                            <button 
                                onClick={() => setCurrentShotResult('error')}
                                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-bold transition-all ${currentShotResult === 'error' ? 'bg-rose-500 text-white shadow-md' : 'text-rose-600 hover:bg-rose-100'}`}
                            >
                                <XCircle size={16}/> 一般失誤
                            </button>
                        </div>
                    </div>

                    {/* 視覺回饋文字區 */}
                    <div className="text-center h-6 flex items-center justify-center shrink-0 mb-3">
                        {lastRecorded ? (
                            <span className={`text-xs font-black animate-in fade-in zoom-in px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-1
                                ${lastRecorded.result === 'winner' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                                  lastRecorded.result === 'error' ? 'text-rose-700 bg-rose-50 border-rose-200' : 
                                  'text-slate-700 bg-slate-100 border-slate-300'}`
                            }>
                                {lastRecorded.result === 'winner' && '🎯 得分：'}
                                {lastRecorded.result === 'error' && '❌ 失誤：'}
                                {lastRecorded.result === 'neutral' && '⚪ 落點：'}
                                {lastRecorded.player} ➡️ {lastRecorded.zone}
                            </span>
                        ) : (
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse tracking-widest uppercase ${activePlayer === 1 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                                正在記錄【{activePlayer === 1 ? (tacticalData.p1 || '藍方') : (tacticalData.p2 || '紅方')}】的表現
                            </span>
                        )}
                    </div>

                    {/* 虛擬球場 */}
                    <div className="relative w-full max-w-[240px] mx-auto aspect-[3/4] bg-[#fdf5e6] border-[6px] border-slate-800 rounded-t-sm rounded-b-sm overflow-hidden shadow-inner shrink-0 group mb-4">
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none z-0 
                            ${currentShotResult === 'winner' ? 'bg-emerald-500' : currentShotResult === 'error' ? 'bg-rose-500' : 'bg-slate-500'}`
                        }></div>
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/80"></div>
                        <div className="absolute top-[55%] left-0 right-0 border-t-[3px] border-red-500/40"></div>
                        <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[3px] border-red-500/40"></div>
                        <div className="absolute top-[55%] left-0 w-[30%] aspect-square border-[3px] border-l-0 border-red-500/40"></div>
                        <div className="absolute top-[55%] right-0 w-[30%] aspect-square border-[3px] border-r-0 border-red-500/40"></div>
                        
                        <div className="absolute top-2 left-0 right-0 text-center text-[9px] font-black text-red-800/40 tracking-[0.4em] pointer-events-none z-10">FRONT WALL</div>
                        
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-20">
                            {zones.map(zone => (
                                <button 
                                    key={zone.id}
                                    onClick={() => handleTacticalClick(zone.id)}
                                    className="relative border border-slate-400/20 hover:bg-black/10 active:bg-black/20 transition-all flex flex-col items-center justify-center outline-none group/btn"
                                >
                                    <span className={`opacity-0 group-hover/btn:opacity-100 transition-all w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md scale-50 group-hover/btn:scale-100
                                        ${currentShotResult === 'winner' ? 'bg-emerald-500/80' : currentShotResult === 'error' ? 'bg-rose-500/80' : 'bg-slate-800/60'}`
                                    }>
                                        <Target size={16}/>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 👇 新增：壁球專屬特殊失誤區 👇 */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button 
                            onClick={() => handleSpecialErrorClick('Error-Tin', '擊中底板')}
                            className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowDownToLine size={20} className="text-rose-500"/>
                            <span className="text-xs font-black">擊中底板 (Tin)</span>
                        </button>
                        <button 
                            onClick={() => handleSpecialErrorClick('Error-Out', '擊出界外')}
                            className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 text-orange-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                            <SignalHigh size={20} className="text-orange-500"/>
                            <span className="text-xs font-black">擊出界外 (Out)</span>
                        </button>
                    </div>

                </div>

                {/* Footer：儲存按鈕 */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-slate-500">
                        待儲存 <span className="text-blue-600 font-black text-xl mx-1">{pendingTacticalShots.length}</span>
                    </span>
                    <button 
                        onClick={saveTacticalShots}
                        disabled={pendingTacticalShots.length === 0}
                        className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all text-sm flex items-center gap-2"
                    >
                        <Save size={18}/> 批次儲存
                    </button>
                </div>

            </div>
        </div>
    );
};
