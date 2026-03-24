// src/pages/GalleryPage.jsx (Version 3.8 - UI Standardized & Blur Background)

import React from 'react';
import { ArrowLeft, ImageIcon, Folder, PlusCircle, Video, ChevronRight, Trash2, Loader2, CloudDownload } from 'lucide-react';

// 👇 引入共用 UI 元件
import { PageHeader, Card, PrimaryButton, SecondaryButton } from '../components/ui.jsx';

export default function GalleryPage({
    role,
    currentAlbum,
    setCurrentAlbum,
    isUploading,
    isSyncingDrive,
    syncGoogleDriveGallery,
    handleAddMedia,
    galleryAlbums,
    setViewingImage,
    getYouTubeEmbedUrl,
    deleteItem
}) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-bold max-w-6xl mx-auto">
            
            {/* 頂部標題與返回按鈕 */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    {currentAlbum && (
                        <button 
                            onClick={() => setCurrentAlbum(null)} 
                            className="p-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 rounded-2xl transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={24}/>
                        </button>
                    )}
                    <PageHeader 
                        title={currentAlbum ? currentAlbum : "精彩花絮"} 
                        subtitle={currentAlbum ? "瀏覽相簿內容" : "回顧訓練與比賽的珍貴時刻"} 
                        icon={ImageIcon} 
                    />
                </div>
                
                {/* 教練專屬操作區 */}
                {role === 'admin' && (
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                        {isUploading && <span className="text-xs text-blue-600 animate-pulse font-bold px-3">處理中...</span>}
                        
                        <SecondaryButton 
                            icon={CloudDownload} 
                            onClick={syncGoogleDriveGallery} 
                            disabled={isSyncingDrive}
                            className="py-3 px-5 text-sm"
                        >
                            {isSyncingDrive ? '同步中...' : 'Drive 同步'}
                        </SecondaryButton>
                        
                        <PrimaryButton 
                            icon={PlusCircle} 
                            onClick={handleAddMedia} 
                            disabled={isUploading}
                            className="py-3 px-6 text-sm bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                        >
                            新增媒體
                        </PrimaryButton>
                    </div>
                )}
            </div>

            {/* 相簿內容顯示區 */}
            {galleryAlbums.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 bg-slate-50/50">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-200 shadow-sm mb-6">
                        <ImageIcon size={48} />
                    </div>
                    <p className="text-xl font-black text-slate-500">目前暫無花絮內容</p>
                    {role === 'admin' && <p className="text-sm text-slate-400 mt-2">點擊右上角的「新增」或「同步」開始建立相簿</p>}
                </Card>
            ) : (
                <>
                    {/* 1. 顯示所有相簿封面 (未點進去時) */}
                    {!currentAlbum && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {galleryAlbums.map((album) => (
                                <div key={album.title} onClick={() => setCurrentAlbum(album.title)} className="group bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">
                                    <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-4 border border-slate-100">
                                        {album.cover ? (
                                            album.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white"><Video size={48} className="opacity-50 group-hover:scale-110 transition-transform"/></div>
                                            ) : (
                                                // 👇 修正 1：相簿封面的防裁切毛玻璃排版 👇
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    {/* 背景模糊層 */}
                                                    <img src={album.cover} className="absolute inset-0 w-full h-full object-cover blur-md opacity-50 scale-125" alt="blur-bg"/>
                                                    {/* 前景完整圖片 */}
                                                    <img src={album.cover} className="relative z-10 w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-700" alt="Cover"/>
                                                </div>
                                            )
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><Folder size={48} className="group-hover:text-blue-400 transition-colors"/></div>
                                        )}
                                        
                                        {/* 項目數量標籤 */}
                                        <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md border border-white/20 z-20">
                                            {album.count} 項目
                                        </div>
                                        
                                        {/* 來源標籤 */}
                                        {album.isDrive && (
                                            <div className="absolute top-3 left-3 bg-blue-500/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-md flex items-center gap-1 backdrop-blur-sm z-20">
                                                <CloudDownload size={12}/> DRIVE
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-2 flex-1 flex flex-col justify-between">
                                        <h4 className="font-black text-lg text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{album.title}</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-2 flex items-center justify-between">
                                            <span>點擊查看</span> 
                                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. 點進相簿後，顯示該相簿內的所有照片/影片 */}
                    {currentAlbum && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {(galleryAlbums.find(a => a.title === currentAlbum)?.items || []).map(item => (
                                <div key={item.id} className="group bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col">
                                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 mb-3 cursor-zoom-in" onClick={() => item.type !== 'video' && setViewingImage(item)}>
                                        {item.type === 'video' ? (
                                            getYouTubeEmbedUrl(item.url) ? (
                                                <iframe src={getYouTubeEmbedUrl(item.url)} className="w-full h-full relative z-10" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={item.title}/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-800 relative z-10"><Video size={32}/><span className="ml-2 text-xs">連結無效</span></div>
                                            )
                                        ) : (
                                            // 👇 修正 2：相簿內頁照片的防裁切毛玻璃排版 👇
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                {/* 背景模糊層 */}
                                                <img src={item.url} className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-125" alt="blur-bg" />
                                                {/* 前景完整圖片 */}
                                                <img src={item.url} alt={item.description || "照片"} className="relative z-10 w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        
                                        {/* 媒體類型標籤 */}
                                        <div className="absolute top-2 right-2 bg-black/50 text-white backdrop-blur-md p-1.5 rounded-lg pointer-events-none z-20">
                                            {item.type === 'video' ? <Video size={14}/> : <ImageIcon size={14}/>}
                                        </div>
                                    </div>
                                    
                                    <div className="px-2 pb-1 flex-1 flex flex-col justify-between gap-2">
                                        <p className="text-xs text-slate-600 font-semibold line-clamp-2 leading-relaxed">
                                            {item.description || "無描述"}
                                        </p>
                                        
                                        {role === 'admin' && !galleryAlbums.find(a => a.title === currentAlbum)?.isDrive && (
                                            <div className="flex justify-end pt-2 border-t border-slate-50 mt-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => deleteItem('gallery', item.id)} className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-lg transition-colors" title="刪除檔案">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
                {role === 'admin' && (
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                        {isUploading && <span className="text-xs text-blue-600 animate-pulse font-bold mr-2">上傳壓縮中...</span>}
                        
                        <button onClick={syncGoogleDriveGallery} disabled={isSyncingDrive} className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-600 hover:text-white shadow-sm transition-all font-black text-sm disabled:opacity-50">
                            {isSyncingDrive ? <Loader2 className="animate-spin" size={18}/> : <Folder size={18}/>} 
                            Drive 同步
                        </button>
                        
                        <button onClick={handleAddMedia} disabled={isUploading} className="bg-orange-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 cursor-pointer hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all font-black text-sm disabled:opacity-50">
                            <PlusCircle size={18}/> 新增
                        </button>
                    </div>
                )}
            </div>

            {/* 相簿內容顯示區 */}
            {galleryAlbums.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><ImageIcon size={40}/></div>
                    <p className="text-xl font-black text-slate-400">目前暫無花絮內容</p>
                    <p className="text-sm text-slate-300 mt-2">請教練新增精彩相片，或點擊上方從 Google Drive 同步</p>
                </div>
            ) : (
                <>
                    {/* 1. 顯示所有相簿封面 (未點進去時) */}
                    {!currentAlbum && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {galleryAlbums.map((album) => (
                                <div key={album.title} onClick={() => setCurrentAlbum(album.title)} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-6">
                                        {album.cover ? (
                                            album.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900/5 text-slate-300"><Video size={48}/></div>
                                            ) : (
                                                <img src={album.cover} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="Cover"/>
                                            )
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><Folder size={48}/></div>
                                        )}
                                        <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-sm">
                                            {album.count} 項目
                                        </div>
                                        {album.isDrive && (
                                            <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest shadow-md flex items-center gap-1">
                                                <Folder size={10}/> DRIVE
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-2 pb-2">
                                        <h4 className="font-black text-xl text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{album.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1 flex items-center">點擊查看相簿內容 <ChevronRight size={12} className="ml-1"/></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. 點進相簿後，顯示該相簿內的所有照片/影片 */}
                    {currentAlbum && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(galleryAlbums.find(a => a.title === currentAlbum)?.items || []).map(item => (
                                <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-4">
                                        {item.type === 'video' ? (
                                            getYouTubeEmbedUrl(item.url) ? (
                                                <iframe src={getYouTubeEmbedUrl(item.url)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={item.title}/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Video size={48}/><span className="ml-2 text-xs">影片連結無效</span></div>
                                            )
                                        ) : (
                                            <img src={item.url} alt={item.description || "照片"} onClick={() => setViewingImage(item)} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 cursor-zoom-in"/>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                                            {item.type === 'video' ? <Video size={12}/> : <ImageIcon size={12}/>}
                                            {item.type === 'video' ? 'Video' : 'Photo'}
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <p className="text-xs text-slate-500 font-bold line-clamp-2">{item.description || "沒有描述"}</p>
                                    </div>
                                    
                                    {role === 'admin' && !galleryAlbums.find(a => a.title === currentAlbum)?.isDrive && (
                                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                                            <button onClick={() => deleteItem('gallery', item.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors" title="刪除檔案">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
