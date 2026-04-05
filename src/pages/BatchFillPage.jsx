// src/pages/BatchFillPage.jsx (Version 5.5 - Batch Generation Workbench)

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // file-saver is a good utility, let's add it.
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Users, Download, ChevronsRight, Loader2 } from 'lucide-react';

export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // 1. Fetch all templates from Firestore
    useEffect(() => {
        const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesData);
        });
        return () => unsubscribe();
    }, []);

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    // 2. The Core PDF Generation Logic
    const handleGeneratePdfs = async () => {
        if (!selectedTemplate) return alert('請先選擇一個報名表範本。');
        if (selectedStudents.length === 0) return alert('請至少選擇一位學生。');

        setIsGenerating(true);
        try {
            const zip = new JSZip();
            const fontBytes = await fetch(StandardFonts.Helvetica).then(res => res.arrayBuffer());

            for (const studentId of selectedStudents) {
                const student = students.find(s => s.id === studentId);
                if (!student) continue;

                // Load the original PDF template from the URL
                const existingPdfBytes = await fetch(selectedTemplate.pdfUrl).then(res => res.arrayBuffer());
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const helveticaFont = await pdfDoc.embedFont(fontBytes);
                
                // Draw text based on mappings
                selectedTemplate.mappings.forEach(mapping => {
                    const page = pdfDoc.getPage(mapping.page - 1);
                    const textToDraw = student[mapping.fieldKey] || ''; // Get student data
                    
                    page.drawText(String(textToDraw), {
                        x: mapping.x,
                        y: mapping.y,
                        font: helveticaFont,
                        size: 10, // You can make this configurable later
                        color: rgb(0, 0, 0),
                    });
                });

                // Save the modified PDF into a new byte array
                const pdfBytes = await pdfDoc.save();
                // Add the generated PDF to the zip file
                zip.file(`${student.nameEN || student.nameZH || studentId}.pdf`, pdfBytes);
            }

            // Generate and download the zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `${selectedTemplate.templateName}_${new Date().toLocaleDateString()}.zip`);

        } catch (error) {
            console.error("PDF 生成失敗:", error);
            alert(`生成 PDF 時發生錯誤：${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    // Sort students for consistent display
    const sortedStudents = useMemo(() => {
        return [...students].sort((a,b) => (a.class || '').localeCompare(b.class) || (a.classNo || '').localeCompare(b.classNo));
    }, [students]);

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
            <PageHeader title="批量生成報名表" subtitle="選擇範本、勾選學生、一鍵下載所有填妥的PDF" icon={FileText} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Column 1: Select Template */}
                <Card className="lg:col-span-1">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">1</span> 選擇範本</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {templates.map(template => (
                            <button key={template.id} onClick={() => setSelectedTemplate(template)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'}`}>
                                <p className="font-bold">{template.templateName}</p>
                                <p className="text-xs text-slate-400">包含 {template.mappings.length} 個標記欄位</p>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Column 2: Select Students */}
                <Card className={`lg:col-span-2 transition-opacity ${!selectedTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">2</span> 勾選學生</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                        {sortedStudents.map(student => (
                            <label key={student.id} className={`p-3 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition-all ${selectedStudents.includes(student.id) ? 'bg-blue-50 border-blue-500' : 'bg-white hover:bg-slate-50'}`}>
                                <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleStudentToggle(student.id)} className="form-checkbox h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                                <div>
                                    <p className="font-bold text-sm">{student.nameZH}</p>
                                    <p className="text-xs text-slate-500">{student.class}班</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom Action Bar */}
            <div className="sticky bottom-6">
                <Card noPadding className="p-6 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div><p className="text-xs font-bold text-slate-400">已選範本</p><p className="font-bold">{selectedTemplate?.templateName || '未選擇'}</p></div>
                        <ChevronsRight className="text-slate-300" />
                        <div><p className="text-xs font-bold text-slate-400">已選學生</p><p className="font-bold">{selectedStudents.length} 人</p></div>
                    </div>
                    <PrimaryButton onClick={handleGeneratePdfs} disabled={!selectedTemplate || selectedStudents.length === 0 || isGenerating} loading={isGenerating} icon={Download}>
                        {isGenerating ? '正在生成...' : `生成 ${selectedStudents.length} 份報名表`}
                    </PrimaryButton>
                </Card>
            </div>
        </div>
    );
}

