// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { Lock, Mail, User, Hash, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLogin, systemConfig }) {
    const [loginTab, setLoginTab] = useState('student');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginClass, setLoginClass] = useState('');
    const [loginClassNo, setLoginClassNo] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (type, e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        
        // 稍微延遲以顯示點擊特效 (可選)
        setTimeout(() => {
            if (type === 'admin') {
                onLogin('admin', { email: loginEmail, password: loginPassword });
            } else {
                onLogin('student', { classStr: loginClass, classNo: loginClassNo, password: loginPassword });
            }
            setIsLoading(false);
        }, 400);
    };

    const Logo = ({ size = 80 }) => {
        const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
        const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;
        return (
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                <img 
                    src={logoUrl} 
                    alt="BCKLAS Logo" 
                    className="object-contain relative z-10 drop-shadow-2xl"
                    style={{ width: size * 2, height: size * 2 }}
                    crossOrigin="anonymous" 
                />
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594420314182-1a48c4349635?q=80&w=2000&auto=format&fit=crop')" }}
        >
            {/* 深色科技感背景遮罩 */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            
            {/* 裝飾性背景光暈 */}
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen blur-[100px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full mix-blend-screen blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

            {/* 玻璃擬物化 (Glassmorphism) 登入框 */}
            <div className="relative bg-white/5 backdrop-blur-2xl w-full max-w-md rounded-[3rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] p-10 sm:p-12 border border-white/10 
                            animate-in fade-in-50 zoom-in-95 duration-700 ease-out">
                
                <div className="flex justify-center mb-8 animate-in slide-in-from-bottom-8 delay-200 duration-500">
                    <Logo size={70} />
                </div>

                <div className="animate-in slide-in-from-bottom-8 delay-300 duration-500 mb-8">
                    <h2 className="text-3xl font-black text-center text-white tracking-tight mb-1">SQUASH PRO</h2>
                    <p className="text-center text-blue-400/80 text-xs font-bold tracking-widest uppercase">BCKLAS Athletics System</p>
                </div>
                
                <div className="animate-in fade-in delay-500 duration-500">
                    {/* 深色版切換標籤 */}
                    <div className="bg-black/30 p-1.5 rounded-full flex mb-8 relative border border-white/5">
                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-600 rounded-full shadow-lg transition-all duration-300 ease-out ${loginTab === 'admin' ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}></div>
                        <button onClick={() => setLoginTab('student')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'student' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>學員入口</button>
                        <button onClick={() => setLoginTab('admin')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'admin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>教練登入</button>
                    </div>

                    <form onSubmit={(e) => handleSubmit(loginTab, e)} className="space-y-6">
                        {loginTab === 'student' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex gap-3">
                                    <div className="relative flex-1 group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors"><User size={18}/></span>
                                        <input type="text" required value={loginClass} onChange={(e) => setLoginClass(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 transition-all rounded-2xl py-4 pl-11 pr-4 outline-none text-white placeholder-slate-500 font-bold" placeholder="班別 (如 6A)" />
                                    </div>
                                    <div className="relative flex-1 group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors"><Hash size={18}/></span>
                                        <input type="text" required value={loginClassNo} onChange={(e) => setLoginClassNo(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 transition-all rounded-2xl py-4 pl-11 pr-4 outline-none text-white placeholder-slate-500 font-bold" placeholder="學號 (如 01)" />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors"><Lock size={18}/></span>
                                    <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-blue-500/50 focus:bg-black/40 transition-all rounded-2xl py-4 pl-12 pr-4 outline-none text-white placeholder-slate-500 font-bold tracking-widest" placeholder="學員密碼" />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
                                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>進入系統 <ArrowRight size={20} /></>}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors"><Mail size={18}/></span>
                                    <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:bg-black/40 transition-all rounded-2xl py-4 pl-12 pr-4 outline-none text-white placeholder-slate-500 font-bold" placeholder="教練電郵" />
                                </div>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors"><Lock size={18}/></span>
                                    <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:bg-black/40 transition-all rounded-2xl py-4 pl-12 pr-4 outline-none text-white placeholder-slate-500 font-bold tracking-widest" placeholder="教練密碼" />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
                                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>管理員登入 <ArrowRight size={20} /></>}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
