// src/pages/FormTemplatePage.jsx (Version 5.2 - Interactive Mapping Enabled)

import React, { useState, useRef } from 'react';
import { FilePenLine, Upload, Trash2 } from 'lucide-react';
import { PageHeader, Card, PrimaryButton, SecondaryButton } from '../components/ui.jsx';
import PdfPreviewer from '../components/PdfPreviewer.jsx';

// --- v5.2: Define the list of fields a user can map to ---
const availableFields = [
    { value: 'nameZH', label: '學生中文姓名' },
    { value: 'nameEN', label: '學生英文姓名' },
    { value: 'dob', label: '出生日期' },
    { value: 'gender', label: '性別' },
    { value: 'idNumber', label: '證件號碼' },
    { value: 'schoolClass', label: '年級班別' },
    { value: 'phone', label: '聯絡電話' },
];

export default function FormTemplatePage() {
    const [templateName, setTemplateName] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const fileInputRef = useRef(null);

    // --- v5.2: New state to hold our mappings ---
    const [mappings, setMappings] = useState([]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            setMappings([]); // Reset mappings when a new file is uploaded
            if (!templateName) {
                setTemplateName(file.name.replace(/\.pdf$/i, ''));
            }
        } else {
            alert('請選擇一個有效的 PDF 檔案。');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };
    
    // --- v5.2: Function to add a new mapping when PDF is clicked ---
    const handleAddMapping = ({ pageNumber, x, y }) => {
        const newMapping = {
            id: Date.now(), // Use timestamp as a simple unique key
            pageNumber,
            x,
            y,
            field: '', // Default to unassigned
        };
        setMappings(prev => [...prev, newMapping]);
    };

    // --- v5.2: Function to update a mapping when dropdown is changed ---
    const handleMappingFieldChange = (id, newField) => {
        setMappings(prev => 
            prev.map(m => (m.id === id ? { ...m, field: newField } : m))
        );
    };

    // --- v5.2: Function to remove a mapping ---
    const handleRemoveMapping = (id) => {
        setMappings(prev => prev.filter(m => m.id !== id));
    };
    
    if (pdfFile) {
        return (
            <div className="space-y-8 animate-in fade-in">
                <PageHeader title="創建報名表範本" subtitle="請在下方的 PDF 預覽圖上點擊，以標記需要填寫的欄位。" icon={FilePenLine} />
                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8 items-start">
                    <div>
                       <PdfPreviewer 
                            file={pdfFile} 
                            onRenderSuccess={() => console.log('PDF 渲染成功！')}
                            onMark={handleAddMapping} // <-- Pass the handler function
                            mappings={mappings}       // <-- Pass the current mappings to be displayed
                        />
                    </div>
                    <Card className="sticky top-28">
                        <h3 className="text-2xl font-black text-slate-800 mb-4">欄位標記</h3>
                         <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">範本名稱</label>
                            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="w-full bg-slate-100 border-2 border-transparent focus:border-blue-500 transition-all rounded-xl p-3 outline-none font-bold" />
                        </div>

                        {/* --- v5.2: Dynamic list of mappings --- */}
                        <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto">
                            {mappings.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-10">請點擊左側 PDF 預覽圖以新增標記...</p>
                            ) : (
                                mappings.map(mapping => (
                                    <div key={mapping.id} className="bg-slate-50 p-3 rounded-lg border flex items-center gap-2">
                                        <div className="flex-grow">
                                            <label className="text-[10px] font-bold text-slate-400">頁 {mapping.pageNumber}, 座標 ({Math.round(mapping.x)}, {Math.round(mapping.y)})</label>
                                            <select 
                                                value={mapping.field} 
                                                onChange={e => handleMappingFieldChange(mapping.id, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-md p-2 mt-1 text-sm font-bold"
                                            >
                                                <option value="">-- 請選擇對應欄位 --</option>
                                                {availableFields.map(field => (
                                                    <option key={field.value} value={field.value}>{field.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <button onClick={() => handleRemoveMapping(mapping.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
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

    // This is the initial "upload" view (code remains the same)
    return ( <div className="...">{/* ... */}</div> );
}
