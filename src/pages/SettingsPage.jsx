// src/pages/SettingsPage.jsx (Version 3.0 - UI Standardized)

import React from 'react';
import { ImageIcon, Trash2, Upload, Plus, History, Save, Settings2 } from 'lucide-react';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import TemplateDownloader from '../components/TemplateDownloader';

// 👇 引入我們的 UI 元件庫
import { PageHeader, Card, PrimaryButton, SecondaryButton, DangerButton } from '../components/ui';

export default function SettingsPage({
    systemConfig, setSystemConfig, importEncoding, setImportEncoding,
    externalTournaments, handleCSVImportExternalTournaments, deleteItem,
    handleSeasonReset, setIsUpdating, db, appId, handleCSVImportTrophies, handleCSVImportAlumni
}) {
    
    const handleAddSingleTournament = async () => { /* ... 內容不變 ... */ 
        const name = prompt('請輸入單一賽事名稱:'); 
        if (name) {
            try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments'), { name, timestamp: serverTimestamp() }); } 
            catch (e) { console.error(e); alert("新增失敗"); }
        }
    };
    
    const handleSaveSystemConfig = async () => { /* ... 內容不變 ... */ 
        setIsUpdating(true); 
        try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig); alert('系統設定已更新！'); } 
        catch (e) { console.error(e); alert("儲存失敗。"); }
        setIsUpdating(false); 
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 使用統一的 PageHeader */}
            <PageHeader 
                title="系統核心設定" 
                subtitle="管理偏好、匯入資料與賽季重置" 
                icon={Settings2} 
            />

            {/* 區塊 1: 系統偏好設定 */}
            <Card>
                <h3 className="text-2xl font-black mb-8 text-slate-800 border-b pb-4">基本偏好</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">數據導入編碼</label>
                        <select value={importEncoding} onChange={(e)=>setImportEncoding(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none font-bold focus:border-blue-500 transition-all">
                            <option value="AUTO">自動偵測 (推薦)</option>
                            <option value="UTF8">萬用編碼 (UTF-8)</option>
                            <option value="BIG5">繁體中文 (BIG5)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">系統外觀主題</label>
                        <select value={systemConfig.theme || 'default'} onChange={(e) => setSystemConfig({...systemConfig, theme: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none font-bold focus:border-blue-500 transition-all">
                            <option value="default">預設 (專業藍)</option>
                            <option value="championship-gold">冠軍金 (黑金)</option>
                            <option value="fresh-green">清新綠 (活力)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">學校校徽 (School Logo)</label>
                        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative" onClick={() => document.getElementById('logoInput').click()}>
                            {systemConfig.schoolLogo ? (
                                <img src={systemConfig.schoolLogo} className="h-24 object-contain" alt="Current Logo"/>
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center"><ImageIcon size={32} className="mb-2"/><span className="text-sm font-bold">點擊上傳</span></div>
                            )}
                            <input id="logoInput" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => { const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = (ev) => setSystemConfig({...systemConfig, schoolLogo: ev.target.result}); reader.readAsDataURL(file); } }}/>
                            {systemConfig.schoolLogo && (
                                <button onClick={(e) => { e.stopPropagation(); setSystemConfig({...systemConfig, schoolLogo: null}); }} className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* 區塊 2: 榮譽殿堂資料管理 */}
            <Card>
                <h3 className="text-2xl font-black mb-2 text-slate-800">榮譽殿堂資料</h3>
                <p className="text-slate-400 text-sm mb-8 border-b pb-4">上傳 `trophies.csv` 和 `alumni.csv` 來更新殿堂內容。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                        <h4 className="font-bold text-slate-700">團隊獎項</h4>
                        <label className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white p-4 rounded-xl cursor-pointer hover:bg-amber-600 transition-all font-bold shadow-md active:scale-95">
                            <Upload size={18}/> 匯入 (.csv)
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportTrophies}/>
                        </label>
                        <TemplateDownloader type="trophies" />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                         <h4 className="font-bold text-slate-700">傳奇校友</h4>
                        <label className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white p-4 rounded-xl cursor-pointer hover:bg-indigo-600 transition-all font-bold shadow-md active:scale-95">
                            <Upload size={18}/> 匯入 (.csv)
                            <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportAlumni}/>
                        </label>
                        <TemplateDownloader type="alumni" />
                    </div>
                </div>
            </Card>

            {/* 區塊 3: 賽事名稱管理 */}
            <Card>
                <h3 className="text-2xl font-black mb-2 text-slate-800">校外賽事名單</h3>
                <p className="text-slate-400 text-sm mb-8 border-b pb-4">批量或單一新增賽事名稱，供錄入成績時選擇。</p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* 注意：這裡我們暫時保留原生寫法，因為它包含 file input */}
                    <label className="flex-1 w-full bg-slate-800 text-white px-6 py-4 rounded-2xl cursor-pointer hover:bg-slate-700 shadow-md flex items-center justify-center gap-2 transition-all font-bold active:scale-95">
                        <Upload size={18}/> 批量匯入 (CSV)
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportExternalTournaments}/>
                    </label>
                    <SecondaryButton icon={Plus} onClick={handleAddSingleTournament}>
                        新增單一
                    </SecondaryButton>
                </div>
                
                <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-2 border border-slate-100">
                    {externalTournaments.length > 0 ? externalTournaments.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 hover:bg-white rounded-lg transition-colors group">
                            <span className="text-sm font-bold text-slate-600">{t.name}</span>
                            <button onClick={() => deleteItem('external_tournaments', t.id)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    )) : <p className="text-sm text-center text-slate-400 p-4">暫無賽事</p>}
                </div>
            </Card>

            {/* 區塊 4: 底部操作列 */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
                 <DangerButton icon={History} onClick={handleSeasonReset} className="w-full md:w-auto">
                    重置積分 (新賽季)
                </DangerButton>
                
                {/* 使用統一的 PrimaryButton */}
                <PrimaryButton icon={Save} onClick={handleSaveSystemConfig} className="w-full md:w-auto md:px-16 text-lg">
                    保存所有設定
                </PrimaryButton>
            </div>
            
        </div>
    );
}
