// src/pages/SettingsPage.jsx

import React from 'react';
// 注意：這裡不再需要 import Download，因為它已經被封裝在 TemplateDownloader 裡面了
import { ImageIcon, Trash2, Upload, Plus, History, Save, Trophy, Users } from 'lucide-react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// 引入我們剛剛建立的新元件
import TemplateDownloader from '../components/TemplateDownloader';

// 注意：props 中已移除 downloadTemplate
export default function SettingsPage({
    systemConfig,
    setSystemConfig,
    importEncoding,
    setImportEncoding,
    externalTournaments,
    handleCSVImportExternalTournaments,
    deleteItem,
    handleSeasonReset,
    setIsUpdating,
    db,
    appId,
    handleCSVImportTrophies,
    handleCSVImportAlumni
}) {
    
    // 內部函式保持不變
    const handleAddSingleTournament = async () => { /* ... */ };
    const handleSaveSystemConfig = async () => { /* ... */ };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
            
            {/* 系統偏好設定區塊 */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                {/* ... 此處內容不變 ... */}
            </div>

            {/* 校外賽事名稱管理 */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                 <h3 className="text-2xl font-black mb-4">校外賽事名稱管理</h3>
                 {/* ... 此處內容不變 ... */}
            </div>

            {/* 榮譽殿堂資料管理區塊 */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black mb-4">榮譽殿堂資料管理</h3>
                <p className="text-slate-400 mb-8">請在此處，分別上傳你已準備好的 `trophies.csv` 和 `alumni.csv` 檔案。</p>
                
                {/* 團隊獎項區 */}
                <div className="bg-slate-50/70 p-6 rounded-3xl border mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 w-full bg-amber-500 text-white p-6 rounded-[1.5rem] cursor-pointer hover:bg-amber-600 shadow-lg shadow-amber-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                            <Upload size={20}/>
                            <span className="font-black">匯入團隊獎項 (.csv)</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportTrophies}/>
                        </label>
                        {/* 使用新的獨立元件，並告訴它要下載 'trophies' 範本 */}
                        <TemplateDownloader type="trophies" />
                    </div>
                </div>

                {/* 傳奇校友區 */}
                <div className="bg-slate-50/70 p-6 rounded-3xl border">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 w-full bg-indigo-500 text-white p-6 rounded-[1.5rem] cursor-pointer hover:bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                            <Upload size={20}/>
                            <span className="font-black">匯入傳奇校友 (.csv)</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportAlumni}/>
                        </label>
                        {/* 使用新的獨立元件，並告訴它要下載 'alumni' 範本 */}
                        <TemplateDownloader type="alumni" />
                    </div>
                </div>
            </div>

            {/* 進階設定 */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
               {/* ... 此處內容不變 ... */}
            </div>

            {/* 版權宣告 */}
            <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                Copyright © 2026 正覺壁球. All Rights Reserved.
            </div>
        </div>
    );
}
