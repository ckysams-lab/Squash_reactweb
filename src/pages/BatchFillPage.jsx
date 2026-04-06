// src/pages/BatchFillPage.jsx (Version 8.0 - Team Slot Model, Markers on Preview, Name Display Fix)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';
import { TEAM_SLOTS, STUDENT_PROPS, parseSlotKey } from './FormTemplatePage';

// ─── Coordinate helper ───────────────────────────────────────────────────────
// Markers store x/y as fractions (0–1) of the rendered canvas.
// pdf-lib uses absolute points with origin at BOTTOM-LEFT → flip Y.
const toAbsCoords = (relX, relY, pdfPage) => {
  const { width, height } = pdfPage.getSize();
  return { x: relX * width, y: height - relY * height };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * A single student slot row: shows the slot label and a searchable dropdown
 * of students from the roster. Displays "中文姓名 (班別)" in the list.
 */
const SlotPicker = ({ slotId, slotLabel, students, selectedId, onSelect }) => {
  const selected = students.find(s => s.id === selectedId);

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="w-20 shrink-0 text-xs font-bold text-slate-500">{slotLabel}</span>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(slotId, e.target.value || null)}
        className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-300"
      >
        {/* FIX: option text shows name + class so the user always sees who they picked */}
        <option value="">— 選擇球員 —</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>
            {s.nameZH || s.nameEN || s.id}
            {s.class ? ` (${s.class})` : ''}
          </option>
        ))}
      </select>
      {selected && (
        <button
          onClick={() => onSelect(slotId, null)}
          className="text-slate-300 hover:text-red-400 text-sm shrink-0"
          title="清除"
        >✕</button>
      )}
    </div>
  );
};

/**
 * A text input for manual (school-level) fields.
 */
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
      className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
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

  // Manual fields (school name, teacher, etc.)
  const [manualData, setManualData] = useState({});

  // Slot → student id mapping  e.g. { A1: 'studentId_xyz', B2: null, … }
  const [slotAssignments, setSlotAssignments] = useState({});

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

    // Build a preview File object from the stored base64 data
    fetch(selectedTemplate.pdfData)
      .then(r => r.blob())
      .then(blob => setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' })));

    // FIX: pass the saved mappings as markers so they appear as pins on the preview
    setPreviewMarkers(
      (selectedTemplate.mappings || []).map((m, i) => ({
        id:       `preview-${i}`,
        index:    i,
        page:     m.page,
        x:        m.x,
        y:        m.y,
        fieldKey: m.fieldKey,
      }))
    );

    setManualData({});
    setSlotAssignments({});
  }, [selectedTemplate]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const sortedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return [...students].sort(
      (a, b) => (a.class || '').localeCompare(b.class) || (a.nameZH || '').localeCompare(b.nameZH)
    );
  }, [students]);

  // Unique manual fields in this template
  const manualFields = useMemo(() => {
    if (!selectedTemplate) return [];
    const seen = new Set();
    return (selectedTemplate.mappings || [])
      .filter(m => m.fieldSource === 'manual' && !seen.has(m.fieldKey) && seen.add(m.fieldKey))
      .map(m => ({ fieldKey: m.fieldKey, fieldLabel: m.fieldLabel }));
  }, [selectedTemplate]);

  // Which slots actually appear in this template (may be a subset of all 12)
  const usedSlots = useMemo(() => {
    if (!selectedTemplate) return [];
    const slotSet = new Set(
      (selectedTemplate.mappings || [])
        .filter(m => m.fieldSource === 'student_slot' && m.slotId)
        .map(m => m.slotId)
    );
    return TEAM_SLOTS.filter(s => slotSet.has(s.slotId));
  }, [selectedTemplate]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleManualUpdate = useCallback((key, value) => {
    setManualData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSlotSelect = useCallback((slotId, studentId) => {
    setSlotAssignments(prev => ({ ...prev, [slotId]: studentId }));
  }, []);

  // ── PDF generation ────────────────────────────────────────────────────────
  /**
   * Resolve the text to print for a single mapping entry.
   *
   * - manual fields   → read from manualData
   * - student_slot    → look up the assigned student, read the named property
   */
  const resolveValue = useCallback((mapping) => {
    if (mapping.fieldSource === 'manual') {
      return String(manualData[mapping.fieldKey] ?? '');
    }
    if (mapping.fieldSource === 'student_slot' && mapping.slotId && mapping.prop) {
      const studentId = slotAssignments[mapping.slotId];
      if (!studentId) return '';
      const student = students.find(s => s.id === studentId);
      // FIX: read the named property from the student object (not raw id)
      return String(student?.[mapping.prop] ?? '');
    }
    return '';
  }, [manualData, slotAssignments, students]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return alert('請先選擇範本。');

    setIsGenerating(true);
    setProgressLabel('載入 PDF…');
    try {
      const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(r => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      // FIX: correct font embedding — no fetch(), just embedFont()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const mappings = selectedTemplate.mappings || [];
      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        const text = resolveValue(mapping);
        if (!text) continue;

        const pdfPage = pdfDoc.getPage(mapping.page - 1);
        // FIX: convert relative coords → absolute PDF points
        const { x, y } = toAbsCoords(mapping.x, mapping.y, pdfPage);

        pdfPage.drawText(text, { x, y, font, size: 10, color: rgb(0, 0, 0) });
        setProgressLabel(`填寫中… ${i + 1} / ${mappings.length}`);
      }

      const pdfBytes = await pdfDoc.save();
      saveAs(
        new Blob([pdfBytes], { type: 'application/pdf' }),
        `${selectedTemplate.templateName}_filled.pdf`
      );
    } catch (err) {
      console.error('PDF 生成失敗:', err);
      alert(`生成 PDF 時發生錯誤：${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressLabel('');
    }
  };

  // ── Stats for bottom bar ──────────────────────────────────────────────────
  const filledSlots   = usedSlots.filter(s => slotAssignments[s.slotId]).length;
  const filledManual  = manualFields.filter(f => manualData[f.fieldKey]).length;

  const canGenerate = !!selectedTemplate && !isGenerating;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      <PageHeader title="填寫及生成報名表" subtitle="選擇範本，分配球員，一鍵生成 PDF" icon={FileText} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Step 1: choose template ── */}
        <Card className="lg:col-span-1">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm">1</span>
            選擇範本
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center text-slate-400 py-10">
                <Loader2 className="animate-spin inline-block mr-2" size={16} /> 載入中...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-sm">
                暫無任何範本。<br />請先到「報名表範本」頁面創建。
              </p>
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

        {/* ── Steps 2+3 ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* PDF preview — FIX: markers prop passed so pins show */}
          {previewFile && (
            <Card>
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Eye className="text-purple-500" size={20} /> 範本預覽
              </h3>
              <div className="max-h-[480px] overflow-y-auto rounded-lg border bg-slate-100 p-2">
                <PdfPreviewer
                  file={previewFile}
                  markers={previewMarkers}
                  // read-only preview: no click handler
                />
              </div>
            </Card>
          )}

          {selectedTemplate && (
            <>
              {/* Manual / school fields */}
              {manualFields.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm">2</span>
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

              {/* Per-slot student assignment */}
              {usedSlots.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans text-sm">
                      {manualFields.length > 0 ? '3' : '2'}
                    </span>
                    分配球員名單
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    為每個隊伍位置指定球員，系統將自動從學生記錄填入中文姓名、班別及出生日期。
                  </p>

                  {/* Group by team letter */}
                  {['A', 'B', 'C', 'D'].map(team => {
                    const teamSlots = usedSlots.filter(s => s.slotId.startsWith(team));
                    if (teamSlots.length === 0) return null;
                    return (
                      <div key={team} className="mb-4 last:mb-0">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{team} 隊</div>
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
            </>
          )}
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="sticky bottom-6">
        <Card noPadding className="p-5 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400">已選範本</p>
              <p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p>
            </div>
            <ChevronsRight className="text-slate-300" size={18} />
            {usedSlots.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400">球員位置</p>
                <p className="font-bold">{filledSlots} / {usedSlots.length} 已分配</p>
              </div>
            )}
            {manualFields.length > 0 && (
              <>
                <ChevronsRight className="text-slate-300" size={18} />
                <div>
                  <p className="text-xs font-bold text-slate-400">學校資料</p>
                  <p className="font-bold">{filledManual} / {manualFields.length} 已填寫</p>
                </div>
              </>
            )}
          </div>

          <PrimaryButton onClick={handleGenerate} disabled={!canGenerate} icon={isGenerating ? undefined : Download}>
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
