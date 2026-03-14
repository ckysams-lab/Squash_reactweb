// src/components/TemplateDownloader.jsx (Version 1.3 - Complete Templates)

import React from 'react';
import { Download } from 'lucide-react';

export default function TemplateDownloader({ type }) {

    const download = () => {
        // Correct BOM for UTF-8 Encoding in Excel
        let csvContent = "\uFEFF"; 
        let fileName = '';

        if (type === 'trophies') {
            csvContent += 'year,tournamentName,award,roster\n';
            csvContent += '2023,全港學界精英壁球比賽,男子甲組團體 冠軍,"陳大文,李小明,張三"\n';
            fileName = 'trophies_template.csv';
            
        } else if (type === 'alumni') {
            csvContent += 'name,graduationYear,achievement\n';
            csvContent += '高偉諾,2020,"創隊隊長, 奠定球隊奮鬥精神"\n';
            fileName = 'alumni_template.csv';
            
        // 👇 --- 新增：處理學員名單範本 (來自 RosterPage) --- 👇
        } else if (type === 'students') {
            csvContent += '姓名,班別,班號,章別,初始積分,壁球班,電話\n';
            csvContent += '陳小明,6A,1,銅章,120,精英A班,98765432\n';
            fileName = 'student_template.csv';
            
        // 👇 --- 新增：處理訓練日程範本 (來自 CalendarPage) --- 👇
        } else if (type === 'schedule') {
            csvContent += '訓練班名稱,日期,時間,地點,教練,備註\n';
            csvContent += '精英A班,2024-09-05,16:00,學校壁球場,徐教練,請準時出席\n';
            fileName = 'schedule_template.csv';
            
        } else {
            console.warn(`TemplateDownloader: 未知的範本類型 -> ${type}`);
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
        <button 
            onClick={download}
            className="w-full sm:w-auto px-6 py-4 bg-white text-slate-600 font-bold border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95" 
            title={`下載 ${type} 的 CSV 範本`}>
            <Download size={18}/> 
            <span>下載範本</span>
        </button>
    );
}
