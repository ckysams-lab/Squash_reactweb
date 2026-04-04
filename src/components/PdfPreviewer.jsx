// src/components/PdfPreviewer.jsx (Version 4.1 / Final)

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// --- This is the verified, correct way to set up the worker for Vite/Vercel ---
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    
    function onDocumentLoadSuccess({ numPages: nextNumPages }) {
        setNumPages(nextNumPages);
        setError(null);
        if(onRenderSuccess) {
            onRenderSuccess();
        }
    }

    function onDocumentLoadError(err) {
        console.error('react-pdf error:', err);
        let userFriendlyError = 'PDF 預覽失敗。檔案可能已損壞、格式不兼容或受密碼保護。';
        setError(userFriendlyError);
    }
    
    const fileUrl = file ? URL.createObjectURL(file) : null;

    return (
        <div className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[400px]">
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
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="mb-4 shadow-lg"
                            width={800}
                        />
                    ))}
                </Document>
            )}
        </div>
    );
}
