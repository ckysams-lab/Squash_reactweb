// src/pages/BatchFillPage.jsx (Version 7.0 - Dynamic Form Generation - Full Code)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Users, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

const appId = 'bcklas-squash-core-v1'; 

// Helper to get nested properties from an object, e.g., "personal.name"
const getStudentValue = (obj, path, defaultValue = '') => {
    if (!path) return defaultValue;
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return value || defaultValue;
};

// --- v7.0: New Dynamic Input Component ---
const DynamicInput = ({ fieldKey, value, students, onUpdate }) => {
    // If the key suggests it's a player selection, render a dropdown
    if (fieldKey.toLowerCase().includes('name')) {
        return (
            <select
                value={value || ''}
                onChange={(e) => onUpdate(fieldKey, e.target.value)}
                className="w-full mt-1 bg-slate-100 border-slate-200 rounded-lg p-2 font-bold"
            >
                <option value="">-- 選擇隊員 --</option>
                {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nameZH || s.nameEN} ({s.class})</option>
                ))}
            </select>
        );
    }
    
    // Otherwise, render a simple text input
    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onUpdate(fieldKey, e.target.value)}
            className="w-full mt-1 bg-slate-100 border-slate-200 rounded-lg p-2"
        />
    );
};


export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const [formData, setFormData] = useState({});
    const [previewFile, setPreviewFile] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch templates:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            if (selectedTemplate.pdfData) {
                fetch(selectedTemplate.pdfData).then(res => res.blob()).then(blob => {
                    setPreviewFile(new File([blob], "preview.pdf", { type: "application/pdf" }));
                });
            }
            setFormData({}); 
        } else {
            setPreviewFile(null);
        }
    }, [selectedTemplate]);
    
    const handleFormUpdate = useCallback((fieldKey, value) => {
        setFormData(prev => ({ ...prev, [fieldKey]: value }));
    }, []);

    const handleGeneratePdf = async () => {
        if (!selectedTemplate) return alert('請先選擇範本。');
        
        setIsGenerating(true);
        setProgress(0); // Reset progress
        try {
            const fontBytes = await fetch(StandardFonts.Helvetica).then(res => res.arrayBuffer());
            const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(fontBytes);

            const mappings = selectedTemplate.mappings;

            for(let i = 0; i < mappings.length; i++) {
                const mapping = mappings[i];
                const { page, x, y, fieldKey } = mapping;
                
                // Get the value from our form state
                let textToDraw = formData[fieldKey] || '';
                
                // If the value is a student ID (because it was a dropdown), resolve it to a name
                if (fieldKey.toLowerCase().includes('name') && textToDraw) {
                    const student = students.find(s => s.id === textToDraw);
                    if (student) {
                       textToDraw = student.nameEN || student.nameZH || '';
                    }
                }
                
                const pdfPage = pdfDoc.getPage(page - 1);
                pdfPage.drawText(String(textToDraw), { x, y, font: helveticaFont, size: 10, color: rgb(0, 0, 0) });
                
                // Update progress after each field is drawn
                setProgress(Math.round(((i + 1) / mappings.length) * 100));
            }
            
            const pdfBytes = await pdfDoc.save();
            FileSaver.saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `${selectedTemplate.templateName}_filled.pdf`);

        } catch (error) {
            console.error("PDF 生成失敗:", error);
            alert(`生成 PDF 時發生錯誤：${error.message}`);
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };
    
    const sortedStudents = useMemo(() => {
        if (!Array.isArray(students)) return [];
        return [...students].sort((a,b) => (a.class || '').localeCompare(b.class) || (a.classNo || '').localeCompare(b.classNo));
    }, [students]);
    
    const formFields = useMemo(() => {
        if (!selectedTemplate) return [];
        return [...new Set(selectedTemplate.mappings.map(m => m.fieldKey))].sort();
    }, [selectedTemplate]);

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
            <PageHeader title="批量生成報名表" subtitle="選擇範本，填寫資料，一鍵生成PDF" icon={FileText} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">1</span> 
                        選擇範本
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="text-center text-slate-400 py-10"><Loader2 className="animate-spin inline-block mr-2" /> 載入中...</div>
                        ) : templates.length === 0 ? (
                            <div className="text-center text-slate-400 py-10">暫無任何範本。<br/>請先到「報名表範本」頁面創建。</div>
                        ) : (
                            templates.map(template => (
                                <button key={template.id} onClick={() => setSelectedTemplate(template)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'}`}>
                                    <p className="font-bold">{template.templateName}</p>
                                    <p className="text-xs text-slate-400">包含 {template.mappings.length} 個標記欄位</p>
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-8">
                    {previewFile && (
                        <Card className="transition-all duration-500">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Eye className="text-purple-500" /> 範本預覽</h3>
                            <div className="max-h-96 overflow-y-auto rounded-lg border bg-slate-100 p-2">
                               <PdfPreviewer file={previewFile} />
                            </div>
                        </Card>
                    )}

                    {selectedTemplate && (
                        <Card>
                             <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">2</span>
                                填寫報名資料
                            </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formFields.map(fieldKey => (
                                    <div key={fieldKey}>
                                        <label className="font-bold text-sm text-slate-700">{fieldKey}</label>
                                        <DynamicInput 
                                            fieldKey={fieldKey}
                                            value={formData[fieldKey]}
                                            students={sortedStudents}
                                            onUpdate={handleFormUpdate}
                                        />
                                    </div>
                                ))}
                                {formFields.length === 0 && (
                                    <p className="text-slate-400 text-sm col-span-full">此範本尚未標記任何欄位。</p>
                                )}
                             </div>
                        </Card>
                    )}
                </div>
            </div>

            <div className="sticky bottom-6">
                <Card noPadding className="p-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div><p className="text-xs font-bold text-slate-400">已選範本</p><p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p></div>
                        <ChevronsRight className="text-slate-300" />
                        <div><p className="text-xs font-bold text-slate-400">已填寫欄位</p><p className="font-bold">{Object.keys(formData).filter(k => formData[k]).length} / {formFields.length}</p></div>
                    </div>
                    <PrimaryButton onClick={handleGeneratePdf} disabled={!selectedTemplate || isGenerating} icon={isGenerating ? undefined : Download} loading={isGenerating}>
                        {isGenerating ? `生成中... (${progress}%)` : `生成報名表`}
                    </PrimaryButton>
                </Card>
            </div>
        </div>
    );
}

