// src/pages/DashboardPage.jsx (Version 3.2 - UI Standardized)

import React, { useMemo } from 'react';
import { 
  Users, CalendarIcon, Award, LayoutDashboard, TrendingUp, CheckCircle2, 
  ArrowRight, Download 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, Cell
} from 'recharts';

// 👇 引入共用 UI 元件
import { PageHeader, Card, PrimaryButton, SecondaryButton } from '../components/ui.jsx';

export default function DashboardPage({
    competitions,
    schedules,
    students,
    dashboardStats
}) {

    // --- 圖表資料準備 ---
    
    // 1. 各班級人數分佈資料
    const classDistributionData = useMemo(() => {
        if (!students || students.length === 0) return [];
        const classCounts = {};
        students.forEach(s => {
            const className = s.squashClass || '未分班';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });
        return Object.entries(classCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count); // 依人數降冪排序
    }, [students]);

    // 2. 近期出席率趨勢 (模擬資料，因為真實的 attendanceLogs 不在此元件內，這裡做視覺展示)
    const mockAttendanceData = [
        { name: '第1週', a: 85 }, { name: '第2週', a: 92 },
        { name: '第3週', a: 88 }, { name: '第4週', a: 95 },
        { name: '第5週', a: 90 }, { name: '本週', a: 98 },
    ];


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 統一的頁面大標題 */}
            <PageHeader 
                title="管理概況" 
                subtitle="球隊運作數據與待辦事項摘要" 
                icon={LayoutDashboard} 
            />

            {/* 區塊 1: 核心數據摘要 (使用單一 Card 包裝) */}
            <Card className="p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 本月訓練總數 */}
                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <CalendarIcon size={32}/>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">本月訓練總數</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800">{dashboardStats.thisMonthTrainings}</span>
                                <span className="text-sm font-bold text-slate-400">堂</span>
                            </div>
                        </div>
                    </div>

                    {/* 距離下一場比賽 */}
                    <div className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                            <TrendingUp size={32}/>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">距離下一場比賽</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800">{dashboardStats.daysToNextMatch}</span>
                                {dashboardStats.daysToNextMatch !== "Today!" && dashboardStats.daysToNextMatch !== "-" && <span className="text-sm font-bold text-slate-400">天</span>}
                            </div>
                        </div>
                    </div>

                    {/* 本年度榮譽總數 */}
                    <div className="bg-yellow-50/50 rounded-3xl p-6 border border-yellow-100 flex items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-yellow-500 shadow-sm shrink-0">
                            <Award size={32}/>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">本年度榮譽總數</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-800">{dashboardStats.awardsThisYear}</span>
                                <span className="text-sm font-bold text-slate-400">項</span>
                            </div>
                        </div>
                    </div>

                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 區塊 2: 訓練班人數分佈圖表 */}
                <Card className="flex flex-col h-[400px]">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">班級人數分佈</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">目前各訓練梯隊之在籍人數</p>
                        </div>
                        <Users className="text-slate-300" size={24} />
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {classDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <Tooltip 
                                        cursor={{fill: '#f1f5f9'}}
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                        {classDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                暫無分班資料
                            </div>
                        )}
                    </div>
                </Card>

                {/* 區塊 3: 近期出席率趨勢 */}
                <Card className="flex flex-col h-[400px]">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">球隊整體出席率</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">近六週平均出席狀況 (模擬)</p>
                        </div>
                        <TrendingUp className="text-slate-300" size={24} />
                    </div>
                    <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['dataMin - 5', 100]} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="a" 
                                    stroke="#10b981" 
                                    strokeWidth={4} 
                                    dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: 'white'}} 
                                    activeDot={{r: 8, strokeWidth: 0}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

            </div>

            {/* 區塊 4: 教練待辦事項 (快速入口) */}
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="text-emerald-500" size={28}/>
                    <h3 className="text-2xl font-black text-slate-800">管理捷徑</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     <SecondaryButton icon={Download} onClick={() => alert('請至各別頁面下載報表')}>
                        匯出本月出席總表
                    </SecondaryButton>
                    <SecondaryButton icon={Award} onClick={() => alert('請至「隊員檔案庫」個別更新')}>
                        更新本月晉級名單
                    </SecondaryButton>
                    <SecondaryButton icon={CalendarIcon} onClick={() => alert('請至「訓練日程」頁面匯入')}>
                        發佈下個月訓練日程
                    </SecondaryButton>
                </div>
            </Card>

        </div>
    );
}
