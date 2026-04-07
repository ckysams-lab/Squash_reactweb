// src/pages/FormTemplatePage.jsx (Version 9.0 - PDF Form Field Mapping)
//
// STRATEGY CHANGE: Instead of clicking coordinates on the PDF, this page:
//   1. Reads the actual named form fields embedded in the uploaded PDF
//   2. Lets the user map each PDF field → a student property or manual input
//   3. Saves that mapping to Firestore alongside the PDF data
//
// This completely avoids the coordinate system and font problems:
// - No more drawText() with Helvetica (which can't render Chinese)
// - Fill fields via pdf-lib's form.getTextField(name).setText(value)
//   which preserves the PDF's original Chinese font (PMingLiU etc.)

import React, { useState, useCallback, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Save, Upload, FileText } from 'lucide-react';

// ─── Known student properties (auto-filled from the student record) ───────────
export const STUDENT_PROPS = [
  { key: 'nameZH',   label: '學生中文姓名' },
  { key: 'nameEN',   label: '學生英文姓名' },
  { key: 'dob',      label: '出生日期' },
  { key: 'gender',   label: '性別' },
  { key: 'idNumber', label: '證件號碼' },
  { key: 'class',    label: '年級班別' },
  { key: 'phone',    label: '聯絡電話' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload  = () => resolve(reader.result);
  reader.onerror = reject;
});

/**
 * Read all /Tx (text) form field names from a PDF File object.
 * Uses pdf-lib to parse the PDF in the browser.
 */
const readPdfFormFields = async (file) => {
  const { PDFDocument } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  return form.getFields()
    .filter(f => f.constructor.name === 'PDFTextField')
    .map(f => f.getName());
};

// ─── Slot system ──────────────────────────────────────────────────────────────
// A "slot" is a numbered player position on the form, e.g. "A隊 第1位".
// Multiple PDF fields map to the same slot (name, class, dob).
// When the user fills a slot with a student, all three fields get resolved.

export const TEAMS = ['A', 'B', 'C', 'D'];
export const SLOTS_PER_TEAM = 6; // form supports 6 players per team

// Try to auto-detect which slot a PDF field name belongs to.
// Returns { team: 'A', slotNum: 1 } or null.
const guessSlot = (fieldName) => {
  const lower = fieldName.toLowerCase();
  for (const team of TEAMS) {
    const t = team.toLowerCase();
    // patterns: name_of_participants_team_a_1, Team A, Team A_2, birth_year_Team A, etc.
    const m =
      lower.match(new RegExp(`team[_\\s]${t}[_\\s](\\d+)$`)) ||
      lower.match(new RegExp(`team[_\\s]${t}$`));
    if (m) return { team, slotNum: parseInt(m[1] || '1', 10) };
  }
  return null;
};

// Try to auto-detect which student property a PDF field name represents.
const guessProp = (fieldName) => {
  const lower = fieldName.toLowerCase();
  if (lower.includes('name_of_participants') || lower.startsWith('name_of')) return 'nameZH';
  if (lower.startsWith('team ') || lower.startsWith('team_') || lower.match(/^team [a-d](_\d+)?$/i)) return 'class';
  if (lower.includes('birth')) return 'dob';
  return null;
};

// ─── MappingRow ───────────────────────────────────────────────────────────────
const SOURCE_OPTIONS = [
  { value: '',         label: '— 跳過此欄位 —' },
  { value: 'manual',   label: '✏️ 手動輸入' },
  ...TEAMS.flatMap(team =>
    Array.from({ length: SLOTS_PER_TEAM }, (_, i) => ({
      value: `slot_${team}${i + 1}`,
      label: `👤 ${team}隊 第${i + 1}位`,
    }))
  ),
];

const PROP_OPTIONS = STUDENT_PROPS.map(p => ({ value: p.key, label: p.label }));

const MappingRow = React.memo(function MappingRow({ fieldName, mapping, onChange }) {
  const { source, prop } = mapping;
  const isSlot   = source?.startsWith('slot_');
  const isManual = source === 'manual';

  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-slate-100 last:border-0">
      {/* PDF field name */}
      <div className="col-span-4">
        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded block truncate" title={fieldName}>
          {fieldName}
        </code>
      </div>

      {/* Source picker */}
      <div className="col-span-4">
        <select
          value={source || ''}
          onChange={e => onChange(fieldName, 'source', e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-300"
        >
          {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Property picker (only for slot) */}
      <div className="col-span-4">
        {isSlot && (
          <select
            value={prop || ''}
            onChange={e => onChange(fieldName, 'prop', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">— 選擇欄位 —</option>
            {PROP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        {isManual && (
          <span className="text-xs text-slate-400 italic px-2">填表時手動輸入</span>
        )}
        {!isSlot && !isManual && source === '' && (
          <span className="text-xs text-slate-300 px-2">—</span>
        )}
      </div>
    </div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FormTemplatePage() {
  const [file,          setFile]         = useState(null);
  const [templateName,  setTemplateName] = useState('');
  const [pdfFields,     setPdfFields]    = useState([]);   // raw field names from PDF
  const [mappings,      setMappings]     = useState({});   // { fieldName: { source, prop } }
  const [isReading,     setIsReading]    = useState(false);
  const [isSaving,      setIsSaving]     = useState(false);

  // ── File upload → read form fields ─────────────────────────────────────────
  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected || selected.type !== 'application/pdf') return;

    setFile(selected);
    setTemplateName(selected.name.replace(/\.pdf$/i, ''));
    setPdfFields([]);
    setMappings({});
    setIsReading(true);

    try {
      const fields = await readPdfFormFields(selected);
      setPdfFields(fields);

      // Auto-map fields based on heuristics
      const auto = {};
      for (const f of fields) {
        const slot = guessSlot(f);
        const prop = guessProp(f);
        if (slot && prop) {
          auto[f] = { source: `slot_${slot.team}${slot.slotNum}`, prop };
        } else {
          auto[f] = { source: '', prop: '' };
        }
      }
      setMappings(auto);
    } catch (err) {
      console.error('讀取 PDF 欄位失敗:', err);
      alert(`無法讀取 PDF 表單欄位：${err.message}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleMappingChange = useCallback((fieldName, key, value) => {
    setMappings(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [key]: value,
        // Reset prop when source changes away from slot
        ...(key === 'source' && !value.startsWith('slot_') ? { prop: '' } : {}),
      },
    }));
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!file)               return alert('請先上傳 PDF 檔案。');
    if (!templateName.trim()) return alert('請為範本命名。');

    const activeMappings = Object.entries(mappings)
      .filter(([, m]) => m.source)
      .map(([fieldName, m]) => ({ fieldName, source: m.source, prop: m.prop || null }));

    if (activeMappings.length === 0) return alert('請至少設定一個欄位的對應。');

    if (file.size > 700 * 1024) return alert(`PDF 過大 (${(file.size / 1024).toFixed(0)} KB)，最大 700KB。`);

    setIsSaving(true);
    try {
      const pdfAsBase64 = await fileToBase64(file);
      await addDoc(collection(db, 'form_templates'), {
        templateName: templateName.trim(),
        pdfData: pdfAsBase64,
        mappings: activeMappings,   // [{ fieldName, source, prop }]
        version: 9,
        createdAt: serverTimestamp(),
      });
      alert(`✅ 範本 "${templateName.trim()}" 已成功儲存！`);
      setFile(null); setPdfFields([]); setMappings({}); setTemplateName('');
    } catch (err) {
      console.error('儲存失敗:', err);
      alert(`儲存失敗：${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeMappingCount = Object.values(mappings).filter(m => m.source).length;
  const slotMappingCount   = Object.values(mappings).filter(m => m.source?.startsWith('slot_')).length;
  const manualMappingCount = Object.values(mappings).filter(m => m.source === 'manual').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-black text-slate-800">📄 範本欄位對應編輯器</h1>
        <p className="text-xs text-slate-500 mt-0.5">上傳 PDF 表格，系統將自動讀取表單欄位，並讓您設定每個欄位的填入方式</p>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Upload + name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">上傳 PDF 表格</label>
              <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 transition-all group">
                <Upload size={20} className="text-slate-400 group-hover:text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">{file ? file.name : '選擇 PDF 檔案'}</p>
                  <p className="text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(0)} KB` : '最大 700KB'}</p>
                </div>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">範本名稱</label>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="例如：2026 外展壁球 U12"
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isReading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-3 text-slate-500 shadow-sm">
            <Loader2 className="animate-spin" size={20} />
            <span>正在讀取 PDF 表單欄位…</span>
          </div>
        )}

        {/* Field mapping table */}
        {pdfFields.length > 0 && !isReading && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-800">欄位對應設定</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  發現 {pdfFields.length} 個表單欄位 ·
                  已對應 {activeMappingCount} 個（球員 {slotMappingCount} · 手動 {manualMappingCount}）
                </p>
              </div>
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <div className="col-span-4">PDF 欄位名稱</div>
              <div className="col-span-4">填入方式</div>
              <div className="col-span-4">學生屬性</div>
            </div>

            {/* Rows */}
            <div className="px-6 divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
              {pdfFields.map(fieldName => (
                <MappingRow
                  key={fieldName}
                  fieldName={fieldName}
                  mapping={mappings[fieldName] || { source: '', prop: '' }}
                  onChange={handleMappingChange}
                />
              ))}
            </div>

            {/* Save button */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving || activeMappingCount === 0}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? '儲存中…' : '儲存範本'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!file && !isReading && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-slate-500">請上傳 PDF 表格以開始設定欄位對應</p>
            <p className="text-xs mt-1">系統會自動識別表格中的填寫欄位</p>
          </div>
        )}
      </div>
    </div>
  );
}
