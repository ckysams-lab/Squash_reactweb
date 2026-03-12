// src/pages/SettingsPage.jsx (Version 1.1)

import React from 'react';
import { ImageIcon, Trash2, Upload, Plus, History, Save, Trophy, Users, Download } from 'lucide-react'; // 👈 引入新的 Icon
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SettingsPage({
    systemConfig,
    setSystemConfig,
    importEncoding,
    setImportEncoding,
    externalTournaments,
    handleCSVImportExternalTournaments,
    deleteItem,
    handleSeasonReset,
    setIsUpdating,
    db,
    appId,
    handleCSVImportTrophies,
    handleCSVImportAlumni,
    downloadTemplate
}) {
    
    // ... (現有的 handleAddSingleTournament 和 handleSaveSystemConfig 函式保持不變)
    const handleAddSingleTournament = async () => {
        const name = prompt('請輸入單一賽事名稱:'); 
        if (name) {
            try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments'), { 
                    name, 
                    timestamp: serverTimestamp() 
                });
            } catch (e) {
                console.error("Failed to add tournament name:", e);
                alert("新增失敗，請檢查網絡。");
            }
        }
    };
    const handleSaveSystemConfig = async () => {
        setIsUpdating(true); 
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig); 
            alert('系統設定已更新！');
        } catch (e) {
            console.error("Failed to save config:", e);
            alert("儲存失敗。");
        }
        setIsUpdating(false); 
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
            
            {/* 系統偏好設定區塊 (保持不變) */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                {/* ... 此處內容完全不變 ... */}
                <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                <div className="space-y-8">
                    
                    {/* 數據導入編碼 */}
                    <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">數據導入編碼</label>
                        <select 
                            value={importEncoding} 
                            onChange={(e)=>setImportEncoding(e.target.value)} 
                            className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner"
                        >
                            <option value="AUTO">自動偵測 (推薦)</option>
                            <option value="UTF8">萬用編碼 (UTF-8)</option>
                            <option value="BIG5">繁體中文 (BIG5 - Excel 常用)</option>
                        </select>
                    </div>
                    
                    {/* 系統外觀主題 */}
                    <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">系統外觀主題</label>
                        <select 
                            value={systemConfig.theme || 'default'} 
                            onChange={(e) => setSystemConfig({...systemConfig, theme: e.target.value})}
                            className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner"
                            style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-card)' }}
                        >
                            <option value="default">預設 (專業藍)</option>
                            <option value="championship-gold">冠軍金 (黑金)</option>
                            <option value="fresh-green">清新綠 (活力)</option>
                        </select>
                    </div>
                    
                    {/* 學校校徽上傳 */}
                    <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">學校校徽 (School Logo)</label>
                        <div 
                            className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative" 
                            onClick={() => document.getElementById('logoInput').click()}
                        >
                            {systemConfig.schoolLogo ? (
                                <img src={systemConfig.schoolLogo} className="h-32 object-contain" alt="Current Logo"/>
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center">
                                    <ImageIcon size={48} className="mb-2"/>
                                    <span className="text-xs font-bold">點擊上傳校徽圖片</span>
                                </div>
                            )}
                            <input 
                                id="logoInput" 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg" 
                                onChange={(e) => { 
                                    const file = e.target.files[0]; 
                                    if(file) { 
                                        if(file.size > 1024 * 1024) { alert('圖片太大，請使用小於 1MB 的圖片'); return; } 
                                        const reader = new FileReader(); 
                                        reader.onload = (ev) => setSystemConfig({...systemConfig, schoolLogo: ev.target.result}); 
                                        reader.readAsDataURL(file); 
                                    } 
                                }}
                            />
                            {systemConfig.schoolLogo && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setSystemConfig({...systemConfig, schoolLogo: null}); }} 
                                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold px-2">建議使用背景透明的 PNG 圖片，檔案大小請小於 1MB 以確保讀取速度。</p>
                    </div>
                </div>
            </div>

            {/* 校外賽事名稱管理 (保持不變) */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                {/* ... 此處內容完全不變 ... */}
                <h3 className="text-2xl font-black mb-4">校外賽事名稱管理</h3>
                <p className="text-slate-400 mb-8">您可以在此批量匯入官方的賽事名稱，以便在「校外賽管理」頁面中快速選取。</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <label className="flex-1 w-full bg-blue-600 text-white px-10 py-5 rounded-[2rem] cursor-pointer hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                        <Upload size={20}/> 批量匯入賽事名稱 (CSV)
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportExternalTournaments}/>
                    </label>
                    <button 
                        onClick={handleAddSingleTournament} 
                        className="w-full sm:w-auto p-5 bg-slate-50 text-slate-500 border rounded-[2rem] hover:text-blue-600 transition-all flex items-center justify-center gap-2" 
                        title="新增單一賽事"
                    >
                        <Plus size={24}/> 新增單一
                    </button>
                </div>
                
                <div className="mt-8">
                    <h4 className="font-bold text-slate-500 mb-2">目前已匯入的賽事列表:</h4>
                    <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-2xl p-4 space-y-2 border">
                        {externalTournaments.length > 0 ? externalTournaments.map(t => (
                            <div key={t.id} className="flex justify-between items-center bg-white p-2 rounded-lg">
                                <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                                <button onClick={() => deleteItem('external_tournaments', t.id)} className="p-1 text-slate-300 hover:text-red-500">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        )) : <p className="text-sm text-center text-slate-400 p-4">暫無賽事</p>}
                    </div>
                </div>
            </div>

            {/* --- START: Version 1.0 (榮譽殿堂) - 新增匯入區塊 --- */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black mb-4">榮譽殿堂資料管理</h3>
                <p className="text-slate-400 mb-8">請在此處，分別上傳你已準備好的 `trophies.csv` 和 `alumni.csv` 檔案，為「榮譽殿堂」注入靈魂。</p>
                
                {/* 團隊獎項區 */}
                <div className="bg-slate-50/70 p-6 rounded-3xl border mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 w-full bg-amber-500 text-white p-6 rounded-[1.5rem] cursor-pointer hover:bg-amber-600 shadow-lg shadow-amber-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                            <Upload size={20}/>
                            <span className="font-black">匯入團隊獎項 (.csv)</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportTrophies}/>
                        </label>
                        <button 
                            onClick={() => downloadTemplate('trophies')}
                            className="w-full sm:w-auto px-6 py-4 bg-white text-slate-500 border rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-2" 
                            title="下載團隊獎項的 CSV 範本">
                            <Download size={20}/> <span className="font-bold">下載範本</span>
                        </button>
                    </div>
                </div>

                {/* 傳奇校友區 */}
                <div className="bg-slate-50/70 p-6 rounded-3xl border">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 w-full bg-indigo-500 text-white p-6 rounded-[1.5rem] cursor-pointer hover:bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                            <Upload size={20}/>
                            <span className="font-black">匯入傳奇校友 (.csv)</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportAlumni}/>
                        </label>
                        <button 
                            onClick={() => downloadTemplate('alumni')}
                            className="w-full sm:w-auto px-6 py-4 bg-white text-slate-500 border rounded-[1.5rem] hover:bg-slate-100 transition-all flex items-center justify-center gap-2" 
                            title="下載傳奇校友的 CSV 範本">
                            <Download size={20}/> <span className="font-bold">下載範本</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 進階設定 (保持不變) */}
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                {/* ... 此處內容完全不變 ... */}
                <div className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 mb-6">
                    <h4 className="text-orange-600 font-black mb-2 flex items-center gap-2"><History/> 新賽季重置</h4>
                    <p className="text-xs text-slate-400 mb-4">將所有學員積分重置為該章別的起步底分 (金:200, 銀:100...)。</p>
                    <button onClick={handleSeasonReset} className="w-full bg-white text-orange-600 border-2 border-orange-200 py-3 rounded-2xl font-black hover:bg-orange-600 hover:text-white transition-all">
                        重置積分 (開啟新賽季)
                    </button>
                </div>
                <button 
                    onClick={handleSaveSystemConfig} 
                    className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                    <Save size={24}/> 保存設定
                </button>
            </div>
            
            {/* 版權宣告 (保持不變) */}
            <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                Copyright © 2026 正覺壁球. All Rights Reserved.
            </div>
        </div>
    );
}
