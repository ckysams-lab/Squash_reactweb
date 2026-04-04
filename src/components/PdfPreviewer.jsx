// src/components/PdfPreviewer.jsx (Version 3.5 - Local Worker Strategy - Full Code)

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// --- v3.5 FIX: Point to the worker file that vite-plugin-static-copy will place in our own build output ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const canvasContainerRef = useRef(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'rendering_page_x', 'success', 'error'

    useEffect(() => {
        // Guard clause: Do nothing if there's no file or the container isn't ready.
        if (!file || !canvasContainerRef.current) return;

        // Reset state for the new file processing.
        setError(null);
        setStatus('loading');
        
        const container = canvasContainerRef.current;
        // The "NotFoundError" from previous log suggests we should be careful when clearing.
        // This ensures we only clear content if there's something to clear.
        if (container.firstChild) {
            container.innerHTML = '';
        }

        const renderPdf = async () => {
            try {
                // Use a Promise to handle FileReader's async nature cleanly.
                const buffer = await new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onload = () => resolve(fileReader.result);
                    fileReader.onerror = () => reject(fileReader.error);
                    fileReader.readAsArrayBuffer(file);
                });

                const typedarray = new Uint8Array(buffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                // All canvases will be stored here
                const canvases = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    // Update status for user feedback
                    setStatus(`rendering_page_${i}`);

                    const page = await pdf.getPage(i);
                    // Use device pixel ratio for sharper rendering on high-DPI screens
                    const viewport = page.getViewport({ scale: window.devicePixelRatio || 2 });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Style canvas to ensure it's responsive and fits the container
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.className = 'mb-4 shadow-lg rounded-md'; // Add some styling
                    
                    // Append canvas to the container *before* rendering
                    container.appendChild(canvas);
                    canvases.push(canvas);

                    // Render the page onto the canvas
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                }
                
                setStatus('success');
                // Notify parent component that rendering is complete, passing the created canvas elements
                if (onRenderSuccess) {
                    onRenderSuccess(canvases);
                }

            } catch (err) {
                console.error('PDF Rendering Failed:', err);
                let userFriendlyError = 'PDF 預覽失敗。檔案可能已損壞或格式不兼容。';
                if (err.name === 'MissingPDFException') {
                    userFriendlyError = '錯誤：PDF 檔案缺失或無法讀取。';
                } else if (err.name === 'PasswordException') {
                    userFriendlyError = '錯誤：此 PDF 檔案受密碼保護，無法預覽。';
                } else if (err.message && err.message.includes('Failed to fetch')) {
                    userFriendlyError = '錯誤：無法加載 PDF 渲染引擎，這通常是一個部署配置問題。';
                }
                setError({ message: userFriendlyError, details: err.toString() });
                setStatus('error');
            }
        };

        renderPdf();

    }, [file, onRenderSuccess]); // Effect dependencies

    // This function determines what to display based on the current status
    const renderContent = () => {
        switch (status) {
            case 'idle':
                return <p className="text-center text-slate-500 p-8">請上傳 PDF 檔案以開始預覽...</p>;
            case 'loading':
                return <p className="text-center text-slate-500 font-bold p-8">正在加載 PDF 檔案...</p>;
            case 'error':
                return (
                    <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
                        <h4 className="font-black text-lg">預覽失敗</h4>
                        <p className="text-sm mt-1">{error.message}</p>
                        <p className="text-xs text-red-400 mt-4 font-mono break-all">{error.details}</p>
                    </div>
                );
            case 'success':
                // When successful, the canvases are already in the container, so we render nothing here.
                return null; 
            default: // Catches 'rendering_page_x'
                return <p className="text-center text-slate-500 font-bold p-8">{`正在渲染第 ${status.split('_')[2]} 頁...`}</p>;
        }
    };
    
    return (
        <div ref={canvasContainerRef} className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[400px] flex items-center justify-center">
            {renderContent()}
        </div>
    );
}
