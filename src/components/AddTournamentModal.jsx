// src/components/AddTournamentModal.jsx (Version 5.2 - Team Formation)

import React, { useState } from 'react';
import { X, Swords, Loader2, CalendarRange, Clock, Users, Target, LayoutTemplate, UserPlus, Trash2 } from 'lucide-react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

import { generateRoundRobinSchedule, generateKnockoutSchedule } from '../utils/scheduler';
import { PrimaryButton, SecondaryButton } from './ui';

export default function AddTournamentModal({ onClose, db, appId, students, setSelectedTournament }) {

    const [step, setStep] = useState(1);
    const [tournamentType, setTournamentType] = useState('round-robin');
    const [newTournamentName, setNewTournamentName] = useState('');
    const [tournamentPlayers, setTournamentPlayers] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- 聯賽/淘汰賽共用狀態 ---
    const [numGroups, setNumGroups] = useState(1);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [defaultTime, setDefaultTime] = useState('16:00');

    // --- 團體賽專屬狀態 ---
    const [teamCount, setTeamCount] = useState(2); // 幾支隊伍對抗
    const [playersPerTeam, setPlayersPerTeam] = useState(3); // 每隊幾個單打
    // 儲存排陣結果的結構： { 'team0': { name: '紅隊', players: [id1, id2, id3] }, 'team1': {...} }
    const [teamLineups, setTeamLineups] = useState({}); 


    const toggleSelectAll = () => {
        if (tournamentPlayers.length === students.length) setTournamentPlayers([]);
        else setTournamentPlayers(students.map(s => s.id));
    };

    const handleNextStep = () => {
        if (newTournamentName.trim() === '') return alert('請先輸入賽事名稱！');
        if (step === 2) {
            if (tournamentPlayers.length < 2) return alert('請至少選擇兩位參賽球員。');
            
            // 如果是團體賽，進入排陣畫面 (Step 3)
            if (tournamentType === 'team') {
                const requiredPlayers = teamCount * playersPerTeam;
                if (tournamentPlayers.length < requiredPlayers) {
                    return alert(`您設定了 ${teamCount} 隊，每隊 ${playersPerTeam} 人，總共需要 ${requiredPlayers} 名球員，但目前只選了 ${tournamentPlayers.length} 人。`);
                }
                
                // 初始化排陣資料結構
                const initialLineups = {};
                for (let i = 0; i < teamCount; i++) {
                    initialLineups[`team${i}`] = {
                        name: `隊伍 ${String.fromCharCode(65 + i)}`, // 預設隊名 A, B, C...
                        players: Array(playersPerTeam).fill(null) // 預留空位
                    };
                }
                setTeamLineups(initialLineups);
                setStep(3);
                return;
            }
        }
        setStep(step + 1);
    };

    // 處理團體賽的球員分配 (簡易點擊分配法)
    const assignPlayerToTeam = (teamKey, slotIndex, playerId) => {
        setTeamLineups(prev => {
            const newLineups = { ...prev };
            // 確保同一個人不會重複出現在其他地方 (先從其他地方拔掉)
            Object.keys(newLineups).forEach(tk => {
                const idx = newLineups[tk].players.indexOf(playerId);
                if (idx !== -1) newLineups[tk].players[idx] = null;
            });
            // 放入新位置
            newLineups[teamKey].players[slotIndex] = playerId;
            return newLineups;
        });
    };

    const removePlayerFromTeam = (teamKey, slotIndex) => {
        setTeamLineups(prev => {
            const newLineups = { ...prev };
            newLineups[teamKey].players[slotIndex] = null;
            return newLineups;
        });
    };


    const handleGenerateMatches = async () => {
        setIsUpdating(true);

        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
            let matchCount = 0;

            if (tournamentType === 'round-robin') {
                // ... (保留原本的 Round-Robin 邏輯) ...
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
                                tournamentName: newTournamentName.trim(), tournamentType: 'round-robin',
                                groupName: groupName, date: match.date, time: match.time, venue: match.venue,
                                player1Id: match.player1Id, player1Name: match.player1Name,
                                player2Id: match.player2Id, player2Name: match.player2Name,
                                score1: null, score2: null, winnerId: null, status: 'scheduled', createdAt: serverTimestamp()
                            });
                            matchCount++;
                        });
                    }
                });

            } else if (tournamentType === 'knockout') {
                 // ... (保留原本的 Knockout 邏輯) ...
                const knockoutPlayersData = tournamentPlayers.map(id => {
                    const student = students.find(s => s.id === id);
                    return { id: student.id, name: student.name };
                });

                const scheduleResult = generateKnockoutSchedule(knockoutPlayersData, startDate, defaultTime);

                if (scheduleResult.success) {
                    scheduleResult.matches.forEach(match => {
                        batch.set(doc(colRef), {
                            tournamentName: newTournamentName.trim(), tournamentType: 'knockout',
                            groupName: match.groupName, date: match.date, time: match.time, venue: match.venue,
                            player1Id: match.player1Id, player1Name: match.player1Name,
                            player2Id: match.player2Id, player2Name: match.player2Name,
                            score1: match.score1, score2: match.score2, winnerId: match.winnerId, status: match.status, createdAt: serverTimestamp()
                        });
                        matchCount++;
                    });
                } else {
                    setIsUpdating(false);
                    return alert(scheduleResult.message);
                }

            } else if (tournamentType === 'team') {
                // --- 3. 團體賽生成邏輯 ---
                // 檢查是否所有位置都填滿了
                let isComplete = true;
                Object.values(teamLineups).forEach(team => {
                    if (team.players.some(p => p === null)) isComplete = false;
                });
                if (!isComplete) {
                    setIsUpdating(false);
                    return alert('請將所有隊伍的排陣（單打席次）填滿後再生成賽程。');
                }

                // 產生隊伍間的對戰組合 (這裡簡單作法：如果是2隊就打一場，如果是多隊就產生單循環)
                const teamKeys = Object.keys(teamLineups);
                for (let i = 0; i < teamKeys.length; i++) {
                    for (let j = i + 1; j < teamKeys.length; j++) {
                        const teamA = teamLineups[teamKeys[i]];
                        const teamB = teamLineups[teamKeys[j]];
                        
                        const matchupName = `${teamA.name} vs ${teamB.name}`;

                        // 為這個對戰組合產生每一點(單打)的比賽
                        for (let slot = 0; slot < playersPerTeam; slot++) {
                            const p1Info = students.find(s => s.id === teamA.players[slot]);
                            const p2Info = students.find(s => s.id === teamB.players[slot]);

                            batch.set(doc(colRef), {
                                tournamentName: newTournamentName.trim(),
                                tournamentType: 'team',
                                groupName: matchupName, // 用對戰隊伍名稱當作組別名
                                matchOrder: `第 ${slot + 1} 單打`, // 標示這是第幾點
                                date: startDate, // 團體賽預設同一天打
                                time: defaultTime,
                                venue: '學校壁球場',
                                player1Id: p1Info.id, player1Name: `${teamA.name} - ${p1Info.name}`, // 名字前加上隊名方便辨識
                                player2Id: p2Info.id, player2Name: `${teamB.name} - ${p2Info.name}`,
                                score1: null, score2: null, winnerId: null, status: 'scheduled', createdAt: serverTimestamp()
                            });
                            matchCount++;
                        }
                    }
                }
            }

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

    // 取得尚未被分配到任何隊伍的球員
    const getUnassignedPlayers = () => {
        const assignedIds = new Set();
        Object.values(teamLineups).forEach(t => {
            t.players.forEach(p => { if (p) assignedIds.add(p); });
        });
        return tournamentPlayers.filter(id => !assignedIds.has(id));
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className={`bg-white rounded-[3rem] w-full flex flex-col max-h-[90vh] shadow-2xl relative overflow-hidden transition-all duration-300 ${step === 3 ? 'max-w-6xl' : 'max-w-4xl'}`} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div className="flex items-center gap-4">
                        <Swords className="text-blue-600"/>
                        <h3 className="text-2xl font-black text-slate-800">建立新賽事</h3>
                        <div className="flex gap-2 ml-4">
                            {[1, 2, tournamentType === 'team' ? 3 : null].filter(Boolean).map(s => (
                                <div key={s} className={`w-8 h-2 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all"><X size={24}/></button>
                </div>
                
                {/* 捲動內容區 */}
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
                    
                    {/* ===== 步驟一：基本設定與賽制選擇 ===== */}
                    {step === 1 && (
                        // ... (與上一版完全相同，為了簡潔省略) ...
                        <div className="space-y-8 animate-in slide-in-from-right-8">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <label className="text-sm font-black text-slate-500 mb-2 block uppercase tracking-widest">賽事名稱</label>
                                <input type="text" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 transition-all rounded-2xl p-4 outline-none text-xl font-bold" placeholder="例如：2026 校內秋季總決賽" autoFocus />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-500 mb-4 uppercase tracking-widest pl-2">選擇比賽形式</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div onClick={() => setTournamentType('round-robin')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'round-robin' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white'}`}>
                                        <div className={`p-4 rounded-full ${tournamentType === 'round-robin' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Users size={32}/></div>
                                        <div><h5 className="font-black text-lg">個人聯賽</h5></div>
                                    </div>
                                    <div onClick={() => setTournamentType('knockout')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'knockout' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-200 bg-white'}`}>
                                        <div className={`p-4 rounded-full ${tournamentType === 'knockout' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Target size={32}/></div>
                                        <div><h5 className="font-black text-lg">個人淘汰賽</h5></div>
                                    </div>
                                    <div onClick={() => setTournamentType('team')} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-3 ${tournamentType === 'team' ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white'}`}>
                                        <div className={`p-4 rounded-full ${tournamentType === 'team' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}><LayoutTemplate size={32}/></div>
                                        <div><h5 className="font-black text-lg">團體對抗賽</h5></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== 步驟二：球員選擇與細節設定 ===== */}
                    {step === 2 && (
                         <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 mb-4 pb-2 border-b">
                                    參數設定
                                </h4>
                                
                                {tournamentType === 'round-robin' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">分組數量</label><input type="number" min="1" value={numGroups} onChange={(e) => setNumGroups(parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">開始日期</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">結束日期</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">預設時間</label><input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                    </div>
                                )}
                                {tournamentType === 'knockout' && (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">開始日期</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">預設時間</label><input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                    </div>
                                )}
                                {tournamentType === 'team' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">建立多少支隊伍？</label><input type="number" min="2" max="8" value={teamCount} onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">每隊需要多少單打？</label><input type="number" min="1" max="10" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(parseInt(e.target.value) || 3)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">比賽日期</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-sm"/></div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[300px]">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-4">
                                    <h4 className="text-lg font-black text-slate-800">選擇參賽球員名單</h4>
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
                                            <label key={s.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                                <input type="checkbox" checked={isSelected} onChange={() => {setTournamentPlayers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}} className="hidden"/>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <div className="truncate">
                                                    <span className={`font-black text-sm block leading-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{s.name}</span>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== 步驟三：團體排陣介面 (僅團體賽可見) ===== */}
                    {step === 3 && tournamentType === 'team' && (
                        <div className="animate-in slide-in-from-right-8 h-full flex flex-col md:flex-row gap-6">
                            
                            {/* 左側：待分配球員名單 */}
                            <div className="w-full md:w-1/3 bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col h-[500px]">
                                <h4 className="font-black text-slate-700 border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                                    待命球員庫
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{getUnassignedPlayers().length} 人</span>
                                </h4>
                                <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                                    {getUnassignedPlayers().map(id => {
                                        const s = students.find(x => x.id === id);
                                        return (
                                            <div key={id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-sm group">
                                                <span className="font-bold text-sm">{s.name}</span>
                                                {/* 下拉選單讓教練選擇要把他放去哪一隊的哪一點 */}
                                                <select 
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val) {
                                                            const [teamKey, slot] = val.split('-');
                                                            assignPlayerToTeam(teamKey, parseInt(slot), id);
                                                        }
                                                    }}
                                                    className="bg-blue-50 text-blue-700 text-xs font-bold rounded-lg px-2 py-1 outline-none border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <option value="">分配至...</option>
                                                    {Object.keys(teamLineups).map(tk => (
                                                        <optgroup key={tk} label={teamLineups[tk].name}>
                                                            {teamLineups[tk].players.map((p, idx) => (
                                                                !p && <option key={`${tk}-${idx}`} value={`${tk}-${idx}`}>第 {idx+1} 單打</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 右側：各隊排陣板 */}
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex gap-6 min-w-max pb-4 h-full">
                                    {Object.keys(teamLineups).map((teamKey, tIdx) => (
                                        <div key={teamKey} className="w-72 bg-white rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col shrink-0">
                                            {/* 隊伍標題 */}
                                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
                                                <input 
                                                    type="text" 
                                                    value={teamLineups[teamKey].name}
                                                    onChange={(e) => {
                                                        setTeamLineups(prev => ({...prev, [teamKey]: {...prev[teamKey], name: e.target.value}}))
                                                    }}
                                                    className="w-full bg-transparent font-black text-xl text-center outline-none focus:bg-white focus:ring-2 ring-blue-200 rounded-lg py-1 transition-all"
                                                />
                                            </div>
                                            {/* 單打席次列表 */}
                                            <div className="p-4 flex-1 space-y-3">
                                                {teamLineups[teamKey].players.map((playerId, slotIdx) => {
                                                    const pInfo = playerId ? students.find(s => s.id === playerId) : null;
                                                    return (
                                                        <div key={slotIdx} className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${pInfo ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-black text-slate-400 w-5">#{slotIdx + 1}</span>
                                                                {pInfo ? (
                                                                    <span className="font-bold text-blue-900">{pInfo.name}</span>
                                                                ) : (
                                                                    <span className="text-sm font-bold text-slate-300">虛位以待...</span>
                                                                )}
                                                            </div>
                                                            {pInfo && (
                                                                <button onClick={() => removePlayerFromTeam(teamKey, slotIdx)} className="text-blue-400 hover:text-red-500 bg-white rounded-md p-1 shadow-sm transition-colors">
                                                                    <X size={14}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
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
                    ) : step === 2 ? (
                        <>
                            <SecondaryButton onClick={() => setStep(1)}>上一步</SecondaryButton>
                            <PrimaryButton 
                                onClick={tournamentType === 'team' ? handleNextStep : handleGenerateMatches} 
                                loading={isUpdating}
                                icon={tournamentType === 'team' ? Users : Swords}
                                className="px-8"
                            >
                                {tournamentType === 'team' ? '進入排陣畫板' : '一鍵生成賽程'}
                            </PrimaryButton>
                        </>
                    ) : (
                        <>
                            <SecondaryButton onClick={() => setStep(2)}>回上一頁</SecondaryButton>
                            <PrimaryButton 
                                onClick={handleGenerateMatches} 
                                loading={isUpdating}
                                icon={Swords}
                                className="px-8 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                            >
                                確認排陣並發佈賽事
                            </PrimaryButton>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
