// src/pages/SocialFeedPage.jsx (Version 3.8 - UI Standardized)

import React from 'react';
import { MessageSquare, PlusCircle, Heart, MessageCircle } from 'lucide-react';
import { PageHeader, Card, PrimaryButton } from '../components/ui.jsx';

export default function SocialFeedPage({
    role,
    currentUserInfo,
    feedPosts,
    setShowCreatePostModal,
    handleLikePost,
    handleAddComment
}) {
    // 取得當前使用者的 ID (用來判斷是否已按讚)
    const currentUserId = role === 'admin' ? 'admin' : currentUserInfo?.id;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-bold max-w-3xl mx-auto">
            
            <PageHeader 
                title="球隊動態牆" 
                subtitle="分享訓練點滴與最新公告" 
                icon={MessageSquare} 
            />

            {/* 發佈動態的入口區塊 */}
            {(role === 'admin' || role === 'student') && (
                <Card className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-black text-slate-400 shrink-0">
                        {role === 'admin' ? '教' : currentUserInfo?.name?.[0] || '?'}
                    </div>
                    <button 
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex-1 w-full bg-slate-50 border border-slate-200 text-slate-400 text-left px-6 py-4 rounded-full font-bold hover:bg-slate-100 hover:border-slate-300 transition-all"
                    >
                        分享今天的訓練心得...
                    </button>
                    <PrimaryButton 
                        icon={PlusCircle} 
                        onClick={() => setShowCreatePostModal(true)}
                        className="w-full sm:w-auto px-6 py-3 rounded-full"
                    >
                        發佈
                    </PrimaryButton>
                </Card>
            )}

            {/* 貼文列表 */}
            <div className="space-y-8">
                {feedPosts.length === 0 ? (
                    <div className="text-center p-12 text-slate-400 bg-white rounded-3xl border border-dashed">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p>目前還沒有任何動態，來搶頭香發佈第一篇吧！</p>
                    </div>
                ) : (
                    feedPosts.map(post => {
                        const isLikedByMe = post.likes && post.likes.includes(currentUserId);
                        const likeCount = post.likes ? post.likes.length : 0;
                        const commentCount = post.comments ? post.comments.length : 0;

                        return (
                            <Card key={post.id} className="p-6 md:p-8" noPadding={false}>
                                {/* 作者資訊 */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-black text-slate-400 shadow-inner">
                                        {post.authorPhotoUrl ? (
                                            <img src={post.authorPhotoUrl} alt="author" className="w-full h-full rounded-full object-cover"/>
                                        ) : (
                                            post.authorName?.[0] || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                            {post.authorName}
                                            {post.authorRole === 'admin' && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wider">教練</span>}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-400">
                                            {new Date(post.createdAt || post.timestamp?.toDate()).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* 貼文內容 */}
                                <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap mb-6 text-lg">
                                    {post.content}
                                </div>

                                {/* 貼文附圖 (如果有的話) */}
                                {post.imageUrl && (
                                    <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm max-h-[500px]">
                                        <img src={post.imageUrl} alt="Post attachment" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {/* 互動按鈕區 (按讚與留言統計) */}
                                <div className="flex items-center gap-6 border-t border-slate-100 pt-4 mt-2">
                                    <button 
                                        onClick={() => handleLikePost(post.id)}
                                        className={`flex items-center gap-2 font-bold transition-all ${isLikedByMe ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                                    >
                                        <Heart size={20} fill={isLikedByMe ? "currentColor" : "none"} className={isLikedByMe ? 'scale-110' : ''} />
                                        <span>{likeCount}</span>
                                    </button>
                                    <div className="flex items-center gap-2 font-bold text-slate-400">
                                        <MessageCircle size={20} />
                                        <span>{commentCount}</span>
                                    </div>
                                </div>

                                {/* 留言區 */}
                                <div className="mt-6 space-y-4 bg-slate-50 p-4 rounded-2xl">
                                    {post.comments && post.comments.length > 0 ? (
                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                                            {post.comments.map(comment => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-black text-slate-400 shrink-0 shadow-sm">
                                                        {comment.authorName?.[0]}
                                                    </div>
                                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex-1 border border-slate-100">
                                                        <div className="flex items-baseline gap-2 mb-1">
                                                            <span className="font-bold text-slate-800 text-sm">{comment.authorName}</span>
                                                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">{comment.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-center text-slate-400 py-2">成為第一個留言的人吧！</p>
                                    )}
                                    
                                    {/* 輸入新留言 */}
                                    {(role === 'admin' || role === 'student') && (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="寫下留言..." 
                                                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-bold outline-none focus:border-blue-400 transition-colors"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        handleAddComment(post.id, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
