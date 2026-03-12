// src/pages/WallOfFamePage.jsx (Version 2.0 - 2D Trophy Cabinet)

import React, { useState } from 'react';
import { X, Users, Award as AwardIcon, Star } from 'lucide-react';

// 獎盃圖片的 URL (我們使用一個免費、高品質的圖檔)
const TROPHY_IMAGE_URL = 'https://cdn.jsdelivr.net/gh/tabler/tabler-icons@latest/static/trophy.svg';

// 獎項資訊彈出視窗
const TrophyInfoModal = ({ trophy, onClose }) => {
    if (!trophy) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                <img src={TROPHY_IMAGE_URL} alt="Trophy" className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
                <p className="text-sm font-bold text-slate-500">{trophy.year}</p>
                <h2 className="text-2xl font-black text-slate-800 mt-2">{trophy.tournamentName}</h2>
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                    <AwardIcon size={16} />
                    <span className="font-bold">{trophy.award}</span>
                </div>

                {trophy.roster && trophy.roster.length > 0 && (
                    <div className="mt-6 pt-6 border-t text-left">
                        <h3 className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center gap-2"><Users size={14}/> 獲獎隊員</h3>
                        <div className="flex flex-wrap gap-2">
                            {trophy.roster.map((player, index) => (
                                <span key={index} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold">{player}</span>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="mt-8">
                    <button onClick={onClose} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors">關閉</button>
                </div>
            </div>
        </div>
    );
};

// 傳奇校友彈出視窗 (保持不變)
const AlumniModal = ({ alumni, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Users className="text-indigo-500"/> 傳奇校友錄</h2>
                    <p className="text-sm text-slate-500 mt-1">感謝這些為球隊奠定輝煌基礎的前輩們</p>
                </div>
                <div className="p-8 overflow-y-auto space-y-4">
                    {alumni.map(person => (
                        <div key={person.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                                <Star className="text-indigo-400" size={32} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800">{person.name}</p>
                                <p className="text-xs text-slate-400 font-bold mt-1">畢業年份: {person.graduationYear}</p>
                                <p className="mt-2 text-sm text-slate-600 font-semibold">"{person.achievement}"</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 text-center border-t">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">關閉</button>
                </div>
            </div>
        </div>
    );
};


export default function WallOfFamePage({ trophies, alumni }) {
    const [selectedTrophy, setSelectedTrophy] = useState(null); 
    const [showAlumni, setShowAlumni] = useState(false);

    return (
        <div className="space-y-12 animate-in fade-in duration-500 font-bold">
            
            {/* 獎盃櫃 */}
            <div 
                className="p-8 rounded-[3rem] border-8 border-yellow-900/80 shadow-2xl" 
                style={{ background: 'linear-gradient(to right, #4a2c0f, #3b220a)' }}
            >
                <h2 className="text-3xl font-black text-yellow-100 text-center mb-8">團隊榮譽榜</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {trophies.map(trophy => (
                        <div 
                            key={trophy.id} 
                            className="aspect-square bg-black/20 rounded-2xl p-4 flex flex-col justify-between items-center cursor-pointer transition-all duration-300 hover:bg-black/40 hover:scale-105 group"
                            onClick={() => setSelectedTrophy(trophy)}
                        >
                            <div className="flex-1 flex items-center justify-center">
                                <img 
                                    src={TROPHY_IMAGE_URL} 
                                    alt="Trophy" 
                                    className="w-3/4 h-3/4 object-contain drop-shadow-[0_5px_15px_rgba(250,204,21,0.4)] group-hover:drop-shadow-[0_8px_25px_rgba(250,204,21,0.6)] transition-all"
                                />
                            </div>
                            <div className="h-px w-full bg-yellow-700/50 my-2"></div>
                            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-md text-center">
                                <p className="font-black text-sm">{trophy.year}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 傳奇校友按鈕 */}
            <div className="text-center">
                <button 
                    onClick={() => setShowAlumni(true)} 
                    className="bg-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all font-bold text-slate-800 flex items-center gap-3 mx-auto"
                >
                    <Users className="text-indigo-500"/>
                    查看傳奇校友錄
                </button>
            </div>

            {/* 彈出視窗 */}
            {selectedTrophy && <TrophyInfoModal trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />}
            {showAlumni && <AlumniModal alumni={alumni} onClose={() => setShowAlumni(false)} />}
        </div>
    );
}

