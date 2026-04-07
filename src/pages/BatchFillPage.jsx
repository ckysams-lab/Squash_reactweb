// src/pages/BatchFillPage.jsx (Version 8.1 - Backward-compatible, always renders inputs)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ─── Field-label lookup (for old templates that only stored fieldKey) ─────────
const FIELD_LABELS = {
  nameZH:          '學生中文姓名',
  nameEN:          '學生英文姓名',
  dob:             '出生日期',
  gender:          '性別',
  idNumber:        '證件號碼',
  class:           '年級班別',
  phone:           '聯絡電話',
  schoolNameZH:    '學校名稱（中文）',
  schoolNameShort: '校名簡稱（中文）',
  address:         '地址',
  email:           '電郵地址',
  fax:             '傳真號碼',
  teacherName:     '負責老師姓名',
  teacherPhone:    '老師聯絡電話',
  captainName:     '領隊姓名',
  captainPhone:    '領隊聯絡電話',
  signDate:        '簽署日期',
};

// Student-record keys — if a mapping's fieldKey matches one of these,
// we treat it as a student auto-fill field (relevant for old templates).
const STUDENT_KEYS = new Set(['nameZH', 'nameEN', 'dob', 'gender', 'idNumber', 'class', 'phone']);

// ─── Normalise a mapping from any template version ───────────────────────────
// Returns a consistent object with { fieldKey, fieldLabel, fieldSource, slotId, prop }
//
//  New format:  fieldSource = 'manual' | 'student_slot', slotId, prop already set
//  Old format:  no fieldSource → infer from fieldKey
//  Slot key:    "slot_A1_nameZH" → student_slot, slotId='A1', prop='nameZH'
const normaliseMapping = (m) => {
  const slotMatch = m.fieldKey?.match(/^slot_([A-D]\d+)_(.+)$/);
  if (slotMatch) {
    return {
      ...m,
      fieldSource: 'student_slot',
      slotId: slotMatch[1],
      prop:   slotMatch[2],
      fieldLabel: m.fieldLabel || `${slotMatch[1]} · ${FIELD_LABELS[slotMatch[2]] || slotMatch[2]}`,
    };
  }
  if (m.fieldSource) {
    // Already has fieldSource from new FormTemplatePage
    return { ...m, fieldLabel: m.fieldLabel || FIELD_LABELS[m.fieldKey] || m.fieldKey };
  }
  // Old template — infer source from the key name
  const isStudent = STUDENT_KEYS.has(m.fieldKey);
  return {
    ...m,
    fieldSource: isStudent ? 'student_direct' : 'manual',
    fieldLabel:  m.fieldLabel || FIELD_LABELS[m.fieldKey] || m.fieldKey,
    slotId: null,
    prop:   isStudent ? m.fieldKey : null,
  };
};

// ─── Coordinate helper ────────────────────────────────────────────────────────
const toAbsCoords = (relX, relY, pdfPage) => {
  const { width, height } = pdfPage.getSize();
  return { x: relX * width, y: height - relY * height };
};

// ─── SlotPicker ───────────────────────────────────────────────────────────────
const SlotPicker = ({ slotId, slotLabel, students, selectedId, onSelect }) => (
  <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
    <span className="w-24 shrink-0 text-xs font-bold text-slate-500">{slotLabel}</span>
    <select
      value={selectedId || ''}
      onChange={(e) => onSelect(slotId, e.target.value || null)}
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
      <button onClick={() => onSelect(slotId, null)} className="text-slate-300 hover:text-red-400 text-sm shrink-0" title="清除">✕</button>
    )}
  </div>
);

// ─── StudentDirectPicker (old template: one student fills the whole form) ─────
const StudentDirectPicker = ({ students, selectedId, onSelect }) => (
  <div>
    <label className="font-bold text-sm text-slate-700 flex items-center gap-2">
      選擇學生
      <span className="text-xs font-normal text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">自動填入</span>
    </label>
    <select
      value={selectedId || ''}
      onChange={(e) => onSelect(e.target.value || null)}
      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    >
      <option value="">— 選擇學生 —</option>
      {students.map(s => (
        <option key={s.id} value={s.id}>
          {s.nameZH || s.nameEN || s.id}{s.class ? ` (${s.class})` : ''}
        </option>
      ))}
    </select>
  </div>
);

// ─── ManualInput ──────────────────────────────────────────────────────────────
const ManualInput = ({ fieldKey, fieldLabel, value, onChange }) => (
  <div>
    <label className="font-bold text-sm text-slate-700 flex items-center gap-2">
      {fieldLabel || fieldKey}
      <span className="text-xs font-normal text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">手動</span>
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={`輸入 ${fieldLabel || fieldKey}...`}
      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BatchFillPage({ students }) {
  const [templates,        setTemplates]       = useState([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [progressLabel,    setProgressLabel]    = useState('');

  // Manual fields: { fieldKey → string }
  const [manualData,      setManualData]      = useState({});
  // Slot assignments: { slotId → studentId } for new-format (student_slot)
  const [slotAssignments, setSlotAssignments] = useState({});
  // Single selected student for old-format (student_direct)
  const [directStudentId, setDirectStudentId] = useState(null);

  // Preview
  const [previewFile,    setPreviewFile]    = useState(null);
  const [previewMarkers, setPreviewMarkers] = useState([]);

  // ── Load templates ────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    }, err => { console.error(err); setIsLoading(false); });
    return () => unsub();
  }, []);

  // ── When template changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedTemplate) {
      setPreviewFile(null);
      setPreviewMarkers([]);
      return;
    }
    fetch(selectedTemplate.pdfData)
      .then(r => r.blob())
      .then(blob => setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' })));

    setPreviewMarkers(
      (selectedTemplate.mappings || []).map((m, i) => ({
        id: `p-${i}`, index: i, page: m.page, x: m.x, y: m.y, fieldKey: m.fieldKey,
      }))
    );
    setManualData({});
    setSlotAssignments({});
    setDirectStudentId(null);
  }, [selectedTemplate]);

  // ── Normalised mappings ───────────────────────────────────────────────────
  const normalisedMappings = useMemo(() => {
    if (!selectedTemplate) return [];
    return (selectedTemplate.mappings || []).map(normaliseMapping);
  }, [selectedTemplate]);

  // Unique manual fields
  const manualFields = useMemo(() => {
    const seen = new Set();
    return normalisedMappings
      .filter(m => m.fieldSource === 'manual' && !seen.has(m.fieldKey) && seen.add(m.fieldKey))
      .map(m => ({ fieldKey: m.fieldKey, fieldLabel: m.fieldLabel }));
  }, [normalisedMappings]);

  // Unique slots (new format)
  const usedSlots = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const m of normalisedMappings) {
      if (m.fieldSource === 'student_slot' && m.slotId && !seen.has(m.slotId)) {
        seen.add(m.slotId);
        result.push({ slotId: m.slotId, label: `${m.slotId[0]} 隊 第${m.slotId[1]}位` });
      }
    }
    // Sort: A1 A2 A3 B1 B2 B3 …
    return result.sort((a, b) => a.slotId.localeCompare(b.slotId));
  }, [normalisedMappings]);

  // Does this template use old-style direct student fields?
  const hasDirectStudentFields = useMemo(
    () => normalisedMappings.some(m => m.fieldSource === 'student_direct'),
    [normalisedMappings]
  );

  // ── Sorted students for dropdowns ─────────────────────────────────────────
  const sortedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return [...students].sort(
      (a, b) => (a.class || '').localeCompare(b.class) || (a.nameZH || '').localeCompare(b.nameZH)
    );
  }, [students]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualUpdate = useCallback((key, val) => setManualData(p => ({ ...p, [key]: val })), []);
  const handleSlotSelect   = useCallback((slotId, id) => setSlotAssignments(p => ({ ...p, [slotId]: id })), []);

  // ── Value resolver ────────────────────────────────────────────────────────
  const resolveValue = useCallback((mapping) => {
    const { fieldSource, fieldKey, slotId, prop } = mapping;

    if (fieldSource === 'manual') {
      return String(manualData[fieldKey] ?? '');
    }

    if (fieldSource === 'student_slot' && slotId && prop) {
      const sid = slotAssignments[slotId];
      if (!sid) return '';
      const s = students.find(st => st.id === sid);
      return String(s?.[prop] ?? '');
    }

    if (fieldSource === 'student_direct' && prop) {
      if (!directStudentId) return '';
      const s = students.find(st => st.id === directStudentId);
      return String(s?.[prop] ?? '');
    }

    return '';
  }, [manualData, slotAssignments, directStudentId, students]);

  // ── PDF generation ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedTemplate) return alert('請先選擇範本。');
    setIsGenerating(true);
    setProgressLabel('載入 PDF…');
    try {
      const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(r => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 0; i < normalisedMappings.length; i++) {
        const text = resolveValue(normalisedMappings[i]);
        if (!text) continue;
        const pdfPage = pdfDoc.getPage(normalisedMappings[i].page - 1);
        const { x, y } = toAbsCoords(normalisedMappings[i].x, normalisedMappings[i].y, pdfPage);
        pdfPage.drawText(text, { x, y, font, size: 10, color: rgb(0, 0, 0) });
        setProgressLabel(`填寫中… ${i + 1} / ${normalisedMappings.length}`);
      }

      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${selectedTemplate.templateName}_filled.pdf`);
    } catch (err) {
      console.error('PDF 生成失敗:', err);
      alert(`生成 PDF 時發生錯誤：${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressLabel('');
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const filledSlots  = usedSlots.filter(s => slotAssignments[s.slotId]).length;
  const filledManual = manualFields.filter(f => manualData[f.fieldKey]).length;
  const stepBase = 2;

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
                <Loader2 className="animate-spin inline-block mr-2" size={16} />載入中...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">暫無任何範本。<br/>請先到「報名表範本」頁面創建。</p>
            ) : templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate?.id === t.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-bold text-sm">{t.templateName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.mappings?.length ?? 0} 個標記欄位</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Steps 2+ */}
        <div className="lg:col-span-2 space-y-6">

          {/* PDF preview with markers */}
          {previewFile && (
            <Card>
              <h3 className="text-xl font-black mb-3 flex items-center gap-2">
                <Eye className="text-purple-500" size={20} /> 範本預覽
              </h3>
              <div className="max-h-[480px] overflow-y-auto rounded-lg border bg-slate-100 p-2">
                <PdfPreviewer file={previewFile} markers={previewMarkers} />
              </div>
            </Card>
          )}

          {selectedTemplate && (
            <>
              {/* Manual / school-level fields */}
              {manualFields.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{stepBase}</span>
                    學校資料
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">以下欄位所有生成的 PDF 共用相同值。</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manualFields.map(({ fieldKey, fieldLabel }) => (
                      <ManualInput
                        key={fieldKey}
                        fieldKey={fieldKey}
                        fieldLabel={fieldLabel}
                        value={manualData[fieldKey]}
                        onChange={handleManualUpdate}
                      />
                    ))}
                  </div>
                </Card>
              )}

              {/* Old-format: single student picker */}
              {hasDirectStudentFields && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {manualFields.length > 0 ? stepBase + 1 : stepBase}
                    </span>
                    選擇學生
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">學生資料將自動從記錄中填入。</p>
                  <StudentDirectPicker
                    students={sortedStudents}
                    selectedId={directStudentId}
                    onSelect={setDirectStudentId}
                  />
                </Card>
              )}

              {/* New-format: per-slot team pickers */}
              {usedSlots.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {manualFields.length > 0 ? stepBase + 1 : stepBase}
                    </span>
                    分配球員名單
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    為每個位置選擇球員，中文姓名、班別及出生日期將自動填入。
                  </p>
                  {['A', 'B', 'C', 'D'].map(team => {
                    const teamSlots = usedSlots.filter(s => s.slotId.startsWith(team));
                    if (!teamSlots.length) return null;
                    return (
                      <div key={team} className="mb-4 last:mb-0">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{team} 隊</p>
                        <div className="bg-slate-50 rounded-xl px-3 py-1">
                          {teamSlots.map(({ slotId, label }) => (
                            <SlotPicker
                              key={slotId}
                              slotId={slotId}
                              slotLabel={label}
                              students={sortedStudents}
                              selectedId={slotAssignments[slotId] ?? null}
                              onSelect={handleSlotSelect}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Fallback: template has no recognised fields at all */}
              {!manualFields.length && !hasDirectStudentFields && !usedSlots.length && (
                <Card>
                  <div className="text-center text-slate-400 py-8 text-sm">
                    <div className="text-3xl mb-2">⚠️</div>
                    <p className="font-bold text-slate-600">此範本沒有可識別的欄位</p>
                    <p className="mt-1 text-xs">請返回「範本標記編輯器」重新標記並儲存範本。</p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
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
                {progressLabel || '生成中...'}
              </span>
            ) : '生成報名表 PDF'}
          </PrimaryButton>
        </Card>
      </div>
    </div>
  );
}
