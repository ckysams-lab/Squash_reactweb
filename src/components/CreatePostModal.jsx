// src/components/CreatePostModal.jsx
import React, { useState } from 'react';
import { X, Image as ImageIcon, Send } from 'lucide-react';
import { db } from '../firebase'; // 確保能連線到資料庫
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toDataURL, compressImage } from '../utils/helpers'; // 引入我們之前做的工具

export default function CreatePostModal({ onClose, currentUserInfo, role, appId }) {
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 處理圖片選擇與預覽
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const compressedDataUrl = await compressImage(file, 0.7);
            setImagePreview(compressedDataUrl);
        }
    };

    // 處理表單送出
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imagePreview) return; // 不能發空文

        setIsSubmitting(true);
        try {
            // 準備寫入資料庫的物件
            const newPost = {
                type: 'user_post', // 標記這是一般使用者的貼文
                content: content.trim(),
                imageUrl: imagePreview || null, // 如果有圖片就存 Base64，否則存 null
                authorId: currentUserInfo?.id || 'admin',
                authorName: currentUserInfo?.name || '系統管理員',
                authorRole: role,
                authorPhotoUrl: currentUserInfo?.photoUrl || null,
                timestamp: serverTimestamp(), // 讓 Firebase 伺服器決定時間
                likes: [], // 按讚的人的 ID 陣列
                comments: [] // 預留留言功能
            };

            // 寫入 Firestore 的 feed_posts 集合中
            const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'feed_posts');
            await addDoc(postsRef, newPost);

            // 發布成功後關閉視窗
            onClose();
        } catch (error) {
            console.error("發佈動態失敗:", error);
            alert("發佈失敗，請稍後再試。");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* 視窗標題 */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-800">建立新動態</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* 發文表單 */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            {currentUserInfo?.photoUrl ? (
                                <img src={currentUserInfo.photoUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="font-bold text-blue-600">{currentUserInfo?.name?.[0] || 'A'}</span>
                            )}
                        </div>
                        <div className="flex-grow">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="和球隊分享些什麼吧？"
                                className="w-full h-32 bg-transparent resize-none outline-none text-lg placeholder:text-slate-300 font-medium"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* 圖片預覽區 */}
                    {imagePreview && (
                        <div className="relative mb-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                            <button 
                                type="button"
                                onClick={() => { setImageFile(null); setImagePreview(''); }}
                                className="absolute top-2 right-2 p-1.5 bg-slate-900/50 text-white rounded-full hover:bg-slate-900 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                        </div>
                    )}

                    {/* 底部工具列與發佈按鈕 */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                            <input 
                                type="file" 
                                id="post-image-upload" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageChange} 
                            />
                            <label 
                                htmlFor="post-image-upload" 
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
                            >
                                <ImageIcon size={18} /> 加入相片
                            </label>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={isSubmitting || (!content.trim() && !imagePreview)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? '發佈中...' : <><Send size={18} /> 發佈</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
