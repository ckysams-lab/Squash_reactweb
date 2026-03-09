// src/pages/GalleryPage.jsx
import React from 'react';
import { ArrowLeft, ImageIcon, Folder, PlusCircle, Video, ChevronRight, Trash2, Loader2 } from 'lucide-react';

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
        <div className="space-y-10 animate-in fade-in duration-500 font-bold">
            {/* 頂部標題與按鈕區 */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6">
                    {currentAlbum ? (
                        <button onClick={() => setCurrentAlbum(null)} className="p-4 bg-slate-100 text-slate-500 hover:text-blue-600 rounded-2xl transition-all">
                            <ArrowLeft size={24}/>
                        </button>
                    ) : (
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ImageIcon/></div>
                    )}
                    <div>
                        <h3 className="text-xl font-black">{currentAlbum ? currentAlbum : "精彩花絮 (Gallery)"}</h3>
                        <p className="text-xs text-slate-400 mt-1">{currentAlbum ? "瀏覽相簿內容" : "回顧訓練與比賽的珍貴時刻"}</p>
                    </div>
                </div>
                
                {/* 教練專屬按鈕區 */}
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
