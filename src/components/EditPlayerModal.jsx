// src/components/EditPlayerModal.jsx (Version 1.2 - 整合密碼設定)

import React, { useState, useEffect } from 'react';
import { X, UserCog, Upload, Loader2, Trophy as TrophyIcon, Key, ShieldCheck } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// 引入共用 UI 元件 (讓外觀保持一致)
import { PrimaryButton, SecondaryButton } from './ui'; 

export default function EditPlayerModal({ 
    student, 
    onClose, 
    db, 
    appId, 
    compressImage,
    handleSetupStudentAuth // 👈 接收來自 App.jsx 的函式
}) {
    const [playerData, setPlayerData] = useState(student);
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // 👇 新增：用來暫存教練輸入的新密碼
    const [newPassword, setNewPassword] = useState(''); 

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
            alert('新頭像處理成功！請記得點擊最下方的「確認更新」來儲存。');
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
        setIsUpdating(true);
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
        setIsUpdating(false);
    };

    // 👇 新增：處理在彈跳視窗內設定密碼的邏輯
    const handlePasswordSetup = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("密碼無效或太短 (最少需要 6 位數)！");
            return;
        }
        // 為了不更動 App.jsx 裡複雜的 Firebase Auth 邏輯，
        // 我們用一個小技巧，覆寫 window.prompt，讓它直接回傳我們在這裡輸入的密碼，
        // 然後再去呼叫 App.jsx 傳進來的 handleSetupStudentAuth 函式。
        const originalPrompt = window.prompt;
        window.prompt = () => newPassword; 
        
        await handleSetupStudentAuth(student);
        
        window.prompt = originalPrompt; // 恢復原本的 prompt 行為
        setNewPassword(''); // 清空輸入框
    };


    return (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[3rem]">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <UserCog className="text-blue-600"/> 編輯隊員檔案
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-all"><X size={24}/></button>
                </div>
                
                {/* 捲動內容區 */}
                <div className="p-8 overflow-y-auto space-y-8">
                    
                    {/* 區塊 1: 頭像與基本資料 */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-md overflow-hidden shrink-0">
                                {playerData.photo_url ? (
                                    <img src={playerData.photo_url} alt={playerData.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <span className="text-slate-400 text-3xl font-black">{playerData.name?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-widest">個人頭像</label>
                                <input id="edit-photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                                <SecondaryButton 
                                    onClick={() => document.getElementById('edit-photo-upload').click()}
                                    disabled={isUploading}
                                    icon={isUploading ? Loader2 : Upload}
                                    className="w-full py-3"
                                >
                                    {isUploading ? '處理中...' : '選擇新照片'}
                                </SecondaryButton>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-widest">姓名</label>
                            <input value={playerData.name} onChange={e => setPlayerData({...playerData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold text-lg focus:border-blue-500 transition-all" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-widest">班別</label>
                                <input value={playerData.class} onChange={e => setPlayerData({...playerData, class: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold text-lg uppercase focus:border-blue-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-widest">班號</label>
                                <input type="number" value={playerData.classNo} onChange={e => setPlayerData({...playerData, classNo: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold text-lg focus:border-blue-500 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* 區塊 2: 壁球專屬資料 */}
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-widest">出生日期</label>
                                <input type="date" value={playerData.dob || ''} onChange={e => setPlayerData({...playerData, dob: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold focus:border-blue-500 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-widest flex items-center gap-1"><TrophyIcon size={12}/> 目前章別</label>
                                <select
                                    value={playerData.badge || ''}
                                    onChange={e => setPlayerData({...playerData, badge: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold appearance-none cursor-pointer focus:border-blue-500 transition-all"
                                >
                                    <option value="無">無</option>
                                    <option value="銅章">銅章</option>
                                    <option value="銀章">銀章</option>
                                    <option value="金章">金章</option>
                                    <option value="白金章">白金章</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* 👇 區塊 3: 帳號與安全 (全新加入) 👇 */}
                    <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <ShieldCheck size={20} />
                            <h4 className="font-black text-lg">帳號與安全</h4>
                        </div>
                        <p className="text-xs font-bold text-slate-500">
                            登入帳號將自動設為：<span className="text-blue-600">{student.class.toLowerCase()}{student.classNo}@bcklas.squash</span>
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="輸入新密碼 (最少 6 碼)" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                            <button 
                                onClick={handlePasswordSetup}
                                className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-md text-sm whitespace-nowrap"
                            >
                                建立/重設
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer 按鈕 */}
                <div className="p-8 border-t border-slate-100 bg-slate-50 rounded-b-[3rem]">
                    <PrimaryButton 
                        onClick={handleUpdatePlayer} 
                        loading={isUpdating}
                        className="w-full text-lg"
                    >
                        儲存所有變更
                    </PrimaryButton>
                </div>

            </div>
        </div>
    );
}
