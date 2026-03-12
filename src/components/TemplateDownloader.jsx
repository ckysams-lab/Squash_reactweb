// src/components/TemplateDownloader.jsx

import React from 'react';
import { Download } from 'lucide-react';

// 這是一個完全獨立的元件，它自己就包含了下載範本需要的所有邏輯。
export default function TemplateDownloader() {

    const download = (type) => {
        let csvContent = "\\uFEFF"; // BOM for Excel compatibility
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
            return;
        }

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
        <>
            {/* 團隊獎項下載按鈕 */}
            <button 
                onClick={() => download('trophies')}
                className="w-full sm:w-auto px-6 py-4 bg-white text-slate-500 border rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-2" 
                title="下載團隊獎項的 CSV 範本">
                <Download size={20}/> <span className="font-bold">下載範本</span>
            </button>

            {/* 傳奇校友下載按鈕 */}
            <button 
                onClick={() => download('alumni')}
                className="w-full sm:w-auto px-6 py-4 bg-white text-slate-500 border rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-2" 
                title="下載傳奇校友的 CSV 範本">
                <Download size={20}/> <span className="font-bold">下載範本</span>
            </button>
        </>
    );
}
