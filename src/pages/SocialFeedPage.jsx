// src/pages/SocialFeedPage.jsx
import React, { useState } from 'react';
import { MessageSquare, Heart, Share2, PlusCircle, User, Zap, Trophy, Megaphone } from 'lucide-react';
import moment from 'moment';

export default function SocialFeedPage({ 
    role, 
    currentUserInfo, 
    feedPosts, 
    setShowCreatePostModal,
    handleLikePost // 我們稍後會在 App.jsx 實作這個功能
}) {
    // 根據貼文類型給予不同的圖示和顏色
    const getPostIcon = (type) => {
        switch(type) {
            case 'achievement': return <Trophy className="text-yellow-500" size={24} />;
            case 'match_result': return <Zap className="text-orange-500" size={24} />;
            case 'announcement': return <Megaphone className="text-blue-500" size={24} />;
            default: return <MessageSquare className="text-slate-400" size={24} />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div>
                    <h3 className="text-3xl font-black text-slate-800">🌐 球隊動態牆</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">追蹤隊友的最新成就與賽事精華</p>
                </div>
                
                {/* 只有教練或已登入的學生可以發文 */}
                {(role === 'admin' || role === 'student') && (
                    <button 
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                    >
                        <PlusCircle size={20} /> 發佈動態
                    </button>
                )}
            </div>

            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                {(!feedPosts || feedPosts.length === 0) ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
                        <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                        <h4 className="text-lg font-black text-slate-500">目前還沒有任何動態</h4>
                        <p className="text-sm text-slate-400">趕快來發佈第一則貼文吧！</p>
                    </div>
                ) : (
                    feedPosts.map(post => {
                        const isLiked = post.likes?.includes(currentUserInfo?.id || 'admin');
                        return (
                            <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                {/* 貼文標頭 */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-inner">
                                            {post.authorPhotoUrl ? (
                                                <img src={post.authorPhotoUrl} alt="author" className="w-full h-full rounded-full object-cover" />
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

                                {/* 貼文內容 */}
                                <div className="mb-4">
                                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    {post.imageUrl && (
                                        <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100">
                                            <img src={post.imageUrl} alt="Post attachment" className="w-full h-auto object-cover max-h-96" />
                                        </div>
                                    )}
                                </div>

                                {/* 貼文互動區 */}
                                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                    <button 
                                        onClick={() => handleLikePost(post.id)}
                                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                                    >
                                        <Heart size={18} className={isLiked ? 'fill-current' : ''} /> 
                                        {post.likes?.length || 0}
                                    </button>
                                    {/* 留言功能未來擴充 */}
                                    <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors">
                                        <MessageSquare size={18} /> 留言
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
