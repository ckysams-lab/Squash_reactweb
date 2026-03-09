// src/pages/CompetitionsPage.jsx
import React from 'react';
import { Megaphone, ListChecks, Plus, Trophy as TrophyIcon, Calendar as CalendarIcon, ExternalLink, Trash2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CompetitionsPage({
    role,
    competitions,
    generateCompetitionRoster,
    deleteItem,
    db,
    appId
}) {
    const handleAddCompetition = async () => {
        const title = prompt('公告標題');
        if (!title) return;
        
        const date = prompt('發佈日期 (YYYY-MM-DD)');
        if (!date) return;
        
        const url = prompt('相關連結 (如報名表 Google Drive / 官網網址) - 可選:');
        
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), { 
                title, 
                date, 
                url: url || '', 
                createdAt: serverTimestamp() 
            });
        } catch (e) {
            console.error("Error adding competition:", e);
            alert("新增公告失敗，請檢查網絡。");
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 font-bold">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-slate-50 rotate-12">
                    <Megaphone size={120}/>
                </div>
                
                <div className="flex justify-between items-center mb-10 relative z-10">
                    <div>
                        <h3 className="text-3xl font-black">最新比賽與公告</h3>
                        <p className="text-slate-400 text-xs mt-1">追蹤校隊最新動態與賽程詳情</p>
                    </div>
                    {role === 'admin' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={generateCompetitionRoster} 
                                className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2" 
                                title="生成推薦名單"
                            >
                                <ListChecks size={24}/>
                                <span className="text-xs font-black">推薦名單</span>
                            </button>
                            <button 
                                onClick={handleAddCompetition} 
                                className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                            >
                                <Plus size={24}/>
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="space-y-4 relative z-10">
                    {competitions.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                            <p className="text-slate-300 font-black">目前暫無公告發佈</p>
                        </div>
                    )}
                    
                    {competitions.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(c => (
                        <div key={c.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                            <div className="flex gap-6 items-center flex-1">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-all">
                                    <TrophyIcon size={24}/>
                                </div>
                                <div>
                                    <p className="font-black text-xl text-slate-800">{c.title}</p>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                        <CalendarIcon size={12}/> {c.date}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => {
                                        if (c.url) window.open(c.url, '_blank');
                                        else alert('此公告暫無詳細連結');
                                    }}
                                    className={`flex-1 md:flex-none px-6 py-3 border rounded-xl text-xs font-black transition-all flex items-center gap-2 ${c.url ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                >
                                    <ExternalLink size={14}/> 查看詳情
                                </button>
                                {role === 'admin' && (
                                    <button onClick={() => deleteItem('competitions', c.id)} className="p-3 text-slate-300 hover:text-red-500">
                                        <Trash2 size={18}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
