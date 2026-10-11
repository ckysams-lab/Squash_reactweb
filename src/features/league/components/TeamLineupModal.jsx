// src/features/league/components/TeamLineupModal.jsx
import React, { useState } from 'react';
import { X, ClipboardList, GripVertical, Save } from 'lucide-react';
import { computeTeamLineupResult } from '../model';

export const TeamLineupModal = ({ match, onClose, onSave }) => {
  const teamSize = match.teamSize || 3;

  const [team1Order, setTeam1Order] = useState(() => {
    const assignedIds = match.rubbers?.map(r => r.p1Id).filter(Boolean) || [];
    const unassigned = (match.team1Roster || []).filter(p => !assignedIds.includes(p.id));
    const assigned = assignedIds.map(id => (match.team1Roster || []).find(p => p.id === id)).filter(Boolean);
    return [...assigned, ...unassigned];
  });

  const [team2Order, setTeam2Order] = useState(() => {
    const assignedIds = match.rubbers?.map(r => r.p2Id).filter(Boolean) || [];
    const unassigned = (match.team2Roster || []).filter(p => !assignedIds.includes(p.id));
    const assigned = assignedIds.map(id => (match.team2Roster || []).find(p => p.id === id)).filter(Boolean);
    return [...assigned, ...unassigned];
  });

  const [rubbers, setRubbers] = useState(() => {
    const initial = match.rubbers ? [...match.rubbers] : [];
    while (initial.length < teamSize) {
      initial.push({ id: `rubber_${initial.length}`, p1Id: '', p1Name: '', p2Id: '', p2Name: '', score1: 0, score2: 0, status: 'pending' });
    }
    return initial.map((r, i) => ({
      ...r,
      p1Id: team1Order[i]?.id || '', p1Name: team1Order[i]?.name || '',
      p2Id: team2Order[i]?.id || '', p2Name: team2Order[i]?.name || ''
    }));
  });

  const updateRubbersFromOrder = (t1, t2) => {
    setRubbers(prev => prev.map((r, i) => ({
      ...r,
      p1Id: t1[i]?.id || '', p1Name: t1[i]?.name || '',
      p2Id: t2[i]?.id || '', p2Name: t2[i]?.name || ''
    })));
  };

  // --- HTML5 Native Drag and Drop Logic ---
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, team, index) => {
    setDraggedItem({ team, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setTimeout(() => {
      if (e.target.classList) e.target.classList.add('opacity-40', 'scale-95', 'border-blue-400', 'shadow-xl');
    }, 0);
  };

  const handleDragEnter = (e, team, index) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.team !== team || draggedItem.index === index) return;

    if (team === 'team1') {
      const items = [...team1Order];
      const [reorderedItem] = items.splice(draggedItem.index, 1);
      items.splice(index, 0, reorderedItem);
      setTeam1Order(items);
      updateRubbersFromOrder(items, team2Order);
      setDraggedItem({ team, index });
    } else {
      const items = [...team2Order];
      const [reorderedItem] = items.splice(draggedItem.index, 1);
      items.splice(index, 0, reorderedItem);
      setTeam2Order(items);
      updateRubbersFromOrder(team1Order, items);
      setDraggedItem({ team, index });
    }
  };

  const handleDragEnd = (e) => {
    if (e.target.classList) e.target.classList.remove('opacity-40', 'scale-95', 'border-blue-400', 'shadow-xl');
    setDraggedItem(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); };
  // --- End Drag and Drop Logic ---

  const updateScore = (idx, field, val) => {
    const newRubbers = [...rubbers];
    newRubbers[idx][field] = val;
    setRubbers(newRubbers);
  };

  const handleSave = () => {
    const { score1, score2, status, winnerId } = computeTeamLineupResult(rubbers, teamSize, match);
    onSave({ ...match, rubbers, score1, score2, status, winnerId });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[2rem] p-8 max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><ClipboardList className="text-blue-500" /> 團體排陣與賽果 (極速拖拽版)</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">按住球員區塊上下拖拽，即可順滑安排第 1 至第 {teamSize} 單打。</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
          {/* 左側：主場隊伍排陣 */}
          <div className="flex-1 flex flex-col bg-blue-50/50 rounded-2xl border border-blue-100 p-4">
            <h4 className="font-black text-blue-800 mb-4 text-center pb-2 border-b border-blue-200">{match.player1Name} 陣容</h4>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
              {team1Order.map((p, index) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'team1', index)}
                  onDragEnter={(e) => handleDragEnter(e, 'team1', index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 ${index < teamSize ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-dashed border-slate-200 opacity-60'}`}
                >
                  <div className="text-slate-400 pointer-events-none"><GripVertical size={18} /></div>
                  <div className="w-12 h-6 flex pointer-events-none items-center justify-center bg-blue-100 text-blue-700 font-black text-[10px] rounded uppercase">
                    {index < teamSize ? `單 ${index + 1}` : '後備'}
                  </div>
                  <span className="font-bold text-sm pointer-events-none text-slate-700 truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 中間：賽果輸入 */}
          <div className="w-full lg:w-48 flex flex-col justify-start space-y-2 pt-[3.25rem]">
            {rubbers.slice(0, teamSize).map((r, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl h-[3.25rem]">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Match {i + 1}</span>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={r.score1} onChange={e => updateScore(i, 'score1', Number(e.target.value))} className="w-10 text-center font-black text-blue-600 bg-white border border-slate-200 rounded outline-none focus:border-blue-400" />
                  <span className="text-slate-300 font-bold">:</span>
                  <input type="number" min="0" value={r.score2} onChange={e => updateScore(i, 'score2', Number(e.target.value))} className="w-10 text-center font-black text-orange-500 bg-white border border-slate-200 rounded outline-none focus:border-orange-400" />
                </div>
              </div>
            ))}
          </div>

          {/* 右側：客場隊伍排陣 */}
          <div className="flex-1 flex flex-col bg-orange-50/50 rounded-2xl border border-orange-100 p-4">
            <h4 className="font-black text-orange-800 mb-4 text-center pb-2 border-b border-orange-200">{match.player2Name} 陣容</h4>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
              {team2Order.map((p, index) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'team2', index)}
                  onDragEnter={(e) => handleDragEnter(e, 'team2', index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing hover:border-orange-400 ${index < teamSize ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-dashed border-slate-200 opacity-60'}`}
                >
                  <div className="text-slate-400 pointer-events-none"><GripVertical size={18} /></div>
                  <div className="w-12 h-6 flex pointer-events-none items-center justify-center bg-orange-100 text-orange-700 font-black text-[10px] rounded uppercase">
                    {index < teamSize ? `單 ${index + 1}` : '後備'}
                  </div>
                  <span className="font-bold text-sm pointer-events-none text-slate-700 truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">取消</button>
          <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-transform active:scale-95">
            <Save size={18} /> 儲存排陣與賽果
          </button>
        </div>
      </div>
    </div>
  );
};
