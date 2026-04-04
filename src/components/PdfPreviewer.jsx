// src/components/PdfPreviewer.jsx (Version 3.7 - Visual Debugger Edition)

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// We continue with the most robust local worker strategy.
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const canvasContainerRef = useRef(null);
    
    // --- DEBUG STATE ---
    const [debugLog, setDebugLog] = useState([]);
    const [finalError, setFinalError] = useState(null);
    const [pdfInfo, setPdfInfo] = useState(null);

    const log = (message, data = '') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLog(prev => [...prev, { timestamp, message, data: data ? JSON.stringify(data, null, 2) : '' }]);
    };

    useEffect(() => {
        if (!file || !canvasContainerRef.current) return;

        // Reset for new file
        setDebugLog([]);
        setFinalError(null);
        setPdfInfo(null);
        log('useEffect triggered. New file detected.', { name: file.name, size: file.size, type: file.type });
        
        const container = canvasContainerRef.current;
        if (container.firstChild) container.innerHTML = '';

        const renderPdf = async () => {
            try {
                log('Starting PDF render process...');
                const fileReader = new FileReader();
                
                const buffer = await new Promise((resolve, reject) => {
                    fileReader.onload = () => {
                        log('FileReader successfully loaded file into memory.');
                        resolve(fileReader.result);
                    };
                    fileReader.onerror = () => {
                        log('FileReader failed to read file.');
                        reject(fileReader.error);
                    };
                    fileReader.readAsArrayBuffer(file);
                });

                const typedarray = new Uint8Array(buffer);
                log('File buffer converted to Uint8Array.');

                const pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
                log('pdf.js successfully parsed the document.', { numPages: pdfDoc.numPages });
                setPdfInfo({ numPages: pdfDoc.numPages });

                const canvases = [];
                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    log(`Getting page ${i}...`);
                    const page = await pdfDoc.getPage(i);
                    log(`Page ${i} retrieved. Viewport scale: ${window.devicePixelRatio || 2}`);
                    const viewport = page.getViewport({ scale: window.devicePixelRatio || 2 });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.className = 'mb-4 shadow-lg rounded-md';
                    
                    container.appendChild(canvas);
                    canvases.push(canvas);

                    log(`Rendering page ${i} onto canvas...`);
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    log(`Page ${i} rendered successfully.`);
                }
                
                log('All pages rendered. Firing onRenderSuccess.');
                if (onRenderSuccess) {
                    onRenderSuccess(canvases);
                }

            } catch (err) {
                log('--- CRITICAL ERROR ---', err.toString());
                console.error('PDF Rendering Failed:', err);
                setFinalError({ name: err.name, message: err.message, stack: err.stack });
            }
        };

        renderPdf();

    }, [file, onRenderSuccess]);

    return (
        <div className="border-4 border-dashed border-red-300 p-2 bg-white">
            <h3 className="font-black text-red-600 text-center text-lg">--- 偵錯模式 V3.7 ---</h3>
            
            {/* The actual preview area */}
            <div ref={canvasContainerRef} className="pdf-preview-container bg-slate-200 p-4 rounded-lg min-h-[200px] flex items-center justify-center">
                {/* This area will be populated by canvases or will remain empty on failure */}
            </div>

            {/* Debug Information Panel */}
            <div className="mt-4 p-4 bg-gray-900 text-white font-mono text-xs rounded-lg max-h-96 overflow-y-auto">
                <h4 className="font-bold text-yellow-400 mb-2">[偵錯日誌]</h4>
                {debugLog.map((entry, index) => (
                    <div key={index} className="mb-2 border-b border-gray-700 pb-1">
                        <p><span className="text-gray-500">{entry.timestamp}</span>: <span className="text-green-400">{entry.message}</span></p>
                        {entry.data && <pre className="text-cyan-400 bg-gray-800 p-2 rounded mt-1">{entry.data}</pre>}
                    </div>
                ))}

                {finalError && (
                    <div className="mt-4 p-4 bg-red-900/50 rounded">
                        <h4 className="font-bold text-red-400">--- 最終捕獲錯誤 ---</h4>
                        <p className="text-red-300 mt-2"><strong>類型:</strong> {finalError.name}</p>
                        <p className="text-red-300"><strong>訊息:</strong> {finalError.message}</p>
                        <pre className="text-red-200 text-xs mt-2 whitespace-pre-wrap">{finalError.stack}</pre>
                    </div>
                )}
                 {!finalError && pdfInfo && (
                     <p className="text-emerald-400 font-bold mt-2">偵錯結論：程式碼流程已走完且未捕獲到任何致命錯誤。</p>
                 )}
            </div>
        </div>
    );
}

