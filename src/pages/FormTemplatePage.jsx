// src/pages/FormTemplatePage.jsx (Version 5.4 - Save to Firebase Enabled)

import React, { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming you have db exported from firebase.js
import { Loader2 } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

const storage = getStorage(); // Initialize Firebase Storage

const STUDENT_FIELDS = [
  { key: 'student_name',   label: '學生姓名' },
  { key: 'student_id',     label: '學號' },
  { key: 'class',          label: '班級' },
  // ... (rest of the fields are identical)
];

// MarkerCard component remains identical to your v5.2
function MarkerCard({ marker, fields, onFieldAssign, onDelete }) { /* ... */ }

export default function FormTemplatePage() {
  const [file, setFile] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isPdfReady, setIsPdfReady] = useState(false);
  
  // --- v5.4: New state for loading status ---
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState(''); // Add state for template name

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setMarkers([]);
      setIsPdfReady(false);
      // Auto-fill template name from file name
      setTemplateName(selected.name.replace(/\.pdf$/i, ''));
    }
  };

  const handlePageClick = useCallback(({ page, x, y }) => {
    setMarkers(prev => [
      ...prev,
      {
        id: `marker_${Date.now()}_${prev.length}`, // Use a more robust unique ID
        index: prev.length,
        page,
        x,
        y,
        fieldKey: '',
        fieldLabel: '',
      },
    ]);
  }, []);

  const handleFieldAssign = useCallback((markerId, fieldKey) => {
    const field = STUDENT_FIELDS.find(f => f.key === fieldKey);
    setMarkers(prev =>
      prev.map(m =>
        m.id === markerId ? { ...m, fieldKey, fieldLabel: field?.label ?? '' } : m
      )
    );
  }, []);

  const handleDeleteMarker = useCallback((markerId) => {
    setMarkers(prev => {
      const updated = prev.filter(m => m.id !== markerId).map((m, i) => ({ ...m, index: i }));
      return updated;
    });
  }, []);

  // --- v5.4: The Core "Save Template" Logic ---
  const handleSaveTemplate = async () => {
    const assignedMarkers = markers.filter(m => m.fieldKey);
    if (!file) return alert('請先上傳 PDF 檔案。');
    if (!templateName.trim()) return alert('請為您的範本命名。');
    if (assignedMarkers.length === 0) return alert('請至少標記並指定一個欄位。');
    if (assignedMarkers.length < markers.length) {
        if (!window.confirm('您有部分標記尚未指定欄位，確定要儲存嗎？（未指定的標記將被忽略）')) {
            return;
        }
    }
    
    setIsSaving(true);
    try {
        // 1. Upload PDF to Firebase Storage
        const filePath = `form-templates/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(storageRef, file);
        const pdfUrl = await getDownloadURL(uploadResult.ref);

        // 2. Prepare data for Firestore
        const templateData = {
            templateName: templateName.trim(),
            pdfUrl: pdfUrl,
            storagePath: filePath, // Store path for future management (e.g., deletion)
            mappings: assignedMarkers.map(({ id, page, x, y, fieldKey }) => ({
                id, page, x, y, fieldKey // Only save essential data
            })),
            createdAt: serverTimestamp(),
        };

        // 3. Save metadata and mappings to Firestore
        const docRef = await addDoc(collection(db, 'form_templates'), templateData);
        
        alert(`✅ 範本 "${templateName.trim()}" 已成功儲存！`);
        
        // Reset state after successful save
        setFile(null);
        setMarkers([]);
        setTemplateName('');
        setIsPdfReady(false);

    } catch (error) {
        console.error("儲存範本失敗:", error);
        alert(`儲存範本時發生錯誤：${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };


  const assignedCount = markers.filter(m => m.fieldKey).length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
         {/* ... Header JSX is identical ... */}
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <main className="flex-1 overflow-y-auto p-6">
           {/* ... Upload prompt or PDF Previewer JSX is identical ... */}
        </main>

        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm overflow-hidden">
          {/* --- v5.4: Add Template Name input --- */}
          <div className="px-5 py-4 border-b border-slate-100">
            <label htmlFor="templateName" className="font-black text-slate-700 text-sm tracking-wide uppercase">範本名稱</label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="例如：2024 壁總盃 U12 表格"
              className="w-full mt-2 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
             {/* ... MarkerCard mapping is identical ... */}
          </div>

          {/* --- v5.4: Update the footer to include the Save button --- */}
          {file && (
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3">
              <button 
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                {isSaving ? '儲存中...' : '儲存範本'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

