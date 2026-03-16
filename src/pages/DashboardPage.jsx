// src/pages/DashboardPage.jsx (Version 4.0 - Team Academic-Sports Balance)

import React, { useState, useMemo } from 'react';
import { 
  Users, CalendarIcon, Award, LayoutDashboard, TrendingUp, CheckCircle2, 
  Download, BookOpen // 👈 引入 BookOpen 圖示
} from 'lucide-react';
import { 
  BarChart, Bar, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis // 👈 引入 ScatterChart 相關元件
} from 'recharts';

import { PageHeader, Card, SecondaryButton } from '../components/ui.jsx';

export default function DashboardPage({
    competitions,
    schedules,
    students,
    dashboardStats,
    assessments // 👈 接收新傳入的 assessments
}) {

    // --- 1. 各班級人數分佈資料 (保持不變) ---
    const classDistributionData = useMemo(() => {
        if (!students || students.length === 0) return [];
        const classCounts = {};
        students.forEach(s => {
            const className = s.squashClass || '未分班';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });
        return Object.entries(classCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [students]);


    // --- 2. 👇 全新：全隊學業與訓練散佈圖資料處理 👇 ---
    const [showExam, setShowExam] = useState({ T1: true, T2: true, T3: true });

    const toggleExam = (term) => setShowExam(prev => ({ ...prev, [term]: !prev[term] }));

    const { scatterDataT1, scatterDataT2, scatterDataT3 } = useMemo(() => {
        const t1 = []; const t2 = []; const t3 = [];
        
        if (!assessments || assessments.length === 0) return { scatterDataT1: t1, scatterDataT2: t2, scatterDataT3: t3 };

        // 針對每一個學生，只取他「最新」的一筆評估紀錄 (避免重複畫點)
        students.forEach(student => {
            const studentAssessments = assessments.filter(a => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
            if (studentAssessments.length > 0) {
                const latestAsm = studentAssessments[0];
                // 如果有 T1 資料，就塞進 t1 陣列
                if (latestAsm.rankT1 && latestAsm.hoursT1) {
                    t1.push({ x: Number(latestAsm.hoursT1), y: Number(latestAsm.rankT1), name: student.name });
                }
                if (latestAsm.rankT2 && latestAsm.hoursT2) {
                    t2.push({ x: Number(latestAsm.hoursT2), y: Number(latestAsm.rankT2), name: student.name });
                }
                if (latestAsm.rankT3 && latestAsm.hoursT3) {
                    t3.push({ x: Number(latestAsm.hoursT3), y: Number(latestAsm.rankT3), name: student.name });
                }
            }
        });

        return { scatterDataT1: t1, scatterDataT2: t2, scatterDataT3: t3 };
    }, [assessments, students]);
    // ----------------------------------------------------


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-7xl mx-auto">
            
            <PageHeader 
                title="管理概況" 
                subtitle="球隊運作數據與待辦事項摘要" 
                icon={LayoutDashboard} 
            />

            {/* 區塊 1: 核心數據摘要 */}
            <Card className="p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0"><CalendarIcon size={32}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">本月訓練總數</p>
                            <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-slate-800">{dashboardStats.thisMonthTrainings}</span><span className="text-sm font-bold text-slate-400">堂</span></div>
                        </div>
                    </div>
                    <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm shrink-0"><TrendingUp size={32}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">距離下一場比賽</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800">{dashboardStats.daysToNextMatch}</span>
                                {dashboardStats.daysToNextMatch !== "Today!" && dashboardStats.daysToNextMatch !== "-" && <span className="text-sm font-bold text-slate-400">天</span>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50/50 rounded-3xl p-6 border border-yellow-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-yellow-500 shadow-sm shrink-0"><Award size={32}/></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">本學年榮譽總數</p>
                            <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-slate-800">{dashboardStats.awardsThisYear}</span><span className="text-sm font-bold text-slate-400">項</span></div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 區塊 2: 訓練班人數分佈圖表 */}
                <Card className="flex flex-col h-[500px]">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">班級人數分佈</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">目前各訓練梯隊之在籍人數</p>
                        </div>
                        <Users className="text-slate-300" size={24} />
                    </div>
                    <div className="flex-1 w-full min-h-0 bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                        {classDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                        {classDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">暫無分班資料</div>
                        )}
                    </div>
                </Card>

                {/* 👇 區塊 3: 全隊學業與訓練關聯散佈圖 👇 */}
                <Card className="flex flex-col h-[500px]">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">學業與訓練平衡分析</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">全隊訓練時數與學期排名之關聯性</p>
                        </div>
                        <BookOpen className="text-indigo-400" size={24} />
                    </div>

                    {/* 互動式過濾按鈕 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => toggleExam('T1')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 flex items-center gap-1.5 ${showExam.T1 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${showExam.T1 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div> T1 評估
                        </button>
                        <button onClick={() => toggleExam('T2')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 flex items-center gap-1.5 ${showExam.T2 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${showExam.T2 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div> T2 評估
                        </button>
                        <button onClick={() => toggleExam('T3')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 flex items-center gap-1.5 ${showExam.T3 ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${showExam.T3 ? 'bg-amber-500' : 'bg-slate-300'}`}></div> T3 評估
                        </button>
                    </div>

                    <div className="flex-1 w-full min-h-0 bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                        {(!scatterDataT1.length && !scatterDataT2.length && !scatterDataT3.length) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 font-bold">
                                <BookOpen size={40} className="mb-3 opacity-30"/>
                                <p className="text-sm">尚未有足夠的學業與時數資料</p>
                                <p className="text-[10px] mt-1 opacity-70">請至「綜合能力評估」錄入資料</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    
                                    <XAxis type="number" dataKey="x" name="訓練時數" unit=" 小時" domain={[0, 'auto']} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                    <YAxis type="number" dataKey="y" name="排名" reversed={true} domain={['dataMax + 5', 1]} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                    <ZAxis type="number" range={[150, 150]} /> 
                                    
                                    <RechartsTooltip 
                                        cursor={{strokeDasharray: '3 3'}}
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        formatter={(value, name, props) => {
                                            if (name === "排名") return [`第 ${value} 名`, name];
                                            return [value, name];
                                        }}
                                        // 顯示學生名字在 Tooltip 標題
                                        labelFormatter={() => ''} 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                              const data = payload[0].payload;
                                              return (
                                                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 font-bold text-sm">
                                                  <p className="text-slate-800 mb-1 border-b pb-1">{data.name}</p>
                                                  <p className="text-slate-500">時數: <span className="text-blue-600">{data.x} 小時</span></p>
                                                  <p className="text-slate-500">排名: <span className="text-indigo-600">第 {data.y} 名</span></p>
                                                </div>
                                              );
                                            }
                                            return null;
                                        }}
                                    />
                                    
                                    {showExam.T1 && <Scatter name="T1" data={scatterDataT1} fill="#6366f1" opacity={0.8} />}
                                    {showExam.T2 && <Scatter name="T2" data={scatterDataT2} fill="#10b981" opacity={0.8} />}
                                    {showExam.T3 && <Scatter name="T3" data={scatterDataT3} fill="#f59e0b" opacity={0.8} />}
                                </ScatterChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
                {/* 👆 全隊學業與訓練關聯散佈圖結束 👆 */}
            </div>

            {/* 區塊 4: 教練待辦事項 */}
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="text-emerald-500" size={28}/>
                    <h3 className="text-2xl font-black text-slate-800">管理捷徑</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     <SecondaryButton icon={Download} onClick={() => alert('請至各別頁面下載報表')}>匯出本月出席總表</SecondaryButton>
                     <SecondaryButton icon={Award} onClick={() => alert('請至「隊員檔案庫」個別更新')}>更新本月晉級名單</SecondaryButton>
                     <SecondaryButton icon={CalendarIcon} onClick={() => alert('請至「訓練日程」頁面匯入')}>發佈下個月訓練日程</SecondaryButton>
                </div>
            </Card>

        </div>
    );
}
