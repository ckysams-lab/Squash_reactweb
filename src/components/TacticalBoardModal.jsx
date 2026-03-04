import React, { useState } from 'react';
import { X, Target, Save } from 'lucide-react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

// 我們把 db 和 appId 當作 props 從外面傳進來
const TacticalBoardModal = ({ onClose, db, appId }) => {
    // 【把原本在 App.js 裡的戰術板專屬 State 移到這裡】
    const [tacticalData, setTacticalData] = useState({ p1: '', p2: '' });
    const [activePlayer, setActivePlayer] = useState(1); 
    const [lastRecorded, setLastRecorded] = useState(null);
    const [pendingTacticalShots, setPendingTacticalShots] = useState([]);

    const zones = [
        { id: 'Front-Left', label: '前左' }, { id: 'Front-Center', label: '前中' }, { id: 'Front-Right', label: '前右' },
        { id: 'Mid-Left', label: '中左' }, { id: 'T-Zone', label: 'T字位' }, { id: 'Mid-Right', label: '中右' },
        { id: 'Back-Left', label: '後左' }, { id: 'Back-Center', label: '後中' }, { id: 'Back-Right', label: '後右' }
    ];

    const handleTacticalClick = (zone) => {
        if (!tacticalData.p1) {
            alert("請至少輸入一位我方球員的姓名！");
            return;
        }
        
        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
        
        setLastRecorded({ player: playerName, zone: zone });
        setTimeout(() => setLastRecorded(null), 800);

        if (tacticalData.p2) {
            setActivePlayer(activePlayer === 1 ? 2 : 1);
        }

        setPendingTacticalShots(prev => [
            ...prev, 
            {
                player: playerName,
                opponent: opponentName || '未知對手',
                zone: zone,
                date: new Date().toISOString().split('T')[0]
            }
        ]);
    };

    const saveTacticalShots = async () => {
        if (pendingTacticalShots.length === 0) return;
        
        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'tactical_shots');
            
            pendingTacticalShots.forEach(shot => {
                batch.set(doc(colRef), {
                    ...shot,
                    timestamp: serverTimestamp()
                });
            });
            
            await batch.commit();
            alert(`✅ 成功批次儲存 ${pendingTacticalShots.length} 筆戰術紀錄！`);
            setPendingTacticalShots([]); 
        } catch(e) {
            console.error("批次戰術紀錄失敗", e);
            alert("儲存失敗，請檢查網路連線。");
        }
    };

    const handleClose = () => {
        if (pendingTacticalShots.length > 0) {
            if (window.confirm(`您還有 ${pendingTacticalShots.length} 筆紀錄未儲存，確定要關閉嗎？(未儲存資料將遺失)`)) {
                setPendingTacticalShots([]);
                onClose(); // 呼叫外面傳進來的關閉函數
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onClick={handleClose}>
            <div className="bg-white rounded-[2rem] p-5 sm:p-6 max-w-md w-full shadow-2xl relative border-4 border-slate-100 max-h-[95vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="absolute top-5 right-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all z-50"><X size={18}/></button>
                
                <div className="text-center mb-4 pr-8">
                    <h3 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2"><Target className="text-blue-600"/> 實戰落點紀錄</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-inner">
                    <div className={`flex-1 p-2 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 1 ? 'border-blue-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(1)}>
                        {activePlayer === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                        <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-0.5">藍方(先發)</label>
                        <input type="text" value={tacticalData.p1} onChange={e => setTacticalData({...tacticalData, p1: e.target.value})} className="w-full bg-transparent font-black text-base text-slate-800 outline-none placeholder:text-slate-300" placeholder="輸入我方"/>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-400 text-[10px] shadow-inner italic">VS</div>
                    <div className={`flex-1 p-2 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${activePlayer === 2 ? 'border-rose-500 bg-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`} onClick={() => setActivePlayer(2)}>
                        {activePlayer === 2 && <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>}
                        <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-0.5 text-right">紅方(對手)</label>
                        <input type="text" value={tacticalData.p2} onChange={e => setTacticalData({...tacticalData, p2: e.target.value})} className="w-full bg-transparent font-black text-base text-slate-800 outline-none text-right placeholder:text-slate-300" placeholder="輸入對手"/>
                    </div>
                </div>

                <div className="text-center mb-4 h-6 flex items-center justify-center shrink-0">
                    {lastRecorded ? (
                        <span className="text-emerald-600 font-black animate-in fade-in zoom-in text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            🎯 已記錄：{lastRecorded.player} ➡️ {lastRecorded.zone}
                        </span>
                    ) : (
                        <span className={`text-xs font-black px-3 py-1 rounded-full animate-pulse ${activePlayer === 1 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                            等待【{activePlayer === 1 ? (tacticalData.p1 || '藍方') : (tacticalData.p2 || '紅方')}】擊球...
                        </span>
                    )}
                </div>

                <div className="relative w-full max-w-[280px] mx-auto aspect-[3/4] bg-[#fdf5e6] border-[5px] border-slate-800 rounded-t-sm rounded-b-sm overflow-hidden shadow-inner shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/80"></div>
                    <div className="absolute top-[55%] left-0 right-0 border-t-[2px] border-red-500/50"></div>
                    <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[2px] border-red-500/50"></div>
                    <div className="absolute top-[55%] left-0 w-[30%] aspect-square border-[2px] border-l-0 border-red-500/50"></div>
                    <div className="absolute top-[55%] right-0 w-[30%] aspect-square border-[2px] border-r-0 border-red-500/50"></div>
                    
                    <div className="absolute top-1 left-0 right-0 text-center text-[9px] font-black text-red-800/40 tracking-[0.3em] pointer-events-none z-10">FRONT WALL</div>

                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {zones.map(zone => (
                            <button 
                                key={zone.id}
                                onClick={() => handleTacticalClick(zone.id)}
                                className="relative group border border-slate-400/20 hover:bg-blue-500/20 active:bg-blue-600/40 transition-all flex flex-col items-center justify-center outline-none"
                            >
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-sm scale-75 group-hover:scale-100">
                                    <Target size={16}/>
                                </span>
                                <span className="sr-only">{zone.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-5 flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                    <span className="text-xs font-bold text-slate-500 px-2">
                        待儲存：<span className="text-blue-600 text-lg mx-1">{pendingTacticalShots.length}</span> 筆
                    </span>
                    <button 
                        onClick={saveTacticalShots}
                        disabled={pendingTacticalShots.length === 0}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-black shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all text-sm flex items-center gap-2"
                    >
                        <Save size={16}/> 批次儲存
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TacticalBoardModal;
