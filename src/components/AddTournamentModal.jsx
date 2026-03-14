// src/components/AddTournamentModal.jsx (Version 5.0 - Multi-format Foundation)

import React, { useState } from 'react';
import { X, Swords, Loader2, CalendarRange, Clock, Users, Target, LayoutTemplate } from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

// 引入演算法與 UI
import { generateRoundRobinSchedule } from '../utils/scheduler';
import { PrimaryButton, SecondaryButton } from './ui';

export default function AddTournamentModal({ onClose, db, appId, students, setSelectedTournament }) {

    // --- 共同狀態 ---
    const [step, setStep] = useState(1); // 控制精靈表單的步驟 (1: 選擇賽制, 2: 細節設定)
    const [tournamentType, setTournamentType] = useState('round-robin'); // 'round-robin', 'knockout', 'team'
    const [newTournamentName, setNewTournamentName] = useState('');
    const [tournamentPlayers, setTournamentPlayers] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- 聯賽 (Round-Robin) 專屬狀態 ---
    const [numGroups, setNumGroups] = useState(1);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [defaultTime, setDefaultTime] = useState('16:00');

    // --- 團體賽 (Team) 專屬狀態 ---
    const [teamCount, setTeamCount] = useState(2);
    const [playersPerTeam, setPlayersPerTeam] = useState(3);


    // 全選/取消全選
    const toggleSelectAll = () => {
        if (tournamentPlayers.length === students.length) setTournamentPlayers([]);
        else setTournamentPlayers(students.map(s => s.id));
    };

    // 處理下一步
    const handleNextStep = () => {
        if (newTournamentName.trim() === '') return alert('請先輸入賽事名稱！');
        setStep(2);
    };

    // --- 核心：產生賽程 (目前只實作了聯賽，淘汰與團體賽先顯示提示) ---
    const handleGenerateMatches = async () => {
        if (tournamentPlayers.length < 2) return alert('請至少選擇兩位參賽球員。');

        setIsUpdating(true);

        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
            let matchCount = 0;

            if (tournamentType === 'round-robin') {
                // --- 1. 個人聯賽 (Round-Robin) 邏輯 ---
                if (numGroups < 1) { setIsUpdating(false); return alert('分組數量至少為 1。'); }
                
                const groups = Array.from({ length: numGroups }, () => []);
                const shuffledPlayers = [...tournamentPlayers].sort(() => 0.5 - Math.random());
                shuffledPlayers.forEach((playerId, index) => groups[index % numGroups].push(playerId));

                groups.forEach((groupPlayerIds, groupIndex) => {
                    const groupName = numGroups > 1 ? `${String.fromCharCode(65 + groupIndex)}組` : null;
                    const groupPlayersData = groupPlayerIds.map(id => {
                        const student = students.find(s => s.id === id);
                        return { id: student.id, name: student.name };
                    });

                    const scheduleResult = generateRoundRobinSchedule(groupPlayersData, startDate, endDate, defaultTime);

                    if (scheduleResult.success) {
                        scheduleResult.matches.forEach(match => {
                            batch.set(doc(colRef), {
                                tournamentName: newTournamentName.trim(),
                                tournamentType: 'round-robin', // 標記賽制
                                groupName: groupName,
                                date: match.date,
                                time: match.time,
                                venue: match.venue,
                                player1Id: match.player1Id, player1Name: match.player1Name,
                                player2Id: match.player2Id, player2Name: match.player2Name,
                                score1: null, score2: null, winnerId: null, status: 'scheduled',
                                createdAt: serverTimestamp()
                            });
                            matchCount++;
                        });
                    }
                });

            } else if (tournamentType === 'knockout') {
                // --- 2. 個人淘汰賽 (Knockout) 預留區 ---
                setIsUpdating(false);
                return alert("淘汰賽 (Knockout) 的自動排程演算法開發中，敬請期待 Version 5.1！");
                
            } else if (tournamentType === 'team') {
                // --- 3. 團體賽 (Team) 預留區 ---
                setIsUpdating(false);
                return alert("團體賽 (Team) 的自訂排陣介面即將推出，敬請期待 Version 5.2！");
            }

            // 如果有產生比賽，就提交並結束
            if (matchCount > 0) {
                await batch.commit();
                alert(`✅ 成功創建 ${newTournamentName.trim()}！\n共生成了 ${matchCount} 場比賽。`);
                setSelectedTournament(newTournamentName.trim());
                onClose();
            }

        } catch (e) {
            console.error("Failed to generate matches:", e);
            alert("生成比賽失敗，請檢查網路連線。");
        }
        setIsUpdating(false);
    };


    // --- UI 渲染區塊 ---

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Swords className="text-blue-600"/> 建立新賽事
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all"><X size={24}/></button>
                </div>
                
                {/* 捲動內容區 */}
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
                    
                    {/* ===== 步驟一：基本設定與賽制選擇 ===== */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <label className="text-sm font-black text-slate-500 mb-2 block uppercase tracking-widest">賽事名稱</label>
                                <input 
                                    type="text" 
                                    value={newTournamentName} 
                                    onChange={(e) => setNewTournamentName(e.target.value)} 
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 transition-all rounded-2xl p-4 outline-none text-xl font-bold" 
                                    placeholder="例如：2026 校內秋季總決賽"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-slate-500 mb-4 uppercase tracking-widest pl-2">選擇比賽形式 (Tournament Format)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* 選項：個人聯賽 */}
                                    <div 
                                        onClick={() => setTournamentType('round-robin')}
                                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'round-robin' ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-1' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                    >
                                        <div className={`p-4 rounded-full ${tournamentType === 'round-robin' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Users size={32}/></div>
                                        <div>
                                            <h5 className={`font-black text-lg ${tournamentType === 'round-robin' ? 'text-blue-800' : 'text-slate-700'}`}>個人聯賽 (Round-Robin)</h5>
                                            <p className="text-xs font-bold text-slate-500 mt-2">單循環賽制。每位球員都會與組內其他所有人交手一次，適合長期積分賽。</p>
                                        </div>
                                    </div>

                                    {/* 選項：個人淘汰賽 */}
                                    <div 
                                        onClick={() => setTournamentType('knockout')}
                                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'knockout' ? 'border-orange-500 bg-orange-50 shadow-md transform -translate-y-1' : 'border-slate-200 bg-white hover:border-orange-300'}`}
                                    >
                                        <div className={`p-4 rounded-full ${tournamentType === 'knockout' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Target size={32}/></div>
                                        <div>
                                            <h5 className={`font-black text-lg ${tournamentType === 'knockout' ? 'text-orange-800' : 'text-slate-700'}`}>個人淘汰賽 (Knockout)</h5>
                                            <p className="text-xs font-bold text-slate-500 mt-2">樹狀圖晉級。輸一場即淘汰，適合短期、節奏緊湊的錦標賽。</p>
                                        </div>
                                    </div>

                                    {/* 選項：團體賽 */}
                                    <div 
                                        onClick={() => setTournamentType('team')}
                                        className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'team' ? 'border-emerald-500 bg-emerald-50 shadow-md transform -translate-y-1' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                                    >
                                        <div className={`p-4 rounded-full ${tournamentType === 'team' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}><LayoutTemplate size={32}/></div>
                                        <div>
                                            <h5 className={`font-black text-lg ${tournamentType === 'emerald-800' ? 'text-blue-800' : 'text-slate-700'}`}>團體對抗賽 (Team Event)</h5>
                                            <p className="text-xs font-bold text-slate-500 mt-2">分組對抗。可自訂隊伍數量與排陣，例如「3單打、2雙打」的校際規格。</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== 步驟二：球員選擇與細節設定 ===== */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col">
                            
                            {/* 動態顯示對應賽制的設定面板 */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 mb-4 pb-2 border-b flex items-center gap-2">
                                    {tournamentType === 'round-robin' && <><Users className="text-blue-500"/> 聯賽參數設定</>}
                                    {tournamentType === 'knockout' && <><Target className="text-orange-500"/> 淘汰賽參數設定</>}
                                    {tournamentType === 'team' && <><LayoutTemplate className="text-emerald-500"/> 團體賽參數設定</>}
                                </h4>
                                
                                {/* 根據選擇的賽制，顯示不同的設定欄位 */}
                                {tournamentType === 'round-robin' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">分組數量</label>
                                            <input type="number" min="1" value={numGroups} onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">開始日期</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">結束日期</label>
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">預設時間</label>
                                            <input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                    </div>
                                )}

                                {tournamentType === 'knockout' && (
                                     <div className="p-4 bg-orange-50 text-orange-800 rounded-xl font-bold text-sm">
                                         系統將根據您下方選擇的球員總數，自動計算並生成 8強、16強 或 32強 的種子排序。
                                     </div>
                                )}

                                {tournamentType === 'team' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">建立多少支隊伍？</label>
                                            <input type="number" min="2" value={teamCount} onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">每隊需要多少人？ (單打點數)</label>
                                            <input type="number" min="1" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(parseInt(e.target.value) || 3)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 參賽球員選擇 (共用) */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[300px]">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-4">
                                    <h4 className="text-lg font-black text-slate-800">
                                        選擇參賽球員名單
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full">已勾選: {tournamentPlayers.length} 人</span>
                                        <button onClick={toggleSelectAll} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                            {tournamentPlayers.length === students.length ? '取消全選' : '一鍵全選'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pr-2 content-start flex-1">
                                    {students.sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo)).map(s => {
                                        const isSelected = tournamentPlayers.includes(s.id);
                                        return (
                                            <label key={s.id} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                <input type="checkbox" checked={isSelected} onChange={() => {setTournamentPlayers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}} className="hidden"/>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <div className="truncate">
                                                    <span className={`font-black text-sm block leading-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{s.name}</span>
                                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{s.class}</span>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    {step === 1 ? (
                        <>
                            <SecondaryButton onClick={onClose}>取消</SecondaryButton>
                            <PrimaryButton onClick={handleNextStep} className="px-12">下一步</PrimaryButton>
                        </>
                    ) : (
                        <>
                            <SecondaryButton onClick={() => setStep(1)}>上一步</SecondaryButton>
                            <PrimaryButton 
                                onClick={handleGenerateMatches} 
                                loading={isUpdating}
                                icon={Swords}
                                className="px-8"
                            >
                                {tournamentType === 'round-robin' ? '生成聯賽賽程' : tournamentType === 'knockout' ? '生成淘汰賽樹狀圖' : '進入團體賽排陣'}
                            </PrimaryButton>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
