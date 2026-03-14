// src/components/PortfolioGenerator.jsx (Version 1.0)

import React, { forwardRef } from 'react';
import { Trophy, Award, Activity, Calendar } from 'lucide-react';
import { ACHIEVEMENT_DATA } from '../constants/data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const PortfolioGenerator = forwardRef(({ student, data, schoolLogo }, ref) => {
    if (!student || !data) return null;

    // 擷取雷達圖資料
    const radarData = data.radarData || [];
    // 擷取並排序最近的獎項 (最多顯示 5 個最重要的)
    const recentAwards = data.achievements.slice(0, 5) || [];

    // 定義 A4 尺寸的固定比例 (210mm x 297mm)
    // 為了保證截圖畫質，我們把容器設得很大，但比例是標準 A4
    return (
        <div ref={ref} className="bg-white w-[1190px] h-[1684px] p-16 flex flex-col font-sans relative overflow-hidden" style={{ boxSizing: 'border-box' }}>
            
            {/* 裝飾性背景色塊 */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-bl-full -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[800px] h-[400px] bg-slate-50 -z-10" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}></div>

            {/* Header: 校徽與標題 */}
            <div className="flex justify-between items-start border-b-4 border-blue-900 pb-8 mb-12">
                <div className="flex items-center gap-6">
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="School Logo" className="h-24 w-24 object-contain" />
                    ) : (
                        <div className="h-24 w-24 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400">LOGO</div>
                    )}
                    <div>
                        <h1 className="text-5xl font-black text-blue-900 tracking-tight">壁球校隊 學生運動員簡歷</h1>
                        <p className="text-xl font-bold text-slate-500 uppercase tracking-widest mt-2">Squash Team Player Portfolio</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-400">Generate Date</p>
                    <p className="text-lg font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Section 1: 個人基本資料 */}
            <div className="flex gap-12 mb-12">
                {/* 大頭照 */}
                <div className="w-56 h-64 bg-slate-100 rounded-3xl border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-7xl font-black text-slate-300">{student.name[0]}</span>
                    )}
                </div>
                
                {/* 姓名與核心數據 */}
                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-6xl font-black text-slate-800 mb-2">{student.name}</h2>
                    <p className="text-2xl font-bold text-slate-500 mb-8">Class {student.class} (No. {student.classNo})</p>
                    
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">目前積分</p>
                            <p className="text-4xl font-black text-blue-900 mt-1">{student.totalPoints || student.points || 0}</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">聯賽勝率</p>
                            <p className="text-4xl font-black text-emerald-900 mt-1">{data.winRate}%</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest">目前章別</p>
                            <p className="text-3xl font-black text-purple-900 mt-1">{student.badge}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-12 flex-1">
                {/* Section 2: 綜合能力雷達圖 (左側) */}
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-2">
                        <Activity className="text-rose-500" /> 綜合能力評估 (Assessment)
                    </h3>
                    <div className="bg-slate-50 rounded-3xl p-6 h-[400px]">
                        {radarData && radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#cbd5e1" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar name="能力值" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                尚無體能與技術評估資料
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: 榮譽與成就 (右側) */}
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-2">
                        <Trophy className="text-amber-500" /> 榮譽與成就 (Achievements)
                    </h3>
                    <div className="space-y-4">
                        {recentAwards.length > 0 ? recentAwards.map((ach, idx) => {
                            const badge = ACHIEVEMENT_DATA[ach.badgeId];
                            if (!badge) return null;
                            const levelData = badge.levels[ach.level || 1];
                            return (
                                <div key={idx} className="flex items-center gap-4 bg-white border-2 border-slate-100 p-4 rounded-2xl shadow-sm">
                                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                                        {React.cloneElement(badge.icon, { size: 32 })}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">{levelData.name}</h4>
                                        <p className="text-sm font-bold text-slate-500">{levelData.desc}</p>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="p-8 bg-slate-50 rounded-3xl text-center text-slate-400 font-bold text-lg">
                                持續努力，累積你的第一面獎牌！
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-slate-200 flex justify-between items-center text-slate-400">
                <p className="font-bold">BCKLAS Squash Team Management System</p>
                <p className="font-bold flex items-center gap-2"><Award size={16}/> Certified Player Record</p>
            </div>
        </div>
    );
});

export default PortfolioGenerator;
