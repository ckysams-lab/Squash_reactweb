// src/components/LoginScreen.jsx (Multi-tenant Version)

import React, { useState } from 'react';

// 👇 定義目前系統支援的機構 (Tenant) 列表 👇
const SUPPORTED_SCHOOLS = [
    { id: 'bcklas-squash-core-v1', name: 'BCKLAS 正覺蓮社壁球隊' },
    { id: 'demo-school-v1', name: 'DEMO 測試中學 (體驗區)' },
    { id: 'lasalle-squash-v1', name: '喇沙書院 (La Salle College)' }
];

export default function LoginScreen({ onLogin, systemConfig }) {
    const [loginType, setLoginType] = useState('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [classStr, setClassStr] = useState('');
    const [classNo, setClassNo] = useState('');
    
    // 預設選擇你們學校
    const [selectedAppId, setSelectedAppId] = useState('bcklas-squash-core-v1');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // 🚨 關鍵：在登入前，把選定的 appId 存在瀏覽器的 LocalStorage 裡 🚨
        localStorage.setItem('tenant_app_id', selectedAppId);

        if (loginType === 'admin') {
            onLogin('admin', { email, password });
        } else {
            onLogin('student', { classStr, classNo, password });
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
            // 如果 systemConfig 沒有設定背景圖，預設使用這張高品質的壁球場照片
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554068865-24cecd4e34e8?q=80&w=2000&auto=format&fit=crop')" }}
        >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <div className="bg-slate-900/80 p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md relative z-10 border border-slate-700 backdrop-blur-md">
                
                <div className="flex flex-col items-center mb-8">
                    {systemConfig?.schoolLogo ? (
                        <img src={systemConfig.schoolLogo} alt="School Logo" className="h-20 mb-4 drop-shadow-md" />
                    ) : (
                        <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg">SQ</div>
                    )}
                    <h2 className="text-2xl font-black text-white tracking-widest text-center">SQUASH PRO</h2>
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">Management System</p>
                </div>

                {/* 模式切換按鈕 */}
                <div className="flex bg-slate-800 p-1.5 rounded-2xl mb-8">
                    <button 
                        type="button"
                        onClick={() => setLoginType('student')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${loginType === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        球員登入
                    </button>
                    <button 
                        type="button"
                        onClick={() => setLoginType('admin')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${loginType === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        教練登入
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 w-full">
                    
                    {/* 👇 新增：機構選擇下拉選單 👇 */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">選擇機構 (Organization)</label>
                        <select 
                            value={selectedAppId} 
                            onChange={(e) => setSelectedAppId(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
                        >
                            {SUPPORTED_SCHOOLS.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="w-full h-px bg-slate-800 my-4"></div>

                    {loginType === 'student' ? (
                        <div className="flex gap-3">
                            <div className="w-1/3">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">班別</label>
                                <input type="text" value={classStr} onChange={e => setClassStr(e.target.value.toUpperCase())} placeholder="例: 6A" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold uppercase" required />
                            </div>
                            <div className="w-1/3">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">班號</label>
                                <input type="text" value={classNo} onChange={e => setClassNo(e.target.value)} placeholder="例: 01" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold" required />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">密碼</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition-all font-bold" required />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">教練帳號 (Email)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@school.edu.hk" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1.5 uppercase tracking-widest">教練密碼</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-indigo-500 transition-all font-bold" required />
                            </div>
                        </div>
                    )}
                    
                    <button type="submit" className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4 ${loginType === 'student' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50'}`}>
                        登入系統 (Login)
                    </button>
                </form>
            </div>
        </div>
    );
}
