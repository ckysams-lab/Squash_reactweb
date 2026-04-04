// src/components/PdfPreviewer.jsx (Version 5.0)
import React, { useState, useMemo, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Use CDN worker matched to the installed pdfjs-dist version.
// This is more reliable than local bundling across Vite/Vercel builds.
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);

    // Memoize the object URL so it's only created when `file` changes,
    // not on every re-render. This prevents stale/dangling blob URLs.
    const fileUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    // Revoke the object URL when the component unmounts or file changes
    // to avoid memory leaks.
    useEffect(() => {
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [fileUrl]);

    function onDocumentLoadSuccess({ numPages: nextNumPages }) {
        setNumPages(nextNumPages);
        setError(null);
        if (onRenderSuccess) {
            onRenderSuccess();
        }
    }

    function onDocumentLoadError(err) {
        // Log the real error to help with future debugging
        console.error('react-pdf load error:', err?.message || err);
        setError('PDF 預覽失敗。檔案可能已損壞、格式不兼容或受密碼保護。');
    }

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
                    loading={
                        <p className="text-center text-slate-500 font-bold p-8">
                            正在加載 PDF 預覽...
                        </p>
                    }
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
