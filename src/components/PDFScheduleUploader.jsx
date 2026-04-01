// src/components/PDFScheduleUploader.jsx

import React, { useState } from 'react';
import { FileText, Loader2, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';

// 設定 pdf.js 的 Worker (這在 Vite 環境中是必需的)
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

            // 1. 提取所有頁面的文字
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(' ') + "\n";
            }

            // 2. 智慧日期掃描 (Smart Date Scanner)
            // 尋找 YYYY-MM-DD 或 DD/MM/YYYY 格式
            const dateRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/g;
            const foundDates = fullText.match(dateRegex) || [];
            
            // 3. 整理成預覽格式 (去重並轉換為標準格式)
            const uniqueDates = [...new Set(foundDates)].map(d => {
                const parts = d.replace(/\//g, '-').split('-');
                // 簡單轉換為 YYYY-MM-DD
                return parts[0].length === 4 ? d.replace(/\//g, '-') : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            });

            const formattedPreview = uniqueDates.map(date => ({
                trainingClass: '待定 (請修改)',
                date: date,
                time: '16:00',
                location: '學校壁球場',
                coach: '徐教練',
                notes: '由 PDF 自動提取'
            }));

            setPreviewData(formattedPreview);
            if (formattedPreview.length === 0) {
                alert("⚠️ 未能從 PDF 中自動識別出日期。請確認 PDF 是否為文字格式而非掃描圖片。");
            }

        } catch (err) {
            console.error("PDF 解析失敗:", err);
            alert("PDF 解析失敗，請確保檔案正確且未受密碼保護。");
        }
        setIsUpdating(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                    {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20}/>}
                    {isProcessing ? '正在掃描 PDF...' : 'AI 掃描 PDF 提取日期'}
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </label>
                {previewData.length > 0 && (
                    <button 
                        onClick={() => setPreviewData([])}
                        className="p-3 bg-slate-200 text-slate-600 rounded-2xl hover:bg-slate-300"
                    >
                        重設
                    </button>
                )}
            </div>

            {/* 預覽與確認區 */}
            {previewData.length > 0 && (
                <div className="bg-white border-2 border-indigo-100 rounded-[2rem] p-6 animate-in zoom-in-95">
                    <h4 className="font-black text-indigo-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500" size={20}/> 識別結果預覽 (共 {previewData.length} 筆)
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mb-6">
                        {previewData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar size={16} className="text-blue-500"/>
                                    <span className="font-mono font-bold text-slate-700">{item.date}</span>
                                </div>
                                <span className="text-xs text-slate-400">16:00 @ 學校球場</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => { onImport(previewData); setPreviewData([]); }}
                        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                        確認並全部匯入日曆
                    </button>
                </div>
            )}
        </div>
    );
}
