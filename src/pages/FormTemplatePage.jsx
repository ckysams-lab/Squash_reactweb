// src/pages/FormTemplatePage.jsx (Version 10.0)
//
// What this page does:
//   1. User uploads a PDF that has interactive form fields (AcroForm)
//   2. pdf-lib reads the field names automatically — no clicking needed
//   3. User sees the PDF preview on the left, field mapping table on the right
//   4. Each PDF field is pre-mapped by heuristic; user can correct any wrong ones
//   5. Save → stores { templateName, pdfData(base64), mappings, version:10 } in Firestore
//
// Mapping format saved:  [{ fieldName, source, prop, label }]
//   source = 'manual'         → user types a value on BatchFillPage
//   source = 'slot_A1' etc.   → auto-filled from a chosen student's property
//   prop   = 'nameZH' | 'class' | 'dob' | …

import React, { useState, useCallback, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Save, Upload } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Student props available for auto-fill ────────────────────────────────────
export const STUDENT_PROPS = [
  { key: 'nameZH',   label: '學生中文姓名' },
  { key: 'nameEN',   label: '學生英文姓名' },
  { key: 'dob',      label: '出生日期' },
  { key: 'gender',   label: '性別' },
  { key: 'idNumber', label: '證件號碼' },
  { key: 'class',    label: '年級班別' },
  { key: 'phone',    label: '聯絡電話' },
];

// ─── Teams / slots ────────────────────────────────────────────────────────────
export const TEAMS = ['A', 'B', 'C', 'D'];
export const SLOTS_PER_TEAM = 6;

// Build all slot options once
const SLOT_OPTIONS = TEAMS.flatMap(team =>
  Array.from({ length: SLOTS_PER_TEAM }, (_, i) => ({
    value: `slot_${team}${i + 1}`,
    label: `${team} 隊 第${i + 1}位`,
  }))
);

const SOURCE_OPTIONS = [
  { value: '',        label: '— 跳過 —' },
  { value: 'manual',  label: '✏️ 手動輸入' },
  ...SLOT_OPTIONS,
];

// ─── Auto-detection heuristics ────────────────────────────────────────────────
// Given a raw PDF field name, guess { source, prop, label } or return defaults.
const autoDetect = (fieldName) => {
  const n = fieldName.toLowerCase();

  // ── Student name fields ──────────────────────────────────────────────────
  // e.g. name_of_participants_team_a_1  →  slot_A1, nameZH
  for (const team of TEAMS) {
    const t = team.toLowerCase();
    let slotNum = null;

    const m1 = n.match(new RegExp(`name_of_participants_team_${t}_(\\d+)$`));
    if (m1) slotNum = parseInt(m1[1], 10);

    if (slotNum !== null) {
      return { source: `slot_${team}${slotNum}`, prop: 'nameZH', label: `${team}隊 第${slotNum}位 · 中文姓名` };
    }
  }

  // ── Class fields ─────────────────────────────────────────────────────────
  // e.g. Team A → slot_A1  /  Team A_2 → slot_A2
  for (const team of TEAMS) {
    const t = team.toLowerCase();
    // "team a_3"  or  "team a" (no suffix = slot 1)
    const m2 = n.match(new RegExp(`^team\\s+${t}_(\\d+)$`));
    const m3 = n.match(new RegExp(`^team\\s+${t}$`));
    if (m2) { const num = parseInt(m2[1], 10); return { source: `slot_${team}${num}`, prop: 'class', label: `${team}隊 第${num}位 · 班別` }; }
    if (m3) { return { source: `slot_${team}1`, prop: 'class', label: `${team}隊 第1位 · 班別` }; }
  }

  // ── DOB fields ───────────────────────────────────────────────────────────
  // e.g. birth_year_Team A  /  birth_year_Team A_2
  for (const team of TEAMS) {
    const t = team.toLowerCase();
    const m4 = n.match(new RegExp(`birth.*team_?\\s*${t}_(\\d+)$`));
    const m5 = n.match(new RegExp(`birth.*team_?\\s*${t}$`));
    if (m4) { const num = parseInt(m4[1], 10); return { source: `slot_${team}${num}`, prop: 'dob', label: `${team}隊 第${num}位 · 出生日期` }; }
    if (m5) { return { source: `slot_${team}1`, prop: 'dob', label: `${team}隊 第1位 · 出生日期` }; }
  }

  // ── Known school fields ──────────────────────────────────────────────────
  const schoolMap = {
    school_name: '學校名稱',
    abbv_sch_name: '校名簡稱',
    address: '地址',
    email_address: '電郵地址',
    fax_no: '傳真號碼',
    teacher_in_charge: '負責老師姓名',
    responsible_contact_mobile_1: '老師聯絡電話 1',
    responsible_contact_mobile_2: '老師聯絡電話 2',
    leader: '領隊姓名',
    leader_contact_mobile_1: '領隊聯絡電話 1',
    leader_contact_mobile_2: '領隊聯絡電話 2',
    date: '日期',
  };
  if (schoolMap[n]) {
    return { source: 'manual', prop: null, label: schoolMap[n] };
  }

  return { source: '', prop: null, label: fieldName };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload  = () => resolve(reader.result);
  reader.onerror = reject;
});

const readPdfFields = async (file) => {
  const { PDFDocument } = await import('pdf-lib');
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const form = doc.getForm();
  return form.getFields()
    .filter(f => f.constructor.name === 'PDFTextField')
    .map(f => f.getName());
};

// ─── MappingRow ───────────────────────────────────────────────────────────────
const MappingRow = React.memo(function MappingRow({ fieldName, mapping, onChange }) {
  const { source, prop, label } = mapping;
  const isSlot = source?.startsWith('slot_');

  return (
    <div className="grid gap-2 items-start py-2.5 border-b border-slate-100 last:border-0"
         style={{ gridTemplateColumns: '2fr 2fr 2fr 2fr' }}>
      {/* Human label */}
      <div className="text-xs font-semibold text-slate-700 leading-tight pt-1">{label || fieldName}</div>

      {/* Raw field name */}
      <code className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded truncate block" title={fieldName}>
        {fieldName}
      </code>

      {/* Source */}
      <select
        value={source || ''}
        onChange={e => onChange(fieldName, 'source', e.target.value)}
        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-300"
      >
        {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Prop (only for slot) */}
      <div>
        {isSlot ? (
          <select
            value={prop || ''}
            onChange={e => onChange(fieldName, 'prop', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">— 選擇屬性 —</option>
            {STUDENT_PROPS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        ) : (
          <span className="text-xs text-slate-300 px-1">
            {source === 'manual' ? '填表時輸入' : '—'}
          </span>
        )}
      </div>
    </div>
  );
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FormTemplatePage() {
  const [file,         setFile]        = useState(null);
  const [previewFile,  setPreviewFile] = useState(null); // separate File object for PdfPreviewer
  const [templateName, setTemplateName] = useState('');
  const [pdfFields,    setPdfFields]   = useState([]);
  const [mappings,     setMappings]    = useState({});   // { fieldName → { source, prop, label } }
  const [isReading,    setIsReading]   = useState(false);
  const [isSaving,     setIsSaving]    = useState(false);

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected || selected.type !== 'application/pdf') return;

    setFile(selected);
    // Use a separate File reference for PdfPreviewer (same bytes, new object is fine)
    setPreviewFile(new File([selected], selected.name, { type: selected.type }));
    setTemplateName(selected.name.replace(/\.pdf$/i, ''));
    setPdfFields([]);
    setMappings({});
    setIsReading(true);

    try {
      const fields = await readPdfFields(selected);
      setPdfFields(fields);
      const auto = {};
      for (const f of fields) {
        auto[f] = autoDetect(f);
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
    setMappings(prev => {
      const current = prev[fieldName] || {};
      const updated = { ...current, [key]: value };
      // Reset prop when switching away from slot
      if (key === 'source' && !value.startsWith('slot_')) {
        updated.prop = null;
      }
      return { ...prev, [fieldName]: updated };
    });
  }, []);

  const handleSave = async () => {
    if (!file)                return alert('請先上傳 PDF 檔案。');
    if (!templateName.trim()) return alert('請為範本命名。');
    if (file.size > 700 * 1024) return alert(`PDF 過大 (${(file.size / 1024).toFixed(0)} KB)，最大 700KB。`);

    const activeMappings = Object.entries(mappings)
      .filter(([, m]) => m.source)
      .map(([fieldName, m]) => ({
        fieldName,
        source: m.source,
        prop:   m.prop   || null,
        label:  m.label  || fieldName,   // ← save label so BatchFillPage can show it
      }));

    if (activeMappings.length === 0) return alert('請至少設定一個欄位的對應。');

    setIsSaving(true);
    try {
      const pdfAsBase64 = await fileToBase64(file);
      await addDoc(collection(db, 'form_templates'), {
        templateName: templateName.trim(),
        pdfData:      pdfAsBase64,
        mappings:     activeMappings,
        version:      10,
        createdAt:    serverTimestamp(),
      });
      alert(`✅ 範本「${templateName.trim()}」已成功儲存！`);
      setFile(null); setPreviewFile(null); setPdfFields([]); setMappings({}); setTemplateName('');
    } catch (err) {
      console.error('儲存失敗:', err);
      alert(`儲存失敗：${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const active  = Object.values(mappings).filter(m => m.source).length;
  const slots   = Object.values(mappings).filter(m => m.source?.startsWith('slot_')).length;
  const manual  = Object.values(mappings).filter(m => m.source === 'manual').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">📄 範本欄位對應編輯器</h1>
          <p className="text-xs text-slate-500 mt-0.5">上傳 PDF 後系統自動識別表單欄位，請確認每個欄位的填入方式</p>
        </div>
        {pdfFields.length > 0 && (
          <button
            onClick={handleSave}
            disabled={isSaving || active === 0}
            className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed text-sm"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? '儲存中…' : '儲存範本'}
          </button>
        )}
      </header>

      {/* Two-column layout: PDF preview left, field table right */}
      <div className="flex h-[calc(100vh-65px)]">

        {/* ── LEFT: PDF preview ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-4">
          {!file && !isReading && (
            <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed border-slate-400 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-slate-100 transition-all group">
              <Upload size={40} className="text-slate-400 group-hover:text-blue-500 mb-3" />
              <p className="font-bold text-slate-600 text-lg">點擊上傳 PDF 表格</p>
              <p className="text-sm text-slate-400 mt-1">支援有表單欄位的 AcroForm PDF，最大 700KB</p>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          {isReading && (
            <div className="flex items-center justify-center h-full gap-3 text-slate-500">
              <Loader2 className="animate-spin" size={24} />
              <span className="font-semibold">正在讀取 PDF 表單欄位…</span>
            </div>
          )}
          {previewFile && !isReading && (
            <div className="rounded-xl overflow-hidden shadow-lg">
              <PdfPreviewer file={previewFile} />
            </div>
          )}
        </div>

        {/* ── RIGHT: field mapping table ───────────────────────────────────── */}
        <div className="w-[520px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">

          {/* Top bar: name + stats */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">範本名稱</label>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="例如：2026 外展壁球 U12"
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            {pdfFields.length > 0 && (
              <p className="text-xs text-slate-500">
                發現 <strong>{pdfFields.length}</strong> 個表單欄位 ·
                已對應 <strong className="text-blue-600">{active}</strong> 個
                （球員 {slots} · 手動 {manual}）
              </p>
            )}
          </div>

          {/* Column headers */}
          {pdfFields.length > 0 && (
            <div className="grid gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide"
                 style={{ gridTemplateColumns: '2fr 2fr 2fr 2fr' }}>
              <div>說明</div>
              <div>PDF 欄位</div>
              <div>填入方式</div>
              <div>學生屬性</div>
            </div>
          )}

          {/* Rows */}
          <div className="flex-1 overflow-y-auto px-5">
            {pdfFields.length === 0 && !isReading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                <p>上傳 PDF 後欄位列表將顯示在此</p>
              </div>
            )}
            {pdfFields.map(fieldName => (
              <MappingRow
                key={fieldName}
                fieldName={fieldName}
                mapping={mappings[fieldName] || { source: '', prop: null, label: fieldName }}
                onChange={handleMappingChange}
              />
            ))}
          </div>

          {/* Bottom save reminder */}
          {pdfFields.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">確認欄位對應後按右上角「儲存範本」</span>
              <button
                onClick={handleSave}
                disabled={isSaving || active === 0}
                className="flex items-center gap-1.5 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed text-sm"
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {isSaving ? '儲存中…' : '儲存範本'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
