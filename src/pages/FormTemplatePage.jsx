// src/pages/FormTemplatePage.jsx (Version 5.3)
import React, { useState, useCallback } from 'react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Available student data fields ───────────────────────────────────────────
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

let markerIdCounter = 0;

export default function FormTemplatePage() {
  const [file, setFile] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isPdfReady, setIsPdfReady] = useState(false);

  // ── File upload ──────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setMarkers([]);
      setIsPdfReady(false);
    }
  }

  // ── Receive click coords from PdfPreviewer ───────────────────────────────
  // Now receives both normalised (x, y) for pin display AND true PDF coords
  // (pdfX, pdfY, pageWidth, pageHeight) for actual PDF generation later.
  const handlePageClick = useCallback(({ page, x, y, pdfX, pdfY, pageWidth, pageHeight }) => {
    setMarkers(prev => [
      ...prev,
      {
        id: `marker_${++markerIdCounter}`,
        index: prev.length,
        page,
        // For rendering the pin on screen (normalised 0–1)
        x,
        y,
        // For writing into the actual PDF later (PDF point units)
        pdfX,
        pdfY,
        pageWidth,
        pageHeight,
        fieldKey: '',
        fieldLabel: '',
      },
    ]);
  }, []);

  // ── Assign a student field to a marker ──────────────────────────────────
  function handleFieldAssign(markerId, fieldKey) {
    const field = STUDENT_FIELDS.find(f => f.key === fieldKey);
    setMarkers(prev =>
      prev.map(m =>
        m.id === markerId
          ? { ...m, fieldKey, fieldLabel: field?.label ?? '' }
          : m
      )
    );
  }

  // ── Delete a marker ──────────────────────────────────────────────────────
  function handleDeleteMarker(markerId) {
    setMarkers(prev =>
      prev
        .filter(m => m.id !== markerId)
        .map((m, i) => ({ ...m, index: i })) // re-index after deletion
    );
  }

  // ── Export template config (ready to save to Firestore / JSON) ──────────
  function handleExport() {
    const unassigned = markers.filter(m => !m.fieldKey).length;
    if (unassigned > 0) {
      alert(`還有 ${unassigned} 個標記尚未指定欄位，請先完成所有標記的設定。`);
      return;
    }
    const config = markers.map(m => ({
      page:        m.page,
      fieldKey:    m.fieldKey,
      fieldLabel:  m.fieldLabel,
      pdfX:        m.pdfX,
      pdfY:        m.pdfY,
      pageWidth:   m.pageWidth,
      pageHeight:  m.pageHeight,
    }));
    console.log('📋 Template config ready to save:', JSON.stringify(config, null, 2));
    alert(`✅ ${config.length} 個欄位設定已準備完成！請查看 console 確認輸出。`);
    // TODO: replace alert with your Firestore save call, e.g.:
    // await setDoc(doc(db, 'formTemplates', templateId), { fields: config });
  }

  const assignedCount = markers.filter(m => m.fieldKey).length;
  const allAssigned = markers.length > 0 && assignedCount === markers.length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">📄 範本標記編輯器</h1>
          <p className="text-xs text-slate-500 mt-0.5">點擊 PDF 上的位置以新增填寫欄位標記</p>
        </div>
        {markers.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {assignedCount} / {markers.length} 已指定欄位
            </span>
            <button
              onClick={() => setMarkers([])}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              清除所有標記
            </button>
            <button
              onClick={handleExport}
              disabled={!allAssigned}
              className="text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-colors font-bold"
            >
              儲存模板設定 →
            </button>
          </div>
        )}
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* ── Left: PDF Preview ── */}
        <main className="flex-1 overflow-y-auto p-6">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <p className="text-lg font-bold text-slate-600">點擊上傳 PDF 範本</p>
                <p className="text-sm text-slate-400 mt-1">僅支援 .pdf 格式</p>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div>
              {isPdfReady && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-xl">
                  <span className="text-base">🖱️</span>
                  <span>
                    <strong>點擊模式已啟動</strong> — 點擊 PDF 上任意位置以插入標記，然後在右側面板指定對應欄位。
                  </span>
                </div>
              )}

              <PdfPreviewer
                file={file}
                markers={markers}
                onPageClick={handlePageClick}
                onRenderSuccess={() => setIsPdfReady(true)}
              />
            </div>
          )}
        </main>

        {/* ── Right: Control Panel ── */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-700 text-sm tracking-wide uppercase">控制面板</h2>
            <p className="text-xs text-slate-400 mt-0.5">為每個標記指定學生資料欄位</p>
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
                <MarkerCard
                  key={marker.id}
                  marker={marker}
                  fields={STUDENT_FIELDS}
                  onFieldAssign={handleFieldAssign}
                  onDelete={handleDeleteMarker}
                />
              ))
            )}
          </div>

          {/* Summary footer */}
          {markers.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">標記摘要</p>
              <div className="space-y-1">
                {markers.map(m => (
                  <div key={m.id} className="flex justify-between text-xs text-slate-600">
                    <span className="font-semibold">
                      #{m.index + 1} 第 {m.page} 頁
                      <span className="text-slate-400 font-normal ml-1">
                        ({m.pdfX}, {m.pdfY})
                      </span>
                    </span>
                    <span className={m.fieldKey ? 'text-blue-600 font-bold' : 'text-amber-500'}>
                      {m.fieldLabel || '未指定'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Individual marker card in the control panel ──────────────────────────────
function MarkerCard({ marker, fields, onFieldAssign, onDelete }) {
  const isAssigned = Boolean(marker.fieldKey);

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isAssigned ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-full text-white text-xs font-black shadow"
            style={{
              width: 22,
              height: 22,
              background: isAssigned ? '#2563eb' : '#f59e0b',
              fontSize: 10,
            }}
          >
            {marker.index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            第 {marker.page} 頁
          </span>
          {/* Shows both normalised % and true PDF coords */}
          <span className="text-xs text-slate-400" title={`PDF 座標: (${marker.pdfX}, ${marker.pdfY})`}>
            ({(marker.x * 100).toFixed(1)}%, {(marker.y * 100).toFixed(1)}%)
          </span>
        </div>
        <button
          onClick={() => onDelete(marker.id)}
          className="text-slate-300 hover:text-red-400 transition-colors text-sm leading-none"
          title="刪除標記"
        >
          ✕
        </button>
      </div>

      {/* Field selector */}
      <select
        value={marker.fieldKey}
        onChange={(e) => onFieldAssign(marker.id, e.target.value)}
        className={`w-full text-xs rounded-lg border px-2 py-1.5 outline-none focus:ring-2 transition-all bg-white ${
          isAssigned
            ? 'border-blue-300 focus:ring-blue-200 text-blue-700 font-semibold'
            : 'border-amber-300 focus:ring-amber-200 text-slate-500'
        }`}
      >
        <option value="">— 選擇資料欄位 —</option>
        {fields.map(f => (
          <option key={f.key} value={f.key}>{f.label}</option>
        ))}
      </select>
    </div>
  );
}
