// src/components/LoginModal.js

import React from 'react';
import { Mail, Lock } from 'lucide-react';
import SchoolLogo from './SchoolLogo';

const LoginModal = ({
  show,
  handleLogin,
  loginTab,
  setLoginTab,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  systemConfig,
  version
}) => {

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/50 transform transition-all duration-700">
        <div className="flex justify-center mb-10">
          <SchoolLogo systemConfig={systemConfig} className="text-white" size={80} />
        </div>
        <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
        <p className="text-center text-slate-400 font-bold mb-10">BCKLAS Squash Team System</p>
        <div className="space-y-6">
          
          <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4 relative">
             <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-[1.8rem] shadow-sm transition-all duration-300 ease-out ${loginTab === 'admin' ? 'left-1/2' : 'left-1'}`}></div>
             <button onClick={() => setLoginTab('student')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'student' ? 'text-blue-600' : 'text-slate-400'}`}>學員入口</button>
             <button onClick={() => setLoginTab('admin')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>教練登入</button>
          </div>

          {loginTab === 'student' ? (
              <div className="space-y-3 font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Mail size={18}/></span>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" 
                    placeholder="學生電郵" 
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" 
                    placeholder="學生密碼" 
                  />
                </div>
                <button onClick={() => handleLogin('student')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                  進入系統
                </button>
              </div>
          ) : (
              <div className="space-y-3 font-bold animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Mail size={18}/></span>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" 
                    placeholder="教練電郵" 
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                  <input 
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" 
                    placeholder="教練密碼" 
                  />
                </div>
                <button onClick={() => handleLogin('admin')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                  管理員登入
                </button>
              </div>
          )}
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-10 font-bold uppercase tracking-widest">BCKLAS Management v{version}</p>
      </div>
    </div>
  );
};

export default LoginModal;
