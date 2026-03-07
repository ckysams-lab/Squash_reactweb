// src/pages/CalendarPage.jsx
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Layers, Download, Upload } from 'lucide-react';

const localizer = momentLocalizer(moment);

export default function CalendarPage({
    role,
    uniqueTrainingClasses,
    selectedClassFilter,
    setSelectedClassFilter,
    calendarEvents,
    setSelectedSchedule,
    downloadTemplate,
    handleCSVImportSchedules
}) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-bold">
            {/* 頂部控制面板 */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                        <CalendarIcon/>
                    </div>
                    <div>
                        <h3 className="text-xl font-black">訓練班日程表</h3>
                        <p className="text-xs text-slate-400 mt-1">查看各級訓練班的日期與地點安排</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    {/* 班別過濾器 */}
                    <div className="relative flex-1 md:flex-none">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18}/>
                        <select 
                            value={selectedClassFilter} 
                            onChange={(e) => setSelectedClassFilter(e.target.value)} 
                            className="w-full md:w-60 bg-slate-50 border-none outline-none pl-12 pr-6 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                        >
                            {uniqueTrainingClasses.map(c => (
                                <option key={c} value={c}>{c === 'ALL' ? '🌍 全部訓練班' : `🏸 ${c}`}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* 教練專屬操作按鈕 */}
                    {role === 'admin' && (
                        <div className="flex gap-2">
                            <button onClick={() => downloadTemplate('schedule')} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl border transition-all" title="下載日程範本">
                                <Download size={20}/>
                            </button>
                            <label className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-black text-sm">
                                <Upload size={18}/> 匯入 CSV 日程
                                <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportSchedules}/>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* 大日曆渲染區 */}
            <div className="bg-white p-6 rounded-[3rem] shadow-sm border h-[70vh]">
                <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={event => setSelectedSchedule(event)}
                    eventPropGetter={(event) => {
                        const className = event.resource.trainingClass === 'A班' ? 'bg-blue-500' : event.resource.trainingClass === 'B班' ? 'bg-green-500' : 'bg-yellow-500';
                        return { className: `${className} border-none text-white p-1 text-xs rounded-lg` };
                    }}
                />
            </div>
        </div>
    );
}
