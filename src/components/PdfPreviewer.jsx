// src/components/PdfPreviewer.jsx (Version 5.2 - Click-to-Mark Enabled)

import React, { useState, useMemo, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfPreviewer({ file, onRenderSuccess, onMark, mappings = [] }) {
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [pageDimensions, setPageDimensions] = useState({});

    const fileUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
        };
    }, [fileUrl]);

    function onDocumentLoadSuccess({ numPages: nextNumPages }) {
        setNumPages(nextNumPages);
        setError(null);
        if (onRenderSuccess) onRenderSuccess();
    }

    function onPageLoadSuccess(page) {
        // Store original dimensions for coordinate conversion
        setPageDimensions(prev => ({ ...prev, [page.pageNumber]: { width: page.originalWidth, height: page.originalHeight } }));
    }

    function onDocumentLoadError(err) {
        console.error('react-pdf load error:', err?.message || err);
        setError('PDF 預覽失敗。檔案可能已損壞、格式不兼容或受密碼保護。');
    }

    // --- v5.2: This is the core new function ---
    const handlePageClick = (event, pageNumber) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const scale = rect.width / pageDimensions[pageNumber].width;

        // Calculate click position relative to the canvas
        const x_on_canvas = event.clientX - rect.left;
        const y_on_canvas = event.clientY - rect.top;

        // Convert to original PDF coordinates (origin at bottom-left)
        const pdf_x = x_on_canvas / scale;
        const pdf_y = pageDimensions[pageNumber].height - (y_on_canvas / scale);
        
        // Pass the precise data to the parent component
        onMark({ pageNumber, x: pdf_x, y: pdf_y });
    };

    return (
        <div className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[400px] relative">
            {error ? (
                <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
                    <h4 className="font-black text-lg">預覽失敗</h4>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            ) : (
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<p className="text-center text-slate-500 font-bold p-8">正在加載 PDF 預覽...</p>}
                >
                    {Array.from(new Array(numPages), (el, index) => (
                        <div key={`page_wrapper_${index + 1}`} className="relative" onClick={(e) => handlePageClick(e, index + 1)}>
                            <Page
                                pageNumber={index + 1}
                                onLoadSuccess={onPageLoadSuccess}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                className="mb-4 shadow-lg"
                                width={800}
                            />
                             {/* --- v5.2: Render visual markers for existing mappings --- */}
                            {mappings.filter(m => m.pageNumber === index + 1).map(mapping => {
                                if (!pageDimensions[mapping.pageNumber]) return null;
                                const scale = 800 / pageDimensions[mapping.pageNumber].width;
                                const top = (pageDimensions[mapping.pageNumber].height - mapping.y) * scale;
                                const left = mapping.x * scale;
                                
                                return (
                                    <div 
                                        key={mapping.id} 
                                        className="absolute w-4 h-4 bg-red-500/50 border-2 border-red-600 rounded-full -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: `${left}px`, top: `${top}px` }}
                                        title={`欄位: ${mapping.field || '未指定'}`}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </Document>
            )}
        </div>
    );
}
