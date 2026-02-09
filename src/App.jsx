import React, { useState, useEffect, useMemo, useRef } from 'react';

import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, 
  Save, FileSpreadsheet, Download, FileText, Info, Link as LinkIcon, Settings2,
  ChevronRight, Search, Filter, History, Clock, MapPin, Layers, Award,
  Trophy as TrophyIcon, Star, Target, TrendingUp, ChevronDown, CheckCircle2,
  FileBarChart, Crown, ListChecks, Image as ImageIcon, Video, PlayCircle, Camera,
  Hourglass, Medal, Folder, ArrowLeft, Bookmark, BookOpen, Swords, Globe, Cake, ExternalLink, Key, Mail
} from 'lucide-react';

import { initializeApp } from 'firebase/app';

import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment, where
} from 'firebase/firestore';

import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// --- 引入新的組件 ---
import LoginModal from './components/LoginModal';
import SchoolLogo from './components/SchoolLogo';


// --- Firebase 初始化 ---
let firebaseConfig;
try {
  const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    firebaseConfig = JSON.parse(envConfig);
  } else if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error('No env config');
  }
} catch (e) {
  firebaseConfig = {
    apiKey: "AIzaSyAYm_63S9pKMZ51Qb2ZlCHRsfuGzy2gstw",
    authDomain: "squashreact.firebaseapp.com",
    projectId: "squashreact",
    storageBucket: "squashreact.firebasestorage.app",
    messagingSenderId: "342733564194",
    appId: "1:342733564194:web:7345d90d7d22c0b605dd7b",
    measurementId: "G-JRZ0QSFLLQ"
  };
}
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 強制鎖定 App ID
const appId = 'bcklas-squash-core-v1'; 

// --- 版本控制 ---
const CURRENT_VERSION = "5.3";

export default function App() {
  // --- 狀態管理 ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]); 
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [competitions, setCompetitions] = useState([]);
  const [schedules, setSchedules] = useState([]); 
  const [galleryItems, setGalleryItems] = useState([]); 
  const [awards, setAwards] = useState([]); 
  const [downloadFiles, setDownloadFiles] = useState([]); 
  
  const [systemConfig, setSystemConfig] = useState({ 
    adminPassword: 'admin', 
    announcements: [],
    seasonalTheme: 'default',
    schoolLogo: null 
  });
  
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 登入狀態 [New in V5.3]
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTab, setLoginTab] = useState('student'); // 'student' | 'admin'

  // 對戰錄入狀態
  const [matchWinner, setMatchWinner] = useState('');
  const [matchLoser, setMatchLoser] = useState('');
  const [importEncoding, setImportEncoding] = useState('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('ALL');
  
  // 年份篩選狀態
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const galleryInputRef = useRef(null);

  // 財務參數
  const [financeConfig, setFinanceConfig] = useState({
    nTeam: 1, costTeam: 2750,
    nTrain: 3, costTrain: 1350,
    nHobby: 4, costHobby: 1200,
    totalStudents: 50, feePerStudent: 250
  });

  // 自動緩存清理機制
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`[System] Detected new version: ${CURRENT_VERSION}. Cleaning cache...`);
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      window.location.reload();
    }
  }, []);

  // 自動計算總收支
  const financialSummary = useMemo(() => {
    if (!financeConfig) return { revenue: 0, expense: 0, profit: 0 };
    const revenue = (Number(financeConfig.totalStudents) || 0) * (Number(financeConfig.feePerStudent) || 0);
    const expense = ((Number(financeConfig.nTeam) || 0) * (Number(financeConfig.costTeam) || 0)) + 
                    ((Number(financeConfig.nTrain) || 0) * (Number(financeConfig.costTrain) || 0)) + 
                    ((Number(financeConfig.nHobby) || 0) * (Number(financeConfig.costHobby) || 0));
    return { revenue, expense, profit: revenue - expense };
  }, [financeConfig]);

  // Dashboard 統計數據
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.setHours(0,0,0,0));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const safeSchedules = Array.isArray(schedules) ? schedules : [];
    const safeCompetitions = Array.isArray(competitions) ? competitions : [];
    const safeAwards = Array.isArray(awards) ? awards : [];

    const thisMonthTrainings = safeSchedules.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const futureCompetitions = safeCompetitions
      .filter(c => c.date && new Date(c.date) >= todayZero)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
    
    let daysToNextMatch = "-";
    if (futureCompetitions.length > 0) {
      const nextMatchDate = new Date(futureCompetitions[0].date);
      if (!isNaN(nextMatchDate)) {
        const diffTime = Math.abs(nextMatchDate - todayZero);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        daysToNextMatch = diffDays === 0 ? "Today!" : `${diffDays}`;
      }
    }

    const awardsThisYear = safeAwards.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      return !isNaN(d) && d.getFullYear() === currentYear;
    }).length;

    return {
      thisMonthTrainings,
      daysToNextMatch,
      awardsThisYear
    };
  }, [schedules, competitions, awards]);

  // 相簿分組邏輯
  const galleryAlbums = useMemo(() => {
    const albums = {};
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    safeGallery.forEach(item => {
      const title = item.title || "未分類";
      if (!albums[title]) {
        albums[title] = {
          title,
          cover: item.url, 
          count: 0,
          items: [],
          type: item.type,
          lastUpdated: item.timestamp
        };
      }
      albums[title].count += 1;
      albums[title].items.push(item);
      if (item.timestamp && albums[title].lastUpdated && item.timestamp > albums[title].lastUpdated) {
         albums[title].cover = item.url;
         albums[title].lastUpdated = item.timestamp;
      }
    });
    return Object.values(albums).sort((a,b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
  }, [galleryItems]);

  // 章別定義
  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 400, level: 4, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", basePoints: 200, level: 3, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 100, level: 2, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", basePoints: 30, level: 1, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", basePoints: 0, level: 0, desc: "努力中" }
  };

  // --- 設定 Favicon ---
  useEffect(() => {
    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;
    try {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = logoUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
      document.title = "BCKLAS 壁球校隊系統";
    } catch(e) { console.error("Favicon error", e); }
  }, [systemConfig?.schoolLogo]);

  // --- Firebase Auth 監聽 ---
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) { 
        console.error("Auth Error:", err);
      }
      setLoading(false);
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        // 如果用戶登出或未登入，確保顯示登入視窗
        setShowLoginModal(true);
      }
      setLoading(false);
      clearTimeout(safetyTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // --- Firestore 資料即時監聽 ---
  useEffect(() => {
    if (!user) return; // 只有在登入後才監聽數據
    
    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      const attendanceLogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs');
      const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
      const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
      const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles');
      const galleryRef = collection(db, 'artifacts', appId, 'public', 'data', 'gallery'); 
      const awardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'awards');
      
      const systemConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');
      const financeConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'finance');

      const unsubSystemConfig = onSnapshot(systemConfigRef, (docSnap) => {
        if (docSnap.exists()) setSystemConfig(docSnap.data());
        else setDoc(systemConfigRef, { adminPassword: 'admin', announcements: [], seasonalTheme: 'default', schoolLogo: null });
      }, (e) => console.error("Config err", e));

      const unsubFinanceConfig = onSnapshot(financeConfigRef, (docSnap) => {
        if (docSnap.exists()) {
          setFinanceConfig(prev => ({...prev, ...docSnap.data()}));
        } else {
          setDoc(financeConfigRef, financeConfig);
        }
      }, (e) => console.error("Finance err", e));
      
      const unsubStudents = onSnapshot(query(studentsRef, orderBy("createdAt", "desc")), (snap) => {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubAttendanceLogs = onSnapshot(query(attendanceLogsRef, orderBy("timestamp", "desc")), (snap) => {
        setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubCompetitions = onSnapshot(query(competitionsRef, orderBy("createdAt", "desc")), (snap) => {
        setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubSchedules = onSnapshot(query(schedulesRef, orderBy("createdAt", "desc")), (snap) => {
        setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubFiles = onSnapshot(filesRef, (snap) => {
        setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubGallery = onSnapshot(query(galleryRef, orderBy("timestamp", "desc")), (snap) => {
        setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      const unsubAwards = onSnapshot(query(awardsRef, orderBy("timestamp", "desc")), (snap) => {
        setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { 
        unsubSystemConfig(); unsubFinanceConfig(); unsubStudents(); unsubAttendanceLogs(); unsubCompetitions(); unsubSchedules(); unsubFiles(); unsubGallery(); unsubAwards();
      };
    } catch (e) {
      console.error("Firestore Init Error:", e);
    }
  }, [user]);

  // --- 登入邏輯 ---
  const handleLogin = async (type) => {
    if (!loginEmail || !loginPassword) {
      alert('請輸入電郵和密碼');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      
      // 登入成功後 Firestore onAuthStateChanged 會觸發 user state 更新
      // 這裡只需要設定角色和UI即可
      
      if (type === 'admin') {
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } else {
        const matchedStudent = students.find(s => s.email === loginEmail);
        if (matchedStudent) {
            setCurrentUserInfo(matchedStudent);
        } else {
            setCurrentUserInfo({ name: '同學', email: loginEmail });
        }
        setRole('student'); 
        setShowLoginModal(false); 
        setActiveTab('competitions');
      }
      
      setLoginEmail('');
      setLoginPassword('');

    } catch (error) {
      console.error("Login failed", error);
      alert('登入失敗：' + error.message + '\n(請確認帳號密碼是否正確)');
    }
  };

  // --- 登出邏輯 ---
  const handleLogout = async () => { 
    try {
      await signOut(auth);
      setRole(null); 
      setCurrentUserInfo(null); 
      setShowLoginModal(true); 
      setSidebarOpen(false);
      setActiveTab('rankings'); // 登出後回到預設頁面
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  // --- 積分計算與排行邏輯 ---
  const rankedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    const uniqueMap = new Map();
    students.forEach(s => {
      const key = `${s.class}-${s.classNo}`;
      const currentPoints = Number(s.points) || 0;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, s);
      } else {
        const existing = uniqueMap.get(key);
        const existingPoints = Number(existing.points) || 0;
        if (currentPoints > existingPoints) uniqueMap.set(key, s);
      }
    });
    return Array.from(uniqueMap.values()).map(s => ({ 
      ...s, 
      totalPoints: Number(s.points) || 0 
    })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      const timeA = a.lastUpdated?.seconds || Infinity;
      const timeB = b.lastUpdated?.seconds || Infinity;
      return timeA - timeB;
    });
  }, [students]);

  // --- 統計各出生年份的人數 ---
  const birthYearStats = useMemo(() => {
    const stats = {};
    if (Array.isArray(rankedStudents)) {
        rankedStudents.forEach(s => {
            if (s.dob) {
                const year = s.dob.split('-')[0];
                if (year) {
                    stats[year] = (stats[year] || 0) + 1;
                } else {
                    stats['未知'] = (stats['未知'] || 0) + 1;
                }
            } else {
                stats['未知'] = (stats['未知'] || 0) + 1;
            }
        });
    }
    return stats;
  }, [rankedStudents]);

  // --- 隊員過濾邏輯 ---
  const filteredStudents = useMemo(() => {
    return rankedStudents.filter(s => {
      const matchSearch = s.name.includes(searchTerm) || s.class.includes(searchTerm.toUpperCase());
      const matchYear = selectedYearFilter === 'ALL' || (s.dob && s.dob.startsWith(selectedYearFilter)) || (selectedYearFilter === '未知' && !s.dob);
      return matchSearch && matchYear;
    });
  }, [rankedStudents, searchTerm, selectedYearFilter]);

  // --- 其他輔助函數 (保持不變) ---
  const saveFinanceConfig = async () => { /* ... */ };
  const adjustPoints = async (id, amount) => { /* ... */ };
  const handleUpdateDOB = async (student) => { /* ... */ };
  const handleExternalComp = (student) => { /* ... */ };
  const handleMatchSubmit = async () => { /* ... */ };
  const handleSeasonReset = async () => { /* ... */ };
  const markAttendance = async (student) => { /* ... */ };
  const generateCompetitionRoster = () => { /* ... */ };
  const exportAttendanceCSV = (targetClass) => { /* ... */ };
  const compressImage = (file) => { /* ... */ };
  const handleAddMedia = async () => { /* ... */ };
  const handleGalleryImageUpload = async (e) => { /* ... */ };
  const getYouTubeEmbedUrl = (url) => { /* ... */ };
  const readCSVFile = (file, encoding) => { /* ... */ };
  const handleCSVImportSchedules = async (e) => { /* ... */ };
  const handleCSVImportStudents = async (e) => { /* ... */ };
  const deleteItem = async (col, id) => { /* ... */ };
  const todaySchedule = useMemo(() => { /* ... */ }, [schedules]);
  const uniqueTrainingClasses = useMemo(() => { /* ... */ }, [schedules]);
  const filteredSchedules = useMemo(() => { /* ... */ }, [schedules, selectedClassFilter]);
  const studentsInSelectedAttendanceClass = useMemo(() => { /* ... */ }, [students, attendanceClassFilter]);
  const downloadTemplate = (type) => { /* ... */ };
  const handleAddAward = async () => { /* ... */ };


  // --- 載入中畫面 ---
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="mb-8 animate-pulse">
          <SchoolLogo systemConfig={systemConfig} size={96} />
        </div>
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-400 font-bold animate-pulse">正在連接 BCKLAS 資料庫...</p>
        <p className="text-xs text-slate-300 mt-2 font-mono">v{CURRENT_VERSION}</p>
      </div>
    );
  }

  // --- 主渲染 ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* 隱藏的 Input 和 燈箱 Modal */}
      <input 
        type="file" 
        ref={galleryInputRef} 
        className="hidden" 
        accept="image/*"
        multiple 
        onChange={handleGalleryImageUpload}
      />
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" 
          onClick={() => setViewingImage(null)}
        >
          <button onClick={() => setViewingImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-all z-50">
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <img src={viewingImage.url} alt={viewingImage.title} className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"/>
             <div className="mt-6 text-center text-white">
                 <h3 className="text-2xl font-bold">{viewingImage.title}</h3>
                 {viewingImage.description && <p className="text-sm text-white/70 mt-2 max-w-2xl mx-auto">{viewingImage.description}</p>}
             </div>
          </div>
        </div>
      )}
      
      {/* 使用新的 LoginModal 組件 */}
      <LoginModal 
        show={showLoginModal}
        handleLogin={handleLogin}
        loginTab={loginTab}
        setLoginTab={setLoginTab}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        systemConfig={systemConfig}
        version={CURRENT_VERSION}
      />
      
      {/* 側邊欄 (Sidebar) - 只有在登入後才顯示 */}
      {!showLoginModal && (
        <aside className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-10 h-full flex flex-col font-bold">
            <div className="flex items-center gap-4 mb-14 px-2">
              <div className="flex items-center justify-center">
                 <SchoolLogo systemConfig={systemConfig} size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
                <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">BCKLAS SYSTEM v{CURRENT_VERSION}</p>
              </div>
            </div>
            
            <nav className="space-y-2 flex-1 overflow-y-auto">
              {/* ... 導航按鈕 ... */}
              <div className="text-[10px] text-slate-300 uppercase tracking-widest mb-4 px-6">主選單</div>
              {(role === 'admin' || role === 'student') && (
                <button onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <LayoutDashboard size={20}/> 管理概況
                </button>
              )}
              <button onClick={() => {setActiveTab('rankings'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'rankings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Trophy size={20}/> 積分排行
              </button>
              {/* ... 其他導航按鈕 ... */}
            </nav>
            
            <div className="pt-10 border-t">
              <div className="bg-slate-50 rounded-3xl p-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                    {role === 'admin' ? <ShieldCheck size={20}/> : <User size={20}/>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">登入身份</p>
                    <p className="text-sm font-black text-slate-800">{role === 'admin' ? '校隊教練' : currentUserInfo?.name || '學員'}</p>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <LogOut size={14}/> 登出系統
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 主內容區 - 只有在登入後才顯示 */}
      {!showLoginModal && (
        <main className="flex-1 h-screen overflow-y-auto relative bg-[#F8FAFC]">
          <header className="px-10 py-8 sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b flex justify-between items-center">
            {/* ... 頂部標題 ... */}
          </header>
          <div className="p-10 max-w-7xl mx-auto pb-40">
            {/* --- 根據 activeTab 顯示不同的內容 --- */}
            {activeTab === 'rankings' && (
              <div>{/* ... 積分排行內容 ... */}</div>
            )}
            {activeTab === 'dashboard' && (
              <div>{/* ... 管理總結內容 ... */}</div>
            )}
            {/* ... 其他 Tab 內容 ... */}
          </div>
        </main>
      )}
    </div>
  );
}
