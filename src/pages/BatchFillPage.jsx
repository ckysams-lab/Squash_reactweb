// src/pages/BatchFillPage.jsx (Version 5.7 - file-saver fix)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import FileSaver from 'file-saver'; // --- v5.7 FIX: Correctly import file-saver ---
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Download, ChevronsRight, Loader2 } from 'lucide-react';

const appId = 'bcklas-squash-core-v1'; 

export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0); // For generation progress

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

    const handleGeneratePdfs = async () => {
        if (!selectedTemplate) return alert('請先選擇一個報名表範本。');
        if (selectedStudents.length === 0) return alert('請至少選擇一位學生。');

        setIsGenerating(true);
        setProgress(0);
        try {
            const zip = new JSZip();
            // Fetch font data only once
            const fontBytes = await fetch(StandardFonts.Helvetica).then(res => res.arrayBuffer());

            for (let i = 0; i < selectedStudents.length; i++) {
                const studentId = selectedStudents[i];
                const student = students.find(s => s.id === studentId);
                if (!student) continue;

                // Update progress
                setProgress(Math.round(((i + 1) / selectedStudents.length) * 100));

                const existingPdfBytes = await fetch(selectedTemplate.pdfUrl).then(res => res.arrayBuffer());
                const pdfDoc = await PDFDocument.load(existingPdfBytes);
                const helveticaFont = await pdfDoc.embedFont(fontBytes);
                
                selectedTemplate.mappings.forEach(mapping => {
                    const page = pdfDoc.getPage(mapping.page - 1);
                    // Use a helper to get potentially nested student data
                    const textToDraw = getStudentValue(student, mapping.fieldKey) || '';
                    
                    page.drawText(String(textToDraw), {
                        x: mapping.x,
                        y: mapping.y,
                        font: helveticaFont,
                        size: 10,
                        color: rgb(0, 0, 0),
                    });
                });

                const pdfBytes = await pdfDoc.save();
                zip.file(`${student.nameEN || student.nameZH || studentId}.pdf`, pdfBytes);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            // --- v5.7 FIX: Use the correct saveAs function from the imported module ---
            FileSaver.saveAs(zipBlob, `${selectedTemplate.templateName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`);

        } catch (error) {
            console.error("PDF 生成失敗:", error);
            alert(`生成 PDF 時發生錯誤：${error.message}`);
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };
    
    // Helper function to handle potentially nested student data in the future
    const getStudentValue = (student, fieldKey) => {
        // For now, it's a direct mapping. This can be expanded later.
        // e.g., if fieldKey is 'parent.name', it could do student['parent']['name']
        return student[fieldKey];
    }
    
    const sortedStudents = useMemo(() => {
        return [...students].sort((a,b) => (a.class || '').localeCompare(b.class) || (a.classNo || '').localeCompare(b.classNo));
    }, [students]);

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
            <PageHeader title="批量生成報名表" subtitle="選擇範本、勾選學生、一鍵下載所有填妥的PDF" icon={FileText} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <Card className="lg:col-span-1">
                    {/* ... Column 1: Select Template (Unchanged) ... */}
                </Card>

                <Card className={`lg:col-span-2 transition-opacity ${!selectedTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                   {/* ... Column 2: Select Students (Unchanged) ... */}
                </Card>
            </div>

            <div className="sticky bottom-6">
                <Card noPadding className="p-6 flex items-center justify-between shadow-2xl">
                    {/* ... Bottom Action Bar Info (Unchanged) ... */}
                    <PrimaryButton onClick={handleGeneratePdfs} disabled={!selectedTemplate || selectedStudents.length === 0 || isGenerating} icon={isGenerating ? Loader2 : Download} className={isGenerating ? 'animate-spin' : ''}>
                        {isGenerating ? `生成中... (${progress}%)` : `生成 ${selectedStudents.length} 份報名表`}
                    </PrimaryButton>
                </Card>
            </div>
        </div>
    );
}
