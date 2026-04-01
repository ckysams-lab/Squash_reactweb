// src/components/PDFScheduleUploader.jsx (Version 4.0 - Day/Month/Year Optimized)

import React, { useState } from 'react';
import { FileText, Loader2, CheckCircle2, Calendar, Search } from 'lucide-react';
// 👇 1. 引入 pdfjs
import * as pdfjs from 'pdfjs-dist';
// 👇 2. 使用 Vite 的特殊語法 '?url'，直接從我們自己的 node_modules 抓取引擎
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// 👇 3. 把引擎的網址設定為我們自己網站內部的網址，徹底解決跨網域問題
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;


export default function PDFScheduleUploader({ onImport }) {
    const [isProcessing, setIsUpdating] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUpdating(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + " ";
            }

            console.log("PDF 原始文字內容:", fullText);

            const dates = [];
            
            // --- 核心邏輯：專門抓取 D/M/YY 或 D/M/YYYY 格式 ---
            // 支援的分隔符號包含斜線(/)、橫線(-)、句點(.)
            const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
            let match;
            
            while ((match = dateRegex.exec(fullText)) !== null) {
                let day = match[1];
                let month = match[2];
                let year = match[3];

                // 處理縮寫年份：如果只有兩位數 (如 26)，自動補成 2026
                if (year.length === 2) {
                    year = "20" + year;
                }

                // 格式化為 YYYY-MM-DD
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                
                // 基礎防呆：確保月份和日期有效
                if (parseInt(month) <= 12 && parseInt(day) <= 31) {
                    dates.push(formattedDate);
                }
            }

            // 備用邏輯：如果沒抓到 D/M/Y，嘗試找「X 月 1, 2, 3 日」格式
            if (dates.length === 0) {
                const monthRegex = /(\d{1,2})\s*月\s*([\d\s,，及及和]+)\s*日/g;
                let m;
                while ((m = monthRegex.exec(fullText)) !== null) {
                    const month = m[1].padStart(2, '0');
                    const days = m[2].match(/\d{1,2}/g);
                    if (days) {
                        days.forEach(day => dates.push(`2026-${month}-${day.padStart(2, '0')}`));
                    }
                }
            }

            // 去重並按日期排序
            const uniqueDates = [...new Set(dates)].sort();
            
            const formattedPreview = uniqueDates.map(date => ({
                trainingClass: '初級訓練班',
                date: date,
                time: '16:00',
                location: '學校壁球場',
                coach: '徐教練',
                notes: '由 PDF 自動識別 (D/M/Y 格式)'
            }));

            setPreviewData(formattedPreview);
            if (formattedPreview.length === 0) {
                alert("未能識別日期。請確認 PDF 內有「日/月/年」格式的文字（例如 2/4/26）。");
            }

        } catch (err) {
            console.error("PDF 解析失敗:", err);
            alert("解析失敗，請確保 PDF 檔案正確。");
        }
        setIsUpdating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-3xl cursor-pointer hover:bg-blue-700 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 group">
                    {isProcessing ? <Loader2 className="animate-spin" size={24}/> : <Search size={24} className="group-hover:scale-110 transition-transform" />}
                    <div className="text-left">
                        <p className="font-black text-lg leading-none">AI 掃描通告 (D/M/Y)</p>
                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Detecting 2/4/26 format</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </label>
                {previewData.length > 0 && (
                    <button onClick={() => setPreviewData([])} className="p-4 bg-slate-200 text-slate-600 rounded-3xl hover:bg-slate-300 transition-all font-bold">重設</button>
                )}
            </div>

            {previewData.length > 0 && (
                <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 animate-in zoom-in-95 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                    
                    <h4 className="font-black text-blue-900 mb-6 flex items-center gap-3 text-xl">
                        <CheckCircle2 className="text-emerald-500" size={28}/> 成功提取 {previewData.length} 個訓練日期
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                        {previewData.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-[10px] text-blue-500 font-black uppercase mb-1">Session {idx + 1}</span>
                                <span className="font-mono text-base font-black text-slate-700">{item.date}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => { onImport(null, previewData); setPreviewData([]); }}
                        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Calendar size={24}/> 確認並匯入我的日曆
                    </button>
                </div>
            )}
        </div>
    );
}
