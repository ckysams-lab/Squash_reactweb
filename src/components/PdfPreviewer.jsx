// src/components/PdfPreviewer.jsx (Version 3.4 - Final Fix using a Static, Verified CDN Worker)

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// --- v3.4 FIX: Use a static, verified, and known-good CDN URL for the worker. ---
// This eliminates all pathing and versioning guesswork.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function PdfPreviewer({ file, onRenderSuccess }) {
    const canvasContainerRef = useRef(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

    useEffect(() => {
        if (!file || !canvasContainerRef.current) return;

        setError(null);
        setStatus('loading');
        
        const container = canvasContainerRef.current;
        container.innerHTML = ''; 

        const renderPdf = async () => {
            try {
                const fileReader = new FileReader();
                const buffer = await new Promise((resolve, reject) => {
                    fileReader.onload = () => resolve(fileReader.result);
                    fileReader.onerror = () => reject(fileReader.error);
                    fileReader.readAsArrayBuffer(file);
                });

                const typedarray = new Uint8Array(buffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                const canvases = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    setStatus(`rendering_page_${i}`);
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: window.devicePixelRatio || 2 });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.width = '100%';
                    canvas.style.height = 'auto';
                    canvas.className = 'mb-4 shadow-lg';
                    
                    container.appendChild(canvas);
                    canvases.push(canvas);

                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                }
                
                setStatus('success');
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
                } else if (err.message.includes('Failed to fetch')) {
                    userFriendlyError = '錯誤：無法從網路加載 PDF 渲染引擎，請檢查您的網路連線。';
                }
                setError({ message: userFriendlyError, details: err.toString() });
                setStatus('error');
            }
        };

        renderPdf();

    }, [file, onRenderSuccess]);

    // UI Rendering Logic based on status
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
                return null; // Canvases are already in the container
            default: // For rendering_page_x
                return <p className="text-center text-slate-500 font-bold p-8">{`正在渲染第 ${status.split('_')[2]} 頁...`}</p>;
        }
    };
    
    return (
        <div ref={canvasContainerRef} className="pdf-preview-container bg-slate-200 p-4 md:p-8 rounded-lg min-h-[400px] flex items-center justify-center">
            {renderContent()}
        </div>
    );
}
