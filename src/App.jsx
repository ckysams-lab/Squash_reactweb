import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, 
  Save, FileSpreadsheet, Download, FileText, Info, Link as LinkIcon, Settings2,
  ChevronRight, Search, Filter, History, Clock, MapPin, Layers, Award,
  Trophy as TrophyIcon, Star, Target, TrendingUp, ChevronDown, CheckCircle2
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
  // --- 狀態管理 ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [schedules, setSchedules] = useState([]); // 訓練日程
  const [downloadFiles, setDownloadFiles] = useState([]); 
  const [systemConfig, setSystemConfig] = useState({ 
    adminPassword: 'admin', 
    announcements: [],
    seasonalTheme: 'default'
  });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [importEncoding, setImportEncoding] = useState('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('ALL'); // 點名頁專用篩選
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

// 新增：財務參數
  const [financeConfig, setFinanceConfig] = useState({
    nTeam: 1, costTeam: 2750,
    nTrain: 3, costTrain: 1350,
    nHobby: 4, costHobby: 1200,
    totalStudents: 50, feePerStudent: 250
  });

// 新增：自動計算總收支
  const financialSummary = useMemo(() => {
  const revenue = financeConfig.totalStudents * financeConfig.feePerStudent;
  const expense = (financeConfig.nTeam * financeConfig.costTeam) + 
                  (financeConfig.nTrain * financeConfig.costTrain) + 
                  (financeConfig.nHobby * financeConfig.costHobby);
  return { revenue, expense, profit: revenue - expense };
}, [financeConfig]);

  // 章別數據與積分邏輯
  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", bonus: 400, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", bonus: 200, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", bonus: 100, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", bonus: 50, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", bonus: 0, desc: "努力中" }
};
  // --- Firebase Auth 監聽 ---
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

  // --- Firestore 資料即時監聽 ---
  useEffect(() => {
    if (!user) return;
    
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
    const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
    const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles'); 
    const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');

    // 系統配置監聽
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) setSystemConfig(docSnap.data());
      else setDoc(configDocRef, { adminPassword: 'admin', announcements: [], seasonalTheme: 'default' });
    });
    
    // 學生資料監聽
    const unsubStudents = onSnapshot(studentsRef, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 點名紀錄監聽
    const unsubAttendance = onSnapshot(attendanceRef, (snap) => {
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 比賽資訊監聽
    const unsubCompetitions = onSnapshot(competitionsRef, (snap) => {
      setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 訓練日程監聽
    const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 檔案下載監聽
    const unsubFiles = onSnapshot(filesRef, (snap) => {
      setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubConfig(); unsubStudents(); unsubAttendance(); unsubCompetitions(); unsubSchedules(); unsubFiles(); 
    };
  }, [user]);

  // --- 登入邏輯 ---
  const handleLogin = (type, data) => {
    if (type === 'admin') {
      if (data.password === systemConfig.adminPassword) {
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } else { alert('管理員密碼錯誤'); }
    } else {
      const student = students.find(s => s.class === data.className.toUpperCase() && s.classNo === data.classNo);
      if (student) {
        setRole('student'); 
        setCurrentUserInfo(student); 
        setShowLoginModal(false); 
        setActiveTab('rankings');
      } else { alert('找不到學員資料，請檢查班別及班號'); }
    }
  };

  const handleLogout = () => { 
    setRole(null); 
    setCurrentUserInfo(null); 
    setShowLoginModal(true); 
    setSidebarOpen(false);
  };

  // --- 積分計算與排行邏輯 ---
  const rankedStudents = useMemo(() => {
    return students.map(s => ({ 
      ...s, 
      totalPoints: (Number(s.points) || 0) + (BADGE_DATA[s.badge]?.bonus || 0) 
    })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.class.localeCompare(b.class);
    });
  }, [students]);

 // --- 財務收支組件 (從 App.jsx 移植並適配樣式) ---
  const FinancialView = () => (
    <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 font-bold">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
            <TrendingUp size={32}/>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總收入</p>
          <h3 className="text-4xl font-black text-emerald-500">${financialSummary.revenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <Trash2 size={32}/>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總支出</p>
          <h3 className="text-4xl font-black text-rose-500">${financialSummary.expense.toLocaleString()}</h3>
        </div>

        <div className={`p-10 rounded-[3.5rem] border shadow-sm flex flex-col justify-center items-center text-center ${financialSummary.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${financialSummary.profit >= 0 ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-rose-600 shadow-sm'}`}>
            <DollarSign size={32}/>
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計資助</p>
          <h3 className={`text-4xl font-black ${financialSummary.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            ${financialSummary.profit.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm"><Trash2 size={24}/></div>
            <h4 className="text-2xl font-black text-slate-800">支出設定 (教練費)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: '校隊教練次數', key: 'nTeam' }, { label: '單次校隊成本', key: 'costTeam' },
              { label: '進階班次數', key: 'nTrain' }, { label: '單次進階成本', key: 'costTrain' },
              { label: '趣味班次數', key: 'nHobby' }, { label: '單次趣味成本', key: 'costHobby' },
            ].map(item => (
              <div key={item.key}>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">{item.label}</label>
                <input 
                  type="number" 
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-rose-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                  value={financeConfig[item.key]}
                  onChange={e => setFinanceConfig({...financeConfig, [item.key]: Number(e.target.value)})}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div>
            <h4 className="text-2xl font-black text-slate-800">預計收入 (學費)</h4>
          </div>
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">預計總人數</label>
              <input 
                type="number" 
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                value={financeConfig.totalStudents}
                onChange={e => setFinanceConfig({...financeConfig, totalStudents: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">每位學員學費 ($)</label>
              <input 
                type="number" 
                className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                value={financeConfig.feePerStudent}
                onChange={e => setFinanceConfig({...financeConfig, feePerStudent: Number(e.target.value)})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const adjustPoints = async (id, amount, reason = "教練調整") => {
    if (role !== 'admin' || !user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), { 
        points: increment(amount),
        lastUpdated: serverTimestamp()
      });
    } catch (e) { console.error(e); }
    setIsUpdating(false);
  };

  // --- CSV 工具 ---
  const readCSVFile = (file, encoding) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target.result;
        const decoder = new TextDecoder(encoding === 'BIG5' ? 'big5' : 'utf-8');
        const text = decoder.decode(new Uint8Array(buffer));
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // --- 核心功能：訓練班日程匯入 ---
  const handleCSVImportSchedules = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
      
      rows.forEach(row => {
        const [className, date, location, coach, notes] = row.split(',').map(s => s?.trim().replace(/^"|"$/g, ''));
        if (date && date !== "日期") {
          batch.set(doc(colRef), { 
            trainingClass: className || '通用訓練班',
            date, 
            location: location || '學校壁球場', 
            coach: coach || '待定', 
            notes: notes || '', 
            createdAt: serverTimestamp() 
          });
        }
      });
      await batch.commit();
      alert('訓練班日程匯入成功！');
    } catch (err) { alert('匯入失敗，請確認 CSV 格式 (班別,日期,地點,教練,備註)'); }
    setIsUpdating(false);
    e.target.value = null;
  };

  // --- 核心功能：學員匯入 ---
  const handleCSVImportStudents = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      
      rows.forEach(row => {
        const cols = row.split(',').map(s => s?.trim().replace(/^"|"$/g, ''));
        const [name, cls, no, badge, initPoints, squashClass] = cols;
        if (name && name !== "姓名") {
          batch.set(doc(colRef), { 
            name, 
            class: (cls || '1A').toUpperCase(), 
            classNo: no || '0', 
            badge: badge || '無', 
            points: Number(initPoints) || 100, 
            squashClass: squashClass || '', // 壁球班別
            createdAt: serverTimestamp() 
          });
        }
      });
      await batch.commit();
      alert('隊員名單更新成功！');
    } catch (err) { alert('匯入失敗'); }
    setIsUpdating(false);
    e.target.value = null;
  };

  const deleteItem = async (col, id) => {
    if (role !== 'admin') return;
    if (confirm('⚠️ 確定要永久刪除此項紀錄嗎？此動作無法復原。')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    }
  };

  // --- 日程連動點名邏輯 ---
  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(s => s.date === today);
  }, [schedules]);

  const uniqueTrainingClasses = useMemo(() => {
    const classes = schedules.map(s => s.trainingClass).filter(Boolean);
    return ['ALL', ...new Set(classes)];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const filtered = selectedClassFilter === 'ALL' 
      ? schedules 
      : schedules.filter(s => s.trainingClass === selectedClassFilter);
    return filtered.sort((a,b) => a.date.localeCompare(b.date));
  }, [schedules, selectedClassFilter]);

  const filteredStudents = useMemo(() => {
    return rankedStudents.filter(s => 
      s.name.includes(searchTerm) || 
      s.class.includes(searchTerm.toUpperCase())
    );
  }, [rankedStudents, searchTerm]);

  // 點名專用過濾學員 (防止重複顯示)
  const studentsInSelectedAttendanceClass = useMemo(() => {
    const sorted = [...students].sort((a,b) => a.class.localeCompare(b.class));
    if (attendanceClassFilter === 'ALL') return sorted;
    
    // 如果學生報名多於一班，squashClass 欄位內容可能包含多個班名
    // 這裡我們檢查學生的 squashClass 字串是否包含目前選定的班別名稱
    return sorted.filter(s => {
      if (!s.squashClass) return false;
      return s.squashClass.includes(attendanceClassFilter);
    });
  }, [students, attendanceClassFilter]);

  // --- 下載範本 ---
  const downloadTemplate = (type) => {
    let csv = "";
    let filename = "";
    if(type === 'schedule') {
      csv = "班別名稱,日期(YYYY-MM-DD),地點,教練,備註\n初級班A,2024-03-20,學校壁球場,王教練,第一課\n校隊訓練,2024-03-25,歌和老街,李教練,專項訓練";
      filename = "訓練日程匯入範本.csv";
    } else {
      csv = "姓名,班別,班號,章別(無/銅章/銀章/金章/白金章),初始積分,壁球班別\n陳小明,6A,01,銅章,120,校隊訓練班\n張小華,5C,12,無,100,壁球中級訓練班";
      filename = "學員匯入範本.csv";
    }

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold animate-pulse">正在連接正覺壁球資料庫...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* 登入視窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/20 transform transition-all duration-700">
            <div className="flex justify-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200">
                <ShieldCheck className="text-white" size={48} />
              </div>
            </div>
            <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
            <p className="text-center text-slate-400 font-bold mb-10">學員管理及積分系統</p>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4">
                <button className="flex-1 py-3 text-sm font-black text-blue-600 bg-white rounded-[1.8rem] shadow-sm">學員入口</button>
                <button onClick={() => {
                  const p = prompt('請輸入教練管理密碼'); 
                  if(p === systemConfig.adminPassword) { setRole('admin'); setShowLoginModal(false); setActiveTab('dashboard'); }
                  else if(p) alert('密碼錯誤');
                }} className="flex-1 py-3 text-sm font-black text-slate-400 hover:text-slate-600">教練登入</button>
              </div>

              <div className="space-y-3 font-bold">
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Layers size={18}/></span>
                  <input id="stdClass" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="班別 (如: 6A)" />
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><UserCheck size={18}/></span>
                  <input id="stdNo" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="班號 (如: 05)" />
                </div>
                <button onClick={() => {
                  const c = document.getElementById('stdClass').value.toUpperCase();
                  const n = document.getElementById('stdNo').value;
                  handleLogin('student', { className: c, classNo: n });
                }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                  進入系統
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-10 font-bold uppercase tracking-widest">PJ Squash Management v2.5</p>
          </div>
        </div>
      )}
      
      {/* 側邊欄 */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 h-full flex flex-col font-bold">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">智能系統</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto">
            <div className="text-[10px] text-slate-300 uppercase tracking-widest mb-4 px-6">主選單</div>
            
            {role === 'admin' && (
              <button onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                <LayoutDashboard size={20}/> 管理概況
              </button>
            )}
            
            <button onClick={() => {setActiveTab('rankings'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'rankings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Trophy size={20}/> 積分排行
            </button>
            
            <button onClick={() => {setActiveTab('schedules'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'schedules' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <CalendarIcon size={20}/> 訓練日程
            </button>
            
            <button onClick={() => {setActiveTab('competitions'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'competitions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Megaphone size={20}/> 比賽與公告
            </button>

            {role === 'admin' && (
              <>
                <div className="text-[10px] text-slate-300 uppercase tracking-widest my-6 px-6 pt-6 border-t">教練工具</div>
                <button onClick={() => {setActiveTab('students'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Users size={20}/> 隊員管理
                </button>
                <button onClick={() => {setActiveTab('attendance'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <ClipboardCheck size={20}/> 快速點名
                </button>
                <button onClick={() => {setActiveTab('financial'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'financial' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <DollarSign size={20}/> 財務收支
                </button>
                <button onClick={() => {setActiveTab('settings'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Settings2 size={20}/> 系統設定
                </button>
              </>
            )}
          </nav>
          
          <div className="pt-10 border-t">
            <div className="bg-slate-50 rounded-3xl p-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  {role === 'admin' ? <ShieldCheck size={20}/> : <User size={20}/>}
                </div>
                <div>
                  <p className="text-xs text-slate-400">登入身份</p>
                  <p className="text-sm font-black text-slate-800">{role === 'admin' ? '校隊教練' : currentUserInfo?.name}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
              <LogOut size={14}/> 登出系統
            </button>
          </div>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#F8FAFC]">
        {/* 頂部標題 */}
        <header className="px-10 py-8 sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all">
              <Menu size={24}/>
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">
                {activeTab === 'rankings' && "🏆 積分排行榜"}
                {activeTab === 'dashboard' && "📊 管理總結"}
                {activeTab === 'students' && "👥 隊員檔案庫"}
                {activeTab === 'attendance' && "✅ 日程連動點名"}
                {activeTab === 'competitions' && "🏸 比賽資訊公告"}
                {activeTab === 'schedules' && "📅 訓練班日程表"}
                {activeTab === 'financial' && <FinancialView />}
                {activeTab === 'settings' && "⚙️ 系統核心設定"}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                BCKLAS SQUASH TEAM MANAGEMENT SYSTEM
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {role === 'admin' && isUpdating && (
              <div className="flex items-center gap-2 text-blue-600 text-xs font-black bg-blue-50 px-4 py-2 rounded-full animate-pulse">
                <Loader2 size={14} className="animate-spin"/> 同步中...
              </div>
            )}
            <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl items-center gap-2 font-black">
              <div className="px-4 py-1.5 bg-white rounded-xl shadow-sm text-xs text-blue-600 flex items-center gap-2">
                <Clock size={14}/> {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto pb-40">
          
          {/* 1. 積分排行 */}
          {activeTab === 'rankings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rankedStudents.slice(0, 3).map((s, i) => (
                  <div key={s.id} className={`p-8 rounded-[3rem] border-2 relative overflow-hidden transition-all hover:scale-[1.02] ${
                    i === 0 ? 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200 shadow-xl shadow-yellow-100/50' : 
                    i === 1 ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-xl shadow-slate-100/50' : 
                    'bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-xl shadow-orange-100/50'
                  }`}>
                    <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                      <TrophyIcon size={120} className={i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : 'text-orange-600'}/>
                    </div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                        i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        #{i+1}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color} border`}>
                        {s.badge}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">{s.name}</h3>
                    <p className="text-slate-400 font-bold mt-1">{s.class} ({s.classNo})</p>
                    <div className="mt-8 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">目前總分</p>
                        <p className="text-5xl font-black font-mono text-slate-800">{s.totalPoints}</p>
                      </div>
                      <TrendingUp size={32} className={i === 0 ? 'text-yellow-500/30' : i === 1 ? 'text-slate-300' : 'text-orange-300'}/>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden font-bold">
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                      value={searchTerm}
                      onChange={(e)=>setSearchTerm(e.target.value)}
                      placeholder="搜尋姓名或班別..." 
                      className="w-full bg-white border rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-600 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b font-black">
                      <tr>
                        <th className="px-8 py-6 text-center">排名</th>
                        <th className="px-8 py-6">隊員資料</th>
                        <th className="px-8 py-6">目前章別</th>
                        <th className="px-8 py-6 text-right">基礎分</th>
                        <th className="px-8 py-6 text-right">總分</th>
                        {role === 'admin' && <th className="px-8 py-6 text-center">教練操作</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="group hover:bg-blue-50/30 transition-all">
                          <td className="px-8 py-8 text-center">
                            <span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl text-sm font-black ${
                              i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {i+1}
                            </span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg font-black text-slate-300 border group-hover:bg-white group-hover:text-blue-600 transition-all uppercase">
                                {s.name[0]}
                              </div>
                              <div>
                                <div className="font-black text-lg text-slate-800">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Class {s.class} • No.{s.classNo}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color} ${BADGE_DATA[s.badge]?.border} shadow-sm`}>
                              <span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span>
                              <span className="text-xs font-black">{s.badge}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right font-mono text-slate-400">{s.points}</td>
                          <td className="px-8 py-8 text-right font-mono text-3xl text-blue-600 font-black">{s.totalPoints}</td>
                          {role === 'admin' && (
                            <td className="px-8 py-8">
                              <div className="flex justify-center gap-2">
                                <button onClick={()=>adjustPoints(s.id, 10)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={18}/></button>
                                <button onClick={()=>adjustPoints(s.id, -10)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. 訓練班日程 (含匯入與過濾) */}
          {activeTab === 'schedules' && (
            <div className="space-y-8 animate-in fade-in duration-500 font-bold">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CalendarIcon/></div>
                    <div>
                      <h3 className="text-xl font-black">訓練班日程表</h3>
                      <p className="text-xs text-slate-400 mt-1">查看各級訓練班的日期與地點安排</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18}/>
                      <select 
                        value={selectedClassFilter} 
                        onChange={(e)=>setSelectedClassFilter(e.target.value)}
                        className="w-full md:w-60 bg-slate-50 border-none outline-none pl-12 pr-6 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                      >
                        {uniqueTrainingClasses.map(c => (
                          <option key={c} value={c}>{c === 'ALL' ? '🌍 全部訓練班' : `🏸 ${c}`}</option>
                        ))}
                      </select>
                    </div>

                    {role === 'admin' && (
                      <div className="flex gap-2">
                         <button onClick={()=>downloadTemplate('schedule')} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl border transition-all" title="下載日程範本"><Download size={20}/></button>
                         <label className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-black text-sm">
                           <Upload size={18}/> 匯入 CSV 日程
                           <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportSchedules}/>
                         </label>
                      </div>
                    )}
                  </div>
               </div>

               {filteredSchedules.length === 0 ? (
                 <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><CalendarIcon size={40}/></div>
                    <p className="text-xl font-black text-slate-400">目前暫無訓練日程紀錄</p>
                    <p className="text-sm text-slate-300 mt-2">請點擊上方匯入按鈕上傳 CSV 檔案</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSchedules.map(sc => {
                      const isToday = new Date().toISOString().split('T')[0] === sc.date;
                      return (
                        <div key={sc.id} className={`bg-white p-10 rounded-[3.5rem] border-2 shadow-sm hover:scale-[1.02] transition-all relative overflow-hidden group ${isToday ? 'border-blue-500 shadow-xl shadow-blue-50' : 'border-slate-100'}`}>
                           {isToday && (
                             <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                               Today • 今日訓練
                             </div>
                           )}
                           <div className="mb-8">
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-black uppercase tracking-widest border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {sc.trainingClass}
                              </span>
                              <h4 className="text-3xl font-black text-slate-800 mt-6">{sc.date}</h4>
                              <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-[0.3em]">Training Session</p>
                           </div>
                           
                           <div className="space-y-5">
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500"><MapPin size={18}/></div>
                                <span className="font-bold">{sc.location}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500"><UserCheck size={18}/></div>
                                <span className="font-bold">{sc.coach} 教練</span>
                              </div>
                              {/* 新增：手動刪除按鈕 */}
                              {role === 'admin' && (
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`確定要刪除 ${sc.date} 的這堂訓練課嗎？`)) {
                                      deleteItem('schedules', sc.id);
                                    }
                                  }}
                                  className="absolute top-8 right-8 w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm z-10"
                                  title="刪除課堂"
                                >
                                  <Trash2 size={20}/>
                                </button>
                              )}
                              {sc.notes && (
                                <div className="p-6 bg-slate-50 rounded-[2rem] text-xs text-slate-400 leading-relaxed italic border border-slate-100">
                                  "{sc.notes}"
                                </div>
                              )}
                           </div>
                           
                           {role === 'admin' && (
                             <div className="mt-10 pt-8 border-t border-dashed border-slate-100 opacity-0 group-hover:opacity-100 transition-all flex justify-end">
                               <button onClick={()=>deleteItem('schedules', sc.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                             </div>
                           )}
                        </div>
                      );
                    })}
                 </div>
               )}
            </div>
          )}

          {/* 3. 快速點名 (過濾多班別學員不重複) */}
          {activeTab === 'attendance' && role === 'admin' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-bold">
               <div className={`p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden transition-all duration-1000 ${todaySchedule ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-800'}`}>
                  <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12"><ClipboardCheck size={300}/></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black flex items-center gap-4 mb-4">教練點名工具 <Clock size={32}/></h3>
                    <div className="flex flex-wrap gap-4">
                      {todaySchedule ? (
                        <>
                          <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <Star size={14} className="text-yellow-300 fill-yellow-300"/>
                            <span className="text-sm font-black">今日：{todaySchedule.trainingClass}</span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <MapPin size={14}/>
                            <span className="text-sm font-black">{todaySchedule.location}</span>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-700/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/5 flex items-center gap-2">
                          <Info size={14}/>
                          <span className="text-sm font-black text-slate-300 font-bold">今日無預設訓練，進行一般點名</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative z-10 bg-white/10 px-10 py-6 rounded-[2.5rem] backdrop-blur-md mt-10 md:mt-0 text-center border border-white/10 shadow-inner">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-100 font-black opacity-60">Today's Date</p>
                    <p className="text-2xl font-black mt-1 font-mono">{new Date().toLocaleDateString()}</p>
                  </div>
               </div>

               {/* 壁球班別篩選選單 */}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                 <div className="flex items-center gap-3 text-slate-400 min-w-max">
                   <Filter size={20} />
                   <span>選擇壁球班別：</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {uniqueTrainingClasses.map(cls => (
                     <button
                       key={cls}
                       onClick={() => setAttendanceClassFilter(cls)}
                       className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                         attendanceClassFilter === cls 
                         ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                       }`}
                     >
                       {cls === 'ALL' ? '🌍 全部學員' : cls}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {studentsInSelectedAttendanceClass.length > 0 ? (
                    studentsInSelectedAttendanceClass.map(s => (
                      <button 
                        key={s.id} 
                        onClick={()=>{
                          alert(`已為 ${s.name} 完成「${todaySchedule ? todaySchedule.trainingClass : '一般點名'}」點名！\n地點：${todaySchedule ? todaySchedule.location : '體育館'}`);
                        }} 
                        className="group p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all flex flex-col items-center text-center relative overflow-hidden"
                      >
                         <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl mb-4 text-slate-300 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all font-black uppercase">
                            {s.name[0]}
                         </div>
                         <p className="font-black text-xl text-slate-800 group-hover:text-blue-600 transition-all">{s.name}</p>
                         <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{s.class} ({s.classNo})</p>
                         {/* 顯示學生報名的所有班別縮略資訊 */}
                         <div className="mt-1 text-[10px] text-blue-500 font-bold truncate max-w-full px-2" title={s.squashClass}>
                           {s.squashClass}
                         </div>
                         <div className="absolute top-4 right-4 text-slate-100 group-hover:text-blue-100 transition-all">
                            <CheckCircle2 size={24}/>
                         </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center text-slate-300 font-bold bg-white rounded-[3rem] border border-dashed">
                      此班別暫無學員資料
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* 4. 比賽資訊與公告 */}
          {activeTab === 'competitions' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500 font-bold">
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 text-slate-50 rotate-12"><Megaphone size={120}/></div>
                      <div className="flex justify-between items-center mb-10 relative z-10">
                         <div>
                           <h3 className="text-3xl font-black">最新比賽與公告</h3>
                           <p className="text-slate-400 text-xs mt-1">追蹤校隊最新動態與賽程詳情</p>
                         </div>
                         {role === 'admin' && (
                           <button onClick={()=>{
                             const title = prompt('公告標題');
                             const date = prompt('比賽日期 (YYYY-MM-DD)');
                             if(title && date) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), { title, date, createdAt: serverTimestamp() });
                           }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                             <Plus size={24}/>
                           </button>
                         )}
                      </div>
                      <div className="space-y-4 relative z-10">
                         {competitions.length === 0 && (
                           <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                             <p className="text-slate-300 font-black">目前暫無公告發佈</p>
                           </div>
                         )}
                         {competitions.sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds).map(c => (
                           <div key={c.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                              <div className="flex gap-6 items-center">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-all">
                                  <TrophyIcon size={24}/>
                                </div>
                                <div>
                                  <p className="font-black text-xl text-slate-800">{c.title}</p>
                                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                    <CalendarIcon size={12}/> {c.date}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all">查看詳情</button>
                                {role === 'admin' && <button onClick={()=>deleteItem('competitions', c.id)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="space-y-8">
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-20 -bottom-20 opacity-10"><FileText size={200}/></div>
                      <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                        檔案下載中心 <Download size={20}/>
                      </h3>
                      <div className="space-y-4 relative z-10">
                         {downloadFiles.map(f => (
                           <a key={f.id} href={f.url} target="_blank" className="group block p-5 bg-white/10 border border-white/10 rounded-[2rem] flex items-center justify-between hover:bg-white hover:text-slate-900 transition-all duration-500">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl group-hover:bg-slate-100 group-hover:text-blue-600 transition-all"><FileSpreadsheet size={18}/></div>
                                <span className="text-sm font-black">{f.name}</span>
                              </div>
                              <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-all"/>
                           </a>
                         ))}
                         {role === 'admin' && (
                           <button onClick={()=>{
                             const name = prompt('檔案顯示名稱');
                             const url = prompt('Google Drive 或連結 URL');
                             if(name && url) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles'), { name, url, createdAt: serverTimestamp() });
                           }} className="w-full py-5 border-2 border-dashed border-white/20 rounded-[2rem] text-xs font-black text-white/30 hover:text-white hover:border-white transition-all flex items-center justify-center gap-2">
                             <Plus size={14}/> 上傳新資源
                           </button>
                         )}
                      </div>
                   </div>
                   
                   <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-blue-100">
                      <h4 className="text-xl font-black mb-4">系統公告通知</h4>
                      <p className="text-sm text-blue-100/70 leading-relaxed font-bold">
                        本學期壁球訓練已全面數位化，請隊員定期查看「積分排行」並參與「訓練班日程」！
                      </p>
                      <button className="mt-8 px-6 py-3 bg-white text-blue-600 rounded-2xl text-xs font-black shadow-lg">了解更多</button>
                   </div>
                </div>
             </div>
          )}

          {/* 5. 隊員管理 (教練專用) */}
          {activeTab === 'students' && role === 'admin' && (
             <div className="space-y-10 animate-in slide-in-from-right-10 duration-700 font-bold">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 relative overflow-hidden">
                   <div className="absolute -left-10 -bottom-10 opacity-5 rotate-12"><Users size={150}/></div>
                   <div className="relative z-10">
                     <h3 className="text-3xl font-black">隊員檔案管理</h3>
                     <p className="text-slate-400 text-sm mt-1">在此批量匯入名單或個別編輯隊員屬性</p>
                   </div>
                   <div className="flex gap-4 relative z-10">
                     <button onClick={()=>downloadTemplate('students')} className="p-5 bg-slate-50 text-slate-400 border border-slate-100 rounded-[2rem] hover:text-blue-600 transition-all" title="下載名單範本"><Download size={24}/></button>
                     <label className="bg-blue-600 text-white px-10 py-5 rounded-[2.2rem] cursor-pointer hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-[0.98]">
                        <Upload size={20}/> 批量匯入 CSV 名單
                        <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportStudents}/>
                     </label>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {students.sort((a,b)=>a.class.localeCompare(b.class)).map(s => (
                     <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col items-center group relative">
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>
                          {s.badge}
                        </div>
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl mb-4 text-slate-300 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all font-black uppercase">
                          {s.name[0]}
                        </div>
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{s.class} ({s.classNo})</p>
                        <div className="mt-1 text-[10px] text-blue-500 font-bold">{s.squashClass}</div>
                        <div className="mt-6 pt-6 border-t border-slate-50 w-full flex justify-center gap-3">
                           <button className="text-slate-200 hover:text-blue-600 p-2 transition-all"><Settings2 size={18}/></button>
                           <button onClick={()=>deleteItem('students', s.id)} className="text-slate-200 hover:text-red-500 p-2 transition-all"><Trash2 size={18}/></button>
                        </div>
                     </div>
                   ))}
                   <button onClick={()=>{
                     const name = prompt('隊員姓名');
                     const cls = prompt('班別 (如: 6A)');
                     if(name && cls) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, class: cls.toUpperCase(), classNo: '00', badge: '無', points: 100, squashClass: '', createdAt: serverTimestamp() });
                   }} className="p-8 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-600 transition-all group">
                     <Plus size={32} className="mb-2 group-hover:scale-125 transition-all"/>
                     <span className="text-sm font-black uppercase tracking-widest">新增單一隊員</span>
                   </button>
                </div>
             </div>
          )}

          {/* 6. 管理概況 (Dashboard) */}
          {activeTab === 'dashboard' && role === 'admin' && (
             <div className="space-y-10 animate-in fade-in duration-700 font-bold">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                      <div className="absolute -right-5 -bottom-5 opacity-20"><Users size={120}/></div>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">隊員總數</p>
                      <p className="text-6xl font-black mt-2 font-mono">{students.length}</p>
                      <div className="mt-6 flex items-center gap-2 text-xs text-blue-200 font-bold">
                        <TrendingUp size={14}/> 活躍率 100%
                      </div>
                   </div>
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                      <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2">總訓練節數</p>
                      <p className="text-6xl font-black mt-2 text-slate-800 font-mono">{schedules.length}</p>
                      <p className="mt-6 text-xs text-slate-400 font-bold">已安排至 2026</p>
                   </div>
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">平均積分</p>
                      <p className="text-6xl font-black mt-2 font-mono">
                        {students.length ? Math.round(rankedStudents.reduce((acc,s)=>acc+s.totalPoints,0)/students.length) : 0}
                      </p>
                      <p className="mt-6 text-xs text-emerald-400 font-bold">較上月 +12.5%</p>
                   </div>
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck size={32}/>
                      </div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">系統狀態</p>
                      <p className="text-xl font-black mt-1 text-slate-800">運作正常</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                      <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                        <Target className="text-blue-600"/> 章別分佈概況
                      </h3>
                      <div className="space-y-6">
                        {Object.keys(BADGE_DATA).filter(k => k !== '無').map(badge => {
                          const count = students.filter(s => s.badge === badge).length;
                          const percent = students.length ? Math.round((count/students.length)*100) : 0;
                          return (
                            <div key={badge} className="space-y-2">
                              <div className="flex justify-between items-center px-2">
                                <span className={`text-xs font-black ${BADGE_DATA[badge].color}`}>{badge}</span>
                                <span className="text-xs text-slate-400 font-mono">{count} 人 ({percent}%)</span>
                              </div>
                              <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border">
                                <div className={`h-full transition-all duration-1000 ${BADGE_DATA[badge].bg.replace('bg-', 'bg-')}`} style={{width: `${percent}%`, backgroundColor: 'currentColor'}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                   
                   <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                      <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                        <History className="text-blue-600"/> 最近更新活動
                      </h3>
                      <div className="space-y-6">
                         {competitions.slice(0, 4).map(c => (
                           <div key={c.id} className="flex gap-6 items-start">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 ring-8 ring-blue-50"></div>
                              <div>
                                <p className="text-sm font-black text-slate-800">發佈了比賽公告：{c.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">比賽日期：{c.date}</p>
                              </div>
                           </div>
                         ))}
                         {schedules.slice(0, 2).map(s => (
                           <div key={s.id} className="flex gap-6 items-start">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 ring-8 ring-emerald-50"></div>
                              <div>
                                <p className="text-sm font-black text-slate-800">新增訓練日程：{s.trainingClass}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{s.date} @ {s.location}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* --- 請插入在約 1011 行 --- */}
          {activeTab === 'financial' && role === 'admin' && <FinancialView />}

          {/* 7. 系統設定 (教練專用) */}
          {activeTab === 'settings' && role === 'admin' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">管理員存取密碼</label>
                        <div className="relative">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                           <input 
                              type="password" 
                              value={systemConfig.adminPassword}
                              onChange={(e)=>setSystemConfig({...systemConfig, adminPassword: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white p-5 pl-14 rounded-2xl outline-none transition-all"
                           />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">數據導入編碼</label>
                        <select 
                          value={importEncoding}
                          onChange={(e)=>setImportEncoding(e.target.value)}
                          className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner"
                        >
                          <option value="AUTO">自動偵測 (推薦)</option>
                          <option value="UTF8">萬用編碼 (UTF-8)</option>
                          <option value="BIG5">繁體中文 (BIG5 - Excel 常用)</option>
                        </select>
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-4">
                        <button 
                          onClick={async ()=>{
                            setIsUpdating(true);
                            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig);
                            setIsUpdating(false);
                            alert('系統設定已更新！');
                          }}
                          className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                          <Save size={24}/> 保存設定
                        </button>
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                          <Info className="text-blue-500 shrink-0" size={20}/>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            修改密碼後請妥善保存，否則將無法進入教練後台。系統預設密碼為 "admin"。
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                  Copyright © 2026 PJ Squash Academy. All Rights Reserved.
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
