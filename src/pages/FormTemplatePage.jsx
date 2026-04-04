// src/pages/FormTemplatePage.jsx (Version 5.3 - Optimized)

import React, { useState, useCallback } from 'react';
import PdfPreviewer from '../components/PdfPreviewer';

const STUDENT_FIELDS = [
    { key: 'student_name',   label: '學生姓名' },
    { key: 'student_id',     label: '學號' },
    { key: 'class',          label: '班級' },
    { key: 'date',           label: '日期' },
    { key: 'score',          label: '成績' },
    { key: 'grade',          label: '評等' },
    { key: 'teacher_name',   label: '教師姓名' },
    { key: 'subject',        label: '科目' },
    { key: 'semester',       label: '學期' },
    { key: 'remarks',        label: '備註' },
];

// --- v5.3 Optimization: Wrap MarkerCard in React.memo ---
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

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setMarkers([]);
            setIsPdfReady(false);
        }
    };

    const handlePageClick = useCallback(({ page, x, y }) => {
        setMarkers(prev => [
            ...prev,
            {
                id: crypto.randomUUID(), // v5.3: Use robust unique ID
                index: prev.length,
                page,
                x,
                y,
                fieldKey: '',
                fieldLabel: '',
            },
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

    const assignedCount = markers.filter(m => m.fieldKey).length;

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                {/* ... Header JSX is identical to your v5.2 ... */}
            </header>
            <div className="flex h-[calc(100vh-65px)]">
                <main className="flex-1 overflow-y-auto p-6">
                    {!file ? (
                        <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] ...">
                            {/* ... Upload prompt JSX is identical to your v5.2 ... */}
                        </label>
                    ) : (
                        <div>
                            {isPdfReady && (
                                <div className="mb-4 flex items-center gap-2 bg-amber-50 ...">
                                    {/* ... Mode hint banner JSX is identical to your v5.2 ... */}
                                </div>
                            )}
                            <PdfPreviewer file={file} markers={markers} onPageClick={handlePageClick} onRenderSuccess={() => setIsPdfReady(true)} />
                        </div>
                    )}
                </main>
                <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="font-black text-slate-700 text-sm tracking-wide uppercase">控制面板</h2>
                        <p className="text-xs text-slate-400 mt-0.5">為每個標記指定學生資料欄位</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {markers.length === 0 ? (
                            <div className="text-center text-slate-400 text-sm py-12">
                                {/* ... Empty state JSX is identical to your v5.2 ... */}
                            </div>
                        ) : (
                            markers.map((marker) => (
                                <MarkerCard key={marker.id} marker={marker} fields={STUDENT_FIELDS} onFieldAssign={handleFieldAssign} onDelete={handleDeleteMarker} />
                            ))
                        )}
                    </div>
                    {markers.length > 0 && (
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                            {/* ... Summary JSX is identical to your v5.2 ... */}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

