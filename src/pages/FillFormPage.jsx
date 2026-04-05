// src/pages/FillFormPage.jsx (Version 6.0 - Initial Fill & Preview)
import React, { useState, useMemo } from 'react';
import PdfPreviewer from '../components/PdfPreviewer'; // 重用我們強大的 PDF 預覽元件

// ─── 模擬資料區 (Mock Data) ───────────────────────────────────────────────────
// 在實際應用中，這些資料將會從您的資料庫 (Firestore) 中讀取。
// 為了方便開發，我們先在這裡寫死。

/**
 * 模擬一個已儲存的「範本設定」。
 * 這就是 FormTemplatePage.jsx (v5.3) 輸出的 JSON 設定。
 * 每個物件代表一個我們在 PDF 上標記的欄位位置。
 */
const MOCK_TEMPLATE = {
  id: 'hong_kong_junior_open_2024',
  name: '2024 香港青少年壁球公開賽報名表',
  fields: [
    { page: 1, fieldKey: 'student_name', fieldLabel: '學生姓名', pdfX: 150, pdfY: 250, pageWidth: 595, pageHeight: 842 },
    { page: 1, fieldKey: 'class', fieldLabel: '班級', pdfX: 400, pdfY: 250, pageWidth: 595, pageHeight: 842 },
    { page: 1, fieldKey: 'student_id', fieldLabel: '學號', pdfX: 150, pdfY: 280, pageWidth: 595, pageHeight: 842 },
    { page: 1, fieldKey: 'date', fieldLabel: '日期', pdfX: 400, pdfY: 280, pageWidth: 595, pageHeight: 842 },
  ],
};

/**
 * 模擬一份學生名單。
 * `key` (例如 'student_name') 必須與 MOCK_TEMPLATE 中的 `fieldKey` 對應。
 */
const MOCK_STUDENTS = [
  { id: 'S001', student_name: '陳浩南', class: '6A', student_id: '2018001', date: '2024-05-10' },
  { id: 'S002', student_name: '李紫晴', class: '6A', student_id: '2018002', date: '2024-05-10' },
  { id: 'S003', student_name: '張偉強', class: '5B', student_id: '2019015', date: '2024-05-10' },
  { id: 'S004', student_name: '王美玲', class: '5C', student_id: '2019033', date: '2024-05-10' },
];
// ──────────────────────────────────────────────────────────────────────────────

export default function FillFormPage() {
  const [file, setFile] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  // ── 檔案上傳 ───────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    }
  }

  // ── 學生選擇 ───────────────────────────────────────────────────────────────
  function handleStudentSelect(studentId, isSelected) {
    const newSet = new Set(selectedStudentIds);
    if (isSelected) {
      newSet.add(studentId);
    } else {
      newSet.delete(studentId);
    }
    setSelectedStudentIds(newSet);
  }

  // ── 核心邏輯：生成用於顯示的文字標記 ───────────────────────────────────────
  // 當「選擇的學生」改變時，這個 useMemo 會重新計算
  const textMarkers = useMemo(() => {
    const markers = [];
    const selectedStudents = MOCK_STUDENTS.filter(s => selectedStudentIds.has(s.id));

    // **注意：** 在這個版本中，我們只處理「第一個」被選中的學生來預覽。
    // 多學生 PDF 生成將在後續版本中處理。
    const studentToPreview = selectedStudents[0];
    if (!studentToPreview) return [];

    // 根據範本設定，為該學生的每一項資料生成一個文字標記
    MOCK_TEMPLATE.fields.forEach(field => {
      const text = studentToPreview[field.fieldKey] ?? 'N/A';
      markers.push({
        id: `text_${studentToPreview.id}_${field.fieldKey}`,
        page: field.page,
        // 百分比座標，用於在畫面上定位
        x: field.pdfX / field.pageWidth,
        y: field.pdfY / field.pageHeight,
        text: text,
      });
    });

    return markers;
  }, [selectedStudentIds]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">📄 學生資料填寫</h1>
          <p className="text-xs text-slate-500 mt-0.5">選擇範本和學生，然後生成已填寫的 PDF</p>
        </div>
        {file && (
          <button
            // disabled={selectedStudentIds.size === 0}
            className="text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-colors font-bold"
          >
            生成 {selectedStudentIds.size} 位學生的 PDF →
          </button>
        )}
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* ── Left: PDF Preview ── */}
        <main className="flex-1 overflow-y-auto p-6">
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <p className="text-lg font-bold text-slate-600">點擊上傳 PDF 報名表</p>
                <p className="text-sm text-slate-400 mt-1">（請上傳您製作範本時使用的同一份 PDF）</p>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative"> {/* 使用 relative 定位，讓文字可以疊在 PDF 上 */}
              <PdfPreviewer file={file} />
              {textMarkers.map(marker => (
                <TextOverlay key={marker.id} marker={marker} />
              ))}
            </div>
          )}
        </main>

        {/* ── Right: Control Panel ── */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-700 text-sm tracking-wide uppercase">控制面板</h2>
            <p className="text-xs text-slate-400 mt-0.5">勾選要報名的學生</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {MOCK_STUDENTS.map(student => (
              <label
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.has(student.id)}
                  onChange={(e) => handleStudentSelect(student.id, e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-sm text-slate-800">{student.student_name}</p>
                  <p className="text-xs text-slate-500">{student.class}班 - {student.student_id}</p>
                </div>
              </label>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * 一個簡單的元件，用於在 PDF 預覽上顯示文字。
 * 它接收一個 `marker` 物件，裡面包含 `x`, `y` 百分比座標和要顯示的 `text`。
 */
function TextOverlay({ marker }) {
  return (
    <div
      className="absolute pointer-events-none text-blue-700 font-bold bg-yellow-200/50 px-1"
      style={{
        left: `${marker.x * 100}%`,
        top: `${marker.y * 100}%`,
        transform: 'translateY(-100%)', // 讓文字的底線對齊座標點
        fontSize: 14,
        whiteSpace: 'nowrap', // 確保姓名等不會換行
      }}
    >
      {marker.text}
    </div>
  );
}
