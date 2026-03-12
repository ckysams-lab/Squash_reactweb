// src/components/TemplateDownloader.jsx

import React from 'react';
import { Download } from 'lucide-react';

// 這個元件接收一個 'type' prop，來決定要下載哪一種範本
export default function TemplateDownloader({ type }) {

    const download = () => {
        let csvContent = "\\uFEFF"; // 用於 Excel 的 BOM (Byte Order Mark)
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
            console.error("TemplateDownloader: 未知的 type ->", type);
            return; // 如果沒有提供 type，就不執行
        }

        // --- 建立並觸發下載 ---
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
            <Download size={20}/> 
            <span className="font-bold">下載範本</span>
        </button>
    );
}
