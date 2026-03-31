// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

export default function LoginScreen({ onLogin, systemConfig }) {
    // 將登入表單專用的狀態封裝在元件內部
    const [loginTab, setLoginTab] = useState('student');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginClass, setLoginClass] = useState('');
    const [loginClassNo, setLoginClassNo] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleSubmit = (type) => {
        if (type === 'admin') {
            onLogin('admin', { email: loginEmail, password: loginPassword });
        } else {
            onLogin('student', { classStr: loginClass, classNo: loginClassNo, password: loginPassword });
        }
    };

    // 提取 SchoolLogo 組件 (專為 LoginScreen 簡化版本)
    const Logo = ({ size = 80 }) => {
        const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
        const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;
        return (
            <img 
                src={logoUrl} 
                alt="BCKLAS Logo" 
                className="object-contain"
                style={{ width: size * 2, height: size * 2 }}
                crossOrigin="anonymous" 
            />
        );
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594420314182-1a48c4349635?q=80&w=2000&auto=format&fit=crop')" }}
        >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>

            {/* 登入框 */}
            <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/30 
                            animate-in fade-in-50 zoom-in-95 duration-700 ease-out">
                
                <div className="flex justify-center mb-10 animate-in slide-in-from-bottom-8 delay-200 duration-500">
                    <Logo size={80} />
                </div>

                <div className="animate-in slide-in-from-bottom-8 delay-300 duration-500">
                    <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
                    <p className="text-center text-slate-400 font-bold mb-10">BCKLAS Squash Team System</p>
                </div>
                
                {/* 登入表單 (動畫延遲載入) */}
                <div className="animate-in fade-in delay-500 duration-500">
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4 relative">
                            <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-[1.8rem] shadow-sm transition-all duration-300 ease-out ${loginTab === 'admin' ? 'left-1/2' : 'left-1'}`}></div>
                            <button onClick={() => setLoginTab('student')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'student' ? 'text-blue-600' : 'text-slate-400'}`}>學員入口</button>
                            <button onClick={() => setLoginTab('admin')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>教練登入</button>
                        </div>
                        {loginTab === 'student' ? (
                            <div className="space-y-3 font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex gap-3">
                                <input type="text" value={loginClass} onChange={(e) => setLoginClass(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 outline-none text-lg" placeholder="班別 (如 6A)" />
                                <input type="text" value={loginClassNo} onChange={(e) => setLoginClassNo(e.target.value)} className="w-1/2 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 outline-none text-lg" placeholder="班號 (如 01)" />
                                </div>
                                <div className="relative">
                                <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="學生密碼" />
                                </div>
                                <button onClick={() => handleSubmit('student')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">進入系統</button>
                            </div>
                        ) : (
                            <div className="space-y-3 font-bold animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="relative">
                                <span className="absolute left-5 top-5 text-slate-300"><Mail size={18}/></span>
                                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="教練電郵" />
                                </div>
                                <div className="relative">
                                <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="教練密碼" />
                                </div>
                                <button onClick={() => handleSubmit('admin')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">管理員登入</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
