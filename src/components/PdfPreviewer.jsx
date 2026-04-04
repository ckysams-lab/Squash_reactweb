// src/components/PdfPreviewer.jsx (Version 5.2)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// unpkg mirrors every exact npm version
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 800;

export default function PdfPreviewer({ file, markers = [], onPageClick, onRenderSuccess }) {
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({});
  const containerRef = useRef(null);

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

  function onDocumentLoadError(err) {
    console.error('react-pdf load error:', err?.message || err);
    setError('PDF 預覽失敗。檔案可能已損壞、格式不兼容或受密碼保護。');
  }

  // Captures the page's rendered dimensions after each page renders
  function onPageRenderSuccess(page, pageNumber) {
    setPageDimensions(prev => ({
      ...prev,
      [pageNumber]: { width: page.width, height: page.height },
    }));
  }

  // Translates a click on the rendered page into normalised 0–1 PDF-space coordinates
  function handlePageClick(e, pageNumber) {
    if (!onPageClick) return;

    const pageEl = e.currentTarget;
    const rect = pageEl.getBoundingClientRect();

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    onPageClick({
      page: pageNumber,
      x: parseFloat((clickX / rect.width).toFixed(4)),
      y: parseFloat((clickY / rect.height).toFixed(4)),
      pageWidth: rect.width,
      pageHeight: rect.height,
    });
  }

  return (
    <div
      className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[400px]"
      ref={containerRef}
    >
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
            <p className="text-center text-slate-500 font-bold p-8">正在加載 PDF 預覽...</p>
          }
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1;
            const pageMarkers = markers.filter(m => m.page === pageNumber);

            return (
              <div
                key={`page_wrapper_${pageNumber}`}
                className="relative mb-4 shadow-lg cursor-crosshair select-none"
                onClick={(e) => handlePageClick(e, pageNumber)}
                title="點擊以新增標記"
              >
                <Page
                  pageNumber={pageNumber}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  width={PAGE_WIDTH}
                  onRenderSuccess={(page) => onPageRenderSuccess(page, pageNumber)}
                />

                {/* Render marker pins on top of the page */}
                {pageMarkers.map((marker) => (
                  <MarkerPin key={marker.id} marker={marker} />
                ))}
              </div>
            );
          })}
        </Document>
      )}
    </div>
  );
}

// Visual pin rendered at the marker's normalised (x, y) position
function MarkerPin({ marker }) {
  const isAssigned = Boolean(marker.fieldKey);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${marker.x * 100}%`,
        top: `${marker.y * 100}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: 10,
      }}
    >
      <div className="flex flex-col items-center">
        {/* Circle badge */}
        <div
          className="flex items-center justify-center rounded-full text-white font-black shadow-lg border-2 border-white"
          style={{
            width: 28,
            height: 28,
            background: isAssigned ? '#2563eb' : '#f59e0b',
            fontSize: 11,
          }}
        >
          {marker.index + 1}
        </div>

        {/* Field label bubble (only shown when a field is assigned) */}
        {marker.fieldLabel && (
          <div
            className="mt-1 px-2 py-0.5 rounded text-white font-bold shadow whitespace-nowrap"
            style={{ background: '#2563eb', fontSize: 10 }}
          >
            {marker.fieldLabel}
          </div>
        )}

        {/* Pin stem */}
        <div
          style={{
            width: 2,
            height: 8,
            background: isAssigned ? '#2563eb' : '#f59e0b',
            marginTop: -2,
          }}
        />
      </div>
    </div>
  );
}
