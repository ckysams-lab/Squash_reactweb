// src/pages/BatchFillPage.jsx (Version 6.2 - Mini-Form Entry Slots - Full Code)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Users, Download, ChevronsRight, Loader2, Eye, User, Calendar } from 'lucide-react';
import PdfPreviewer from '../components/PdfPreviewer';

const appId = 'bcklas-squash-core-v1'; 

// Helper to get nested properties from an object, e.g., "personal.name"
const getStudentValue = (obj, path, defaultValue = '') => {
    // This is a simple implementation. For production, a more robust library like lodash.get might be used.
    if (!path) return defaultValue;
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return value || defaultValue;
};

// --- v6.2: New Slot Component for selecting a player for each position ---
const EntrySlot = ({ slot, students, onSelectPlayer, onUpdateExtraData, selectedPlayerIds }) => {
    // Filter out students who are already selected in other slots, but keep the current slot's selected student in the list
    const availableStudents = students.filter(s => !selectedPlayerIds.includes(s.id) || s.id === slot.studentId);
    const selectedStudent = slot.studentId ? students.find(s => s.id === slot.studentId) : null;

    return (
        <div className="p-4 bg-white rounded-xl border-2 space-y-3">
            <div>
                <label className="font-bold text-sm text-blue-800">席位 #{slot.slotNumber}</label>
                <select
                    value={slot.studentId || ''}
                    onChange={(e) => onSelectPlayer(slot.slotNumber, e.target.value)}
                    className="w-full mt-1 bg-slate-100 border-slate-200 rounded-lg p-2 font-bold"
                >
                    <option value="">-- 未選擇隊員 --</option>
                    {availableStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.nameZH || s.nameEN} ({s.class})</option>
                    ))}
                </select>
            </div>

            {selectedStudent && (
                <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in duration-300">
                    <div className="text-xs text-slate-500 space-y-1">
                        <p className="flex items-center gap-2"><User size={14}/> {selectedStudent.nameEN}</p>
                        <p className="flex items-center gap-2"><Calendar size={14}/> {selectedStudent.dob}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600">參賽組別 (例如: U12男子組)</label>
                        <input type="text" value={slot.extraData.competitionGroup || ''} onChange={(e) => onUpdateExtraData(slot.slotNumber, 'competitionGroup', e.target.value)} className="w-full text-sm mt-1 bg-slate-50 border-slate-200 rounded-md p-1.5"/>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-600">球衣尺碼 (例如: M)</label>
                        <input type="text" value={slot.extraData.jerseySize || ''} onChange={(e) => onUpdateExtraData(slot.slotNumber, 'jerseySize', e.target.value)} className="w-full text-sm mt-1 bg-slate-50 border-slate-200 rounded-md p-1.5"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-600">其他備註</label>
                        <input type="text" value={slot.extraData.notes || ''} onChange={(e) => onUpdateExtraData(slot.slotNumber, 'notes', e.target.value)} className="w-full text-sm mt-1 bg-slate-50 border-slate-200 rounded-md p-1.5"/>
                    </div>
                </div>
            )}
        </div>
    );
};


export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const [entrySlots, setEntrySlots] = useState([]);
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

            const slotNumbers = new Set(
                selectedTemplate.mappings.map(m => {
                    const match = m.fieldKey.match(/_(\d+)$/);
                    return match ? parseInt(match[1], 10) : 1;
                })
            );
            
            const maxSlot = Math.max(0, ...slotNumbers);
            const newSlots = Array.from({ length: maxSlot }, (_, i) => ({
                slotNumber: i + 1,
                studentId: null,
                extraData: {},
            }));
            setEntrySlots(newSlots);

        } else {
            setPreviewFile(null);
            setEntrySlots([]);
        }
    }, [selectedTemplate]);

    const handleSelectPlayerForSlot = (slotNumber, studentId) => {
        setEntrySlots(prevSlots => 
            prevSlots.map(slot => 
                slot.slotNumber === slotNumber ? { ...slot, studentId } : slot
            )
        );
    };

    const handleUpdateExtraData = (slotNumber, field, value) => {
        setEntrySlots(prevSlots =>
            prevSlots.map(slot =>
                slot.slotNumber === slotNumber 
                    ? { ...slot, extraData: { ...slot.extraData, [field]: value } }
                    : slot
            )
        );
    };

    const handleGeneratePdf = async () => {
        if (!selectedTemplate) return alert('請先選擇一個報名表範本。');
        const filledSlots = entrySlots.filter(s => s.studentId);
        if (filledSlots.length === 0) return alert('請至少為一個席位選擇隊員。');

        setIsGenerating(true);
        setProgress(0);
        try {
            const fontBytes = await fetch(StandardFonts.Helvetica).then(res => res.arrayBuffer());
            const existingPdfBytes = await fetch(selectedTemplate.pdfData).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(fontBytes);

            selectedTemplate.mappings.forEach(mapping => {
                const match = mapping.fieldKey.match(/_(\d+)$/);
                const slotNumber = match ? parseInt(match[1], 10) : 1;
                const baseFieldKey = match ? mapping.fieldKey.replace(`_${slotNumber}`, '') : mapping.fieldKey;

                const targetSlot = entrySlots.find(s => s.slotNumber === slotNumber);
                if (!targetSlot || !targetSlot.studentId) return;

                const student = students.find(s => s.id === targetSlot.studentId);
                if (!student) return;
                
                const textToDraw = targetSlot.extraData[baseFieldKey] || getStudentValue(student, baseFieldKey);

                const page = pdfDoc.getPage(mapping.page - 1);
                page.drawText(String(textToDraw), {
                    x: mapping.x,
                    y: mapping.y,
                    font: helveticaFont,
                    size: 10,
                    color: rgb(0, 0, 0),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            FileSaver.saveAs(blob, `${selectedTemplate.templateName}_filled.pdf`);

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
    
    const selectedPlayerIds = entrySlots.map(s => s.studentId).filter(Boolean);

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
                    {previewFile && (
                        <Card className="transition-all duration-500">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Eye className="text-purple-500" /> 範本預覽</h3>
                            <div className="max-h-96 overflow-y-auto rounded-lg border bg-slate-100 p-2">
                               <PdfPreviewer file={previewFile} />
                            </div>
                        </Card>
                    )}

                    {entrySlots.length > 0 && (
                        <Card>
                             <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-sans">2</span> 
                                選擇參賽隊員
                            </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {entrySlots.map(slot => (
                                    <EntrySlot 
                                        key={slot.slotNumber}
                                        slot={slot}
                                        students={sortedStudents}
                                        onSelectPlayer={handleSelectPlayerForSlot}
                                        onUpdateExtraData={handleUpdateExtraData}
                                        selectedPlayerIds={selectedPlayerIds}
                                    />
                                ))}
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
                        <div><p className="text-xs font-bold text-slate-400">已填席位</p><p className="font-bold">{selectedPlayerIds.length} / {entrySlots.length}</p></div>
                    </div>
                    <PrimaryButton onClick={handleGeneratePdf} disabled={!selectedTemplate || selectedPlayerIds.length === 0 || isGenerating} icon={isGenerating ? undefined : Download} loading={isGenerating}>
                        {isGenerating ? `生成中... (${progress}%)` : `生成報名表`}
                    </PrimaryButton>
                </Card>
            </div>
        </div>
    );
}

