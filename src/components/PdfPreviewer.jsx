// src/components/PdfPreviewer.jsx (Version 3.3 - The Correct Solution)

import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// --- v3.3 FIX: Use a reliable public CDN for the worker source ---
// This is the correct approach. It tells the browser to fetch the worker
// from a public server, completely bypassing the need for local files.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const canvasContainerRef = useRef(null);

    useEffect(() => {
        if (!file || !canvasContainerRef.current) return;

        const container = canvasContainerRef.current;
        container.innerHTML = ''; // Clear previous canvases

        // Display a loading message while the PDF is being processed
        const loadingIndicator = document.createElement('p');
        loadingIndicator.textContent = '正在加載 PDF 預覽，請稍候...';
        loadingIndicator.className = 'text-center text-slate-500 font-bold p-8';
        container.appendChild(loadingIndicator);

        const fileReader = new FileReader();

        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                container.innerHTML = ''; // Clear the loading indicator

                const canvases = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    // Use device pixel ratio for sharper rendering on high-DPI screens
                    const viewport = page.getViewport({ scale: window.devicePixelRatio || 2 });

                    const canvas = document.createElement('canvas');
                    canvas.className = 'mb-4 shadow-lg w-full h-auto';
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Style canvas to ensure it's responsive and fits the container
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';

                    container.appendChild(canvas);
                    canvases.push(canvas);

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                }
                
                if (onRenderSuccess) {
                    onRenderSuccess(canvases);
                }

            } catch (error) {
                console.error('Error rendering PDF:', error);
                container.innerHTML = '<p class="text-center text-red-500 font-bold p-8">PDF 預覽失敗。檔案可能已損壞或格式不兼容。請檢查瀏覽器控制台的錯誤訊息。</p>';
            }
        };

        fileReader.readAsArrayBuffer(file);

    }, [file, onRenderSuccess]);

    return (
        <div ref={canvasContainerRef} className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[300px]">
            {!file && <p className="text-center text-slate-500 p-8">請上傳 PDF 檔案以開始預覽...</p>}
        </div>
    );
}
