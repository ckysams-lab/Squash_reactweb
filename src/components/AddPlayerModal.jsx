import React, { useState } from 'react';
import { X, UserPlus, Upload } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 我們將 db, appId, storage 當作 props 從外面傳進來
const AddPlayerModal = ({ onClose, db, appId, storage }) => {
    const [newPlayer, setNewPlayer] = useState({
        name: '',
        eng_name: '',
        class: '',
        classNo: '',
        gender: 'M',
        birthday: '',
        photo_url: '',
        squashClass: 'L1',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const storageRef = ref(storage, `student_photos/${appId}/${file.name}_${Date.now()}`);
        
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setNewPlayer(prev => ({ ...prev, photo_url: downloadURL }));
            alert('頭像上傳成功！');
        } catch (error) {
            console.error("Upload failed", error);
            alert('上傳失敗，請重試。');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayer.name || !newPlayer.class || !newPlayer.classNo) {
            alert('姓名、班級和班號為必填項！');
            return;
        }
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), {
                ...newPlayer,
                classNo: parseInt(newPlayer.classNo, 10),
                totalPoints: 0,
                attendance_rate: 100,
                lastUpdated: serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            });
            alert('成功新增隊員！');
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
                <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><UserPlus className="text-blue-500"/> 新增隊員</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed">
                            {newPlayer.photo_url ? (
                                <img src={newPlayer.photo_url} alt="preview" className="w-full h-full object-cover rounded-2xl"/>
                            ) : (
                                <span className="text-slate-400 text-xs text-center font-bold">頭像預覽</span>
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
                                <Upload size={16}/> {isUploading ? '上傳中...' : '選擇圖片'}
                            </button>
                            <p className="text-xs text-slate-400 mt-2">（可選）建議使用正方形頭像</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600">中文姓名</label>
                            <input value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600">英文姓名</label>
                            <input value={newPlayer.eng_name} onChange={e => setNewPlayer({...newPlayer, eng_name: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-bold text-slate-600">班級</label>
                            <input value={newPlayer.class} onChange={e => setNewPlayer({...newPlayer, class: e.target.value})} placeholder="例如: 5A" className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600">班號</label>
                            <input type="number" value={newPlayer.classNo} onChange={e => setNewPlayer({...newPlayer, classNo: e.target.value})} placeholder="例如: 23" className="w-full p-2 mt-1 rounded-lg border outline-none font-bold" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-600">性別</label>
                            <select value={newPlayer.gender} onChange={e => setNewPlayer({...newPlayer, gender: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold bg-white">
                                <option value="M">男 (Male)</option>
                                <option value="F">女 (Female)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-bold text-slate-600">分班</label>
                        <select value={newPlayer.squashClass} onChange={e => setNewPlayer({...newPlayer, squashClass: e.target.value})} className="w-full p-2 mt-1 rounded-lg border outline-none font-bold bg-white">
                            <option value="L1">L1</option>
                            <option value="L2">L2</option>
                            <option value="L3">L3</option>
                            <option value="L4">L4</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button onClick={handleAddPlayer} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-black hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95">
                            確認新增
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPlayerModal;
