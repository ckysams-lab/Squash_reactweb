// src/pages/VideoAnalysisPage.jsx (Version 1.0 - Smart Player MVP)

import React, { useState, useRef } from 'react';
import { PlaySquare, Tag, Video, ChevronRight, Activity, Search } from 'lucide-react';
import { PageHeader, Card, PrimaryButton, SecondaryButton } from '../components/ui';

export default function VideoAnalysisPage() {
    // 假設這是 AI 分析後回傳的資料
    const mockAnalysisData = {
        videoId: "dQw4w9WgXcQ", // 這裡你可以換成真實的壁球比賽 YouTube ID
        title: "2026 校際決賽：陳小明 vs 王大衛",
        duration: 212, // 影片總秒數
        tags: [
            { id: 1, time: 15, label: "發球得分", type: "positive", player: "陳小明" },
            { id: 2, time: 42, label: "反手下網失誤", type: "negative", player: "陳小明" },
            { id: 3, time: 89, label: "精彩長回合 (30拍+)", type: "neutral", player: "雙方" },
            { id: 4, time: 120, label: "正手直線致勝", type: "positive", player: "王大衛" },
            { id: 5, time: 175, label: "T點控制不佳", type: "negative", player: "陳小明" },
            { id: 6, time: 198, label: "賽末點", type: "neutral", player: "陳小明" },
        ]
    };

    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, positive, negative
    const playerRef = useRef(null);

    // 格式化秒數為 mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // 點擊標籤時，讓 YouTube 影片跳轉到該時間點 (這裡我們用簡單的 iframe src 替換來模擬)
    // 在真實的 React 應用中，我們會使用 react-youtube 套件來做到無縫跳轉
    const [currentIframeSrc, setCurrentIframeSrc] = useState(`https://www.youtube.com/embed/${mockAnalysisData.videoId}?enablejsapi=1`);

    const jumpToTime = (seconds) => {
        setCurrentIframeSrc(`https://www.youtube.com/embed/${mockAnalysisData.videoId}?start=${seconds}&autoplay=1&enablejsapi=1`);
    };

    const filteredTags = mockAnalysisData.tags.filter(t => activeFilter === 'ALL' || t.type === activeFilter);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-6xl mx-auto">
            
            <PageHeader 
                title="AI 影片分析引擎" 
                subtitle="自動辨識賽事關鍵時刻與戰術標籤 (Phase 1 MVP)" 
                icon={Video} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                
                {/* 左側：播放器與智慧時間軸 */}
                <div className="space-y-6">
                    <Card className="p-4 bg-slate-900 border-none shadow-2xl">
                        {/* 影片播放區域 */}
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative">
                            <iframe 
                                ref={playerRef}
                                src={currentIframeSrc}
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Video Player"
                            ></iframe>
                        </div>

                        {/* 智慧時間軸 (Timeline) */}
                        <div className="mt-8 px-4 relative">
                            <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={16}/> AI 識別時間軸
                            </h4>
                            
                            {/* 時間軸底線 */}
                            <div className="w-full h-2 bg-slate-800 rounded-full relative">
                                {/* 在時間軸上畫出標記點 */}
                                {filteredTags.map(tag => {
                                    // 計算該標籤在時間軸上的百分比位置
                                    const positionPercent = (tag.time / mockAnalysisData.duration) * 100;
                                    
                                    // 根據類型決定顏色
                                    let colorClass = "bg-blue-500";
                                    if(tag.type === 'positive') colorClass = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]";
                                    if(tag.type === 'negative') colorClass = "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]";

                                    return (
                                        <div 
                                            key={tag.id}
                                            onClick={() => jumpToTime(tag.time)}
                                            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full cursor-pointer hover:scale-150 transition-transform ${colorClass} group z-10 border-2 border-slate-900`}
                                            style={{ left: `${positionPercent}%` }}
                                        >
                                            {/* Hover 時顯示的小提示框 */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-slate-800 text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none flex flex-col items-center">
                                                <span className="font-mono text-slate-400">{formatTime(tag.time)}</span>
                                                <span className="font-black">{tag.label}</span>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                                <span>0:00</span>
                                <span>{formatTime(mockAnalysisData.duration)}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 右側：標籤過濾器與清單 */}
                <Card className="flex flex-col h-[600px]">
                    <div className="mb-6 border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Tag className="text-indigo-500" /> 賽事關鍵片段
                        </h3>
                    </div>

                    {/* 過濾器按鈕 */}
                    <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl shrink-0">
                        <button onClick={() => setActiveFilter('ALL')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>全部</button>
                        <button onClick={() => setActiveFilter('positive')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeFilter === 'positive' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}>得分/好球</button>
                        <button onClick={() => setActiveFilter('negative')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${activeFilter === 'negative' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}>失誤/弱點</button>
                    </div>

                    {/* 標籤清單 (可點擊跳轉) */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {filteredTags.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm mt-10">此分類下無標籤</p>
                        ) : (
                            filteredTags.map(tag => {
                                let bgClass = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
                                let dotClass = "bg-slate-400";
                                if(tag.type === 'positive') { bgClass = "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"; dotClass = "bg-emerald-500"; }
                                if(tag.type === 'negative') { bgClass = "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800"; dotClass = "bg-rose-500"; }

                                return (
                                    <div 
                                        key={tag.id}
                                        onClick={() => jumpToTime(tag.time)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-95 flex items-center gap-4 group ${bgClass}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${dotClass} group-hover:scale-125 transition-transform`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h5 className="font-black text-sm">{tag.label}</h5>
                                                <span className="font-mono text-xs opacity-70 bg-white/50 px-2 py-0.5 rounded-md">{formatTime(tag.time)}</span>
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold">{tag.player}</p>
                                        </div>
                                        <ChevronRight size={16} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
