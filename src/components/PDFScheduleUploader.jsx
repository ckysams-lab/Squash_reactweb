// src/components/PDFScheduleUploader.jsx (Version 2.0 - Optimized for HK School Notices)

import React, { useState } from 'react';
import { FileText, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
                fullText += content.items.map(item => item.str).join(' ') + "\n";
            }

            console.log("PDF 提取文本:", fullText); // 供開發者除錯

            // --- 強化版日期搜尋邏輯 ---
            
            // 1. 先找出年份 (例如 2026)
            const yearMatch = fullText.match(/20\d{2}/);
            const foundYear = yearMatch ? yearMatch[0] : new Date().getFullYear();

            // 2. 尋找所有日期格式：D/M, D-M, DD/MM, 以及帶有「日」字的
            // 這個正則表達式專門對付「1/4」、「15/5」這類格式
            const pattern = /(\d{1,2})[\/\-\.月](\d{1,2})/g;
            let match;
            const dates = [];
            
            while ((match = pattern.exec(fullText)) !== null) {
                let day = match[1];
                let month = match[2];
                
                // 修正：如果格式是「4月1日」，順序會反過來
                if (fullText.includes(`${day}月${month}日`)) {
                    const temp = day; day = month; month = temp;
                }

                const formattedDate = `${foundYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                // 簡單防呆：月份不超過 12，日期不超過 31
                if (parseInt(month) <= 12 && parseInt(day) <= 31) {
                    dates.push(formattedDate);
                }
            }

            // 3. 整理結果
            const uniqueDates = [...new Set(dates)].sort();
            const formattedPreview = uniqueDates.map(date => ({
                trainingClass: '初級訓練班',
                date: date,
                time: '16:00',
                location: '學校壁球場',
                coach: '徐教練',
                notes: '由 PDF AI 自動提取'
            }));

            setPreviewData(formattedPreview);
            if (formattedPreview.length === 0) {
                alert("未能識別日期。請確認 PDF 內有「日/月」或「月-日」格式的文字。");
            }

        } catch (err) {
            console.error("PDF 解析失敗:", err);
            alert("解析失敗。");
        }
        setIsUpdating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                    {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20}/>}
                    {isProcessing ? '正在分析通告...' : 'AI 掃描通告提取日期'}
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </label>
                {previewData.length > 0 && (
                    <button onClick={() => setPreviewData([])} className="p-3 bg-slate-200 text-slate-600 rounded-2xl hover:bg-slate-300">重設</button>
                )}
            </div>

            {previewData.length > 0 && (
                <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 animate-in zoom-in-95 shadow-xl">
                    <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500" size={20}/> 成功提取日期 (共 {previewData.length} 堂課)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                        {previewData.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-2">
                                <Calendar size={12} className="text-blue-500 shrink-0"/>
                                <span className="font-mono text-xs font-bold text-slate-700">{item.date}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => { onImport(null, previewData); setPreviewData([]); }}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                        確認並全部匯入日曆
                    </button>
                </div>
            )}
        </div>
    );
}
