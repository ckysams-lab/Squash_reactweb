// src/components/TacticalBoardModal.jsx (Version 4.0 - Strategy Board Added)

import React, { useState, useRef, useEffect } from 'react';
import { X, Target, Save, CheckCircle2, XCircle, CircleDashed, ArrowDownToLine, SignalHigh, Undo2, Minus, Plus, PenTool, Eraser, Navigation } from 'lucide-react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';

export default function TacticalBoardModal({ onClose, db, appId }) {
    
    // --- 核心模式切換 ---
    // 'record' = 記錄落點模式, 'strategy' = 戰術推演模式
    const [boardMode, setBoardMode] = useState('record'); 

    // ==========================================
    // 模式一：記錄模式 (Record Mode) 狀態
    // ==========================================
    const [tacticalData, setTacticalData] = useState({ p1: '', p2: '' });
    const [activePlayer, setActivePlayer] = useState(1); 
    const [currentShotResult, setCurrentShotResult] = useState('neutral'); 
    const [rallyLength, setRallyLength] = useState(1); 
    const [currentShotType, setCurrentShotType] = useState('Drive'); 
    const [lastRecorded, setLastRecorded] = useState(null);
    const [pendingTacticalShots, setPendingTacticalShots] = useState([]);

    const zones = [
        { id: 'Front-Left', label: '前左' }, { id: 'Front-Center', label: '前中' }, { id: 'Front-Right', label: '前右' },
        { id: 'Mid-Left', label: '中左' }, { id: 'T-Zone', label: 'T字位' }, { id: 'Mid-Right', label: '中右' },
        { id: 'Back-Left', label: '後左' }, { id: 'Back-Center', label: '後中' }, { id: 'Back-Right', label: '後右' }
    ];
    const shotTypes = [
        { id: 'Drive', label: '長球', color: 'bg-blue-100 text-blue-700 border-blue-300' },
        { id: 'Boast', label: '側牆', color: 'bg-purple-100 text-purple-700 border-purple-300' },
        { id: 'Drop', label: '短球', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
        { id: 'Lob', label: '高吊', color: 'bg-amber-100 text-amber-700 border-amber-300' },
        { id: 'Volley', label: '截擊', color: 'bg-rose-100 text-rose-700 border-rose-300' }
    ];

    const handleTacticalClick = (zone) => {
        if (!tacticalData.p1) return alert("請先輸入我方球員姓名！");
        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
        const newShot = { player: playerName, opponent: opponentName || '未知', zone: zone, shotResult: currentShotResult, shotType: currentShotType, rallyLength: rallyLength, date: new Date().toISOString().split('T')[0] };
        
        setLastRecorded({ player: playerName, zone: zone, result: currentShotResult, shots: rallyLength, type: currentShotType });
        setTimeout(() => setLastRecorded(null), 2000);
        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);
        setPendingTacticalShots(prev => [...prev, newShot]);
        setCurrentShotResult('neutral'); setCurrentShotType('Drive'); setRallyLength(1);
    };

    const handleSpecialErrorClick = (errorZoneId, errorLabel) => {
        if (!tacticalData.p1) return alert("請先輸入我方球員姓名！");
        const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
        const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
        const newShot = { player: playerName, opponent: opponentName || '未知', zone: errorZoneId, shotResult: 'error', shotType: currentShotType, rallyLength: rallyLength, date: new Date().toISOString().split('T')[0] };
        
        setLastRecorded({ player: playerName, zone: errorLabel, result: 'error', shots: rallyLength, type: currentShotType });
        setTimeout(() => setLastRecorded(null), 2000);
        if (tacticalData.p2) setActivePlayer(activePlayer === 1 ? 2 : 1);
        setPendingTacticalShots(prev => [...prev, newShot]);
        setCurrentShotResult('neutral'); setCurrentShotType('Drive'); setRallyLength(1);
    };

    const handleUndo = () => {
        if (pendingTacticalShots.length === 0) return;
        setPendingTacticalShots(prev => {
            const newList = [...prev]; const removedShot = newList.pop(); 
            setLastRecorded({ player: removedShot.player, zone: removedShot.zone.includes('Error-') ? removedShot.zone.replace('Error-', '') : removedShot.zone, result: 'undo' });
            setTimeout(() => setLastRecorded(null), 1500);
            if (tacticalData.p2) setActivePlayer(p => p === 1 ? 2 : 1);
            setRallyLength(removedShot.rallyLength || 1); setCurrentShotType(removedShot.shotType || 'Drive');
            return newList;
        });
    };

    const saveTacticalShots = async () => {
        if (pendingTacticalShots.length === 0) return;
        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'tactical_shots');
            pendingTacticalShots.forEach(shot => batch.set(doc(colRef), { ...shot, timestamp: serverTimestamp() }));
            await batch.commit();
            alert(`✅ 成功儲存 ${pendingTacticalShots.length} 筆紀錄！`);
            setPendingTacticalShots([]); 
        } catch(e) { alert("儲存失敗，請檢查網路連線。"); }
    };


    // ==========================================
    // 模式二：戰術推演模式 (Strategy Mode) 狀態與邏輯
    // ==========================================
    const svgRef = useRef(null);
    const [drawings, setDrawings] = useState([]); // 儲存所有的線條
    const [currentLine, setCurrentLine] = useState(null); // 正在畫的線
    const [playersOnCourt, setPlayersOnCourt] = useState([]); // 放置在球場上的球員
    const [drawTool, setDrawTool] = useState('line'); // 'line', 'player1', 'player2'
    
    // 滑鼠/觸控按下的事件
    const handlePointerDown = (e) => {
        if (boardMode !== 'strategy') return;
        const rect = svgRef.current.getBoundingClientRect();
        // 支援滑鼠與觸控
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (drawTool === 'player1' || drawTool === 'player2') {
            // 放置球員圓點
            const color = drawTool === 'player1' ? '#3b82f6' : '#ef4444'; // 藍色或紅色
            setPlayersOnCourt(prev => [...prev, { x, y, color, id: Date.now() }]);
            // 放完後自動切回畫線模式
            setDrawTool('line');
        } else if (drawTool === 'line') {
            // 開始畫線
            setCurrentLine({ points: [{ x, y }], color: '#fbbf24' }); // 黃色戰術線
        }
    };

    // 滑鼠/觸控移動的事件 (畫線)
    const handlePointerMove = (e) => {
        if (boardMode !== 'strategy' || !currentLine) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        setCurrentLine(prev => ({
            ...prev,
            points: [...prev.points, { x, y }]
        }));
    };

    // 滑鼠/觸控放開的事件 (結束畫線)
    const handlePointerUp = () => {
        if (boardMode !== 'strategy' || !currentLine) return;
        setDrawings(prev => [...prev, currentLine]);
        setCurrentLine(null);
    };

    // 清空畫板
    const clearBoard = () => {
        if (window.confirm("確定要清空畫板上的所有戰術嗎？")) {
            setDrawings([]);
            setPlayersOnCourt([]);
        }
    };

    const handleClose = () => {
        if (pendingTacticalShots.length > 0) {
            if (window.confirm(`您還有 ${pendingTacticalShots.length} 筆紀錄未儲存，確定要關閉嗎？`)) {
                setPendingTacticalShots([]); onClose(); 
            }
        } else { onClose(); }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in" onClick={handleClose}>
            
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header 與 模式切換 */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 shrink-0 gap-4">
                    <div className="flex bg-slate-200 p-1 rounded-2xl shadow-inner">
                        <button 
                            onClick={() => setBoardMode('record')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${boardMode === 'record' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Target size={18}/> 記錄模式
                        </button>
                        <button 
                            onClick={() => setBoardMode('strategy')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${boardMode === 'strategy' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Navigation size={18}/> 推演畫板
                        </button>
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm transition-all absolute sm:relative right-4 top-4 sm:right-0 sm:top-0"><X size={20}/></button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1 flex flex-col">
                    
                    {/* 👇 ================= 記錄模式 UI ================= 👇 */}
                    {boardMode === 'record' && (
                        <div className="flex flex-col h-full animate-in fade-in">
                            <div className="flex items-center gap-2 mb-6 bg-slate-100 p-2 rounded-2xl shadow-inner shrink-0">
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

                            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1">
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="text-center h-8 flex items-center justify-center shrink-0 mb-2 w-full">
                                        {lastRecorded ? (
                                            <span className={`text-xs font-black animate-in fade-in zoom-in px-4 py-1.5 rounded-full border shadow-sm flex items-center gap-1 ${lastRecorded.result === 'winner' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : lastRecorded.result === 'error' ? 'text-rose-700 bg-rose-50 border-rose-200' : lastRecorded.result === 'undo' ? 'text-amber-700 bg-amber-50 border-amber-300' : 'text-slate-700 bg-slate-100 border-slate-300'}`}>
                                                {lastRecorded.result === 'winner' && '🎯 得分：'} {lastRecorded.result === 'error' && '❌ 失誤：'} {lastRecorded.result === 'neutral' && '⚪ 落點：'} {lastRecorded.result === 'undo' && '⏪ 撤銷：'}
                                                [{lastRecorded.type}] {lastRecorded.zone} {lastRecorded.shots ? `(${lastRecorded.shots}拍)` : ''}
                                            </span>
                                        ) : (
                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full animate-pulse tracking-widest uppercase ${activePlayer === 1 ? 'text-blue-600 bg-blue-50' : 'text-rose-600 bg-rose-50'}`}>
                                                記錄【{activePlayer === 1 ? (tacticalData.p1 || '藍方') : (tacticalData.p2 || '紅方')}】的表現
                                            </span>
                                        )}
                                    </div>

                                    {/* 虛擬球場 (九宮格) */}
                                    <div className="relative w-full max-w-[280px] mx-auto aspect-[3/4] bg-[#fdf5e6] border-[6px] border-slate-800 rounded-t-sm rounded-b-sm overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] shrink-0 group mb-4">
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none z-0 ${currentShotResult === 'winner' ? 'bg-emerald-500' : currentShotResult === 'error' ? 'bg-rose-500' : 'bg-slate-500'}`}></div>
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/80"></div>
                                        <div className="absolute top-[55%] left-0 right-0 border-t-[3px] border-red-500/40"></div>
                                        <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[3px] border-red-500/40"></div>
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-20">
                                            {zones.map(zone => (
                                                <button key={zone.id} onClick={() => handleTacticalClick(zone.id)} className="relative border border-slate-400/20 hover:bg-black/10 active:bg-black/20 transition-all flex flex-col items-center justify-center outline-none group/btn">
                                                    <span className={`opacity-0 group-hover/btn:opacity-100 transition-all w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md scale-50 group-hover/btn:scale-100 ${currentShotResult === 'winner' ? 'bg-emerald-500/80' : currentShotResult === 'error' ? 'bg-rose-500/80' : 'bg-slate-800/60'}`}><Target size={16}/></span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                                        <button onClick={() => handleSpecialErrorClick('Error-Tin', '擊中底板')} className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"><ArrowDownToLine size={20} className="text-rose-500"/><span className="text-xs font-black">下網 (Tin)</span></button>
                                        <button onClick={() => handleSpecialErrorClick('Error-Out', '擊出界外')} className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 text-orange-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"><SignalHigh size={20} className="text-orange-500"/><span className="text-xs font-black">出界 (Out)</span></button>
                                    </div>
                                </div>

                                <div className="w-full lg:w-80 flex flex-col gap-5 mt-6 lg:mt-0">
                                    <div className="bg-slate-800 p-5 rounded-[2rem] text-center shadow-lg relative overflow-hidden isolate">
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">1. 本回合拍數</h4>
                                        <div className="flex items-center justify-between bg-slate-900 rounded-full p-2 border border-slate-700">
                                            <button onClick={() => setRallyLength(prev => Math.max(1, prev - 1))} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors active:scale-90"><Minus size={18}/></button>
                                            <div className="flex flex-col items-center px-4 w-16"><span className="text-3xl font-black text-white leading-none tracking-tighter">{rallyLength}</span></div>
                                            <button onClick={() => setRallyLength(prev => prev + 1)} className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-colors active:scale-90 shadow-md shadow-blue-900/50"><Plus size={18}/></button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">2. 選擇擊球技巧</h4>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {shotTypes.map(type => (
                                                <button key={type.id} onClick={() => setCurrentShotType(type.id)} className={`px-3 py-2 rounded-xl text-xs font-black transition-all border-2 ${currentShotType === type.id ? `${type.color} shadow-sm transform scale-105` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

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
                    )}

                    {/* 👇 ================= 戰術推演模式 UI ================= 👇 */}
                    {boardMode === 'strategy' && (
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full animate-in fade-in">
                            
                            {/* 畫板區 */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="text-center mb-4 w-full">
                                    <span className="text-xs font-black px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full">
                                        💡 提示：在右側選擇工具後，直接在球場上點擊或拖曳
                                    </span>
                                </div>

                                {/* 畫布球場 (結合 SVG) */}
                                <div className="relative w-full max-w-[320px] mx-auto aspect-[3/4] bg-[#fdf5e6] border-[6px] border-slate-800 rounded-t-sm rounded-b-sm overflow-hidden shadow-2xl shrink-0 cursor-crosshair touch-none">
                                    {/* 背景線條 */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/80 pointer-events-none"></div>
                                    <div className="absolute top-[55%] left-0 right-0 border-t-[4px] border-red-500/50 pointer-events-none"></div>
                                    <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[4px] border-red-500/50 pointer-events-none"></div>
                                    
                                    {/* SVG 畫布 */}
                                    <svg 
                                        ref={svgRef}
                                        className="absolute inset-0 w-full h-full z-20"
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                    >
                                        {/* 渲染已經畫好的線 */}
                                        {drawings.map((line, i) => (
                                            <polyline 
                                                key={i}
                                                points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
                                                fill="none"
                                                stroke={line.color}
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="drop-shadow-sm"
                                            />
                                        ))}
                                        {/* 渲染正在畫的線 */}
                                        {currentLine && (
                                            <polyline 
                                                points={currentLine.points.map(p => `${p.x},${p.y}`).join(' ')}
                                                fill="none"
                                                stroke={currentLine.color}
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        )}
                                        {/* 渲染球員圓點 */}
                                        {playersOnCourt.map(player => (
                                            <circle 
                                                key={player.id}
                                                cx={player.x} 
                                                cy={player.y} 
                                                r="12" 
                                                fill={player.color} 
                                                stroke="white"
                                                strokeWidth="3"
                                                className="drop-shadow-md"
                                            />
                                        ))}
                                    </svg>
                                </div>
                            </div>

                            {/* 右側工具列 */}
                            <div className="w-full lg:w-64 flex flex-col gap-4">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">畫筆工具</h4>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => setDrawTool('line')}
                                            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${drawTool === 'line' ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <PenTool size={18}/> 畫戰術路線
                                        </button>
                                        <button 
                                            onClick={() => setDrawTool('player1')}
                                            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${drawTool === 'player1' ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div> 放置藍方球員
                                        </button>
                                        <button 
                                            onClick={() => setDrawTool('player2')}
                                            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-all border-2 ${drawTool === 'player2' ? 'bg-rose-100 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white"></div> 放置紅方球員
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={clearBoard}
                                    className="w-full py-4 bg-slate-200 text-slate-600 rounded-[2rem] font-black hover:bg-slate-300 hover:text-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <Eraser size={18}/> 清空畫板
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer (只在記錄模式顯示儲存按鈕) */}
                {boardMode === 'record' && (
                    <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={handleUndo} disabled={pendingTacticalShots.length === 0} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300 disabled:opacity-30 transition-all shadow-sm" title="撤銷上一筆"><Undo2 size={20}/></button>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待儲存紀錄</span>
                                <span className="text-blue-600 font-black text-xl leading-none">{pendingTacticalShots.length}</span>
                            </div>
                        </div>
                        <button onClick={saveTacticalShots} disabled={pendingTacticalShots.length === 0} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all text-sm flex items-center gap-2">
                            <Save size={18}/> 批次儲存
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
