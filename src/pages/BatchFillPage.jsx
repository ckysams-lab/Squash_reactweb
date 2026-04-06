// src/pages/BatchFillPage.jsx (Version 8.0 - Fixed Coords, Fixed Font, True Batch Mode)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2, Eye, Users } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

// ---------------------------------------------------------------------------
// Backward-compatible field classification
// ---------------------------------------------------------------------------

// Keys that map to student records. Old templates have no fieldSource, so we
// classify by matching against this set as a fallback.
const STUDENT_FIELD_KEYS = new Set([
  'nameZH', 'nameEN', 'dob', 'gender', 'idNumber', 'class', 'phone',
  // extend this list if you add more fields to STUDENT_FIELDS in FormTemplatePage
]);

/**
 * Determine the effective source of a mapping, supporting old Firestore documents
 * that were saved before fieldSource was added.
 */
const getFieldSource = (mapping) => {
  if (mapping.fieldSource) return mapping.fieldSource;
  return STUDENT_FIELD_KEYS.has(mapping.fieldKey) ? 'student' : 'manual';
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read a value from a student object by dot-notation path, e.g. "personal.name".
 */
const getStudentValue = (obj, path, defaultValue = '') => {
  if (!path || !obj) return defaultValue;
  const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
  return value ?? defaultValue;
};

/**
 * Resolve the text to draw for a single mapping entry given:
 *  - the mapping metadata saved from FormTemplatePage
 *  - the current student object (for auto-fill fields)
 *  - the manual form data object (for manual fields)
 *
 * The STUDENT_FIELDS exported from FormTemplatePage use the `key` as the path
 * into the student object (e.g. key = "nameZH" → student.nameZH).
 */
const resolveFieldValue = (mapping, student, manualData) => {
  const { fieldKey } = mapping;
  if (getFieldSource(mapping) === 'student' && student) {
    return String(getStudentValue(student, fieldKey, ''));
  }
  return String(manualData[fieldKey] ?? '');
};

/**
 * FIX: Convert a relative marker position (0–1 fractions of the *rendered* PDF
 * canvas size) back to absolute PDF user-space points.
 *
 * PdfPreviewer renders each page at some CSS pixel size. The markers store
 * x/y as fractions of that rendered size. pdf-lib's coordinate system has its
 * origin at the BOTTOM-LEFT of the page, so we must flip the y axis.
 *
 * @param {number} relX   - marker.x  (0 to 1 fraction of page width)
 * @param {number} relY   - marker.y  (0 to 1 fraction of page height, 0 = top)
 * @param {PDFPage} pdfPage
 * @returns {{ x: number, y: number }} in PDF points (origin = bottom-left)
 */
const relativeToAbsoluteCoords = (relX, relY, pdfPage) => {
  const { width, height } = pdfPage.getSize();
  return {
    x: relX * width,
    // Flip Y: PDF origin is bottom-left, but our marker Y is measured from top
    y: height - relY * height,
  };
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A simple text input for fields that are NOT auto-filled from student records.
 * These are fields tagged with fieldSource = 'manual' in the template mappings.
 */
const ManualFieldInput = ({ fieldKey, fieldLabel, value, onChange }) => (
  <div>
    <label className="font-bold text-sm text-slate-700">
      {fieldLabel || fieldKey}
      <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">手動</span>
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(fieldKey, e.target.value)}
      placeholder={`輸入 ${fieldLabel || fieldKey}...`}
      className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
);

/**
 * A student selector checkbox list for choosing which students to generate PDFs for.
 */
const StudentSelector = ({ students, selectedIds, onToggle, onSelectAll, onClearAll }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-bold text-slate-600">選擇學生 ({selectedIds.size} / {students.length})</span>
      <div className="flex gap-2">
        <button onClick={onSelectAll} className="text-xs text-blue-500 hover:underline">全選</button>
        <button onClick={onClearAll} className="text-xs text-slate-400 hover:underline">清除</button>
      </div>
    </div>
    <div className="max-h-64 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2">
      {students.map(s => (
        <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1">
          <input
            type="checkbox"
            checked={selectedIds.has(s.id)}
            onChange={() => onToggle(s.id)}
            className="rounded"
          />
          <span className="text-sm text-slate-700 font-medium">{s.nameZH || s.nameEN}</span>
          <span className="text-xs text-slate-400">{s.class}</span>
        </label>
      ))}
      {students.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">沒有學生資料</p>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BatchFillPage({ students }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });

  // Manual-input fields (fieldSource === 'manual') shared across all generated PDFs
  const [manualData, setManualData] = useState({});

  // Batch: which students to include
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // Preview
  const [previewFile, setPreviewFile] = useState(null);

  // -------------------------------------------------------------------------
  // Load templates from Firestore
  // -------------------------------------------------------------------------
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(data);
      setIsLoading(false);
    }, (err) => {
      console.error('Failed to fetch templates:', err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // -------------------------------------------------------------------------
  // When a template is selected, reset state and load its PDF preview
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (selectedTemplate?.pdfData) {
      fetch(selectedTemplate.pdfData)
        .then(res => res.blob())
        .then(blob => setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' })));
    } else {
      setPreviewFile(null);
    }
    setManualData({});
    setSelectedStudentIds(new Set());
  }, [selectedTemplate]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const sortedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return [...students].sort(
      (a, b) => (a.class || '').localeCompare(b.class) || (a.classNo || '').localeCompare(b.classNo)
    );
  }, [students]);

  /**
   * Unique manual fields in the template (fields that need user input,
   * i.e. NOT sourced from the student record).
   */
  const manualFields = useMemo(() => {
    if (!selectedTemplate) return [];
    const seen = new Set();
    return selectedTemplate.mappings
      .filter(m => getFieldSource(m) === 'manual' && !seen.has(m.fieldKey) && seen.add(m.fieldKey))
      .map(m => ({ fieldKey: m.fieldKey, fieldLabel: m.fieldLabel || m.fieldKey }));
  }, [selectedTemplate]);

  const hasStudentFields = useMemo(() => {
    if (!selectedTemplate) return false;
    return selectedTemplate.mappings.some(m => getFieldSource(m) === 'student');
  }, [selectedTemplate]);

  const handleManualUpdate = useCallback((fieldKey, value) => {
    setManualData(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleToggleStudent = useCallback((id) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedStudentIds(new Set(sortedStudents.map(s => s.id)));
  }, [sortedStudents]);

  const handleClearAll = useCallback(() => {
    setSelectedStudentIds(new Set());
  }, []);

  // -------------------------------------------------------------------------
  // Core: generate a single filled PDF for one student
  // FIX 1: pdfDoc.embedFont(StandardFonts.Helvetica) — not fetch()
  // FIX 2: relativeToAbsoluteCoords() for correct placement
  // -------------------------------------------------------------------------
  const generateOnePdf = async (pdfDoc, font, template, student, manualData) => {
    const mappings = template.mappings;
    for (const mapping of mappings) {
      const { page, x, y } = mapping;
      const text = resolveFieldValue(mapping, student, manualData);
      if (!text) continue;

      const pdfPage = pdfDoc.getPage(page - 1);
      // FIX: convert relative (0–1) coordinates to absolute PDF points
      const { x: absX, y: absY } = relativeToAbsoluteCoords(x, y, pdfPage);

      pdfPage.drawText(text, {
        x: absX,
        y: absY,
        font,
        size: 10,
        color: rgb(0, 0, 0),
      });
    }
    return pdfDoc.save();
  };

  // -------------------------------------------------------------------------
  // Batch generate: one PDF per student, download as ZIP
  // -------------------------------------------------------------------------
  const handleGenerateBatch = async () => {
    if (!selectedTemplate) return alert('請先選擇範本。');
    if (hasStudentFields && selectedStudentIds.size === 0) return alert('請至少選擇一名學生。');

    setIsGenerating(true);
    setProgress({ current: 0, total: 0, label: '準備中...' });

    try {
      // FIX: embed the font once from the template (no fetch needed)
      const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(r => r.arrayBuffer());

      const studentsToProcess = hasStudentFields
        ? sortedStudents.filter(s => selectedStudentIds.has(s.id))
        : [null]; // no student fields → generate a single PDF

      const zip = new JSZip();
      const total = studentsToProcess.length;
      setProgress({ current: 0, total, label: '生成中...' });

      for (let i = 0; i < studentsToProcess.length; i++) {
        const student = studentsToProcess[i];

        // Load a fresh copy of the PDF for each student
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        // FIX: correct way to embed a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pdfBytes = await generateOnePdf(pdfDoc, font, selectedTemplate, student, manualData);

        const fileName = student
          ? `${selectedTemplate.templateName}_${student.nameZH || student.nameEN || student.id}.pdf`
          : `${selectedTemplate.templateName}_filled.pdf`;

        zip.file(fileName, pdfBytes);
        setProgress({ current: i + 1, total, label: `已完成 ${i + 1} / ${total}` });
      }

      if (total === 1) {
        // Single PDF → download directly without ZIP
        const [fileName, fileData] = Object.entries(zip.files)[0];
        const bytes = await fileData.async('uint8array');
        saveAs(new Blob([bytes], { type: 'application/pdf' }), fileName);
      } else {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${selectedTemplate.templateName}_batch.zip`);
      }

    } catch (err) {
      console.error('PDF 生成失敗:', err);
      alert(`生成 PDF 時發生錯誤：${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0, label: '' });
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const filledManualCount = manualFields.filter(f => manualData[f.fieldKey]).length;
  const canGenerate =
    !!selectedTemplate &&
    !isGenerating &&
    (!hasStudentFields || selectedStudentIds.size > 0);

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      <PageHeader title="批量生成報名表" subtitle="選擇範本，填寫資料，一鍵生成PDF" icon={FileText} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Step 1: Choose template ── */}
        <Card className="lg:col-span-1">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">1</span>
            選擇範本
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center text-slate-400 py-10">
                <Loader2 className="animate-spin inline-block mr-2" /> 載入中...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center text-slate-400 py-10">
                暫無任何範本。<br />請先到「報名表範本」頁面創建。
              </div>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">{template.templateName}</p>
                  <p className="text-xs text-slate-400">包含 {template.mappings.length} 個標記欄位</p>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* ── Step 2+3: Fill data ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* PDF preview */}
          {previewFile && (
            <Card>
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <Eye className="text-purple-500" size={20} /> 範本預覽
              </h3>
              <div className="max-h-96 overflow-y-auto rounded-lg border bg-slate-100 p-2">
                <PdfPreviewer file={previewFile} />
              </div>
            </Card>
          )}

          {selectedTemplate && (
            <>
              {/* Manual fields */}
              {manualFields.length > 0 && (
                <Card>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">2</span>
                    手動填寫欄位
                    <span className="text-xs font-normal text-slate-400 ml-auto">
                      {filledManualCount} / {manualFields.length} 已填
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    以下欄位對所有生成的 PDF 使用相同的值（例如：活動名稱、日期）。
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manualFields.map(({ fieldKey, fieldLabel }) => (
                      <ManualFieldInput
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

              {/* Student selector */}
              {hasStudentFields && (
                <Card>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">
                      {manualFields.length > 0 ? '3' : '2'}
                    </span>
                    選擇學生
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    每名學生將生成一份獨立的 PDF，學生資料將自動從記錄中填入。
                  </p>
                  <StudentSelector
                    students={sortedStudents}
                    selectedIds={selectedStudentIds}
                    onToggle={handleToggleStudent}
                    onSelectAll={handleSelectAll}
                    onClearAll={handleClearAll}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="sticky bottom-6">
        <Card noPadding className="p-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400">已選範本</p>
              <p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p>
            </div>
            <ChevronsRight className="text-slate-300" />
            <div>
              <p className="text-xs font-bold text-slate-400">生成份數</p>
              <p className="font-bold">
                {hasStudentFields ? `${selectedStudentIds.size} 名學生` : (selectedTemplate ? '1 份' : '—')}
              </p>
            </div>
          </div>

          <PrimaryButton onClick={handleGenerateBatch} disabled={!canGenerate} icon={isGenerating ? undefined : Download}>
            {isGenerating
              ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  {progress.label || '生成中...'}
                  {progress.total > 0 && ` (${progress.current}/${progress.total})`}
                </span>
              )
              : `生成報名表${selectedStudentIds.size > 1 ? ` (${selectedStudentIds.size} 份 ZIP)` : ''}`}
          </PrimaryButton>
        </Card>
      </div>
    </div>
  );
}
