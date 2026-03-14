// src/components/AddTournamentModal.jsx (Version 4.0 - Smart Scheduling)

import React, { useState } from 'react';
import { X, Swords, Loader2, CalendarRange, Clock } from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

// 👇 引入我們剛剛建立的智慧排程引擎
import { generateRoundRobinSchedule } from '../utils/scheduler';
// 引入 UI 元件讓外觀保持一致
import { PrimaryButton, SecondaryButton } from './ui';

export default function AddTournamentModal({ onClose, db, appId, students, setSelectedTournament }) {

    const [newTournamentName, setNewTournamentName] = useState('');
    const [tournamentPlayers, setTournamentPlayers] = useState([]);
    const [numGroups, setNumGroups] = useState(1);
    const [isUpdating, setIsUpdating] = useState(false);

    // 👇 新增：排程相關的狀態
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 預設排兩週
    const [defaultTime, setDefaultTime] = useState('16:00');

    // 全選/取消全選
    const toggleSelectAll = () => {
        if (tournamentPlayers.length === students.length) {
            setTournamentPlayers([]);
        } else {
            setTournamentPlayers(students.map(s => s.id));
        }
    };

    const handleGenerateRoundRobinMatches = async () => {
        if (newTournamentName.trim() === '') return alert('請輸入賽事名稱。');
        if (tournamentPlayers.length < 2) return alert('請至少選擇兩位參賽球員。');
        if (numGroups < 1) return alert('分組數量至少為 1。');
        if (tournamentPlayers.length < numGroups * 2) return alert('球員數量不足以分成這麼多組，請減少分組數量或增加球員。');
        if (new Date(startDate) > new Date(endDate)) return alert('結束日期不能早於開始日期。');

        setIsUpdating(true);

        try {
            // 1. 隨機分組邏輯 (保留原有的優秀設計)
            const groups = Array.from({ length: numGroups }, () => []);
            const shuffledPlayers = [...tournamentPlayers].sort(() => 0.5 - Math.random());
            shuffledPlayers.forEach((playerId, index) => {
                groups[index % numGroups].push(playerId);
            });

            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
            let matchCount = 0;

            // 2. 針對每一個分組，呼叫智慧排程引擎
            groups.forEach((groupPlayerIds, groupIndex) => {
                const groupName = numGroups > 1 ? `${String.fromCharCode(65 + groupIndex)}組` : null;
                
                // 把 ID 陣列轉成演算法需要的物件陣列格式
                const groupPlayersData = groupPlayerIds.map(id => {
                    const student = students.find(s => s.id === id);
                    return { id: student.id, name: student.name };
                });

                // 👇 核心：呼叫演算法，產生帶有日期時間的賽程
                const scheduleResult = generateRoundRobinSchedule(
                    groupPlayersData, 
                    startDate, 
                    endDate, 
                    defaultTime
                );

                if (scheduleResult.success) {
                    // 把演算法算出來的每一場比賽，寫入 Firebase
                    scheduleResult.matches.forEach(match => {
                        batch.set(doc(colRef), {
                            tournamentName: newTournamentName.trim(),
                            groupName: groupName,
                            
                            // 這些是由引擎算出來的：
                            date: match.date,
                            time: match.time,
                            venue: match.venue,
                            
                            player1Id: match.player1Id,
                            player1Name: match.player1Name,
                            player2Id: match.player2Id,
                            player2Name: match.player2Name,
                            
                            score1: null,
                            score2: null,
                            winnerId: null,
                            status: 'scheduled',
                            createdAt: serverTimestamp()
                        });
                        matchCount++;
                    });
                } else {
                    console.warn(`第 ${groupName || 1} 組排程警告:`, scheduleResult.message);
                }
            });
            
            // 3. 提交所有資料
            await batch.commit();
            alert(`✅ 智慧排程完成！\n\n賽事：${newTournamentName.trim()}\n共生成了 ${matchCount} 場比賽，已均勻分配至指定日期。`);
            
            setSelectedTournament(newTournamentName.trim());
            onClose();

        } catch (e) {
            console.error("Failed to generate matches:", e);
            alert("生成比賽失敗，請檢查網路連線。");
        }
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[3rem] shrink-0">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Swords className="text-blue-600"/> 建立智慧循環賽
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all"><X size={24}/></button>
                </div>
                
                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    
                    {/* 賽事基本資訊 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">1. 賽事設定</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">賽事名稱</label>
                                <input type="text" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 transition-all rounded-xl p-3 outline-none font-bold" placeholder="例如：2026 校內秋季聯賽"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">分組數量 (系統會打亂抽籤)</label>
                                <input type="number" min="1" value={numGroups} onChange={(e) => setNumGroups(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 transition-all rounded-xl p-3 outline-none font-bold"/>
                            </div>
                        </div>
                    </div>

                    {/* 智慧排程引擎參數 */}
                    <div className="space-y-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                        <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest border-b border-blue-200 pb-2 flex items-center gap-2">
                            <CalendarRange size={16}/> 2. 智慧排程引擎 (Auto-Scheduler)
                        </h4>
                        <p className="text-xs text-slate-500 font-bold">引擎會根據以下設定的區間，將產生的對戰組合自動均勻分配到每一天。</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-bold text-blue-700 mb-1 block">開始日期</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl p-3 outline-none font-bold text-sm shadow-sm"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-700 mb-1 block">結束日期</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl p-3 outline-none font-bold text-sm shadow-sm"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-700 mb-1 block flex items-center gap-1"><Clock size={12}/> 預設比賽時間</label>
                                <input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="w-full bg-white border border-blue-200 rounded-xl p-3 outline-none font-bold text-sm shadow-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* 參賽球員選擇 */}
                    <div className="space-y-4 flex-1 flex flex-col min-h-[200px]">
                        <div className="flex justify-between items-end border-b pb-2">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                3. 選擇參賽名單
                            </h4>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">已選 {tournamentPlayers.length} 人</span>
                        </div>
                        
                        <button onClick={toggleSelectAll} className="text-sm font-bold text-blue-600 hover:text-blue-800 text-left w-fit transition-colors">
                            {tournamentPlayers.length === students.length ? '取消全選' : '一鍵全選所有學員'}
                        </button>
                        
                        <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 p-4 rounded-2xl border flex-1">
                            {students.sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo)).map(s => {
                                const isSelected = tournamentPlayers.includes(s.id);
                                return (
                                    <label key={s.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                        <input type="checkbox" checked={isSelected} onChange={() => {setTournamentPlayers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}} className="hidden"/>
                                        <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-200'}`}></div>
                                        <div className="truncate">
                                            <span className="font-black text-sm block leading-tight truncate">{s.name}</span>
                                            <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{s.class}</span>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[3rem] flex justify-end gap-4 shrink-0">
                    <SecondaryButton onClick={onClose}>取消</SecondaryButton>
                    <PrimaryButton 
                        onClick={handleGenerateRoundRobinMatches} 
                        loading={isUpdating}
                        icon={Swords}
                        className="px-10"
                    >
                        一鍵生成智能賽程
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
