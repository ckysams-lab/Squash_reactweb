// src/pages/CalendarPage.jsx (Version 3.1 - UI Standardized & Bug Fix)

import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Upload, Filter, ChevronDown, Plus } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 引入 UI 元件
import { PageHeader, Card } from '../components/ui.jsx';
// 引入獨立的下載器
import TemplateDownloader from '../components/TemplateDownloader.jsx';

const localizer = momentLocalizer(moment);

export default function CalendarPage({
    role,
    uniqueTrainingClasses,
    selectedClassFilter,
    setSelectedClassFilter,
    calendarEvents,
    setSelectedSchedule,
    handleCSVImportSchedules
}) {

    // 客製化日曆的工具列
    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const goToCurrent = () => toolbar.onNavigate('TODAY');

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex gap-2">
                    <button onClick={goToBack} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-500 font-bold">&lt;</button>
                    <button onClick={goToCurrent} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-blue-600 font-black">今天</button>
                    <button onClick={goToNext} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-500 font-bold">&gt;</button>
                </div>
                <h3 className="text-xl font-black text-slate-800">{toolbar.label}</h3>
                <div className="flex gap-2">
                    {['month', 'week', 'agenda'].map(view => (
                        <button 
                            key={view} 
                            onClick={() => toolbar.onView(view)} 
                            className={`px-4 py-2 rounded-xl transition-all font-bold text-sm ${toolbar.view === view ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                        >
                            {view === 'month' ? '月' : view === 'week' ? '週' : '列表'}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 font-bold">
            
            <PageHeader 
                title="訓練日程表" 
                subtitle="查看所有訓練班的上課時間與地點" 
                icon={CalendarIcon} 
            />

    import PDFScheduleUploader from '../components/PDFScheduleUploader.jsx'; 
            <Card className="flex flex-col lg:flex-row items-center justify-between gap-6 overflow-visible">
                <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <select 
                            value={selectedClassFilter} 
                            onChange={(e) => setSelectedClassFilter(e.target.value)} 
                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 focus:border-blue-500 outline-none transition-all"
                        >
                            {uniqueTrainingClasses.map(cls => (
                                <option key={cls} value={cls}>{cls === 'ALL' ? '顯示所有班別' : cls}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                    </div>
                </div>

                {role === 'admin' && (
                    <div className="flex w-full lg:w-auto flex-col sm:flex-row gap-4">
                        {/* 使用新的下載器 */}
                        <PDFScheduleUploader onImport={handleCSVImportSchedules} />
                        <TemplateDownloader type="schedule" />
                        
                        <label className="bg-slate-800 text-white px-8 py-4 rounded-2xl cursor-pointer hover:bg-slate-700 shadow-lg flex items-center justify-center gap-2 transition-all font-bold active:scale-95">
                            <Upload size={18}/> 批量匯入日程
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportSchedules}/>
                        </label>
                    </div>
                )}
            </Card>

            <Card className="h-[800px] flex flex-col" noPadding>
                <div className="flex-1 p-6">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={['month', 'week', 'agenda']}
                        components={{ toolbar: CustomToolbar }}
                        onSelectEvent={(event) => setSelectedSchedule(event)}
                        eventPropGetter={(event) => {
                            // 簡單的顏色區分邏輯 (可根據需求擴充)
                            let bgColor = '#3b82f6'; // 預設藍色
                            if(event.resource.trainingClass.includes('精英') || event.resource.trainingClass.includes('校隊')) bgColor = '#f59e0b'; // 琥珀色
                            if(event.resource.trainingClass.includes('興趣') || event.resource.trainingClass.includes('初班')) bgColor = '#10b981'; // 翠綠色
                            
                            return {
                                style: {
                                    backgroundColor: bgColor,
                                    borderRadius: '8px',
                                    opacity: 0.9,
                                    color: 'white',
                                    border: 'none',
                                    display: 'block',
                                    fontWeight: 'bold',
                                    fontSize: '12px',
                                    padding: '2px 6px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }
                            };
                        }}
                        messages={{
                            next: "下一個",
                            previous: "上一個",
                            today: "今天",
                            month: "月",
                            week: "週",
                            day: "日",
                            agenda: "列表",
                            date: "日期",
                            time: "時間",
                            event: "訓練班"
                        }}
                    />
                </div>
            </Card>
        </div>
    );
}
