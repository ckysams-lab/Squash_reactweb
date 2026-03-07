
// src/pages/DashboardPage.jsx
import React from 'react';
import { 
  History, Users, Calendar as CalendarIcon, Hourglass, 
  Target, Medal, Trophy as TrophyIcon, BookOpen, 
  Download, TrendingUp, Clock 
} from 'lucide-react';
import { BADGE_DATA } from '../constants/data';

export default function DashboardPage({ 
  competitions, 
  schedules, 
  students, 
  dashboardStats 
}) {
  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-bold">
      
      {/* 最近更新活動 */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-10">
        <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
          <History className="text-blue-600"/> 最近更新活動
        </h3>
        <div className="space-y-6">
          {/* 取前四筆比賽公告 */}
          {competitions.slice(0, 4).map(c => (
            <div key={c.id} className="flex gap-6 items-start">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 ring-8 ring-blue-50"></div>
              <div>
                <p className="text-sm font-black text-slate-800">發佈了比賽公告：{c.title}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">比賽日期：{c.date}</p>
              </div>
            </div>
          ))}
          {/* 取前兩筆訓練日程 */}
          {schedules.slice(0, 2).map(s => (
            <div key={s.id} className="flex gap-6 items-start">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 ring-8 ring-emerald-50"></div>
              <div>
                <p className="text-sm font-black text-slate-800">新增訓練日程：{s.trainingClass}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{s.date} @ {s.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 四大指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="absolute -right-5 -bottom-5 opacity-20"><Users size={120}/></div>
          <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">活躍隊員</p>
          <p className="text-6xl font-black mt-2 font-mono">{students.length}</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-blue-200 font-bold"><TrendingUp size={14}/> 成長茁壯中</div>
        </div>
        
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-5 -bottom-5 opacity-5"><CalendarIcon size={120}/></div>
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2">本月訓練</p>
          <p className="text-6xl font-black mt-2 text-slate-800 font-mono">{dashboardStats.thisMonthTrainings}</p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-bold"><Clock size={14}/> 訓練不間斷</div>
        </div>
        
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-5 -bottom-5 opacity-20"><Hourglass size={120}/></div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">距離下一場比賽</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-6xl font-black font-mono">{dashboardStats.daysToNextMatch}</p>
            {dashboardStats.daysToNextMatch !== '-' && dashboardStats.daysToNextMatch !== 'Today!' && (<span className="text-xl font-bold text-slate-500">Days</span>)}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400 font-bold"><Target size={14}/> 全力備戰中</div>
        </div>
        
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -right-5 -bottom-5 opacity-5"><Medal size={120}/></div>
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 z-10 border border-yellow-200"><TrophyIcon size={32}/></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 z-10">本年度獎項</p>
          <p className="text-4xl font-black mt-1 text-slate-800 z-10">{dashboardStats.awardsThisYear}</p>
        </div>
      </div>

      {/* 底部圖表與手冊區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
          <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Target className="text-blue-600"/> 章別分佈概況</h3>
          <div className="space-y-6">
            {Object.keys(BADGE_DATA).filter(k => k !== '無').map(badge => {
              const count = students.filter(s => s.badge === badge).length;
              const percent = students.length ? Math.round((count/students.length)*100) : 0;
              return (
                <div key={badge} className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <span className={`text-xs font-black ${BADGE_DATA[badge].color}`}>{badge}</span>
                    <span className="text-xs text-slate-400 font-mono">{count} 人 ({percent}%)</span>
                  </div>
                  <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border">
                    <div className={`h-full transition-all duration-1000 ${BADGE_DATA[badge].bg.replace('bg-', 'bg-')}`} style={{width: `${percent}%`, backgroundColor: 'currentColor'}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-4"><BookOpen className="text-blue-600"/> 章別獎勵計劃</h3>
          <div className="flex-1 w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group">
            <iframe src="https://docs.google.com/gview?embedded=true&url=https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@8532769cb36715336a13538c021cfee65daa50c9/Booklet.pdf" className="w-full h-full min-h-[300px]" frameBorder="0" title="Award Scheme Booklet"></iframe>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href="https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@8532769cb36715336a13538c021cfee65daa50c9/Booklet.pdf" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700">
                <Download size={14}/> 下載 PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
