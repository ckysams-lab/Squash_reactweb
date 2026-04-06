// src/pages/FormTemplatePage.jsx (Version 8.0 - Multi-Student Slot Support)

import React, { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Save } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Field Definitions ───────────────────────────────────────────────────────
//
// Three kinds of fields:
//   "manual"       – typed once, same on all copies (school name, teacher, etc.)
//   "student_slot" – per-slot student data picked from roster on BatchFillPage
//                    fieldKey format: "slot_A1_nameZH"

export const SCHOOL_FIELDS = [
  { key: 'schoolNameZH',    label: '學校名稱（中文）', source: 'manual' },
  { key: 'schoolNameShort', label: '校名簡稱（中文）', source: 'manual' },
  { key: 'address',         label: '地址',             source: 'manual' },
  { key: 'email',           label: '電郵地址',          source: 'manual' },
  { key: 'fax',             label: '傳真號碼',          source: 'manual' },
  { key: 'teacherName',     label: '負責老師姓名',      source: 'manual' },
  { key: 'teacherPhone',    label: '老師聯絡電話',      source: 'manual' },
  { key: 'captainName',     label: '領隊姓名',          source: 'manual' },
  { key: 'captainPhone',    label: '領隊聯絡電話',      source: 'manual' },
  { key: 'signDate',        label: '簽署日期',          source: 'manual' },
];

// Per-student properties pulled automatically from the student record
export const STUDENT_PROPS = [
  { prop: 'nameZH', label: '中文姓名' },
  { prop: 'class',  label: '就讀班別' },
  { prop: 'dob',    label: '出生日期' },
];

// 4 teams × 3 player slots = 12 slots total
export const TEAM_SLOTS = ['A', 'B', 'C', 'D'].flatMap(team =>
  [1, 2, 3].map(n => ({ slotId: `${team}${n}`, label: `${team} 隊 第${n}位` }))
);

export const makeSlotKey = (slotId, prop) => `slot_${slotId}_${prop}`;

export const parseSlotKey = (key) => {
  const m = key?.match(/^slot_([A-D]\d+)_(.+)$/);
  return m ? { slotId: m[1], prop: m[2] } : null;
};

// Flat list with group labels for the <select>
export const ALL_FIELDS = [
  ...SCHOOL_FIELDS.map(f => ({ ...f, group: '📋 學校資料（手動填寫）' })),
  ...TEAM_SLOTS.flatMap(({ slotId, label: slotLabel }) =>
    STUDENT_PROPS.map(({ prop, label: propLabel }) => ({
      key: makeSlotKey(slotId, prop),
      label: `${slotLabel} · ${propLabel}`,
      group: `👤 球員名單（${slotId[0]} 隊）`,
      source: 'student_slot',
      slotId,
      prop,
    }))
  ),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

// ─── MarkerCard ───────────────────────────────────────────────────────────────

const SOURCE_BADGE = {
  manual: { bg: '#fef9c3', color: '#92400e', text: '手動' },
  student_slot: { bg: '#dbeafe', color: '#1d4ed8', text: '球員' },
};

// Pre-group options so the select renders correctly
const GROUPED_OPTIONS = (() => {
  const map = new Map();
  for (const f of ALL_FIELDS) {
    if (!map.has(f.group)) map.set(f.group, []);
    map.get(f.group).push(f);
  }
  return [...map.entries()];
})();

const MarkerCard = React.memo(function MarkerCard({ marker, onFieldAssign, onDelete }) {
  const isAssigned = Boolean(marker.fieldKey);
  const field = ALL_FIELDS.find(f => f.key === marker.fieldKey);
  const badge = field ? SOURCE_BADGE[field.source] : null;

  return (
    <div className={`rounded-xl border p-3 transition-all ${isAssigned ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center justify-center rounded-full text-white font-black shadow"
            style={{ width: 22, height: 22, background: isAssigned ? '#2563eb' : '#f59e0b', fontSize: 10 }}
          >
            {marker.index + 1}
          </span>
          <span className="text-xs font-semibold text-slate-600">第 {marker.page} 頁</span>
          <span className="text-xs text-slate-400">({(marker.x * 100).toFixed(1)}%, {(marker.y * 100).toFixed(1)}%)</span>
          {badge && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: badge.bg, color: badge.color, fontWeight: 700 }}>
              {badge.text}
            </span>
          )}
        </div>
        <button onClick={() => onDelete(marker.id)} className="text-slate-300 hover:text-red-400 transition-colors text-sm" title="刪除標記">✕</button>
      </div>

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
        {GROUPED_OPTIONS.map(([group, fields]) => (
          <optgroup key={group} label={group}>
            {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────

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
      { id: crypto.randomUUID(), index: prev.length, page, x, y, fieldKey: '' },
    ]);
  }, []);

  const handleFieldAssign = useCallback((markerId, fieldKey) => {
    const field = ALL_FIELDS.find(f => f.key === fieldKey);
    setMarkers(prev =>
      prev.map(m =>
        m.id === markerId
          ? {
              ...m,
              fieldKey,
              fieldLabel:  field?.label  ?? '',
              fieldSource: field?.source ?? '',
              slotId:      field?.slotId ?? null,
              prop:        field?.prop   ?? null,
            }
          : m
      )
    );
  }, []);

  const handleDeleteMarker = useCallback((markerId) => {
    setMarkers(prev =>
      prev.filter(m => m.id !== markerId).map((m, i) => ({ ...m, index: i }))
    );
  }, []);

  const handleSaveTemplate = async () => {
    const assignedMarkers = markers.filter(m => m.fieldKey);
    if (!file)                    return alert('請先上傳 PDF 檔案。');
    if (!templateName.trim())     return alert('請為您的範本命名。');
    if (assignedMarkers.length === 0) return alert('請至少標記並指定一個欄位。');
    if (file.size > 700 * 1024)   return alert(`錯誤：PDF 過大 (${(file.size / 1024).toFixed(0)} KB)，最大 700KB。`);

    if (assignedMarkers.length < markers.length) {
      if (!window.confirm('部分標記尚未指定欄位，確定儲存嗎？（未指定的標記將被忽略）')) return;
    }

    setIsSaving(true);
    try {
      const pdfAsBase64 = await fileToBase64(file);
      await addDoc(collection(db, 'form_templates'), {
        templateName: templateName.trim(),
        pdfData: pdfAsBase64,
        mappings: assignedMarkers.map(({ page, x, y, fieldKey, fieldLabel, fieldSource, slotId, prop }) => ({
          page, x, y, fieldKey, fieldLabel, fieldSource,
          slotId: slotId ?? null,
          prop:   prop   ?? null,
        })),
        createdAt: serverTimestamp(),
      });
      alert(`✅ 範本 "${templateName.trim()}" 已成功儲存！`);
      setFile(null); setMarkers([]); setTemplateName(''); setIsPdfReady(false);
    } catch (error) {
      console.error('儲存範本失敗:', error);
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
            <button
              onClick={() => setMarkers([])}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >清除所有標記</button>
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
                <p className="text-sm text-slate-400 mt-1">僅支援 .pdf 格式，最大 700KB</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div>
              {isPdfReady && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-xl">
                  <span>🖱️</span>
                  <span><strong>點擊模式已啟動</strong> — 點擊 PDF 上任意位置以插入標記，然後在右側面板指定對應欄位。</span>
                </div>
              )}
              {/* markers prop passed so pins render on the PDF */}
              <PdfPreviewer
                file={file}
                markers={markers}
                onPageClick={handlePageClick}
                onRenderSuccess={() => setIsPdfReady(true)}
              />
            </div>
          )}
        </main>

        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <label htmlFor="tplName" className="font-black text-slate-700 text-sm tracking-wide uppercase">範本名稱</label>
            <input
              id="tplName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例如：2026 外展壁球 U12"
              className="w-full mt-2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {markers.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-12">
                <div className="text-3xl mb-2">📍</div>
                <p>尚未新增任何標記</p>
                <p className="text-xs mt-1 text-slate-300">上傳 PDF 後點擊頁面即可新增</p>
              </div>
            ) : markers.map(marker => (
              <MarkerCard key={marker.id} marker={marker} onFieldAssign={handleFieldAssign} onDelete={handleDeleteMarker} />
            ))}
          </div>

          {file && (
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
              <button
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? '儲存中...' : '儲存範本'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
