// src/pages/WallOfFamePage.jsx (Version 1.0)

import React from 'react';
import { Trophy, Users, Star, Award as AwardIcon } from 'lucide-react';

const WallOfFamePage = ({ trophies, alumni }) => {
    return (
        <div className="space-y-12 animate-in fade-in duration-500 font-bold">
            
            {/* Section 1: 團隊獎項 */}
            <div>
                <div className="mb-8 text-center">
                    <Trophy className="mx-auto text-yellow-500 mb-2" size={48} />
                    <h2 className="text-3xl font-black text-slate-800">團隊榮譽榜</h2>
                    <p className="text-sm text-slate-400 mt-1">記錄每一個揮灑汗水換來的獎盃</p>
                </div>
                
                <div className="space-y-8">
                    {trophies.length > 0 ? trophies.map(trophy => (
                        <div key={trophy.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:border-blue-200">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl text-center">
                                    <span className="block text-3xl font-black text-blue-600">{trophy.year}</span>
                                    <span className="text-xs tracking-widest">年份</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-slate-800">{trophy.tournamentName}</h3>
                                    <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                                        <AwardIcon size={16} />
                                        <span className="font-bold text-sm">{trophy.award}</span>
                                    </div>
                                    {trophy.roster && trophy.roster.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">獲獎隊員</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {trophy.roster.map((player, index) => (
                                                    <span key={index} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{player}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-400 py-10">暫無團隊獎項紀錄，請教練在系統設定中匯入。</p>
                    )}
                </div>
            </div>

            {/* Section 2: 傳奇校友 */}
            <div>
                <div className="mb-8 text-center">
                    <Users className="mx-auto text-indigo-500 mb-2" size={48} />
                    <h2 className="text-3xl font-black text-slate-800">傳奇校友錄</h2>
                    <p className="text-sm text-slate-400 mt-1">感謝這些為球隊奠定輝煌基礎的前輩</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {alumni.length > 0 ? alumni.map(person => (
                        <div key={person.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center flex flex-col items-center transition-all hover:shadow-lg hover:scale-105">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
                                <Star className="text-indigo-300" size={40} />
                            </div>
                            <p className="text-xl font-black text-slate-800">{person.name}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1">畢業年份: {person.graduationYear}</p>
                            <p className="mt-4 text-sm text-slate-600 font-semibold h-20">"{person.achievement}"</p>
                        </div>
                    )) : (
                         <p className="text-center text-slate-400 py-10 col-span-full">暫無傳奇校友紀錄，請教練在系統設定中匯入。</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WallOfFamePage;
