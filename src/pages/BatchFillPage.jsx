// src/pages/BatchFillPage.jsx (Version 6.2 - Preview & Interaction Fix - Full Code)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Users, Download, ChevronsRight, Loader2, Eye } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

const appId = 'bcklas-squash-core-v1'; 

export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

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
        if (selectedTemplate && selectedTemplate.pdfData) {
            fetch(selectedTemplate.pdfData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], selectedTemplate.templateName + ".pdf", { type: "application/pdf" });
                    setPreviewFile(file);
                });
        } else {
            setPreviewFile(null);
        }
    }, [selectedTemplate]);

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const handleGeneratePdfs = async () => {
        if (!selectedTemplate) return alert('請先選擇一個報名表範本。');
        if (selectedStudents.length === 0) return alert('請至少選擇一位學生。');

        setIsGenerating(true);
        setProgress(0);
        try {
            const zip = new JSZip();
            const fontBytes = await fetch(StandardFonts.Helvetica).then(res => res.arrayBuffer());

            for (let i = 0; i < selectedStudents.length; i++) {
                const studentId = selectedStudents[i];
                const student = students.find(s => s.id === studentId);
                if (!student) continue;

                setProgress(Math.round(((i + 1) / selectedStudents.length) * 100));

                const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(res => res.arrayBuffer());
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const helveticaFont = await pdfDoc.embedFont(fontBytes);
                
                selectedTemplate.mappings.forEach(mapping => {
                    const page = pdfDoc.getPage(mapping.page - 1);
                    const textToDraw = student[mapping.fieldKey] || '';
                    
                    page.drawText(String(textToDraw), {
                        x: mapping.x,
                        y: mapping.y,
                        font: helveticaFont,
                        size: 10,
                        color: rgb(0, 0, 0),
                    });
                });

                const pdfBytes = await pdfDoc.save();
                zip.file(`${student.nameEN || student.nameZH || student.name || studentId}.pdf`, pdfBytes);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            FileSaver.saveAs(zipBlob, `${selectedTemplate.templateName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`);

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

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
            <PageHeader title="批量生成報名表" subtitle="選擇範本、勾選學生、一鍵下載所有填妥的PDF" icon={FileText} />
            
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
                    <Card className={`transition-all duration-500 ${!selectedTemplate ? 'hidden' : 'block'}`}>
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Eye className="text-purple-500" /> 範本預覽</h3>
                        <div className="max-h-96 overflow-y-auto rounded-lg border bg-slate-100">
                           {previewFile && <PdfPreviewer file={previewFile} />}
                        </div>
                    </Card>

                    <Card className={`transition-opacity ${!selectedTemplate ? 'opacity-50' : ''}`}>
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">2</span> 
                            勾選學生
                        </h3>
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2 ${!selectedTemplate ? 'pointer-events-none' : ''}`}>
                            {sortedStudents.length === 0 ? (
                                 <div className="col-span-full text-center text-slate-400 py-10">暫無學生數據。</div>
                            ) : (
                                sortedStudents.map(student => (
                                    <label key={student.id} className={`p-3 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition-all ${selectedStudents.includes(student.id) ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'}`}>
                                        <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleStudentToggle(student.id)} className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <p className="font-bold text-sm">{student.nameZH || student.name}</p>
                                            <p className="text-xs text-slate-500">{student.class}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="sticky bottom-6">
                <Card noPadding className="p-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div><p className="text-xs font-bold text-slate-400">已選範本</p><p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p></div>
                        <ChevronsRight className="text-slate-300" />
                        <div><p className="text-xs font-bold text-slate-400">已選學生</p><p className="font-bold">{selectedStudents.length} 人</p></div>
                    </div>
                    <PrimaryButton onClick={handleGeneratePdfs} disabled={!selectedTemplate || selectedStudents.length === 0 || isGenerating} icon={isGenerating ? undefined : Download} loading={isGenerating}>
                        {isGenerating ? `生成中... (${progress}%)` : `生成 ${selectedStudents.length} 份報名表`}
                    </PrimaryButton>
                </Card>
            </div>
        </div>
    );
}

