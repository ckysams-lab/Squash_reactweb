// src/pages/ExternalMatchesPage.jsx (Version 2.1 - Batch Input)

import React, { useState, useMemo } from 'react';
import { BookMarked, Save, Globe, Trophy, User, X, PlusCircle, Trash2 } from 'lucide-react';
import { writeBatch, collection, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

const appId = 'bcklas-squash-core-v1';

// A single row for entering a result
const ResultRow = ({ rowData, students, onUpdate, onRemove }) => {
    return (
        <div className="grid grid-cols-[2fr,1fr,1fr,1.2fr,1fr,auto] gap-3 items-center p-3 bg-white rounded-2xl border">
            {/* Player Select */}
            <select 
                value={rowData.player1Id} 
                onChange={e => onUpdate(rowData.id, 'player1Id', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-blue-900 appearance-none cursor-pointer text-sm"
            >
                <option value="">選擇隊員...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
            </select>

            {/* Opponent Info */}
            <input type="text" placeholder="對手學校" value={rowData.opponentSchool} onChange={e => onUpdate(rowData.id, 'opponentSchool', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-sm" />
            <input type="text" placeholder="對手姓名" value={rowData.opponentPlayerName} onChange={e => onUpdate(rowData.id, 'opponentPlayerName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-sm" />

            {/* Win/Loss Buttons */}
            <div className="flex gap-2">
                <button onClick={() => onUpdate(rowData.id, 'isWin', true)} className={`flex-1 py-2 text-xs rounded-lg font-black transition-all border ${rowData.isWin === true ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white text-slate-400 hover:border-emerald-300'}`}>勝</button>
                <button onClick={() => onUpdate(rowData.id, 'isWin', false)} className={`flex-1 py-2 text-xs rounded-lg font-black transition-all border ${rowData.isWin === false ? 'bg-rose-100 border-rose-400 text-rose-700' : 'bg-white text-slate-400 hover:border-rose-300'}`}>敗</button>
            </div>

            {/* Score Input */}
            <input type="text" placeholder="比分" value={rowData.score} onChange={e => onUpdate(rowData.id, 'score', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono text-sm" />
            
            {/* Remove Button */}
            <button onClick={() => onRemove(rowData.id)} className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-500 hover:text-white transition-all">
                <Trash2 size={16} />
            </button>
        </div>
    );
};

export default function ExternalMatchesPage({ externalTournaments, students }) {
    const [commonInfo, setCommonInfo] = useState({ tournamentName: '', date: new Date().toISOString().split('T')[0] });
    const [results, setResults] = useState([{ id: 1, player1Id: '', opponentSchool: '', opponentPlayerName: '', isWin: null, score: '' }]);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const handleAddRow = () => {
        setResults(prev => [...prev, { id: Date.now(), player1Id: '', opponentSchool: '', opponentPlayerName: '', isWin: null, score: '' }]);
    };

    const handleRemoveRow = (id) => {
        setResults(prev => prev.filter(row => row.id !== id));
    };

    const handleUpdateRow = (id, field, value) => {
        setResults(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleSaveAllResults = async () => {
        if (!commonInfo.tournamentName || !commonInfo.date) {
            alert('請先選擇賽事名稱和比賽日期。');
            return;
        }

        const validResults = results.filter(r => r.player1Id && r.isWin !== null);
        if (validResults.length === 0) {
            alert('沒有可儲存的有效賽果。請至少為一名隊員選擇「勝」或「敗」。');
            return;
        }

        setIsUpdating(true);
        try {
            const batch = writeBatch(db);
            const matchesColRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');

            for (const result of validResults) {
                const player = students.find(s => s.id === result.player1Id);
                if (!player) continue;

                const newMatchRef = doc(matchesColRef);
                const matchData = {
                    ...commonInfo,
                    player1Id: result.player1Id,
                    player1Name: player.name,
                    opponentSchool: result.opponentSchool,
                    opponentPlayerName: result.opponentPlayerName,
                    isWin: result.isWin,
                    externalMatchScore: result.score,
                    winnerId: result.isWin ? result.player1Id : null,
                    matchType: 'external',
                    status: 'completed',
                    timestamp: serverTimestamp(),
                };
                batch.set(newMatchRef, matchData);
            }

            await batch.commit();
            alert(`✅ 成功儲存 ${validResults.length} 筆賽果！`);
            setResults([{ id: 1, player1Id: '', opponentSchool: '', opponentPlayerName: '', isWin: null, score: '' }]); // Reset form
        } catch (error) {
            console.error("Batch save failed: ", error);
            alert('批量儲存失敗，請檢查網絡連線。');
        }
        setIsUpdating(false);
    };

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo));
    }, [students]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-7xl mx-auto">
            <PageHeader title="校外賽批量紀錄" subtitle="一次性為單個賽事，登錄所有隊員的比賽成績" icon={BookMarked} />

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">賽事名稱</label>
                        <select value={commonInfo.tournamentName} onChange={e => setCommonInfo({...commonInfo, tournamentName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer">
                            <option value="" disabled>-- 請選擇賽事 --</option>
                            {externalTournaments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">比賽日期</label>
                        <input type="date" value={commonInfo.date} onChange={e => setCommonInfo({...commonInfo, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-[2fr,1fr,1fr,1.2fr,1fr,auto] gap-3 px-3 text-xs text-slate-500 uppercase">
                        <span>我方隊員</span>
                        <span>對手學校</span>
                        <span>對手姓名</span>
                        <span className="text-center">本場結果</span>
                        <span>最終比分</span>
                        <span>操作</span>
                    </div>
                    {results.map(row => (
                        <ResultRow key={row.id} rowData={row} students={sortedStudents} onUpdate={handleUpdateRow} onRemove={handleRemoveRow} />
                    ))}
                </div>
                
                <div className="mt-6 flex justify-start">
                    <button onClick={handleAddRow} className="flex items-center gap-2 text-sm font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all">
                        <PlusCircle size={16} /> 新增一名隊員
                    </button>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                    <PrimaryButton icon={Save} onClick={handleSaveAllResults} loading={isUpdating} className="px-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 w-full md:w-auto">
                        儲存全部 {results.filter(r => r.player1Id && r.isWin !== null).length > 0 && `(${results.filter(r => r.player1Id && r.isWin !== null).length})`} 筆賽果
                    </PrimaryButton>
                </div>
            </Card>
        </div>
    );
}

