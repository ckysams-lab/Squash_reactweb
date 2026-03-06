// src/components/AddAwardModal.jsx
import React, { useState } from 'react';
import { X, ImageIcon, Save, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddAwardModal({ onClose, db, appId, compressImage }) {
  // 將原本在 App.jsx 的狀態移到這裡，變成 Modal 專屬的局部狀態
  const [isUpdating, setIsUpdating] = useState(false);
  const [awardPhotoPreview, setAwardPhotoPreview] = useState(null);
  const [newAwardData, setNewAwardData] = useState({
    title: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    rank: '',
    description: '',
    photoUrl: null,
  });

  const handleAwardPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const compressedUrl = await compressImage(file, 0.8);
      setNewAwardData(prev => ({ ...prev, photoUrl: compressedUrl }));
      setAwardPhotoPreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("Award photo upload failed:", err);
      alert("照片上傳或壓縮失敗。");
    }
    setIsUpdating(false);
  };

  const handleSaveAward = async () => {
    const { title, studentName, date, rank } = newAwardData;
    if (!title || !studentName || !date || !rank) {
      alert("請填寫所有必填欄位：獎項名稱、名次、獲獎學生和日期。");
      return;
    }
    setIsUpdating(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'awards'), {
        ...newAwardData,
        timestamp: serverTimestamp()
      });
      alert('🏆 獎項新增成功！');
      onClose(); // 儲存成功後自動關閉 Modal
    } catch (e) {
      console.error("Failed to save award:", e);
      alert('新增失敗，請檢查網絡連線。');
    }
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
        <h3 className="text-3xl font-black text-slate-800 mb-8">新增輝煌成就</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {/* 圖片上傳區 */}
          <div className="md:col-span-1">
            <label className="text-sm font-bold text-slate-500 mb-2 block">得獎照片</label>
            <div 
              className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all cursor-pointer"
              onClick={() => document.getElementById('awardPhotoInput').click()}
            >
              {awardPhotoPreview ? (
                <img src={awardPhotoPreview} alt="Award Preview" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={40} />
                  <p className="text-xs font-bold mt-2">點擊上傳照片</p>
                </div>
              )}
            </div>
            <input 
              id="awardPhotoInput"
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleAwardPhotoUpload}
            />
          </div>

          {/* 表單輸入區 */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">獎項名稱</label>
              <input type="text" placeholder="例如：全港學界壁球賽" value={newAwardData.title} onChange={e => setNewAwardData({...newAwardData, title: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">名次</label>
              <input type="text" placeholder="例如：冠軍" value={newAwardData.rank} onChange={e => setNewAwardData({...newAwardData, rank: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">獲獎學生</label>
              <input type="text" placeholder="輸入學生姓名" value={newAwardData.studentName} onChange={e => setNewAwardData({...newAwardData, studentName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
            </div>
          </div>

          <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1">獲獎日期</label>
              <input type="date" value={newAwardData.date} onChange={e => setNewAwardData({...newAwardData, date: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
          </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1">備註 (可選)</label>
              <textarea placeholder="可輸入比賽地點、主辦單位等資訊" value={newAwardData.description} onChange={e => setNewAwardData({...newAwardData, description: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500 h-20"></textarea>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
            <button onClick={handleSaveAward} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-yellow-500 text-white rounded-2xl shadow-xl shadow-yellow-100 hover:bg-yellow-600 transition-all font-black disabled:opacity-50">
                {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存獎項
            </button>
        </div>
      </div>
    </div>
  );
}
