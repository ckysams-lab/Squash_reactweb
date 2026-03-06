// src/components/AddTournamentModal.jsx
import React, { useState } from 'react';
import { X, Swords, Loader2 } from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function AddTournamentModal({ onClose, db, appId, students, setSelectedTournament }) {
    // 將原本在 App.jsx 的狀態移到這裡
    const [newTournamentName, setNewTournamentName] = useState('');
    const [tournamentPlayers, setTournamentPlayers] = useState([]);
    const [numGroups, setNumGroups] = useState(1);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleGenerateRoundRobinMatches = async () => {
        if (newTournamentName.trim() === '') {
            alert('請輸入賽事名稱。');
            return;
        }
        if (tournamentPlayers.length < 2) {
            alert('請至少選擇兩位參賽球員。');
            return;
        }
        if (numGroups < 1) {
            alert('分組數量至少為 1。');
            return;
        }
        if (tournamentPlayers.length < numGroups * 2) {
            alert('球員數量不足以分成這麼多組，請減少分組數量或增加球員。');
            return;
        }

        setIsUpdating(true);
        try {
            const groups = Array.from({ length: numGroups }, () => []);
            const shuffledPlayers = [...tournamentPlayers].sort(() => 0.5 - Math.random());
            shuffledPlayers.forEach((playerId, index) => {
                groups[index % numGroups].push(playerId);
            });

            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
            let matchCount = 0;

            groups.forEach((groupPlayers, groupIndex) => {
                const groupName = `${String.fromCharCode(65 + groupIndex)}組`; 

                for (let i = 0; i < groupPlayers.length; i++) {
                    for (let j = i + 1; j < groupPlayers.length; j++) {
                        const player1 = students.find(s => s.id === groupPlayers[i]);
                        const player2 = students.find(s => s.id === groupPlayers[j]);

                        if (player1 && player2) {
                            batch.set(doc(colRef), {
                                tournamentName: newTournamentName.trim(),
                                groupName: numGroups > 1 ? groupName : null,
                                date: new Date().toISOString().split('T')[0],
                                time: 'N/A',
                                venue: '待定',
                                player1Id: player1.id,
                                player1Name: player1.name,
                                player2Id: player2.id,
                                player2Name: player2.name,
                                score1: null,
                                score2: null,
                                winnerId: null,
                                status: 'scheduled',
                                createdAt: serverTimestamp()
                            });
                            matchCount++;
                        }
                    }
                }
            });
            
            await batch.commit();
            alert(`✅ 成功生成 ${newTournamentName.trim()} 賽事！\n\n共 ${numGroups} 個分組，${matchCount} 場比賽已創建。`);
            
            // 成功後更新外部的選擇狀態，並關閉視窗
            setSelectedTournament(newTournamentName.trim());
            onClose();
        } catch (e) {
            console.error("Failed to generate matches:", e);
            alert("生成比賽失敗，請稍後再試。");
        }
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
                <h3 className="text-3xl font-black text-slate-800 mb-8">建立新的循環賽事</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">1. 賽事名稱</label>
                        <input type="text" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg" placeholder="例如：2024-25 上學期循環賽"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">2. 選擇參賽球員 (已選 {tournamentPlayers.length} 人)</label>
                        <div className="max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border">
                            {students.sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo)).map(s => (
                                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${tournamentPlayers.includes(s.id) ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}>
                                    <input type="checkbox" checked={tournamentPlayers.includes(s.id)} onChange={() => {setTournamentPlayers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}} className="w-5 h-5 rounded-md accent-blue-200"/>
                                    <span className="font-bold text-sm">{s.name} ({s.class})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">3. 分組數量 (自動平均分配)</label>
                        <input type="number" min="1" value={numGroups} onChange={(e) => setNumGroups(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg"/>
                    </div>
                </div>
                <div className="mt-10 flex justify-end">
                    <button onClick={handleGenerateRoundRobinMatches} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all font-black disabled:opacity-50">
                        {isUpdating ? <Loader2 className="animate-spin" /> : <Swords/>} 自動生成賽程
                    </button>
                </div>
            </div>
        </div>
    );
}
