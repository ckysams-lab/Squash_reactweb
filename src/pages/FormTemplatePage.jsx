// src/pages/FormTemplatePage.jsx (Version 3.0 - PDF Upload & Preview Enabled)

import React, { useState, useRef } from 'react';
import { FilePenLine, Upload } from 'lucide-react';
import { PageHeader, Card, PrimaryButton, SecondaryButton } from '../components/ui.jsx';
import PdfPreviewer from '../components/PdfPreviewer.jsx';

export default function FormTemplatePage() {
    const [templateName, setTemplateName] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            if (!templateName) {
                // Auto-fill template name from file name (without .pdf)
                setTemplateName(file.name.replace(/\.pdf$/i, ''));
            }
        } else {
            alert('請選擇一個有效的 PDF 檔案。');
        }
    };

    const handleUploadClick = () => {
        // Trigger the hidden file input
        fileInputRef.current.click();
    };
    
    // This will be the main view for creating a template
    if (pdfFile) {
        return (
            <div className="space-y-8 animate-in fade-in">
                <PageHeader 
                    title="創建報名表範本" 
                    subtitle="請在下方的 PDF 預覽圖上點擊，以標記需要填寫的欄位。" 
                    icon={FilePenLine} 
                />
                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8 items-start">
                    {/* Left: PDF Previewer */}
                    <div>
                       <PdfPreviewer file={pdfFile} />
                    </div>
                    {/* Right: Mapping Controls (Placeholder for now) */}
                    <Card className="sticky top-28">
                        <h3 className="text-2xl font-black text-slate-800 mb-4">欄位標記</h3>
                         <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">範本名稱</label>
                            <input 
                                type="text"
                                value={templateName}
                                onChange={e => setTemplateName(e.target.value)}
                                className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-500 transition-all rounded-xl p-3 outline-none font-bold"
                            />
                        </div>
                        <div className="mt-6">
                            <p className="text-sm text-slate-500">在這裡，您將看到所有已標記的欄位列表... (下一步開發)</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                            <PrimaryButton>儲存範本 (開發中)</PrimaryButton>
                            <SecondaryButton onClick={() => setPdfFile(null)}>重新選擇 PDF</SecondaryButton>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // This is the initial "upload" view
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-5xl mx-auto">
            <PageHeader 
                title="智慧報名表系統" 
                subtitle="上傳PDF、標記欄位、一鍵生成，徹底告別手動填表" 
                icon={FilePenLine} 
            />
            <Card>
                <div className="text-center">
                    <div className="max-w-md mx-auto">
                        <Upload className="text-blue-500 mx-auto mb-4" size={48} />
                        <h3 className="text-2xl font-black text-slate-800">開始創建新範本</h3>
                        <p className="text-slate-500 mt-2 mb-8">
                            請上傳一份空白的比賽報名表 (PDF格式)，我們將引導您完成後續的欄位標記。
                        </p>
                        
                        {/* Hidden file input */}
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                            className="hidden"
                        />
                        
                        {/* Visible upload button */}
                        <PrimaryButton onClick={handleUploadClick} icon={Upload} className="w-full">
                            選擇 PDF 檔案
                        </PrimaryButton>
                    </div>
                </div>
            </Card>
             {/* We will add a list of existing templates here later */}
        </div>
    );
}

