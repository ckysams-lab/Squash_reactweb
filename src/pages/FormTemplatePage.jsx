// src/pages/FormTemplatePage.jsx (Version 3.0 - Initial Setup)

import React from 'react';
import { FilePenLine, Upload, MousePointerClick, FileDown } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function FormTemplatePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-5xl mx-auto">
            
            <PageHeader 
                title="智慧報名表系統" 
                subtitle="上傳PDF、標記欄位、一鍵生成，徹底告別手動填表" 
                icon={FilePenLine} 
            />

            <Card>
                <div className="text-center">
                    <h3 className="text-2xl font-black text-slate-800 mb-4">歡迎來到「Project 'AutoForm'」</h3>
                    <p className="text-slate-500 max-w-2xl mx-auto mb-8">
                        這將是您處理比賽報名的革命性工具。我們將分階段實現這個強大的功能，讓您從此告別繁瑣的重複工作。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left my-12">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <Upload className="text-blue-500 mb-3" />
                            <h4 className="font-black">第一步：上傳</h4>
                            <p className="text-xs text-slate-500 font-normal mt-1">上傳任何比賽的空白PDF報名表。</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <MousePointerClick className="text-yellow-500 mb-3" />
                            <h4 className="font-black">第二步：標記</h4>
                            <p className="text-xs text-slate-500 font-normal mt-1">在PDF預覽圖上點擊，並指定每個位置對應的學生資料欄位。</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <FileDown className="text-emerald-500 mb-3" />
                            <h4 className="font-black">第三步：生成</h4>
                            <p className="text-xs text-slate-500 font-normal mt-1">勾選參賽學生，一鍵生成所有填好的PDF並打包下載。</p>
                        </div>
                    </div>

                    <PrimaryButton className="w-full md:w-auto px-10">
                        ➕ 創建新範本 (開發中...)
                    </PrimaryButton>
                </div>
            </Card>

        </div>
    );
}
