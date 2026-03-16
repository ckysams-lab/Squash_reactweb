// src/components/TacticalBoardModal.jsx (Version 3.4 - Ultimate Tactical Board)

import React, { useState } from 'react';
import { X, Target, Save, CheckCircle2, XCircle, CircleDashed, ArrowDownToLine, SignalHigh, Undo2, Minus, Plus } from 'lucide-react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

export default function TacticalBoardModal({ onClose, db, appId }) {
    
    const [tacticalData, setTacticalData] = useState({ p1: '', p2: '' });
    const [activePlayer, setActivePlayer] = useState(1); 
    
    // --- 核心記錄狀態 ---
    const [rallyLength, setRallyLength] = useState(1); 
    const [currentShotResult, setCurrentShotResult] = useState('neutral'); 
    // 👇 新增：擊球技巧狀態
    const [currentShotType, setCurrentShotType] = useState('Drive'); 
    
    const [lastRecorded, setLastRecorded] = useState(null);
    const [pendingTacticalShots, setPendingTacticalShots] = useState([]);

    const zones = [
        { id: 'Front-Left', label: '前左' }, { id: 'Front-Center', label: '前中' }, { id: 'Front-Right', label: '前右' },
        { id: 'Mid-Left', label: '中左' }, { id: 'T-Zone', label: 'T字位' }, { id: 'Mid-Right', label: '中右' },
        { id: 'Back-Left', label: '後左' }, { id: 'Back-Center', label: '後中' }, { id: 'Back-Right', label: '後右' }
    ];

    // 擊球技巧選項定義
    const shotTypes = [
        { id: 'Drive', label: '長球', color: 'bg-blue-100 text-blue-700 border-blue-300' },
        { id: 'Boast', label: '側牆', color: 'bg-purple-100 text-purple-700 border-purple-300' },
        { id: 'Drop', label: '短球', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
        { id: 'Lob', label: '高吊', color: 'bg-amber-100 text-amber-700 border-amber-300' },
        { id: 'Volley', label: '截擊', color: 'bg-rose-100 text-rose-700 border-rose-300' }
    ];

    const resetStatesForNextShot = () => {
        setCurrentShotResult('neutral');
        setCurrentShotType('Drive'); // 預設切回最常用的長球
        setRallyLength(1);
    };

    const handleTacticalClick = (zone) => {
        if (!tacticalData.p1) return alert("請至少輸入一位我方球員的姓名！");
        
        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
        
        const newShot = {
            player: playerName, opponent: opponentName || '未知對手',
            zone: zone, 
            shotResult: currentShotResult, 
            shotType: currentShotType, // 👈 存入擊球技巧
            rallyLength: rallyLength, 
            date: new Date().toISOString().split('T')[0]
        };

        setLastRecorded({ player: playerName, zone: zone, result: currentShotResult, shots: rallyLength, type: currentShotType });
        setTimeout(() => setLastRecorded(null), 2000);

        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);

        setPendingTacticalShots(prev => [...prev, newShot]);
        resetStatesForNextShot();
    };

    const handleSpecialErrorClick = (errorZoneId, errorLabel) => {
        if (!tacticalData.p1) return alert("請至少輸入一位我方球員的姓名！");

        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;

        const newShot = {
            player: playerName, opponent: opponentName || '未知對手',
            zone: errorZoneId, 
            shotResult: 'error', 
            shotType: currentShotType, // 👈 存入擊球技巧
            rallyLength: rallyLength,
            date: new Date().toISOString().split('T')[0]
        };

        setLastRecorded({ player: playerName, zone: errorLabel, result: 'error', shots: rallyLength, type: currentShotType });
        setTimeout(() => setLastRecorded(null), 2000);

        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);

        setPendingTacticalShots(prev => [...prev, newShot]);
        resetStatesForNextShot();
    };

    const handleUndo = () => {
        if (pendingTacticalShots.length === 0) return;

        setPendingTacticalShots(prev => {
            const newList = [...prev];
            const removedShot = newList.pop(); 
            
            setLastRecorded({ 
                player: removedShot.player, 
                zone: removedShot.zone.includes('Error-') ? removedShot.zone.replace('Error-Tin', '擊中底板').replace('Error-Out', '擊出界外') : removedShot.zone, 
                result: 'undo' 
            });
            setTimeout(() => setLastRecorded(null), 1500);

            if (tacticalData.p2) setActivePlayer(prevPlayer => prevPlayer === 1 ? 2 : 1);

            // 還原狀態
            setRallyLength(removedShot.rallyLength || 1);
            setCurrentShotType(removedShot.shotType || 'Drive');

            return newList;
        });
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
            if (window.confirm(`您還有 ${pendingTacticalShots.length} 筆紀錄未儲存，確定要關閉嗎？(未儲存資料將遺失)`)) {
                setPendingTacticalShots([]);
                onClose(); 
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onClick={handleClose}>
            
            {/* 加寬卡片以容納所有控制器 (max-w-3xl) */}
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Target className="text-blue-600"/> 實戰落點紀錄
                    </h3>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm transition-all"><X size={20}/></button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 flex flex-col">
                    
                    {/* 球員輸入區塊 */}
                    <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-2xl shadow-inner shrink-0">
                        <div className={`flex-1 p-2 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 1 ? 'border-blue-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(1)}>
                            {activePlayer === 1 && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">藍方 (我方)</label>
                            <input type="text" value={tacticalData.p1} onChange={e => setTacticalData({...tacticalData, p1: e.target.value})} className="w-full bg-transparent font-black text-lg text-slate-800 outline-none placeholder:text-slate-300" placeholder="輸入姓名"/>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-[10px] shadow-sm italic shrink-0">VS</div>
                        <div className={`flex-1 p-2 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 2 ? 'border-rose-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(2)}>
                            {activePlayer === 2 && <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>}
                            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-0.5 text-right">紅方 (對手)</label>
                            <input type="text" value={tacticalData.p2} onChange={e => setTacticalData({...tacticalData, p2: e.target.value})} className="w-full bg-transparent font-black text-lg text-slate-800 outline-none text-right placeholder:text-slate-300" placeholder="可留空"/>
                        </div>
                    </div>

                    {/* 主體：左邊球場，右邊控制器群 */}
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
                        
                        {/* 左側：虛擬球場與特殊失誤 */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                            
                            <div className="text-center h-8 flex items-center justify-center shrink-0 mb-2 w-full">
                                {lastRecorded ? (
                                    <span className={`text-xs font-black animate-in fade-in zoom-in px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-1
                                        ${lastRecorded.result === 'winner' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                                        lastRecorded.result === 'error' ? 'text-rose-700 bg-rose-50 border-rose-200' : 
                                        lastRecorded.result === 'undo' ? 'text-amber-700 bg-amber-50 border-amber-300' : 
                                        'text-slate-700 bg-slate-100 border-slate-300'}`
                                    }>
                                        {lastRecorded.result === 'winner' && '🎯 得分：'}
                                        {lastRecorded.result === 'error' && '❌ 失誤：'}
                                        {lastRecorded.result === 'neutral' && '⚪ 落點：'}
                                        {lastRecorded.result === 'undo' && '⏪ 已撤銷：'}
                                        [{lastRecorded.type}] {lastRecorded.zone} {lastRecorded.shots ? `(${lastRecorded.shots}拍)` : ''}
                                    </span>
                                ) : (
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse tracking-widest uppercase ${activePlayer === 1 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                                        正在記錄【{activePlayer === 1 ? (tacticalData.p1 || '藍方') : (tacticalData.p2 || '紅方')}】的表現
                                    </span>
                                )}
                            </div>

                            <div className="relative w-full max-w-[280px] mx-auto aspect-[3/4] bg-[#fdf5e6] border-[6px] border-slate-800 rounded-t-sm rounded-b-sm overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] shrink-0 group mb-4">
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
                                            <span className={`opacity-0 group-hover/btn:opacity-100 transition-all w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md scale-50 group-hover/btn:scale-100
                                                ${currentShotResult === 'winner' ? 'bg-emerald-500/80' : currentShotResult === 'error' ? 'bg-rose-500/80' : 'bg-slate-800/60'}`
                                            }>
                                                <Target size={20}/>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                                <button onClick={() => handleSpecialErrorClick('Error-Tin', '擊中底板')} className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                    <ArrowDownToLine size={20} className="text-rose-500"/>
                                    <span className="text-xs font-black">下網 (Tin)</span>
                                </button>
                                <button onClick={() => handleSpecialErrorClick('Error-Out', '擊出界外')} className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 text-orange-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm">
                                    <SignalHigh size={20} className="text-orange-500"/>
                                    <span className="text-xs font-black">出界 (Out)</span>
                                </button>
                            </div>
                        </div>

                        {/* 右側：紀錄控制器 */}
                        <div className="w-full lg:w-80 flex flex-col gap-5 mt-6 lg:mt-0">
                            
                            {/* 1. 回合拍數 */}
                            <div className="bg-slate-800 p-5 rounded-[2rem] text-center shadow-lg relative overflow-hidden isolate">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. 本回合拍數</h4>
                                <div className="flex items-center justify-between bg-slate-900 rounded-full p-2 border border-slate-700">
                                    <button onClick={() => setRallyLength(prev => Math.max(1, prev - 1))} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors active:scale-90"><Minus size={18}/></button>
                                    <div className="flex flex-col items-center px-4 w-16">
                                        <span className="text-3xl font-black text-white leading-none tracking-tighter">{rallyLength}</span>
                                    </div>
                                    <button onClick={() => setRallyLength(prev => prev + 1)} className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors active:scale-90 shadow-md shadow-blue-900/50"><Plus size={18}/></button>
                                </div>
                            </div>

                            {/* 2. 選擇球種 */}
                            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">2. 選擇擊球技巧</h4>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {shotTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setCurrentShotType(type.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all border-2 
                                                ${currentShotType === type.id ? `${type.color} shadow-sm transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            {type.id} {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. 選擇結果 */}
                            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">3. 結果 ➔ 點擊球場</h4>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setCurrentShotResult('winner')} className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${currentShotResult === 'winner' ? 'bg-emerald-500 border-emerald-600 text-white shadow-md transform scale-105' : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50'}`}><CheckCircle2 size={16}/> 漂亮得分</button>
                                    <button onClick={() => setCurrentShotResult('neutral')} className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${currentShotResult === 'neutral' ? 'bg-slate-700 border-slate-800 text-white shadow-md transform scale-105' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}><CircleDashed size={16}/> 普通落點</button>
                                    <button onClick={() => setCurrentShotResult('error')} className={`py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${currentShotResult === 'error' ? 'bg-rose-500 border-rose-600 text-white shadow-md transform scale-105' : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'}`}><XCircle size={16}/> 發生失誤</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={handleUndo} disabled={pendingTacticalShots.length === 0} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 disabled:opacity-30 transition-all shadow-sm" title="撤銷上一筆紀錄"><Undo2 size={20}/></button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待儲存紀錄</span>
                            <span className="text-blue-600 font-black text-xl leading-none">{pendingTacticalShots.length}</span>
                        </div>
                    </div>
                    <button onClick={saveTacticalShots} disabled={pendingTacticalShots.length === 0} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all text-sm flex items-center gap-2">
                        <Save size={18}/> 批次儲存
                    </button>
                </div>

            </div>
        </div>
    );
}
