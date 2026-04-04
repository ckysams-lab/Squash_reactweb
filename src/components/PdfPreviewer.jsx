// src/components/PdfPreviewer.jsx (Version 3.0)

import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

export default function PdfPreviewer({ file }) {
    const canvasContainerRef = useRef(null);

    useEffect(() => {
        if (!file || !canvasContainerRef.current) return;

        const container = canvasContainerRef.current;
        // Clear previous canvases
        container.innerHTML = ''; 

        const fileReader = new FileReader();

        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });

                    const canvas = document.createElement('canvas');
                    canvas.className = 'mb-4 shadow-lg';
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    container.appendChild(canvas);

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                }
            } catch (error) {
                console.error('Error rendering PDF:', error);
                // Optionally display an error message to the user
            }
        };

        fileReader.readAsArrayBuffer(file);

    }, [file]);

    return (
        <div ref={canvasContainerRef} className="pdf-preview-container bg-slate-200 p-8 rounded-lg">
            {!file && <p className="text-center text-slate-500">請上傳 PDF 檔案以開始預覽...</p>}
        </div>
    );
}

