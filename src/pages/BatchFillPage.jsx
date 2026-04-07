// src/pages/BatchFillPage.jsx (Version 9.0 - Fill PDF Form Fields Directly)
//
// KEY CHANGE: Uses pdf-lib's form.getTextField(name).setText(value)
// instead of page.drawText(). This:
//   ✅ Preserves the PDF's original Chinese font (PMingLiU) — no more garbled text
//   ✅ Fills the correct position automatically (no coordinate math needed)
//   ✅ Works with any PDF that has interactive form fields

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Student property label lookup ───────────────────────────────────────────
const PROP_LABELS = {
  nameZH:   '中文姓名',
  nameEN:   '英文姓名',
  dob:      '出生日期',
  gender:   '性別',
  idNumber: '證件號碼',
  class:    '年級班別',
  phone:    '電話',
};

// ─── Normalise a template regardless of which version saved it ────────────────
//
// v9  mappings: [{ fieldName, source, prop }]
//       source = 'manual' | 'slot_A1' | 'slot_B3' etc.
//
// older mappings (v6/v7/v8): [{ fieldKey, fieldSource?, slotId?, prop?, x, y, page }]
//   These used coordinate drawing — we keep manual fields working but
//   slot/student fields will be best-effort.
//
const normaliseMappings = (raw = []) => {
  return raw.map(m => {
    // v9 format already has fieldName + source
    if (m.fieldName) return m;

    // Older format — convert
    const fieldName = m.fieldKey;
    if (!fieldName) return null;

    // slot key like "slot_A1_nameZH"
    const slotMatch = fieldName.match(/^slot_([A-D]\d+)_(.+)$/);
    if (slotMatch) {
      return { fieldName, source: `slot_${slotMatch[1]}`, prop: slotMatch[2] };
    }
    if (m.fieldSource === 'student_slot' && m.slotId) {
      return { fieldName, source: `slot_${m.slotId}`, prop: m.prop };
    }
    if (m.fieldSource === 'student_direct') {
      return { fieldName, source: 'slot_DIRECT', prop: m.prop };
    }
    // manual / unknown
    return { fieldName, source: 'manual', prop: null };
  }).filter(Boolean);
};

// ─── Unique slots used by a normalised mapping list ───────────────────────────
const getUsedSlots = (mappings) => {
  const seen = new Set();
  const slots = [];
  for (const m of mappings) {
    if (m.source?.startsWith('slot_') && m.source !== 'slot_DIRECT' && !seen.has(m.source)) {
      seen.add(m.source);
      const id = m.source.replace('slot_', ''); // 'A1', 'B3' etc.
      slots.push({ slotKey: m.source, slotId: id, label: `${id[0]} 隊 第${id.slice(1)}位` });
    }
  }
  return slots.sort((a, b) => a.slotId.localeCompare(b.slotId));
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SlotPicker = ({ slotKey, label, students, selectedId, onSelect }) => (
  <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
    <span className="w-24 shrink-0 text-xs font-bold text-slate-500">{label}</span>
    <select
      value={selectedId || ''}
      onChange={e => onSelect(slotKey, e.target.value || null)}
      className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-300"
    >
      <option value="">— 選擇球員 —</option>
      {students.map(s => (
        <option key={s.id} value={s.id}>
          {s.nameZH || s.nameEN || s.id}{s.class ? ` (${s.class})` : ''}
        </option>
      ))}
    </select>
    {selectedId && (
      <button onClick={() => onSelect(slotKey, null)} className="text-slate-300 hover:text-red-400 text-sm" title="清除">✕</button>
    )}
  </div>
);

const ManualInput = ({ fieldName, label, value, onChange }) => (
  <div>
    <label className="font-bold text-sm text-slate-700 flex items-center gap-2">
      {label || fieldName}
      <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">手動</span>
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(fieldName, e.target.value)}
      placeholder={`輸入 ${label || fieldName}…`}
      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function BatchFillPage({ students }) {
  const [templates,        setTemplates]       = useState([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [progressLabel,    setProgressLabel]    = useState('');

  const [manualData,      setManualData]      = useState({});  // { fieldName → string }
  const [slotAssignments, setSlotAssignments] = useState({});  // { slotKey → studentId }
  const [directStudentId, setDirectStudentId] = useState(null);

  const [previewFile, setPreviewFile] = useState(null);

  // ── Load templates ────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => { setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoading(false); },
      err  => { console.error(err); setIsLoading(false); }
    );
    return () => unsub();
  }, []);

  // ── When template selected ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTemplate?.pdfData) { setPreviewFile(null); return; }
    fetch(selectedTemplate.pdfData)
      .then(r => r.blob())
      .then(blob => setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' })));
    setManualData({});
    setSlotAssignments({});
    setDirectStudentId(null);
  }, [selectedTemplate]);

  // ── Normalised mappings ───────────────────────────────────────────────────
  const normMappings = useMemo(
    () => normaliseMappings(selectedTemplate?.mappings),
    [selectedTemplate]
  );

  const usedSlots = useMemo(() => getUsedSlots(normMappings), [normMappings]);

  const manualFields = useMemo(() => {
    const seen = new Set();
    return normMappings
      .filter(m => m.source === 'manual' && !seen.has(m.fieldName) && seen.add(m.fieldName))
      .map(m => ({ fieldName: m.fieldName, label: m.label || m.fieldName }));
  }, [normMappings]);

  const hasDirectStudent = useMemo(
    () => normMappings.some(m => m.source === 'slot_DIRECT'),
    [normMappings]
  );

  const sortedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return [...students].sort(
      (a, b) => (a.class || '').localeCompare(b.class) || (a.nameZH || '').localeCompare(b.nameZH)
    );
  }, [students]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualUpdate = useCallback((key, val) => setManualData(p => ({ ...p, [key]: val })), []);
  const handleSlotSelect   = useCallback((slotKey, id) => setSlotAssignments(p => ({ ...p, [slotKey]: id })), []);

  // ── Resolve value for one mapping entry ───────────────────────────────────
  const resolveValue = useCallback((mapping) => {
    const { source, prop, fieldName } = mapping;

    if (source === 'manual') {
      return manualData[fieldName] ?? '';
    }
    if (source === 'slot_DIRECT' && prop) {
      const s = students?.find(st => st.id === directStudentId);
      return s?.[prop] ?? '';
    }
    if (source?.startsWith('slot_') && prop) {
      const sid = slotAssignments[source];
      if (!sid) return '';
      const s = students?.find(st => st.id === sid);
      return s?.[prop] ?? '';
    }
    return '';
  }, [manualData, slotAssignments, directStudentId, students]);

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedTemplate) return alert('請先選擇範本。');
    setIsGenerating(true);
    setProgressLabel('載入 PDF…');

    try {
      const pdfBytes = await fetch(selectedTemplate.pdfData).then(r => r.arrayBuffer());
      const pdfDoc   = await PDFDocument.load(pdfBytes);
      const form     = pdfDoc.getForm();

      let filled = 0;
      for (let i = 0; i < normMappings.length; i++) {
        const mapping = normMappings[i];
        const value   = String(resolveValue(mapping));
        if (!value) continue;

        try {
          // ✅ Fill the actual named form field — preserves Chinese font
          const field = form.getTextField(mapping.fieldName);
          field.setText(value);
          filled++;
        } catch (e) {
          // Field might not exist in this PDF or might not be a text field
          console.warn(`跳過欄位 "${mapping.fieldName}": ${e.message}`);
        }
        setProgressLabel(`填寫中… ${i + 1} / ${normMappings.length}`);
      }

      // Flatten form so values are baked in (optional — comment out to keep fields editable)
      // form.flatten();

      const outputBytes = await pdfDoc.save();
      saveAs(
        new Blob([outputBytes], { type: 'application/pdf' }),
        `${selectedTemplate.templateName}_filled.pdf`
      );

      if (filled === 0) alert('⚠️ 沒有填入任何資料，請確認已填寫欄位並選擇了球員。');
    } catch (err) {
      console.error('PDF 生成失敗:', err);
      alert(`生成 PDF 時發生錯誤：${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressLabel('');
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const filledSlots  = usedSlots.filter(s => slotAssignments[s.slotKey]).length;
  const filledManual = manualFields.filter(f => manualData[f.fieldName]).length;
  const stepBase     = 2;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      <PageHeader title="填寫及生成報名表" subtitle="選擇範本，填寫資料，一鍵生成 PDF" icon={FileText} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Step 1 — choose template */}
        <Card className="lg:col-span-1">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            選擇範本
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center text-slate-400 py-10">
                <Loader2 className="animate-spin inline-block mr-2" size={16} />載入中…
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">暫無範本，請先到「範本編輯器」創建。</p>
            ) : templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate?.id === t.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-sm">{t.templateName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.mappings?.length ?? 0} 個欄位對應</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Steps 2+ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Preview */}
          {previewFile && (
            <Card>
              <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                <Eye className="text-purple-500" size={20} /> 範本預覽
              </h3>
              <div className="max-h-[420px] overflow-y-auto rounded-lg border bg-slate-100 p-2">
                <PdfPreviewer file={previewFile} />
              </div>
            </Card>
          )}

          {selectedTemplate && (
            <>
              {/* Manual fields */}
              {manualFields.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{stepBase}</span>
                    學校資料
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">以下欄位填入後將套用到生成的 PDF。</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manualFields.map(({ fieldName, label }) => (
                      <ManualInput
                        key={fieldName}
                        fieldName={fieldName}
                        label={label}
                        value={manualData[fieldName]}
                        onChange={handleManualUpdate}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Old-style single student */}
              {hasDirectStudent && (
                <Card>
                  <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {manualFields.length > 0 ? stepBase + 1 : stepBase}
                    </span>
                    選擇學生
                  </h3>
                  <select
                    value={directStudentId || ''}
                    onChange={e => setDirectStudentId(e.target.value || null)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  >
                    <option value="">— 選擇學生 —</option>
                    {sortedStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nameZH || s.nameEN || s.id}{s.class ? ` (${s.class})` : ''}
                      </option>
                    ))}
                  </select>
                </Card>
              )}

              {/* Slot pickers */}
              {usedSlots.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {manualFields.length > 0 ? stepBase + 1 : stepBase}
                    </span>
                    分配球員名單
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    選擇球員後，中文姓名、班別及出生日期將自動填入 PDF 對應欄位。
                  </p>
                  {['A', 'B', 'C', 'D'].map(team => {
                    const teamSlots = usedSlots.filter(s => s.slotId.startsWith(team));
                    if (!teamSlots.length) return null;
                    return (
                      <div key={team} className="mb-4 last:mb-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{team} 隊</p>
                        <div className="bg-slate-50 rounded-xl px-3 py-1">
                          {teamSlots.map(({ slotKey, label }) => (
                            <SlotPicker
                              key={slotKey}
                              slotKey={slotKey}
                              label={label}
                              students={sortedStudents}
                              selectedId={slotAssignments[slotKey] ?? null}
                              onSelect={handleSlotSelect}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Fallback */}
              {!manualFields.length && !hasDirectStudent && !usedSlots.length && (
                <Card>
                  <div className="text-center text-slate-400 py-8 text-sm">
                    <p className="text-2xl mb-2">⚠️</p>
                    <p className="font-bold text-slate-600">此範本沒有可識別的欄位對應</p>
                    <p className="mt-1 text-xs">請返回「範本編輯器」重新設定欄位對應後儲存。</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-6">
        <Card noPadding className="p-5 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-5 text-sm flex-wrap">
            <div>
              <p className="text-xs font-bold text-slate-400">已選範本</p>
              <p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p>
            </div>
            {usedSlots.length > 0 && (
              <>
                <ChevronsRight className="text-slate-300" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400">球員位置</p>
                  <p className="font-bold">{filledSlots} / {usedSlots.length} 已分配</p>
                </div>
              </>
            )}
            {manualFields.length > 0 && (
              <>
                <ChevronsRight className="text-slate-300" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400">學校資料</p>
                  <p className="font-bold">{filledManual} / {manualFields.length} 已填</p>
                </div>
              </>
            )}
          </div>

          <PrimaryButton onClick={handleGenerate} disabled={!selectedTemplate || isGenerating} icon={isGenerating ? undefined : Download}>
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                {progressLabel || '生成中…'}
              </span>
            ) : '生成報名表 PDF'}
          </PrimaryButton>
        </Card>
      </div>
    </div>
  );
}
