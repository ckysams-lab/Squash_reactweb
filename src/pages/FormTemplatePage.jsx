// src/pages/FormTemplatePage.jsx (Version 11.0)
//
// UX: identical to the original v6 click-to-mark experience.
//   Left  — full-height scrollable PDF preview; click anywhere to place a pin
//   Right — marker list; each marker selects which PDF form field it maps to,
//           AND what data source fills it (manual text or a student slot+property)
//
// Save format (v10-compatible):
//   mappings: [{ fieldName, source, prop, label }]
//     fieldName — the real AcroForm field name inside the PDF
//     source    — 'manual' | 'slot_A1' | 'slot_B2' | …
//     prop      — 'nameZH' | 'class' | 'dob' | … (only for slot sources)
//     label     — human-readable description for BatchFillPage

import React, { useState, useCallback, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Save } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Student properties available for slot auto-fill ─────────────────────────
export const STUDENT_PROPS = [
  { key: 'nameZH',   label: '中文姓名' },
  { key: 'nameEN',   label: '英文姓名' },
  { key: 'dob',      label: '出生日期' },
  { key: 'gender',   label: '性別' },
  { key: 'idNumber', label: '證件號碼' },
  { key: 'class',    label: '年級班別' },
  { key: 'phone',    label: '聯絡電話' },
];

// ─── Teams / slots ────────────────────────────────────────────────────────────
const TEAMS = ['A', 'B', 'C', 'D'];
const SLOTS_PER_TEAM = 6;

const SLOT_OPTIONS = TEAMS.flatMap(team =>
  Array.from({ length: SLOTS_PER_TEAM }, (_, i) => ({
    value: `slot_${team}${i + 1}`,
    label: `${team} 隊 第${i + 1}位`,
  }))
);

const DATA_SOURCE_OPTIONS = [
  { value: '',       label: '— 選擇填入方式 —' },
  { value: 'manual', label: '✏️ 手動輸入' },
  ...SLOT_OPTIONS,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload  = () => resolve(reader.result);
  reader.onerror = reject;
});

// Read all text field names + tooltip labels from the uploaded PDF
const readPdfFields = async (file) => {
  const { PDFDocument } = await import('pdf-lib');
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const form = doc.getForm();
  return form.getFields()
    .filter(f => f.constructor.name === 'PDFTextField')
    .map(f => ({ name: f.getName() }));
};

// ─── MarkerCard ───────────────────────────────────────────────────────────────
// Each marker has:
//   fieldName  — which PDF form field it targets (e.g. "name_of_participants_team_a_1")
//   source     — 'manual' | 'slot_A1' | …
//   prop       — 'nameZH' | 'class' | … (only meaningful when source is a slot)

const MarkerCard = React.memo(function MarkerCard({ marker, pdfFields, onChange, onDelete }) {
  const isAssigned = Boolean(marker.fieldName && marker.source);
  const isSlot = marker.source?.startsWith('slot_');

  // Badge colour
  let badgeBg = '#f59e0b'; // amber = unassigned
  if (isAssigned && isSlot) badgeBg = '#2563eb'; // blue = slot
  if (isAssigned && marker.source === 'manual') badgeBg = '#7c3aed'; // purple = manual

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isAssigned ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center justify-center rounded-full text-white font-black shadow"
            style={{ width: 22, height: 22, background: badgeBg, fontSize: 10 }}
          >
            {marker.index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600">第 {marker.page} 頁</span>
        </div>
        <button
          onClick={() => onDelete(marker.id)}
          className="text-slate-300 hover:text-red-400 transition-colors text-sm"
          title="刪除標記"
        >✕</button>
      </div>

      {/* Row 1: which PDF field */}
      <div className="mb-2">
        <p className="text-xs text-slate-400 mb-1">PDF 表單欄位</p>
        <select
          value={marker.fieldName || ''}
          onChange={e => onChange(marker.id, 'fieldName', e.target.value)}
          className="w-full text-xs rounded-lg border px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-300 border-slate-300"
        >
          <option value="">— 選擇 PDF 欄位 —</option>
          {pdfFields.map(f => (
            <option key={f.name} value={f.name}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Row 2: data source */}
      <div className="mb-2">
        <p className="text-xs text-slate-400 mb-1">填入資料來源</p>
        <select
          value={marker.source || ''}
          onChange={e => onChange(marker.id, 'source', e.target.value)}
          className={`w-full text-xs rounded-lg border px-2 py-1.5 bg-white outline-none focus:ring-2 ${
            isAssigned ? 'border-blue-300 focus:ring-blue-200' : 'border-slate-300'
          }`}
        >
          {DATA_SOURCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Row 3: student property (only when source is a slot) */}
      {isSlot && (
        <div>
          <p className="text-xs text-slate-400 mb-1">學生屬性</p>
          <select
            value={marker.prop || ''}
            onChange={e => onChange(marker.id, 'prop', e.target.value)}
            className="w-full text-xs rounded-lg border border-blue-300 px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">— 選擇屬性 —</option>
            {STUDENT_PROPS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Summary label when fully assigned */}
      {isAssigned && (
        <p className="text-xs mt-2 font-semibold truncate" style={{ color: badgeBg }}>
          {marker.fieldName}
          {isSlot && marker.prop
            ? ` ← ${SLOT_OPTIONS.find(s => s.value === marker.source)?.label} · ${STUDENT_PROPS.find(p => p.key === marker.prop)?.label}`
            : marker.source === 'manual' ? ' ← 手動輸入' : ''}
        </p>
      )}
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FormTemplatePage() {
  const [file,         setFile]        = useState(null);
  const [pdfFields,    setPdfFields]   = useState([]);  // [{ name }]
  const [markers,      setMarkers]     = useState([]);  // placed pins
  const [isPdfReady,   setIsPdfReady]  = useState(false);
  const [isReading,    setIsReading]   = useState(false);
  const [isSaving,     setIsSaving]    = useState(false);
  const [templateName, setTemplateName] = useState('');

  // ── Upload PDF → read its form fields ─────────────────────────────────────
  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected || selected.type !== 'application/pdf') return;
    setFile(selected);
    setMarkers([]);
    setIsPdfReady(false);
    setTemplateName(selected.name.replace(/\.pdf$/i, ''));
    setPdfFields([]);
    setIsReading(true);
    try {
      const fields = await readPdfFields(selected);
      setPdfFields(fields);
    } catch (err) {
      console.error('讀取 PDF 欄位失敗:', err);
      // Non-fatal — user can still place markers, just won't have field list
    } finally {
      setIsReading(false);
    }
  };

  // ── Place a marker on click ────────────────────────────────────────────────
  const handlePageClick = useCallback(({ page, x, y }) => {
    setMarkers(prev => [
      ...prev,
      { id: crypto.randomUUID(), index: prev.length, page, x, y, fieldName: '', source: '', prop: '' },
    ]);
  }, []);

  // ── Update a marker field ──────────────────────────────────────────────────
  const handleMarkerChange = useCallback((markerId, key, value) => {
    setMarkers(prev => prev.map(m => {
      if (m.id !== markerId) return m;
      const updated = { ...m, [key]: value };
      // Reset prop when switching source away from a slot
      if (key === 'source' && !value.startsWith('slot_')) updated.prop = '';
      return updated;
    }));
  }, []);

  // ── Delete a marker ────────────────────────────────────────────────────────
  const handleDeleteMarker = useCallback((markerId) => {
    setMarkers(prev =>
      prev.filter(m => m.id !== markerId).map((m, i) => ({ ...m, index: i }))
    );
  }, []);

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!file)                return alert('請先上傳 PDF 檔案。');
    if (!templateName.trim()) return alert('請為範本命名。');
    if (file.size > 700 * 1024) return alert(`PDF 過大 (${(file.size / 1024).toFixed(0)} KB)，最大 700KB。`);

    // Only save markers that have both a fieldName and a source
    const validMarkers = markers.filter(m => m.fieldName && m.source);
    if (validMarkers.length === 0) return alert('請至少完整設定一個標記（需選擇 PDF 欄位及填入方式）。');

    if (validMarkers.length < markers.length) {
      if (!window.confirm(`有 ${markers.length - validMarkers.length} 個標記尚未完整設定，確定儲存嗎？（不完整的標記將被略過）`)) return;
    }

    setIsSaving(true);
    try {
      const pdfAsBase64 = await fileToBase64(file);

      // Build a human label for each mapping
      const buildLabel = (m) => {
        if (m.source === 'manual') return m.fieldName;
        const slotLabel = SLOT_OPTIONS.find(s => s.value === m.source)?.label || m.source;
        const propLabel = STUDENT_PROPS.find(p => p.key === m.prop)?.label || m.prop || '';
        return `${slotLabel} · ${propLabel}`;
      };

      await addDoc(collection(db, 'form_templates'), {
        templateName: templateName.trim(),
        pdfData:      pdfAsBase64,
        version:      10,
        mappings:     validMarkers.map(m => ({
          fieldName: m.fieldName,
          source:    m.source,
          prop:      m.prop || null,
          label:     buildLabel(m),
        })),
        createdAt: serverTimestamp(),
      });

      alert(`✅ 範本「${templateName.trim()}」已儲存，共 ${validMarkers.length} 個欄位標記。`);
      setFile(null); setMarkers([]); setTemplateName(''); setIsPdfReady(false); setPdfFields([]);
    } catch (err) {
      console.error('儲存失敗:', err);
      alert(`儲存失敗：${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const assignedCount = markers.filter(m => m.fieldName && m.source).length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">📄 範本標記編輯器</h1>
          <p className="text-xs text-slate-500 mt-0.5">點擊 PDF 頁面放置標記，然後在右側設定每個標記的 PDF 欄位及填入方式</p>
        </div>
        {markers.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{assignedCount} / {markers.length} 已完整設定</span>
            <button
              onClick={() => setMarkers([])}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              清除所有標記
            </button>
          </div>
        )}
      </header>

      {/* ── Body: left PDF + right panel ── */}
      <div className="flex h-[calc(100vh-65px)]">

        {/* LEFT — PDF preview, full height */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-200">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed border-slate-400 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-slate-100 transition-all group">
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <p className="text-lg font-bold text-slate-600">點擊上傳 PDF 範本</p>
                <p className="text-sm text-slate-400 mt-1">僅支援 .pdf 格式，最大 700KB</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div>
              {isReading && (
                <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2 rounded-xl">
                  <Loader2 className="animate-spin" size={14} />
                  正在讀取 PDF 表單欄位…
                </div>
              )}
              {isPdfReady && !isReading && (
                <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-xl">
                  <span>🖱️</span>
                  <span><strong>點擊模式已啟動</strong> — 點擊 PDF 上任意位置以新增標記，然後在右側面板設定欄位對應。</span>
                </div>
              )}
              {/* PdfPreviewer fills 100% of the available width naturally */}
              <PdfPreviewer
                file={file}
                markers={markers}
                onPageClick={handlePageClick}
                onRenderSuccess={() => setIsPdfReady(true)}
              />
            </div>
          )}
        </main>

        {/* RIGHT — marker list panel */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
          {/* Template name */}
          <div className="px-5 py-4 border-b border-slate-100">
            <label className="font-black text-slate-700 text-xs tracking-wide uppercase">範本名稱</label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="例如：2026 外展壁球 U12"
              className="w-full mt-2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
            {pdfFields.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                已讀取 <span className="font-semibold text-blue-600">{pdfFields.length}</span> 個 PDF 表單欄位
              </p>
            )}
          </div>

          {/* Marker list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {markers.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-12">
                <div className="text-3xl mb-2">📍</div>
                <p className="font-semibold">尚未新增任何標記</p>
                <p className="text-xs mt-1 text-slate-300">上傳 PDF 後點擊頁面新增</p>
              </div>
            ) : (
              markers.map(marker => (
                <MarkerCard
                  key={marker.id}
                  marker={marker}
                  pdfFields={pdfFields}
                  onChange={handleMarkerChange}
                  onDelete={handleDeleteMarker}
                />
              ))
            )}
          </div>

          {/* Save button */}
          {file && (
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? '儲存中…' : '儲存範本'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
