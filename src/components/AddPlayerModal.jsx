import React, { useState } from 'react';
import { X, UserPlus, Upload, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddPlayerModal = ({ onClose, db, appId, compressImage }) => {
    const [newPlayer, setNewPlayer] = useState({
        name: '',
        class: '',
        classNo: '',
        gender: 'M',
        dob: '',
        photo_url: null,
        squashClass: '初級班',
        badge: '無',
        points: 100
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 使用系統現有的 compressImage 函式轉成 Base64
            const compressedBase64 = await compressImage(file, 0.8);
            setNewPlayer(prev => ({ ...prev, photo_url: compressedBase64 }));
            alert('頭像處理成功！');
        } catch (error) {
            console.error("Photo compression failed", error);
            alert('照片處理失敗，請重試。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayer.name || !newPlayer.class) {
            alert('姓名和班別為必填項！');
            return;
        }
        
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
                name: newPlayer.name,
                class: newPlayer.class.toUpperCase(),
                classNo: newPlayer.classNo || '00',
                gender: newPlayer.gender,
                dob: newPlayer.dob,
                squashClass: newPlayer.squashClass,
                badge: newPlayer.badge,
                points: Number(newPlayer.points) || 100,
                photo_url: newPlayer.photo_url || '',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });
            alert('✅ 成功新增隊員！');
            onClose();
        } catch (e) {
            console.error("新增隊員失敗: ", e);
            alert('新增失敗，請檢查網絡連線。');
        }
    };

    return (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24}/></button>
                <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><UserPlus className="text-blue-500"/> 新增單一隊員</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed overflow-hidden">
                            {newPlayer.photo_url ? (
                                <img src={newPlayer.photo_url} alt="preview" className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-slate-400 text-xs text-center font-bold px-2">尚未上傳</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-bold text-slate-600 mb-2 block">上傳隊員頭像</label>
                            <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                            <button 
                                onClick={() => document.getElementById('photo-upload').click()}
                                disabled={isUploading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>} 
                                {isUploading ? '處理中...' : '選擇圖片'}
                            </button>
                            <p className="text-xs text-slate-400 mt-2">（可選）建議使用正方形照片</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600">姓名 <span className="text-red-500">*</span></label>
                            <input value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" placeholder="例如: 陳大文" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-sm font-bold text-slate-600">班別 <span className="text-red-500">*</span></label>
                            <input value={newPlayer.class} onChange={e => setNewPlayer({...newPlayer, class: e.target.value})} placeholder="例如: 6A" className="w-full p-2 mt-1 rounded-lg border outline-none font-bold uppercase" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-sm font-bold text-slate-600">班號</label>
                            <input type="number" value={newPlayer.classNo} onChange={e => setNewPlayer({...newPlayer, classNo: e.target.value})} placeholder="例如: 01" className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600">性別</label>
                            <select value={newPlayer.gender} onChange={e => setNewPlayer({...newPlayer, gender: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold bg-white">
                                <option value="M">男</option>
                                <option value="F">女</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600">出生日期 (可選)</label>
                            <input type="date" value={newPlayer.dob} onChange={e => setNewPlayer({...newPlayer, dob: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-600">報名班別</label>
                        <input value={newPlayer.squashClass} onChange={e => setNewPlayer({...newPlayer, squashClass: e.target.value})} placeholder="例如: 進階班" className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                    </div>

                    <div className="pt-4">
                        <button onClick={handleAddPlayer} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-black hover:bg-blue-700 shadow-md transition-all active:scale-95">
                            確認新增隊員
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPlayerModal;

