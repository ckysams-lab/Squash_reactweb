// src/pages/SocialFeedPage.jsx
import React, { useState } from 'react';
import { MessageSquare, Heart, PlusCircle, User, Zap, Trophy, Megaphone, Send } from 'lucide-react';
import moment from 'moment';
// 確保您有設定 moment 的語系為繁體中文，如果沒有，可以在 App.jsx 頂端加上： import 'moment/locale/zh-tw'; moment.locale('zh-tw');

export default function SocialFeedPage({ 
    role, 
    currentUserInfo, 
    feedPosts, 
    setShowCreatePostModal,
    handleLikePost,
    handleAddComment // 👈 接收新函數
}) {
    // 狀態：記錄哪些貼文的留言區被打開了。用 Set 或 Object 都可以，這裡用 Object 存布林值
    const [expandedComments, setExpandedComments] = useState({});
    // 狀態：記錄每個貼文目前正在輸入的留言文字
    const [commentInputs, setCommentInputs] = useState({});

    // 切換留言區展開/收起
    const toggleComments = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // 處理輸入框文字改變
    const handleCommentInputChange = (postId, text) => {
        setCommentInputs(prev => ({
            ...prev,
            [postId]: text
        }));
    };

    // 送出留言
    const submitComment = (e, postId) => {
        e.preventDefault();
        const text = commentInputs[postId];
        if (text && text.trim()) {
            handleAddComment(postId, text);
            // 清空該篇貼文的輸入框
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        }
    };

    const getPostIcon = (type) => {
        switch(type) {
            case 'achievement': return <Trophy className="text-yellow-500" size={24} />;
            case 'match_result': return <Zap className="text-orange-500" size={24} />;
            case 'announcement': return <Megaphone className="text-blue-500" size={24} />;
            default: return <MessageSquare className="text-slate-400" size={24} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div>
                    <h3 className="text-3xl font-black text-slate-800">🌐 球隊動態牆</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">追蹤隊友的最新成就與賽事精華</p>
                </div>
                
                {(role === 'admin' || role === 'student') && (
                    <button 
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                    >
                        <PlusCircle size={20} /> 發佈動態
                    </button>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                {(!feedPosts || feedPosts.length === 0) ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
                        <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                        <h4 className="text-lg font-black text-slate-500">目前還沒有任何動態</h4>
                        <p className="text-sm text-slate-400">趕快來發佈第一則貼文吧！</p>
                    </div>
                ) : (
                    feedPosts.map(post => {
                        const isLiked = post.likes?.includes(currentUserInfo?.id || 'admin');
                        const commentsCount = post.comments?.length || 0;
                        const isExpanded = expandedComments[post.id];

                        return (
                            <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                {/* --- 貼文上半部 (保持不變) --- */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-inner overflow-hidden">
                                            {post.authorPhotoUrl ? (
                                                <img src={post.authorPhotoUrl} alt="author" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-slate-400" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                                {post.authorName}
                                                {post.authorRole === 'admin' && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] rounded-full uppercase tracking-widest">Coach</span>}
                                            </h5>
                                            <p className="text-xs font-bold text-slate-400">
                                                {post.timestamp ? moment(post.timestamp.toDate()).fromNow() : '剛剛'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        {getPostIcon(post.type)}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    {post.imageUrl && (
                                        <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100">
                                            <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto object-cover max-h-96" />
                                        </div>
                                    )}
                                </div>

                                {/* --- 互動按鈕區 --- */}
                                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                    <button 
                                        onClick={() => handleLikePost(post.id)}
                                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                                    >
                                        <Heart size={18} className={isLiked ? 'fill-current' : ''} /> 
                                        {post.likes?.length || 0}
                                    </button>
                                    
                                    {/* 點擊展開/收起留言 */}
                                    <button 
                                        onClick={() => toggleComments(post.id)}
                                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        <MessageSquare size={18} className={isExpanded ? 'fill-blue-100 text-blue-500' : ''}/> 
                                        {commentsCount > 0 ? commentsCount : '留言'}
                                    </button>
                                </div>

                                {/* --- 留言區塊 (展開時才顯示) --- */}
                                {isExpanded && (
                                    <div className="mt-6 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                        
                                        {/* 歷史留言列表 */}
                                        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {(!post.comments || post.comments.length === 0) ? (
                                                <p className="text-sm text-center text-slate-400 py-2">成為第一個留言的人吧！</p>
                                            ) : (
                                                post.comments.map(comment => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                                            {comment.authorPhotoUrl ? (
                                                                <img src={comment.authorPhotoUrl} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400">{comment.authorName?.[0] || 'U'}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow bg-slate-50 rounded-2xl rounded-tl-none p-3">
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <span className="font-bold text-sm text-slate-800">{comment.authorName}</span>
                                                                <span className="text-[10px] text-slate-400">{moment(comment.createdAt).fromNow()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600">{comment.text}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* 留言輸入框 (必須登入才能看到) */}
                                        {(role === 'admin' || role === 'student') ? (
                                            <form onSubmit={(e) => submitComment(e, post.id)} className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                                    placeholder="寫下留言..." 
                                                    className="flex-grow bg-slate-100 border-transparent rounded-full px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={!commentInputs[post.id]?.trim()}
                                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </form>
                                        ) : (
                                            <p className="text-xs text-center text-slate-400 bg-slate-50 py-2 rounded-xl">請登入後發表留言</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
