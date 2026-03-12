// src/pages/SettingsPage.jsx (Version 1.4 - Corrected Final Fix)

import React from 'react';
import { ImageIcon, Trash2, Upload, Plus, History, Save, Trophy, Users, Download } from 'lucide-react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// 這是我們剛剛建立的獨立下載器
import TemplateDownloader from '../components/TemplateDownloader';

// 我們不再需要從 props 接收 downloadTemplate
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
    
    // ... 內部函式保持不變
    const handleAddSingleTournament = async () => { /* ... */ };
    const handleSaveSystemConfig = async () => { /* ... */ };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
            
            {/* ... 上方區塊不變 ... */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">...</div>
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">...</div>

            {/* --- 榮譽殿堂資料管理區塊 (修正版) --- */}
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
                        {/* 👇 **修正後**：傳遞 type prop 來指定要下載哪個範本 */}
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
                        {/* 👇 **修正後**：傳遞 type prop 來指定要下載哪個範本 */}
                        <TemplateDownloader type="alumni" />
                    </div>
                </div>
            </div>

            {/* ... 下方區塊不變 ... */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">...</div>
            <div className="p-8 text-center ...">...</div>
        </div>
    );
}


// --- TemplateDownloader.jsx 也需要一個小更新 ---
// 請用這份程式碼更新 `src/components/TemplateDownloader.jsx`
// src/components/TemplateDownloader.jsx (Version 1.1)

import React from 'react';
import { Download } from 'lucide-react';

// 接收一個 type prop
export default function TemplateDownloader({ type }) {

    const download = () => {
        let csvContent = "\\uFEFF";
        let fileName = '';

        if (type === 'trophies') {
            csvContent += 'year,tournamentName,award,roster\\n';
            csvContent += '2023,全港學界精英壁球比賽,男子甲組團體 冠軍,"陳大文,李小明,張三"\\n';
            fileName = 'trophies_template.csv';
        } else if (type === 'alumni') {
            csvContent += 'name,graduationYear,achievement\\n';
            csvContent += '高偉諾,2020,"創隊隊長, 奠定球隊奮鬥精神"\\n';
            fileName = 'alumni_template.csv';
        } else {
            return; // 如果沒有 type，就不執行
        }

        // ... (下載的邏輯不變)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button 
            onClick={download}
            className="w-full sm:w-auto px-6 py-4 bg-white text-slate-500 border rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-2" 
            title={`下載 ${type} 的 CSV 範本`}>
            <Download size={20}/> <span className="font-bold">下載範本</span>
        </button>
    );
}

