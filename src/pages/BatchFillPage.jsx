// src/pages/BatchFillPage.jsx (Version 11.0)
//
// Fills PDF AcroForm fields by name using pdf-lib's form.getTextField().setText().
// Supports v10/v11 templates saved by FormTemplatePage v11.
// Also provides a clear upgrade prompt for old coordinate-based templates.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Normalise any saved template version into consistent mapping objects ─────
//
// Output: [{ fieldName, source, prop, label }]
//   fieldName — real PDF AcroForm field name
//   source    — 'manual' | 'slot_A1' | … | 'slot_DIRECT'
//   prop      — student property key (nameZH / class / dob / …)
//   label     — human-readable description
//
const normaliseMappings = (raw = []) =>
  raw.map(m => {
    // v10/v11 — already has fieldName
    if (m.fieldName) {
      return {
        fieldName: m.fieldName,
        source:    m.source || 'manual',
        prop:      m.prop || null,
        label:     m.label || m.fieldName,
      };
    }
    // Older coordinate-based formats — fieldKey is NOT a real PDF field name
    // Keep them in the list so we can detect "old format" and show upgrade notice
    const fk = m.fieldKey || '';
    const slotMatch = fk.match(/^slot_([A-D]\d+)_(.+)$/);
    if (slotMatch) return { fieldName: fk, source: `slot_${slotMatch[1]}`, prop: slotMatch[2], label: fk };
    if (m.fieldSource === 'student_slot' && m.slotId) return { fieldName: fk, source: `slot_${m.slotId}`, prop: m.prop, label: m.fieldLabel || fk };
    if (m.fieldSource === 'student_direct') return { fieldName: fk, source: 'slot_DIRECT', prop: m.prop, label: m.fieldLabel || fk };
    return { fieldName: fk, source: 'manual', prop: null, label: m.fieldLabel || fk };
  }).filter(m => m.fieldName);

// ─── Derive unique player slots from mappings ─────────────────────────────────
const getUsedSlots = (mappings) => {
  const seen = new Set();
  return mappings
    .filter(m => m.source?.startsWith('slot_') && m.source !== 'slot_DIRECT' && !seen.has(m.source) && seen.add(m.source))
    .map(m => {
      const id = m.source.replace('slot_', '');
      return { slotKey: m.source, slotId: id, label: `${id[0]} 隊 第${id.slice(1)}位` };
    })
    .sort((a, b) => a.slotId.localeCompare(b.slotId));
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
      <button onClick={() => onSelect(slotKey, null)} className="text-slate-300 hover:text-red-400 text-sm shrink-0">✕</button>
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
      placeholder={`輸入${label || fieldName}…`}
      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BatchFillPage({ students }) {
  const [templates,        setTemplates]       = useState([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [progressLabel,    setProgressLabel]    = useState('');

  const [manualData,      setManualData]      = useState({});
  const [slotAssignments, setSlotAssignments] = useState({});
  const [directStudentId, setDirectStudentId] = useState(null);
  const [previewFile,     setPreviewFile]     = useState(null);

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

  // ── When template changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTemplate?.pdfData) { setPreviewFile(null); return; }
    fetch(selectedTemplate.pdfData)
      .then(r => r.blob())
      .then(blob => setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' })));
    setManualData({});
    setSlotAssignments({});
    setDirectStudentId(null);
  }, [selectedTemplate]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const normMappings   = useMemo(() => normaliseMappings(selectedTemplate?.mappings), [selectedTemplate]);
  const usedSlots      = useMemo(() => getUsedSlots(normMappings), [normMappings]);
  const hasDirectStudent = useMemo(() => normMappings.some(m => m.source === 'slot_DIRECT'), [normMappings]);

  const manualFields = useMemo(() => {
    const seen = new Set();
    return normMappings
      .filter(m => m.source === 'manual' && !seen.has(m.fieldName) && seen.add(m.fieldName))
      .map(m => ({ fieldName: m.fieldName, label: m.label || m.fieldName }));
  }, [normMappings]);

  const sortedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return [...students].sort(
      (a, b) => (a.class || '').localeCompare(b.class) || (a.nameZH || '').localeCompare(b.nameZH)
    );
  }, [students]);

  // Is this an old coordinate-based template that can't be filled?
  const isOldFormat = !selectedTemplate?.version || selectedTemplate.version < 10;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualUpdate = useCallback((key, val) => setManualData(p => ({ ...p, [key]: val })), []);
  const handleSlotSelect   = useCallback((sk, id) => setSlotAssignments(p => ({ ...p, [sk]: id })), []);

  // ── Resolve text for one mapping ──────────────────────────────────────────
  const resolveValue = useCallback((m) => {
    if (m.source === 'manual') return manualData[m.fieldName] ?? '';
    if (m.source === 'slot_DIRECT' && m.prop) {
      const s = students?.find(st => st.id === directStudentId);
      return s?.[m.prop] ?? '';
    }
    if (m.source?.startsWith('slot_') && m.prop) {
      const sid = slotAssignments[m.source];
      if (!sid) return '';
      const s = students?.find(st => st.id === sid);
      return s?.[m.prop] ?? '';
    }
    return '';
  }, [manualData, slotAssignments, directStudentId, students]);

  // ── Generate PDF ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedTemplate) return alert('請先選擇範本。');

    setIsGenerating(true);
    setProgressLabel('載入 PDF…');
    try {
      const rawBytes = await fetch(selectedTemplate.pdfData).then(r => r.arrayBuffer());
      const pdfDoc   = await PDFDocument.load(rawBytes);
      const form     = pdfDoc.getForm();

      let filled = 0;
      for (let i = 0; i < normMappings.length; i++) {
        const m     = normMappings[i];
        const value = String(resolveValue(m)).trim();
        if (!value) continue;
        try {
          form.getTextField(m.fieldName).setText(value);
          filled++;
        } catch {
          // Field not found in PDF — skip
        }
        setProgressLabel(`填寫中… ${i + 1} / ${normMappings.length}`);
      }

      const outputBytes = await pdfDoc.save();
      saveAs(new Blob([outputBytes], { type: 'application/pdf' }), `${selectedTemplate.templateName}_filled.pdf`);

      if (filled === 0) {
        alert('⚠️ 沒有填入任何資料。\n請確認已選擇球員及填寫學校資料。');
      }
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      <PageHeader title="填寫及生成報名表" subtitle="選擇範本，填寫資料，一鍵生成 PDF" icon={FileText} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Step 1 */}
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
              <p className="text-center text-slate-400 py-10 text-sm">暫無範本。<br/>請先到「範本編輯器」創建。</p>
            ) : templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate?.id === t.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-sm">{t.templateName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.mappings?.length ?? 0} 個欄位
                  {t.version >= 10 ? '' : ' · ⚠️ 舊版'}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Steps 2+ */}
        <div className="lg:col-span-2 space-y-6">

          {/* PDF preview */}
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
            isOldFormat ? (
              <Card>
                <div className="text-center py-10 text-sm text-slate-500">
                  <p className="text-3xl mb-3">⚠️</p>
                  <p className="font-bold text-slate-700 text-base mb-2">此範本為舊版格式，無法直接填寫</p>
                  <p className="max-w-sm mx-auto">
                    請到「範本標記編輯器」重新上傳同一份 PDF，
                    重新放置標記並儲存。新版範本即可正常填寫及生成。
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Manual fields */}
                {manualFields.length > 0 && (
                  <Card>
                    <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                      <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                      學校資料
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">填入後將套用到生成的 PDF。</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manualFields.map(({ fieldName, label }) => (
                        <ManualInput key={fieldName} fieldName={fieldName} label={label} value={manualData[fieldName]} onChange={handleManualUpdate} />
                      ))}
                    </div>
                  </Card>
                )}

                {/* Direct student (legacy) */}
                {hasDirectStudent && (
                  <Card>
                    <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{manualFields.length > 0 ? 3 : 2}</span>
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
                        {manualFields.length > 0 ? 3 : 2}
                      </span>
                      分配球員名單
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">選擇球員後，姓名、班別及出生日期將自動填入對應欄位。</p>
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

                {!manualFields.length && !hasDirectStudent && !usedSlots.length && (
                  <Card>
                    <div className="text-center text-slate-400 py-8 text-sm">
                      <p className="text-2xl mb-2">⚠️</p>
                      <p className="font-bold text-slate-600">此範本沒有可識別的欄位對應</p>
                      <p className="mt-1 text-xs">請返回「範本編輯器」重新標記並儲存。</p>
                    </div>
                  </Card>
                )}
              </>
            )
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
          <PrimaryButton onClick={handleGenerate} disabled={!selectedTemplate || isGenerating || isOldFormat} icon={isGenerating ? undefined : Download}>
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
