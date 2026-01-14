import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, Save, FileSpreadsheet, Download, FileText, Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment
} from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyAYm_63S9pKMZ51Qb2ZlCHRsfuGzy2gstw",
  authDomain: "squashreact.firebaseapp.com",
  projectId: "squashreact",
  storageBucket: "squashreact.firebasestorage.app",
  messagingSenderId: "342733564194",
  appId: "1:342733564194:web:7345d90d7d22c0b605dd7b",
  measurementId: "G-JRZ0QSFLLQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'squash-management-v1';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [competitions, setCompetitions] = useState([]); // 新增：比賽資訊狀態
  const [systemConfig, setSystemConfig] = useState({ adminPassword: 'admin', announcements: [] });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);

  // 財務狀態
  const [finance, setFinance] = useState({
    nTeam: 1, nTrain: 3, nHobby: 4,
    totalStudents: 50, feePerStudent: 250
  });

  // 勳章對照表
  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", bonus: 400 },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-100", icon: "🥇", bonus: 200 },
    "銀章": { color: "text-slate-500", bg: "bg-slate-200", icon: "🥈", bonus: 100 },
    "銅章": { color: "text-orange-600", bg: "bg-orange-100", icon: "🥉", bonus: 50 },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", bonus: 0 }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
    const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');

    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSystemConfig(docSnap.data());
      } else {
        setDoc(configDocRef, { adminPassword: 'admin', announcements: [] });
      }
    });

    const unsubStudents = onSnapshot(studentsRef, 
      (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Students error:", err)
    );
    const unsubAttendance = onSnapshot(attendanceRef, 
      (snap) => setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Attendance error:", err)
    );
    const unsubCompetitions = onSnapshot(competitionsRef,
      (snap) => setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Competitions error:", err)
    );

    return () => { unsubConfig(); unsubStudents(); unsubAttendance(); unsubCompetitions(); };
  }, [user]);

  const handleLogin = (type, data) => {
    if (type === 'admin') {
      if (data.password === systemConfig.adminPassword) {
        setRole('admin');
        setShowLoginModal(false);
        setActiveTab('dashboard');
      } else {
        alert('教練密碼錯誤 (預設為 admin)');
      }
    } else {
      const student = students.find(s => s.class === data.className && s.classNo === data.classNo);
      if (student) {
        setRole('student');
        setCurrentUserInfo(student);
        setShowLoginModal(false);
        setActiveTab('rankings');
      } else {
        alert('找不到該學生資料，請檢查班別與班號');
      }
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUserInfo(null);
    setShowLoginModal(true);
  };

  const rankedStudents = useMemo(() => {
    return students.map(s => {
      const attCount = attendance.filter(a => a.studentId === s.id).length;
      const bonus = BADGE_DATA[s.badge]?.bonus || 0;
      const basePoints = Number(s.points) || 0;
      const totalPoints = basePoints + (attCount * 10) + bonus;
      return { ...s, attCount, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, attendance]);

  const adjustPoints = async (studentId, amount) => {
    if (role !== 'admin') return;
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId);
    await updateDoc(ref, { points: increment(amount) });
  };

  const handleDownloadForm = (fileName) => {
    // 這裡通常是跳轉到一個 PDF 的 URL，或者模擬下載
    alert(`正在準備下載表格：${fileName}\n(在實際環境中，這裡將連接到存儲 PDF 的文件服務器)`);
  };

  // --- 匯出 CSV 功能 ---
  const exportToCSV = () => {
    const headers = ["姓名", "班別", "班號", "等級", "章別", "原始積分", "出勤加分", "總積分"];
    const rows = rankedStudents.map(s => [
      s.name,
      s.class,
      s.classNo,
      s.level,
      s.badge,
      s.points,
      s.attCount * 10,
      s.totalPoints
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `正覺壁球學員名單_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV 匯入: 新增學員 (基本資料) ---
  const handleCSVImportStudents = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '').slice(1);
        const batch = writeBatch(db);
        const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
        
        rows.forEach(row => {
          const [name, cls, no, lv] = row.split(',').map(s => s?.trim());
          if (name) {
            const newDoc = doc(colRef);
            batch.set(newDoc, {
              name,
              class: cls || '1A',
              classNo: no || '0',
              level: lv || '初級',
              badge: '無',
              points: 100
            });
          }
        });
        await batch.commit();
        alert(`成功新增 ${rows.length} 位隊員資料`);
      } catch (err) { alert('匯入失敗，請檢查 CSV 格式'); }
    };
    reader.readAsText(file);
  };

  // --- CSV 匯入: 積分/章別匯入 (更新現有學員) ---
  const handleCSVImportRankings = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '').slice(1);
        const batch = writeBatch(db);
        
        let updateCount = 0;
        rows.forEach(row => {
          const [name, cls, no, bdg, pts] = row.split(',').map(s => s?.trim());
          const target = students.find(s => s.name === name && s.class === cls && s.classNo === no);
          if (target) {
            const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', target.id);
            batch.update(ref, {
              badge: bdg || target.badge,
              points: pts ? Number(pts) : target.points
            });
            updateCount++;
          }
        });
        await batch.commit();
        alert(`已成功更新 ${updateCount} 位學員的積分與章別`);
      } catch (err) { alert('匯入更新失敗，請確保學員已存在於系統中'); }
    };
    reader.readAsText(file);
  };

  const LoginModal = () => {
    const [loginType, setLoginType] = useState('student');
    const [formData, setFormData] = useState({ password: '', className: '', classNo: '' });
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-200">
                <ShieldCheck className="text-white" size={40} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-center text-slate-800 mb-8">正覺壁球系統</h2>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 font-bold">
              <button onClick={() => setLoginType('student')} className={`flex-1 py-3 rounded-xl transition-all ${loginType === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>學員登入</button>
              <button onClick={() => setLoginType('admin')} className={`flex-1 py-3 rounded-xl transition-all ${loginType === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>教練管理</button>
            </div>
            <div className="space-y-4">
              {loginType === 'student' ? (
                <>
                  <input className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="班別 (如: 6A)" value={formData.className} onChange={e=>setFormData({...formData, className: e.target.value.toUpperCase()})} />
                  <input className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="班號 (如: 05)" value={formData.classNo} onChange={e=>setFormData({...formData, classNo: e.target.value})} />
                </>
              ) : (
                <input type="password" className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="請輸入管理密碼" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
              )}
              <button onClick={() => handleLogin(loginType, formData)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">進入系統</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FinancialView = () => {
    const totalRevenue = finance.totalStudents * finance.feePerStudent;
    const totalExpense = (finance.nTeam * 2750) + (finance.nTrain * 1350) + (finance.nHobby * 1200);
    const profit = totalRevenue - totalExpense;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-3"><Lock size={20} className="text-blue-500"/> 開班與收入設定</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase mb-2">隊員人數設定</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">預計參加總人數</span>
                  <input type="number" className="w-24 p-2 rounded-xl text-center font-bold" value={finance.totalStudents} onChange={e=>setFinance({...finance, totalStudents: Number(e.target.value)})} />
                </div>
              </div>
              {[
                { label: '校隊訓練班 ($2750/班)', key: 'nTeam' },
                { label: '一般訓練班 ($1350/班)', key: 'nTrain' },
                { label: '簡易運動班 ($1200/班)', key: 'nHobby' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  <input type="number" className="w-20 p-2 rounded-xl text-center font-bold" value={finance[item.key]} onChange={e=>setFinance({...finance, [item.key]: Number(e.target.value)})} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">預計本期盈餘</p>
              <h2 className={`text-5xl font-black ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>${profit.toLocaleString()}</h2>
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">總收入 (學費)</p>
                  <p className="text-xl font-black text-slate-700">${totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">總支出 (開班費)</p>
                  <p className="text-xl font-black text-slate-700">${totalExpense.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white">
              <h4 className="font-bold mb-2 text-white">系統密碼設定</h4>
              <p className="text-xs text-blue-100 mb-4 font-bold">目前管理員密碼：{systemConfig.adminPassword}</p>
              <button onClick={() => {
                const newPass = prompt("請輸入新的管理員密碼：", systemConfig.adminPassword);
                if(newPass) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), { adminPassword: newPass });
              }} className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all w-full">修改教練密碼</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 比賽資訊頁面 ---
  const CompetitionsView = () => {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
        {/* 比賽資訊與下載區 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><Trophy className="text-amber-500" size={24}/> 最新比賽資訊</h3>
                {role === 'admin' && (
                  <button 
                    onClick={async () => {
                      const title = prompt("比賽名稱：");
                      const date = prompt("日期 (如: 2024-05-20)：");
                      const info = prompt("簡介：");
                      if(title && date) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), { title, date, info, createdAt: serverTimestamp() });
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
                  >
                    <Plus size={16}/> 發布比賽
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {competitions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold">暫無比賽資訊</div>
                ) : (
                  competitions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(comp => (
                    <div key={comp.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-blue-600 font-black text-sm mb-1">{comp.date}</p>
                          <h4 className="text-lg font-black text-slate-800">{comp.title}</h4>
                          <p className="text-sm text-slate-500 font-bold mt-2">{comp.info}</p>
                        </div>
                        {role === 'admin' && (
                          <button 
                            onClick={async () => { if(confirm('確定刪除此比賽？')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'competitions', comp.id)) }}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
              <h3 className="font-black text-xl mb-4 flex items-center gap-2"><FileText size={22}/> 表格下載中心</h3>
              <p className="text-blue-100 text-sm font-bold mb-6">家長可在此下載最新的比賽報名表及相關文件。</p>
              
              <div className="space-y-3">
                {[
                  "2024夏季公開賽報名表.pdf",
                  "壁球隊健康聲明書.pdf",
                  "家長同意書範本.pdf"
                ].map((file, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleDownloadForm(file)}
                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg"><Download size={16}/></div>
                      <span className="text-sm font-bold truncate">{file}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2"><Info size={18} className="text-blue-500"/> 注意事項</h4>
              <ul className="text-xs text-slate-500 font-bold space-y-2 list-disc pl-4">
                <li>請在比賽截止日期前一週交回表格。</li>
                <li>所有報名需經由教練團審核資格。</li>
                <li>出勤率低於 80% 的同學可能無法獲得推薦參賽。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {showLoginModal && <LoginModal />}
      
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
          </div>
          <nav className="space-y-2 flex-1 font-bold">
            {role === 'admin' && (
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                <LayoutDashboard size={22} /> 管理首頁
              </button>
            )}
            <button onClick={() => setActiveTab('rankings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'rankings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Trophy size={22} /> 積分排行
            </button>
            {/* 比賽資訊 - 學生/家長可見 */}
            <button onClick={() => setActiveTab('competitions')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'competitions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <CalendarIcon size={22} /> 比賽資訊
            </button>
            {role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Users size={22} /> 學員管理
                </button>
                <button onClick={() => setActiveTab('attendance')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <ClipboardCheck size={22} /> 考官點名
                </button>
                <button onClick={() => setActiveTab('financial')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'financial' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <DollarSign size={22} /> 財務預算
                </button>
              </>
            )}
          </nav>
          <div className="mt-auto p-6 bg-slate-50 rounded-3xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {role === 'admin' ? <ShieldCheck size={20}/> : <User size={20}/>}
                </div>
                <div className="truncate">
                  <p className="text-xs font-black truncate">{role === 'admin' ? '教練/考官' : currentUserInfo?.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{role === 'admin' ? '管理權限' : `${currentUserInfo?.class} 班`}</p>
                </div>
             </div>
             <button onClick={handleLogout} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 transition-all">登出系統</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="px-10 py-6 sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><Menu size={24}/></button>
            <h1 className="text-2xl font-black">
              {activeTab === 'rankings' && "🏆 隊員積分排行榜"}
              {activeTab === 'dashboard' && "📊 系統概況"}
              {activeTab === 'students' && "👥 學員名單管理"}
              {activeTab === 'attendance' && "✅ 考官點名考核"}
              {activeTab === 'financial' && "💰 財務預算分析"}
              {activeTab === 'competitions' && "🏸 比賽資訊與下載"}
            </h1>
          </div>
          <div className="text-sm font-bold text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('zh-TW')}
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto pb-20">
          {activeTab === 'rankings' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-black text-slate-800">當前排行榜</h3>
                {role === 'student' && (
                  <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-blue-100">
                    我的積分：{rankedStudents.find(s=>s.id === currentUserInfo?.id)?.totalPoints || 0}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5">排名</th>
                      <th className="px-8 py-5">隊員</th>
                      <th className="px-8 py-5">章別獎勵</th>
                      <th className="px-8 py-5">出勤加分</th>
                      <th className="px-8 py-5">總分</th>
                      {role === 'admin' && <th className="px-8 py-5">手動調整</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankedStudents.map((s, i) => (
                      <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${s.id === currentUserInfo?.id ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-8 py-6">
                           <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${i < 3 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{i+1}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-800">{s.name}</div>
                          <div className="text-[10px] font-bold text-slate-400">{s.class}({s.classNo}) • {s.level}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>
                            {BADGE_DATA[s.badge]?.icon} {s.badge}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-500">+{s.attCount * 10}</td>
                        <td className="px-8 py-6">
                          <span className="text-2xl font-mono font-black text-blue-600">{s.totalPoints}</span>
                        </td>
                        {role === 'admin' && (
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <button onClick={()=>adjustPoints(s.id, -10)} className="text-slate-300 hover:text-red-500 transition-colors"><MinusCircle size={20}/></button>
                              <button onClick={()=>adjustPoints(s.id, 10)} className="text-slate-300 hover:text-emerald-500 transition-colors"><PlusCircle size={20}/></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'competitions' && <CompetitionsView />}

          {activeTab === 'students' && role === 'admin' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Users size={20} className="text-blue-500"/> 學員名單匯入</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">格式：姓名, 班別, 班號, 等級</p>
                  </div>
                  <label className="mt-6 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-sm cursor-pointer hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                    <Upload size={18}/> 匯入新學員
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVImportStudents} />
                  </label>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Trophy size={20} className="text-amber-500"/> 成績批次更新</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2">格式：姓名, 班別, 班號, 章別, 積分</p>
                  </div>
                  <label className="mt-6 bg-amber-500 text-white px-6 py-4 rounded-2xl font-bold text-sm cursor-pointer hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-100">
                    <FileSpreadsheet size={18}/> 更新章別/積分
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVImportRankings} />
                  </label>
                </div>

                <div className="bg-emerald-600 p-8 rounded-[2.5rem] flex flex-col justify-between text-white shadow-lg shadow-emerald-100">
                  <div>
                    <h3 className="font-black text-white text-lg flex items-center gap-2"><Download size={20}/> 數據備份與匯出</h3>
                    <p className="text-xs font-bold text-emerald-100 mt-2">匯出包含總積分的完整隊員表 (CSV)</p>
                  </div>
                  <button onClick={exportToCSV} className="mt-6 bg-white text-emerald-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-md">
                    <Download size={18}/> 匯出學員總表
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                    <div>
                      <p className="font-black text-slate-800">{s.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.class}({s.classNo}) | {s.badge}</p>
                    </div>
                    <button onClick={async () => { if(confirm('確定刪除？')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id)) }} className="text-slate-200 hover:text-red-500 p-2 transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && role === 'admin' && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="font-black text-2xl text-slate-800">考官點名</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">點擊學員頭像以標記今日出勤狀況</p>
                </div>
                <div className="text-sm font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl">
                   本日已考核：{attendance.filter(a => new Date(a.date?.seconds * 1000).toDateString() === new Date().toDateString()).length} / {students.length}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {students.map(s => {
                  const isPresent = attendance.some(a => a.studentId === s.id && new Date(a.date?.seconds * 1000).toDateString() === new Date().toDateString());
                  return (
                    <button
                      key={s.id}
                      onClick={async () => {
                        const today = new Date().toDateString();
                        const existing = attendance.find(a => a.studentId === s.id && new Date(a.date?.seconds * 1000).toDateString() === today);
                        if (existing) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', existing.id));
                        else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), { studentId: s.id, date: serverTimestamp() });
                      }}
                      className={`p-6 rounded-[2rem] font-bold transition-all border-2 flex flex-col items-center gap-4 ${isPresent ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105' : 'bg-white border-slate-50 text-slate-400 hover:border-blue-200'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPresent ? 'bg-white/20' : 'bg-slate-50 text-slate-300'}`}>
                        {isPresent ? <UserCheck size={24}/> : <Plus size={24}/>}
                      </div>
                      <div className="text-center">
                        <div className="text-lg leading-none mb-1">{s.name}</div>
                        <div className={`text-[10px] uppercase font-black ${isPresent ? 'text-blue-100' : 'text-slate-300'}`}>{s.class} ({s.classNo})</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'financial' && role === 'admin' && <FinancialView />}
          
          {activeTab === 'dashboard' && role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">活躍隊員</p>
                <p className="text-4xl font-black text-slate-800">{students.length} <span className="text-sm font-bold text-slate-400 uppercase">Members</span></p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">本日考核人數</p>
                <p className="text-4xl font-black text-emerald-500">
                  {attendance.filter(a => new Date(a.date?.seconds * 1000).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">公告欄</p>
                <button onClick={() => {
                   const title = prompt("新增公告內容：");
                   if(title) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), { announcements: [...(systemConfig.announcements || []), { title, date: new Date().toLocaleDateString() }] });
                }} className="text-blue-600 font-bold flex items-center gap-2 hover:underline"><Plus size={16}/> 發布新公告</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={()=>setSidebarOpen(false)} />}
    </div>
  );
}