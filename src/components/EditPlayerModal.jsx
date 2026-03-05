// 這是包含了「出生日期」和「報名班別」的最終版本
import React, { useState, useEffect } from 'react';
import { X, UserCog, Upload, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const EditPlayerModal = ({ student, onClose, db, appId, compressImage }) => {
    const [playerData, setPlayerData] = useState(student);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setPlayerData(student);
    }, [student]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const compressedBase64 = await compressImage(file, 0.8);
            setPlayerData(prev => ({ ...prev, photo_url: compressedBase64 }));
            alert('新頭像處理成功！');
        } catch (error) {
            console.error("Photo compression failed", error);
            alert('照片處理失敗，請重試。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdatePlayer = async () => {
        if (!playerData.name || !playerData.class) {
            alert('姓名和班別為必填項！');
            return;
        }
        
        try {
            const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id);
            await updateDoc(studentRef, {
                ...playerData,
                lastUpdated: serverTimestamp()
            });
            alert('✅ 成功更新隊員資料！');
            onClose();
        } catch (e) {
            console.error("更新隊員失敗: ", e);
            alert('更新失敗，請檢查網絡連線。');
        }
    };

    return (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24}/></button>
                <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><UserCog className="text-amber-500"/> 編輯隊員資料</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden">
                            {playerData.photo_url ? (
                                <img src={playerData.photo_url} alt={playerData.name} className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-slate-400 text-xs text-center font-bold px-2">尚未上傳</span>
                            )}
                        </div>
                         <div className="flex-1">
                            <label className="text-sm font-bold text-slate-600 mb-2 block">更換隊員頭像</label>
                            <input id="edit-photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                            <button 
                                onClick={() => document.getElementById('edit-photo-upload').click()}
                                disabled={isUploading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>} 
                                {isUploading ? '處理中...' : '選擇新圖片'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-600">姓名</label>
                        <input value={playerData.name} onChange={e => setPlayerData({...playerData, name: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600">班別</label>
                            <input value={playerData.class} onChange={e => setPlayerData({...playerData, class: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold uppercase" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600">班號</label>
                            <input type="number" value={playerData.classNo} onChange={e => setPlayerData({...playerData, classNo: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-bold text-slate-600">出生日期</label>
                        <input type="date" value={playerData.dob || ''} onChange={e => setPlayerData({...playerData, dob: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-600">報名班別</label>
                        <input value={playerData.squashClass || ''} onChange={e => setPlayerData({...playerData, squashClass: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                    </div>

                    <div className="pt-4">
                        <button onClick={handleUpdatePlayer} className="w-full bg-amber-500 text-white px-4 py-3 rounded-xl font-black hover:bg-amber-600 shadow-md transition-all active:scale-95">
                            確認更新
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPlayerModal;
