// src/pages/BatchFillPage.jsx (Version 6.1 - Corrected Rendering Logic)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { db } from '../firebase';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';
import { FileText, Users, Download, ChevronsRight, Loader2 } from 'lucide-react';

const appId = 'bcklas-squash-core-v1'; 

export default function BatchFillPage({ students }) {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // <-- v6.1: Add a dedicated loading state
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, 'form_templates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesData);
            setIsLoading(false); // <-- Data loaded, set loading to false
        }, (error) => {
            console.error("Failed to fetch templates:", error);
            setIsLoading(false); // Also stop loading on error
        });
        return () => unsubscribe();
    }, []);

    const handleStudentToggle = (studentId) => { /* ... (Unchanged) ... */ };
    const handleGeneratePdfs = async () => { /* ... (Unchanged) ... */ };
    
    const sortedStudents = useMemo(() => {
        if (!Array.isArray(students)) return [];
        return [...students].sort((a,b) => (a.class || '').localeCompare(b.class) || (a.classNo || '').localeCompare(b.classNo));
    }, [students]);

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
            <PageHeader title="批量生成報名表" subtitle="選擇範本、勾選學生、一鍵下載所有填妥的PDF" icon={FileText} />
            
            {/* --- v6.1: The entire grid is now rendered unconditionally --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Column 1: Select Template */}
                <Card className="lg:col-span-1">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">1</span> 
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

                {/* Column 2: Select Students */}
                <Card className={`lg:col-span-2 transition-opacity ${!selectedTemplate ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center">2</span> 
                        勾選學生
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
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

            {/* Bottom Action Bar */}
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

