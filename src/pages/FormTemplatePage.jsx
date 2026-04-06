// src/pages/FormTemplatePage.jsx (Version 6.4 - Firestore-Only Save Strategy - Full Code)

import React, { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Save, Upload } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

const STUDENT_FIELDS = [
  { key: 'nameZH',   label: '學生中文姓名' },
  { key: 'nameEN',   label: '學生英文姓名' },
  { key: 'dob',      label: '出生日期' },
  { key: 'gender',   label: '性別' },
  { key: 'idNumber', label: '證件號碼' },
  { key: 'class',    label: '年級班別' },
  { key: 'phone',    label: '聯絡電話' },
  // You can add more fields from your student data structure here
];

// Helper function to convert a File to a Base64 string
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const MarkerCard = React.memo(function MarkerCard({ marker, fields, onFieldAssign, onDelete }) {
  const isAssigned = Boolean(marker.fieldKey);
  return (
    <div className={`rounded-xl border p-3 transition-all ${isAssigned ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded-full text-white text-xs font-black shadow" style={{ width: 22, height: 22, background: isAssigned ? '#2563eb' : '#f59e0b', fontSize: 10 }}>
            {marker.index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600">第 {marker.page} 頁</span>
          <span className="text-xs text-slate-400">({(marker.x * 100).toFixed(1)}%, {(marker.y * 100).toFixed(1)}%)</span>
        </div>
        <button onClick={() => onDelete(marker.id)} className="text-slate-300 hover:text-red-400 transition-colors text-sm leading-none" title="刪除標記">✕</button>
      </div>
      <select value={marker.fieldKey} onChange={(e) => onFieldAssign(marker.id, e.target.value)} className={`w-full text-xs rounded-lg border px-2 py-1.5 outline-none focus:ring-2 transition-all bg-white ${isAssigned ? 'border-blue-300 focus:ring-blue-200 text-blue-700 font-semibold' : 'border-amber-300 focus:ring-amber-200 text-slate-500'}`}>
        <option value="">— 選擇資料欄位 —</option>
        {fields.map(f => (<option key={f.key} value={f.key}>{f.label}</option>))}
      </select>
    </div>
  );
});

export default function FormTemplatePage() {
    const [file, setFile] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [isPdfReady, setIsPdfReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setMarkers([]);
            setIsPdfReady(false);
            setTemplateName(selected.name.replace(/\.pdf$/i, ''));
        }
    };

    const handlePageClick = useCallback(({ page, x, y }) => {
        setMarkers(prev => [
            ...prev,
            { id: crypto.randomUUID(), index: prev.length, page, x, y, fieldKey: '', fieldLabel: '' },
        ]);
    }, []);

    const handleFieldAssign = useCallback((markerId, fieldKey) => {
        const field = STUDENT_FIELDS.find(f => f.key === fieldKey);
        setMarkers(prev =>
            prev.map(m =>
                m.id === markerId ? { ...m, fieldKey, fieldLabel: field?.label ?? '' } : m
            )
        );
    }, []);

    const handleDeleteMarker = useCallback((markerId) => {
        setMarkers(prev => {
            const updated = prev.filter(m => m.id !== markerId).map((m, i) => ({ ...m, index: i }));
            return updated;
        });
    }, []);

    const handleSaveTemplate = async () => {
        const assignedMarkers = markers.filter(m => m.fieldKey);
        if (!file) return alert('請先上傳 PDF 檔案。');
        if (!templateName.trim()) return alert('請為您的範本命名。');
        if (assignedMarkers.length === 0) return alert('請至少標記並指定一個欄位。');

        // Firestore has a 1MB limit per document. Base64 is ~33% larger than binary.
        // We check against ~700KB to be safe.
        if (file.size > 700 * 1024) { 
            return alert(`錯誤：PDF 檔案過大 (${(file.size / 1024).toFixed(0)} KB)。此儲存方式僅支援小於 700KB 的檔案。`);
        }
        
        if (assignedMarkers.length < markers.length) {
            if (!window.confirm('您有部分標記尚未指定欄位，確定要儲存嗎？（未指定的標記將被忽略）')) {
                return;
            }
        }

        setIsSaving(true);
        try {
            const pdfAsBase64 = await fileToBase64(file);

            const templateData = {
                templateName: templateName.trim(),
                pdfData: pdfAsBase64,
                mappings: assignedMarkers.map(({ page, x, y, fieldKey }) => ({
                    page, x, y, fieldKey
                })),
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'form_templates'), templateData);
            
            alert(`✅ 範本 "${templateName.trim()}" 已成功儲存！`);
            
            setFile(null);
            setMarkers([]);
            setTemplateName('');
            setIsPdfReady(false);

        } catch (error) {
            console.error("儲存範本失敗:", error);
            alert(`儲存範本時發生錯誤：${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const assignedCount = markers.filter(m => m.fieldKey).length;

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">📄 範本標記編輯器</h1>
                    <p className="text-xs text-slate-500 mt-0.5">點擊 PDF 上的位置以新增填寫欄位標記</p>
                </div>
                {markers.length > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">{assignedCount} / {markers.length} 已指定欄位</span>
                        <button onClick={() => setMarkers([])} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors">
                            清除所有標記
                        </button>
                    </div>
                )}
            </header>

            <div className="flex h-[calc(100vh-65px)]">
                <main className="flex-1 overflow-y-auto p-6">
                    {!file ? (
                        <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                            <div className="text-center">
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                                <p className="text-lg font-bold text-slate-600">點擊上傳 PDF 範本</p>
                                <p className="text-sm text-slate-400 mt-1">僅支援 .pdf 格式</p>
                            </div>
                            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                    ) : (
                        <div>
                            {isPdfReady && (
                                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-xl">
                                    <span className="text-base">🖱️</span>
                                    <span><strong>點擊模式已啟動</strong> — 點擊 PDF 上任意位置以插入標記，然後在右側面板指定對應欄位。</span>
                                </div>
                            )}
                            <PdfPreviewer file={file} markers={markers} onPageClick={handlePageClick} onRenderSuccess={() => setIsPdfReady(true)} />
                        </div>
                    )}
                </main>

                <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <label htmlFor="templateName" className="font-black text-slate-700 text-sm tracking-wide uppercase">範本名稱</label>
                        <input id="templateName" type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="例如：2024 壁總盃 U12" className="w-full mt-2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {markers.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-12">
                                <div className="text-3xl mb-2">📍</div>
                                <p>尚未新增任何標記</p>
                                <p className="text-xs mt-1 text-slate-300">上傳 PDF 後點擊頁面即可新增</p>
                            </div>
                        ) : (
                            markers.map((marker) => (
                                <MarkerCard key={marker.id} marker={marker} fields={STUDENT_FIELDS} onFieldAssign={handleFieldAssign} onDelete={handleDeleteMarker} />
                            ))
                        )}
                    </div>

                    {file && (
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3">
                            <button onClick={handleSaveTemplate} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed">
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                {isSaving ? '儲存中...' : '儲存範本'}
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

